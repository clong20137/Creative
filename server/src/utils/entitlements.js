import CMSLicense from '../models/CMSLicense.js'
import Subscription from '../models/Subscription.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'

function normalizeSlugList(value) {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)))
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function buildEntitlementsFromPlan(plan) {
  const data = plan?.toJSON ? plan.toJSON() : (plan || {})
  return {
    hasActivePlan: Boolean(plan),
    source: data.productType === 'cms-license' ? 'license' : data.productType === 'service' ? 'subscription' : null,
    planId: data.id || null,
    planName: data.name || '',
    tier: data.tier || 'starter',
    maxPages: toNumberOrNull(data.maxPages),
    maxMediaItems: toNumberOrNull(data.maxMediaItems),
    maxStorageMb: toNumberOrNull(data.maxStorageMb),
    maxTeamMembers: toNumberOrNull(data.maxTeamMembers),
    allowAllPlugins: data.allowAllPlugins !== false,
    allowedPluginSlugs: normalizeSlugList(data.allowedPluginSlugs),
    whiteLabelEnabled: data.whiteLabelEnabled === true,
    backupsEnabled: data.backupsEnabled === true,
    auditLogEnabled: data.auditLogEnabled === true,
    customDomainEnabled: data.customDomainEnabled === true,
    includedUpdates: data.includedUpdates !== false,
    updateChannel: data.updateChannel || 'stable'
  }
}

export async function getClientEntitlements(clientId) {
  const [activeLicense, activeSubscription] = await Promise.all([
    CMSLicense.findOne({
      where: { clientId, status: 'active' },
      include: [{ model: SubscriptionPlan, required: false }],
      order: [['createdAt', 'DESC']]
    }),
    Subscription.findOne({
      where: { clientId, status: 'active', productType: 'service' },
      include: [{ model: SubscriptionPlan, required: false }],
      order: [['createdAt', 'DESC']]
    })
  ])

  const plan = activeLicense?.SubscriptionPlan || activeSubscription?.SubscriptionPlan || null
  const entitlements = buildEntitlementsFromPlan(plan)
  return {
    ...entitlements,
    licenseId: activeLicense?.id || null,
    subscriptionId: activeSubscription?.id || null
  }
}

export function isPluginAllowed(entitlements, slug) {
  if (!entitlements?.hasActivePlan) {
    return {
      allowed: false,
      reason: 'An active CMS plan is required before plugin add-ons can be enabled.'
    }
  }
  if (entitlements.allowAllPlugins) {
    return { allowed: true, reason: '' }
  }
  const normalizedSlug = String(slug || '').trim()
  const allowed = normalizeSlugList(entitlements.allowedPluginSlugs).includes(normalizedSlug)
  return {
    allowed,
    reason: allowed ? '' : 'This plugin is not included with your current plan.'
  }
}
