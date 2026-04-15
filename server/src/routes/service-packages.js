import express from 'express'
import ServicePackage from '../models/ServicePackage.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const services = await ServicePackage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })
    res.json(services)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
