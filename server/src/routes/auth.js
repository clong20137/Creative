import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import User from '../models/User.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company, role } = req.body
    
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) return res.status(400).json({ error: 'Email already exists' })
    
    const user = await User.create({ name, email, password, company, role: role || 'client' })
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    
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
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
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
