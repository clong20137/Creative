import express from 'express'
import Subscription from '../models/Subscription.js'

const router = express.Router()

// Get subscription for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ where: { clientId: req.params.clientId } })
    res.json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single subscription
router.get('/:id', async (req, res) => {
  try {
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
    const subscription = await Subscription.create(req.body)
    res.status(201).json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update subscription
router.put('/:id', async (req, res) => {
  try {
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
    const subscription = await Subscription.findByPk(req.params.id)
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    await subscription.destroy()
    res.json({ message: 'Subscription deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
