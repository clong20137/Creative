import express from 'express'
import sequelize from '../database.js'
import User from '../models/User.js'
import Project from '../models/Project.js'
import Invoice from '../models/Invoice.js'
import Subscription from '../models/Subscription.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'

const router = express.Router()

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalClients = await User.count({ where: { role: 'client' } })
    const totalProjects = await Project.count()
    const activeProjects = await Project.count({ where: { status: 'in-progress' } })
    
    const totalRevenueResult = await Invoice.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: { status: 'paid' }
    })
    
    const activeSubscriptions = await Subscription.count({ where: { status: 'active' } })
    
    res.json({
      totalClients,
      totalProjects,
      activeProjects,
      totalRevenue: totalRevenueResult?.dataValues?.total || 0,
      activeSubscriptions
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await User.findAll({
      where: { role: 'client' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    })
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'company'] }],
      order: [['createdAt', 'DESC']]
    })
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'company'] }],
      order: [['issueDate', 'DESC']]
    })
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'company'] },
        { model: SubscriptionPlan, attributes: ['id', 'name', 'price', 'billingCycle'] }
      ],
      order: [['createdAt', 'DESC']]
    })
    res.json(subscriptions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get subscription plans offered by the studio
router.get('/subscription-plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({ order: [['createdAt', 'DESC']] })
    res.json(plans)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create subscription plan
router.post('/subscription-plans', async (req, res) => {
  try {
    const features = Array.isArray(req.body.features)
      ? req.body.features
      : String(req.body.features || '')
        .split('\n')
        .map(feature => feature.trim())
        .filter(Boolean)

    const plan = await SubscriptionPlan.create({ ...req.body, features })
    res.status(201).json(plan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update subscription plan
router.put('/subscription-plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found' })

    const features = Array.isArray(req.body.features)
      ? req.body.features
      : String(req.body.features || '')
        .split('\n')
        .map(feature => feature.trim())
        .filter(Boolean)

    await plan.update({ ...req.body, features })
    res.json(plan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete subscription plan
router.delete('/subscription-plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id)
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found' })
    await plan.destroy()
    res.json({ message: 'Subscription plan deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Assign a plan to a client
router.post('/subscriptions/assign', async (req, res) => {
  try {
    const { clientId, planId, renewalDate } = req.body
    const client = await User.findByPk(clientId)
    if (!client || client.role !== 'client') return res.status(404).json({ error: 'Client not found' })

    const plan = await SubscriptionPlan.findByPk(planId)
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found' })

    const nextRenewalDate = renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const subscription = await Subscription.create({
      clientId,
      planId,
      planName: plan.name,
      tier: plan.tier,
      status: 'active',
      price: plan.price,
      billingCycle: plan.billingCycle,
      renewalDate: nextRenewalDate,
      features: plan.features
    })

    res.status(201).json(subscription)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create user (by admin)
router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body)
    res.status(201).json({ message: 'User created', user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    await user.update(req.body)
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    await user.destroy()
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Revenue by month
router.get('/revenue/monthly', async (req, res) => {
  try {
    const monthlyRevenue = await sequelize.query(
      `SELECT 
        DATE_FORMAT(paidDate, '%Y-%m') as month,
        SUM(total) as revenue  
      FROM Invoices 
      WHERE status = 'paid' AND paidDate IS NOT NULL
      GROUP BY DATE_FORMAT(paidDate, '%Y-%m')
      ORDER BY month ASC`,
      { type: 'SELECT' }
    )
    res.json(monthlyRevenue)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
