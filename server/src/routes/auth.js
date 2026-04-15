import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import nodemailer from 'nodemailer'
import User from '../models/User.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function signAuthToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

function signTwoFactorToken(user) {
  return jwt.sign({ userId: user.id, purpose: 'two-factor' }, JWT_SECRET, { expiresIn: '10m' })
}

function createTwoFactorCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
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

async function sendTwoFactorCode(user, code) {
  const transporter = createTransporter()
  if (!transporter) return false

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Your Creative Studio sign-in code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
  })

  return true
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company, role } = req.body
    
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) return res.status(400).json({ error: 'Email already exists' })
    
    const user = await User.create({ name, email, password, company, role: role || 'client' })
    
    const token = signAuthToken(user)
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    const isValidPassword = await bcryptjs.compare(password, user.password)
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' })
    
    if (user.twoFactorEnabled) {
      const code = createTwoFactorCode()
      await user.update({
        twoFactorCode: code,
        twoFactorExpires: new Date(Date.now() + 10 * 60 * 1000)
      })

      const sent = await sendTwoFactorCode(user, code)
      if (!sent) return res.status(500).json({ error: 'Two-factor email is not configured' })

      return res.json({
        requiresTwoFactor: true,
        tempToken: signTwoFactorToken(user),
        message: 'Verification code sent'
      })
    }

    const token = signAuthToken(user)
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verify two-factor code
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body
    if (!tempToken || !code) return res.status(400).json({ error: 'Verification code is required' })

    const decoded = jwt.verify(tempToken, JWT_SECRET)
    if (decoded.purpose !== 'two-factor') return res.status(401).json({ error: 'Invalid verification session' })

    const user = await User.findByPk(decoded.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!user.twoFactorCode || user.twoFactorCode !== code) return res.status(401).json({ error: 'Invalid verification code' })
    if (!user.twoFactorExpires || new Date(user.twoFactorExpires).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Verification code expired' })
    }

    await user.update({ twoFactorCode: null, twoFactorExpires: null })
    const token = signAuthToken(user)

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid verification session' })
  }
})

// Get Current User
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })
    
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ userId: decoded.userId, role: decoded.role })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
