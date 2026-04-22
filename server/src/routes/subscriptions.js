import express from 'express'
import Subscription from '../models/Subscription.js'
import { DataTypes } from 'sequelize'

const router = express.Router()
let subscriptionSchemaReady = false

async function ensureSubscriptionSchema() {
  if (subscriptionSchemaReady) return

  const queryInterface = Subscription.sequelize.getQueryInterface()
  const subscriptionTable = await queryInterface.describeTable('Subscriptions').catch(() => null)
  const planTable = await queryInterface.describeTable('SubscriptionPlans').catch(() => null)

  if (subscriptionTable) {
    const addSubscriptionColumn = async (name, config) => {
      if (subscriptionTable[name]) return
      await queryInterface.addColumn('Subscriptions', name, config).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }

    await addSubscriptionColumn('productType', {
      type: DataTypes.ENUM('service', 'cms-license'),
      allowNull: false,
      defaultValue: 'service'
    })
    await addSubscriptionColumn('licenseKey', { type: DataTypes.STRING, allowNull: true })
    await addSubscriptionColumn('licensedDomain', { type: DataTypes.STRING, allowNull: true })
    await addSubscriptionColumn('updateChannel', {
      type: DataTypes.ENUM('stable', 'early-access'),
      allowNull: false,
      defaultValue: 'stable'
    })
    await addSubscriptionColumn('includedUpdates', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
    await addSubscriptionColumn('lastValidatedAt', {
      type: DataTypes.DATE,
      allowNull: true
    })
  }

  if (planTable) {
    const addPlanColumn = async (name, config) => {
      if (planTable[name]) return
      await queryInterface.addColumn('SubscriptionPlans', name, config).catch((error) => {
        if (!String(error?.message || '').includes('Duplicate column')) throw error
      })
    }

    await addPlanColumn('productType', {
      type: DataTypes.ENUM('service', 'cms-license'),
      allowNull: false,
      defaultValue: 'service'
    })
    await addPlanColumn('updateChannel', {
      type: DataTypes.ENUM('stable', 'early-access'),
      allowNull: false,
      defaultValue: 'stable'
    })
    await addPlanColumn('includedUpdates', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
  }

  subscriptionSchemaReady = true
}

// Get subscription for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findOne({
      where: { clientId: req.params.clientId, status: 'active', productType: 'service' },
      order: [['createdAt', 'DESC']]
    })
    if (subscription) return res.json(subscription)

    const fallbackSubscription = await Subscription.findOne({
      where: { clientId: req.params.clientId, status: 'active' },
      order: [['createdAt', 'DESC']]
    })
    res.json(fallbackSubscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/client/:clientId/license', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const activeLicense = await Subscription.findOne({
      where: { clientId: req.params.clientId, productType: 'cms-license', status: 'active' },
      order: [['createdAt', 'DESC']]
    })

    if (activeLicense) {
      if (!activeLicense.lastValidatedAt) {
        await activeLicense.update({ lastValidatedAt: new Date() })
      }
      return res.json({ hasActiveLicense: true, license: activeLicense })
    }

    const latestLicense = await Subscription.findOne({
      where: { clientId: req.params.clientId, productType: 'cms-license' },
      order: [['createdAt', 'DESC']]
    })

    res.json({ hasActiveLicense: false, license: latestLicense })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single subscription
router.get('/:id', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    res.json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create subscription
router.post('/', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.create(req.body)
    res.status(201).json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update subscription
router.put('/:id', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    await subscription.update(req.body)
    res.json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Cancel subscription
router.put('/:id/cancel', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    await subscription.update({ status: 'cancelled', endDate: new Date() })
    res.json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete subscription
router.delete('/:id', async (req, res) => {
  try {
    await ensureSubscriptionSchema()
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    await subscription.destroy()
    res.json({ message: 'Subscription deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
