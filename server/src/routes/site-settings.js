import express from 'express'
import SiteSetting from '../models/SiteSetting.js'

const router = express.Router()

export async function getOrCreateSiteSettings() {
  const [settings] = await SiteSetting.findOrCreate({
    where: { id: 1 },
    defaults: { id: 1 }
  })
  return settings
}

router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
