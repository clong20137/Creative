import express from 'express'
import jwt from 'jsonwebtoken'
import Ticket from '../models/Ticket.js'
import User from '../models/User.js'
import { ensureActiveUser } from '../utils/auth.js'
import { cleanMultiline, cleanString } from '../utils/validation.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.role = decoded.role
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

router.get('/client', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { clientId: req.userId },
      order: [['createdAt', 'DESC']]
    })
    res.json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    const subject = cleanString(req.body.subject, 180)
    const message = cleanMultiline(req.body.message, 4000)
    const priority = ['low', 'normal', 'high', 'urgent'].includes(req.body.priority) ? req.body.priority : 'normal'
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' })
    const ticket = await Ticket.create({
      clientId: req.userId,
      subject,
      message,
      priority
    })
    res.status(201).json(ticket)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/admin', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    if (req.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    const tickets = await Ticket.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'company'] }],
      order: [['createdAt', 'DESC']]
    })
    res.json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', verifyToken, ensureActiveUser, async (req, res) => {
  try {
    if (req.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    const ticket = await Ticket.findByPk(req.params.id)
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    const updates = {}
    if (['pending', 'in-progress', 'resolved', 'closed'].includes(req.body.status)) updates.status = req.body.status
    if (['low', 'normal', 'high', 'urgent'].includes(req.body.priority)) updates.priority = req.body.priority
    if (req.body.adminResponse !== undefined) updates.adminResponse = cleanMultiline(req.body.adminResponse, 4000)
    await ticket.update(updates)
    res.json(ticket)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
