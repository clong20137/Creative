import express from 'express'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'
import ContactMessage from '../models/ContactMessage.js'
import { getOrCreateSiteSettings } from './site-settings.js'
import { verifyTurnstileToken } from '../utils/turnstile.js'
import { createRateLimiter } from '../utils/rate-limit.js'
import { cleanMultiline, cleanString, isValidEmail } from '../utils/validation.js'
import { ensureActiveUser, requireRole, verifyToken } from '../utils/auth.js'

const router = express.Router()
const contactRateLimit = createRateLimiter({
  name: 'contact-form',
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Too many contact requests. Please wait a bit and try again.'
})

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

router.post('/', contactRateLimit, async (req, res) => {
  try {
    if (!await verifyTurnstileToken(req.body.turnstileToken, req.ip)) {
      return res.status(400).json({ error: 'Captcha verification failed' })
    }
    const name = cleanString(req.body.name, 120)
    const email = cleanString(req.body.email, 160).toLowerCase()
    const phone = cleanString(req.body.phone, 40)
    const company = cleanString(req.body.company, 120)
    const service = cleanString(req.body.service, 120)
    const messageText = cleanMultiline(req.body.message, 4000)
    if (!name || !email || !messageText) return res.status(400).json({ error: 'Name, email, and message are required' })
    if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email address is required' })

    const message = await ContactMessage.create({
      name,
      email,
      phone,
      company,
      service,
      message: messageText
    })
    const settings = await getOrCreateSiteSettings()
    const transporter = createTransporter()

    if (transporter && settings.contactEmail) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: settings.contactEmail,
          replyTo: email,
          subject: `New website inquiry from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || ''}\nCompany: ${company || ''}\nService: ${service || ''}\n\n${messageText}`
        })
      } catch (emailError) {
        console.error('Contact message saved, but email notification failed:', emailError.message)
      }
    }

    res.status(201).json({ message: 'Message sent', contactMessage: { id: message.id, status: message.status, createdAt: message.createdAt } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    const messages = await ContactMessage.findAll({ order: [['createdAt', 'DESC']] })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id)
    if (!message) return res.status(404).json({ error: 'Message not found' })
    const nextStatus = ['new', 'read', 'archived'].includes(req.body.status) ? req.body.status : message.status
    await message.update({ status: nextStatus })
    res.json(message)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
