import express from 'express'
import nodemailer from 'nodemailer'
import FormSubmission from '../models/FormSubmission.js'
import { getOrCreateSiteSettings } from './site-settings.js'
import { verifyTurnstileToken } from '../utils/turnstile.js'
import { createRateLimiter } from '../utils/rate-limit.js'
import { cleanMultiline, cleanString, isValidEmail } from '../utils/validation.js'
import { ensureActiveUser, requireRole, verifyToken } from '../utils/auth.js'

const router = express.Router()
const formSubmissionRateLimit = createRateLimiter({
  name: 'custom-form-submissions',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many form submissions. Please wait a bit and try again.'
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

function sanitizeField(field, index) {
  const type = ['text', 'email', 'tel', 'textarea', 'select', 'checkbox'].includes(field?.type) ? field.type : 'text'
  const label = cleanString(field?.label || field?.name || `Field ${index + 1}`, 120)
  const id = cleanString(field?.id || field?.name || `field-${index + 1}`, 80)
  const required = Boolean(field?.required)
  const value = type === 'checkbox'
    ? Boolean(field?.value)
    : cleanMultiline(field?.value, 4000)

  return { id, label, type, required, value }
}

function getFieldValue(fields, matcher) {
  const match = fields.find((field) => matcher(field))
  return match?.type === 'checkbox' ? (match.value ? 'Yes' : 'No') : String(match?.value || '')
}

router.post('/', formSubmissionRateLimit, async (req, res) => {
  try {
    if (!await verifyTurnstileToken(req.body.turnstileToken, req.ip)) {
      return res.status(400).json({ error: 'Captcha verification failed' })
    }

    const formName = cleanString(req.body.formName, 120)
    const pagePath = cleanString(req.body.pagePath, 255)
    const pageTitle = cleanString(req.body.pageTitle, 160)
    const rawFields = Array.isArray(req.body.fields) ? req.body.fields.slice(0, 30) : []
    const fields = rawFields.map(sanitizeField).filter((field) => field.label)

    if (!formName) return res.status(400).json({ error: 'Form name is required' })
    if (fields.length === 0) return res.status(400).json({ error: 'At least one form field is required' })

    const missingRequired = fields.find((field) => field.required && (
      field.type === 'checkbox'
        ? !field.value
        : !String(field.value || '').trim()
    ))
    if (missingRequired) {
      return res.status(400).json({ error: `${missingRequired.label} is required` })
    }

    const email = getFieldValue(fields, (field) => field.type === 'email' || /email/i.test(field.label))
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' })
    }

    const name = getFieldValue(fields, (field) => /name/i.test(field.label))
    const phone = getFieldValue(fields, (field) => field.type === 'tel' || /phone/i.test(field.label))

    const submission = await FormSubmission.create({
      formName,
      pagePath: pagePath || null,
      pageTitle: pageTitle || null,
      name: name || null,
      email: email || null,
      phone: phone || null,
      fields
    })

    const settings = await getOrCreateSiteSettings()
    const transporter = createTransporter()
    if (transporter && settings.contactEmail) {
      try {
        const lines = fields.map((field) => `${field.label}: ${field.type === 'checkbox' ? (field.value ? 'Yes' : 'No') : (field.value || '')}`)
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: settings.contactEmail,
          replyTo: email || undefined,
          subject: `New form submission: ${formName}`,
          text: [
            `Form: ${formName}`,
            pageTitle ? `Page Title: ${pageTitle}` : '',
            pagePath ? `Page Path: ${pagePath}` : '',
            '',
            ...lines
          ].filter(Boolean).join('\n')
        })
      } catch (emailError) {
        console.error('Form submission saved, but email notification failed:', emailError.message)
      }
    }

    res.status(201).json({
      message: 'Form submitted',
      submission: {
        id: submission.id,
        formName: submission.formName,
        status: submission.status,
        createdAt: submission.createdAt
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    const submissions = await FormSubmission.findAll({ order: [['createdAt', 'DESC']] })
    res.json(submissions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', verifyToken, ensureActiveUser, requireRole('admin'), async (req, res) => {
  try {
    const submission = await FormSubmission.findByPk(req.params.id)
    if (!submission) return res.status(404).json({ error: 'Submission not found' })
    const nextStatus = ['new', 'read', 'archived'].includes(req.body.status) ? req.body.status : submission.status
    await submission.update({ status: nextStatus })
    res.json(submission)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
