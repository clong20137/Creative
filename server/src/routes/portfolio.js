import express from 'express'
import Project from '../models/Project.js'

const router = express.Router()

// Get all completed projects for portfolio
router.get('/', async (req, res) => {
  try {
    const portfolio = await Project.findAll({
      where: { status: 'completed' },
      order: [['createdAt', 'DESC']]
    })
    res.json(portfolio)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get portfolio by category
router.get('/category/:category', async (req, res) => {
  try {
    const portfolio = await Project.findAll({
      where: {
        status: 'completed',
        category: req.params.category
      },
      order: [['createdAt', 'DESC']]
    })
    res.json(portfolio)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single portfolio item
router.get('/:id', async (req, res) => {
  try {
    const item = await Project.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Portfolio item not found' })
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
