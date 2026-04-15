import express from 'express'
import PortfolioItem from '../models/PortfolioItem.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const portfolio = await PortfolioItem.findAll({
      where: { isPublished: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })
    res.json(portfolio)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get portfolio by category
router.get('/category/:category', async (req, res) => {
  try {
    const portfolio = await PortfolioItem.findAll({
      where: {
        category: req.params.category,
        isPublished: true
      },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })
    res.json(portfolio)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single portfolio item
router.get('/:id', async (req, res) => {
  try {
    const item = await PortfolioItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ error: 'Portfolio item not found' })
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
