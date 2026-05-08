import express from 'express'
import fs from 'fs/promises'
import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import FormSubmission from '../models/FormSubmission.js'
import { getOrCreateSiteSettings } from './site-settings.js'
import { verifyTurnstileToken } from '../utils/turnstile.js'
import { createRateLimiter } from '../utils/rate-limit.js'
import { cleanMultiline, cleanString, isValidEmail } from '../utils/validation.js'
import { ensureActiveUser, requireRole, verifyToken } from '../utils/auth.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.resolve(__dirname, '../../uploads')
const formSubmissionRateLimit = createRateLimiter({
  name: 'custom-form-submissions',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many form submissions. Please wait a bit and try again.'
})

const uploadMimeExtensions = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
}

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

function parseEmailList(value) {
  return String(value || '')
    .split(/[,\n]/)
    .map((entry) => cleanString(entry, 160).trim().toLowerCase())
    .filter(Boolean)
    .filter((entry, index, list) => list.indexOf(entry) === index && isValidEmail(entry))
}

function sanitizeRoutingRule(rule, index) {
  return {
    id: cleanString(rule?.id || `rule-${index + 1}`, 80),
    fieldId: cleanString(rule?.fieldId, 80),
    operator: ['equals', 'not_equals', 'contains', 'checked', 'not_checked'].includes(rule?.operator) ? rule.operator : 'equals',
    value: cleanString(rule?.value, 240),
    notificationEmails: parseEmailList(rule?.notificationEmails)
  }
}

function matchesRoutingRule(rule, fields) {
  const field = fields.find((item) => item.id === rule.fieldId)
  if (!field) return false

  const rawValue = field.type === 'checkbox'
    ? Boolean(field.value)
    : field.type === 'file'
      ? String(field.value?.name || field.value?.url || '')
      : String(field.value || '')

  if (rule.operator === 'checked') return rawValue === true
  if (rule.operator === 'not_checked') return rawValue === false
  if (rule.operator === 'contains') return typeof rawValue === 'string' && rawValue.toLowerCase().includes(String(rule.value || '').toLowerCase())
  if (rule.operator === 'not_equals') return String(rawValue).toLowerCase() !== String(rule.value || '').toLowerCase()
  return String(rawValue).toLowerCase() === String(rule.value || '').toLowerCase()
}

async function storeSubmissionFile(value, fieldId) {
  const dataUrl = String(value?.dataUrl || '')
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    const error = new Error('Unsupported file upload format')
    error.statusCode = 400
    throw error
  }

  const mimeType = match[1]
  const extension = uploadMimeExtensions[mimeType]
  if (!extension) {
    const error = new Error('This file type is not supported')
    error.statusCode = 400
    throw error
  }

  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > 10 * 1024 * 1024) {
    const error = new Error('Uploaded file is too large')
    error.statusCode = 413
    throw error
  }

  await fs.mkdir(uploadsDir, { recursive: true })
  const filename = `${randomUUID()}-${cleanString(fieldId || 'upload', 40) || 'upload'}.${extension}`
  const filePath = path.join(uploadsDir, filename)
  await fs.writeFile(filePath, buffer)

  return {
    name: cleanString(value?.name || filename, 160),
    size: Number(value?.size || buffer.length) || buffer.length,
    type: mimeType,
    url: `/api/uploads/${filename}`
  }
}

async function sanitizeField(field, index) {
  const type = ['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'file'].includes(field?.type) ? field.type : 'text'
  const label = cleanString(field?.label || field?.name || `Field ${index + 1}`, 120)
  const id = cleanString(field?.id || field?.name || `field-${index + 1}`, 80)
  const required = Boolean(field?.required)
  let value = null

  if (type === 'checkbox') {
    value = Boolean(field?.value)
  } else if (type === 'file') {
    value = field?.value?.dataUrl ? await storeSubmissionFile(field.value, id) : null
  } else {
    value = cleanMultiline(field?.value, 4000)
  }

  return { id, label, type, required, value }
}

function getFieldValue(fields, matcher) {
  const match = fields.find((field) => matcher(field))
  if (match?.type === 'checkbox') return match.value ? 'Yes' : 'No'
  if (match?.type === 'file') return String(match?.value?.url || match?.value?.name || '')
  return String(match?.value || '')
}

router.post('/', formSubmissionRateLimit, async (req, res) => {
  try {
    if (!await verifyTurnstileToken(req.body.turnstileToken, req.ip)) {
      return res.status(400).json({ error: 'Captcha verification failed' })
    }

    const formName = cleanString(req.body.formName, 120)
    const pagePath = cleanString(req.body.pagePath, 255)
    const pageTitle = cleanString(req.body.pageTitle, 160)
    const rawFields = Array.isArray(req.body.fields) ? req.body.fields.slice(0, 40) : []
    const fields = (await Promise.all(rawFields.map(sanitizeField))).filter((field) => field.label)
    const notificationEmails = parseEmailList(req.body.notificationEmails)
    const routingRules = Array.isArray(req.body.routingRules)
      ? req.body.routingRules.slice(0, 20).map(sanitizeRoutingRule).filter((rule) => rule.fieldId && rule.notificationEmails.length > 0)
      : []

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
    const routedEmails = routingRules
      .filter((rule) => matchesRoutingRule(rule, fields))
      .flatMap((rule) => rule.notificationEmails)
    const recipients = Array.from(new Set([
      ...notificationEmails,
      ...routedEmails,
      ...(settings.contactEmail ? [settings.contactEmail] : [])
    ].filter(Boolean)))

    if (transporter && recipients.length > 0) {
      try {
        const lines = fields.map((field) => {
          if (field.type === 'checkbox') return `${field.label}: ${field.value ? 'Yes' : 'No'}`
          if (field.type === 'file') return `${field.label}: ${field.value?.name || 'Uploaded file'}${field.value?.url ? ` (${field.value.url})` : ''}`
          return `${field.label}: ${field.value || ''}`
        })
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipients.join(', '),
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
