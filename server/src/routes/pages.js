import express from 'express'
import CustomPage from '../models/CustomPage.js'

const router = express.Router()

router.get('/:slug', async (req, res) => {
  try {
    const page = await CustomPage.findOne({
      where: {
        slug: req.params.slug
      }
    })

    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
