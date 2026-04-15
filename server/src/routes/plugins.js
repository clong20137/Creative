import express from 'express'
import Stripe from 'stripe'
import Plugin from '../models/Plugin.js'
import RestaurantMenuItem from '../models/RestaurantMenuItem.js'
import RealEstateListing from '../models/RealEstateListing.js'
import { getOrCreateSiteSettings } from './site-settings.js'

const router = express.Router()

async function getStripeClient() {
  const settings = await getOrCreateSiteSettings()
  const secretKey = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!secretKey || secretKey.includes('your_key_here')) return null
  return new Stripe(secretKey)
}

export async function getOrCreateRestaurantPlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'restaurant-menu' },
    defaults: {
      slug: 'restaurant-menu',
      name: 'Restaurant Menu',
      description: 'Create menu categories, item photos, descriptions, and prices for a restaurant website.',
      category: 'Restaurant',
      price: 299,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/restaurant'
    }
  })

  const itemCount = await RestaurantMenuItem.count()
  if (itemCount === 0) {
    await RestaurantMenuItem.bulkCreate([
      {
        name: 'Harvest Bowl',
        description: 'Roasted vegetables, greens, grains, citrus vinaigrette, and toasted seeds.',
        category: 'Entrees',
        price: 14.5,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
        sortOrder: 1
      },
      {
        name: 'Wood Fired Pizza',
        description: 'Tomato, mozzarella, basil, olive oil, and a crisp blistered crust.',
        category: 'Entrees',
        price: 17,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
        sortOrder: 2
      },
      {
        name: 'Chocolate Tart',
        description: 'Dark chocolate ganache, sea salt, berry compote, and whipped cream.',
        category: 'Desserts',
        price: 9,
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80',
        sortOrder: 3
      }
    ])
  }

  return plugin
}

export async function getOrCreateRealEstatePlugin() {
  const [plugin] = await Plugin.findOrCreate({
    where: { slug: 'real-estate-listings' },
    defaults: {
      slug: 'real-estate-listings',
      name: 'Real Estate Listings',
      description: 'Add property listings with photos, prices, descriptions, and more information buttons.',
      category: 'Real Estate',
      price: 399,
      isEnabled: true,
      isPurchased: true,
      demoUrl: '/plugins/real-estate'
    }
  })

  const listingCount = await RealEstateListing.count()
  if (listingCount === 0) {
    await RealEstateListing.bulkCreate([
      {
        title: 'Modern Meridian-Kessler Home',
        address: 'Indianapolis, IN',
        description: 'Bright living spaces, updated finishes, a private backyard, and room to entertain.',
        price: 489000,
        image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1000&q=80',
        sortOrder: 1
      },
      {
        title: 'Downtown Condo With Skyline Views',
        address: 'Indianapolis, IN',
        description: 'Walkable downtown condo with secure parking, open kitchen, and city views.',
        price: 335000,
        image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1000&q=80',
        sortOrder: 2
      },
      {
        title: 'Quiet Carmel Retreat',
        address: 'Carmel, IN',
        description: 'Spacious layout, mature trees, finished basement, and a flexible home office.',
        price: 625000,
        image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1000&q=80',
        sortOrder: 3
      }
    ])
  }

  return plugin
}

export async function ensureDemoPlugins() {
  await Promise.all([
    getOrCreateRestaurantPlugin(),
    getOrCreateRealEstatePlugin()
  ])
}

router.get('/', async (req, res) => {
  try {
    await ensureDemoPlugins()
    const plugins = await Plugin.findAll({
      where: { isEnabled: true },
      order: [['name', 'ASC']]
    })
    res.json(plugins)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:slug/checkout-session', async (req, res) => {
  try {
    await ensureDemoPlugins()
    const plugin = await Plugin.findOne({ where: { slug: req.params.slug } })
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' })
    if (plugin.isPurchased) return res.status(400).json({ error: 'Plugin is already purchased' })

    const stripe = await getStripeClient()
    if (!stripe) return res.status(400).json({ error: 'Stripe is not configured' })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plugin.name} Plugin`
            },
            unit_amount: Math.round(Number(plugin.price || 0) * 100)
          }
        }
      ],
      metadata: {
        pluginSlug: plugin.slug
      },
      success_url: `${frontendUrl}/admin/plugins?plugin_payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/admin/plugins?plugin_payment=cancelled`
    })

    res.json({ url: session.url })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/restaurant/menu', async (req, res) => {
  try {
    const plugin = await getOrCreateRestaurantPlugin()
    const items = await RestaurantMenuItem.findAll({
      where: { isAvailable: true },
      order: [['category', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']]
    })

    res.json({ plugin, items })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/real-estate/listings', async (req, res) => {
  try {
    const plugin = await getOrCreateRealEstatePlugin()
    const listings = await RealEstateListing.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })

    res.json({ plugin, listings })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/real-estate/listings/:id', async (req, res) => {
  try {
    const plugin = await getOrCreateRealEstatePlugin()
    const listing = await RealEstateListing.findOne({
      where: { id: req.params.id, isActive: true }
    })
    if (!listing) return res.status(404).json({ error: 'Listing not found' })

    res.json({ plugin, listing })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
