import express from 'express'
import Stripe from 'stripe'
import Invoice from '../models/Invoice.js'
import Plugin from '../models/Plugin.js'
import ClientPluginPurchase from '../models/ClientPluginPurchase.js'
import ProtectedContentItem from '../models/ProtectedContentItem.js'
import ProtectedContentPurchase from '../models/ProtectedContentPurchase.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import CMSLicense from '../models/CMSLicense.js'
import { getOrCreateSiteSettings } from './site-settings.js'

const router = express.Router()

async function getStripeWebhookConfig() {
  const settings = await getOrCreateSiteSettings()
  const secretKey = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  const webhookSecret = settings.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey || secretKey.includes('your_key_here')) {
    throw new Error('Stripe secret key is not configured')
  }

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured')
  }

  return {
    stripe: new Stripe(secretKey),
    webhookSecret
  }
}

async function markInvoicePaid(session) {
  const invoiceId = session.metadata?.invoiceId
  if (!invoiceId || session.payment_status !== 'paid') return

  const invoice = await Invoice.findByPk(invoiceId)
  if (!invoice || invoice.status === 'paid') return

  await invoice.update({
    status: 'paid',
    paidDate: new Date(),
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null
  })
}

async function markPluginPurchased(session) {
  const pluginSlug = session.metadata?.pluginSlug
  if (!pluginSlug || session.payment_status !== 'paid') return

  const plugin = await Plugin.findOne({ where: { slug: pluginSlug } })
  if (!plugin) return

  const clientId = session.metadata?.clientId
  if (clientId) {
    const purchaseData = {
      clientId: Number(clientId),
      pluginId: plugin.id,
      pluginSlug: plugin.slug,
      pluginName: plugin.name,
      price: plugin.price,
      status: 'active',
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      purchasedAt: new Date()
    }
    const purchase = await ClientPluginPurchase.findOne({
      where: { clientId: Number(clientId), pluginSlug: plugin.slug }
    })
    if (purchase) {
      await purchase.update(purchaseData)
    } else {
      await ClientPluginPurchase.create(purchaseData)
    }
    return
  }

  await plugin.update({
    isPurchased: true,
    isEnabled: true
  })
}

async function markProtectedContentPurchased(session) {
  const contentItemId = session.metadata?.protectedContentItemId
  const clientId = session.metadata?.clientId
  if (!contentItemId || !clientId || session.payment_status !== 'paid') return

  const item = await ProtectedContentItem.findByPk(contentItemId)
  if (!item) return

  const purchaseData = {
    clientId: Number(clientId),
    contentItemId: item.id,
    itemTitle: item.title,
    price: item.price,
    status: 'active',
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    purchasedAt: new Date()
  }
  const purchase = await ProtectedContentPurchase.findOne({
    where: { clientId: Number(clientId), contentItemId: item.id }
  })
  if (purchase) {
    await purchase.update(purchaseData)
  } else {
    await ProtectedContentPurchase.create(purchaseData)
  }
}

async function markCmsLicensePurchased(session, stripe) {
  const planId = session.metadata?.cmsLicensePlanId
  const clientId = session.metadata?.clientId
  if (!planId || !clientId || session.payment_status !== 'paid') return

  const plan = await SubscriptionPlan.findByPk(planId)
  if (!plan || plan.productType !== 'cms-license') return

  let renewalDate = null
  let cancelAtPeriodEnd = false
  let customerId = typeof session.customer === 'string' ? session.customer : null
  let subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      renewalDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
      cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)
      customerId = typeof subscription.customer === 'string' ? subscription.customer : customerId
    } catch (error) {
      renewalDate = null
    }
  }

  const licenseData = {
    clientId: Number(clientId),
    planId: plan.id,
    planName: plan.name,
    tier: plan.tier || 'starter',
    status: 'active',
    price: plan.price || 0,
    billingCycle: plan.billingCycle || 'monthly',
    licensedDomain: String(session.metadata?.licensedDomain || '').trim() || null,
    updateChannel: plan.updateChannel || 'stable',
    includedUpdates: plan.includedUpdates !== false,
    startDate: new Date(),
    renewalDate,
    endDate: null,
    lastValidatedAt: new Date(),
    features: Array.isArray(plan.features) ? plan.features : [],
    notes: 'Activated from Stripe checkout',
    stripeCheckoutSessionId: session.id,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    cancelAtPeriodEnd
  }

  const existingLicense = await CMSLicense.findOne({
    where: { clientId: Number(clientId) },
    order: [['createdAt', 'DESC']]
  })
  if (existingLicense) {
    await existingLicense.update({
      ...licenseData,
      licenseKey: existingLicense.licenseKey
    })
  } else {
    await CMSLicense.create({
      ...licenseData,
      licenseKey: `CMS-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`
    })
  }
}

async function syncCmsLicenseSubscription(eventObject) {
  const subscriptionId = typeof eventObject?.id === 'string' ? eventObject.id : null
  if (!subscriptionId) return

  const license = await CMSLicense.findOne({ where: { stripeSubscriptionId: subscriptionId } })
  if (!license) return

  const isActive = ['active', 'trialing'].includes(eventObject.status)
  await license.update({
    status: isActive ? 'active' : (eventObject.status === 'canceled' ? 'cancelled' : 'inactive'),
    renewalDate: eventObject.current_period_end ? new Date(eventObject.current_period_end * 1000) : license.renewalDate,
    endDate: eventObject.ended_at ? new Date(eventObject.ended_at * 1000) : (eventObject.cancel_at_period_end ? license.renewalDate : null),
    cancelAtPeriodEnd: Boolean(eventObject.cancel_at_period_end),
    stripeCustomerId: typeof eventObject.customer === 'string' ? eventObject.customer : license.stripeCustomerId
  })
}

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature']
    const { stripe, webhookSecret } = await getStripeWebhookConfig()
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      await markInvoicePaid(event.data.object)
      await markPluginPurchased(event.data.object)
      await markProtectedContentPurchased(event.data.object)
      await markCmsLicensePurchased(event.data.object, stripe)
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      await syncCmsLicenseSubscription(event.data.object)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

export default router
