import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { customPagesAPI, pluginsAPI, resolveAssetUrl } from '../services/api'
import NotFound from './NotFound'

const pluginLinks: Record<string, { label: string; url: string }> = {
  restaurant: { label: 'Restaurant Menu', url: '/plugins/restaurant' },
  'real-estate': { label: 'Real Estate Listings', url: '/plugins/real-estate' },
  booking: { label: 'Booking Appointments', url: '/plugins/booking' },
  plugins: { label: 'Website Plugins', url: '/plugins' }
}

export default function CustomPage() {
  const { slug = '' } = useParams()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true)
        setNotFound(false)
        const data = await customPagesAPI.getPage(slug)
        setPage(data)
        document.title = data.metaTitle || `${data.title} | Creative by Caleb`
        const metaDescription = document.querySelector<HTMLMetaElement>("meta[name='description']")
        if (metaDescription && data.metaDescription) metaDescription.content = data.metaDescription
      } catch (error) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading page...</div>
      </div>
    )
  }

  if (notFound || !page) return <NotFound />
  const sections = Array.isArray(page.sections) ? page.sections : []

  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-6">{page.headerTitle || page.title}</h1>
          {page.headerSubtitle && <p className="text-xl max-w-3xl mx-auto">{page.headerSubtitle}</p>}
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-4xl">
          {sections.length > 0 ? (
            <div className="space-y-10">
              {sections.map((section: any, index: number) => <PageSection key={section.id || index} section={section} />)}
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              {String(page.content || '').split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-5 text-gray-700 leading-relaxed whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function PageSection({ section }: { section: any }) {
  if (section.type === 'header') {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
        {section.body && <p className="mt-3 text-lg text-gray-600 whitespace-pre-line">{section.body}</p>}
      </div>
    )
  }

  if (section.type === 'image') {
    return (
      <figure>
        <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || ''} className="w-full rounded-lg object-cover" />
        {(section.title || section.body) && (
          <figcaption className="mt-3 text-sm text-gray-600">
            {section.title && <strong className="text-gray-900">{section.title}</strong>} {section.body}
          </figcaption>
        )}
      </figure>
    )
  }

  if (section.type === 'plugin') {
    return (
      <EmbeddedPluginSection section={section} />
    )
  }

  if (section.type === 'section') {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
        <div>
          {section.title && <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>}
          {section.body && <p className="mt-3 text-gray-600 whitespace-pre-line">{section.body}</p>}
        </div>
        {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || ''} className="w-full rounded-lg object-cover" />}
      </div>
    )
  }

  return <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">{section.body}</p>
}

function EmbeddedPluginSection({ section }: { section: any }) {
  const plugin = pluginLinks[section.pluginSlug] || pluginLinks.plugins
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPluginData = async () => {
      try {
        setLoading(true)
        if (section.pluginSlug === 'restaurant') {
          setData(await pluginsAPI.getRestaurantMenu())
        } else if (section.pluginSlug === 'real-estate') {
          setData(await pluginsAPI.getRealEstateListings())
        } else if (section.pluginSlug === 'booking') {
          setData(await pluginsAPI.getBookingSlots())
        } else {
          setData({ plugins: await pluginsAPI.getPlugins() })
        }
      } catch (error) {
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPluginData()
  }, [section.pluginSlug])

  return (
    <div className="rounded-lg border bg-gray-50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{section.title || plugin.label}</h2>
        {section.body && <p className="mt-3 text-gray-600 whitespace-pre-line">{section.body}</p>}
      </div>

      {loading ? (
        <div className="text-gray-600">Loading {plugin.label}...</div>
      ) : (
        <PluginContent pluginSlug={section.pluginSlug || 'plugins'} data={data} />
      )}

      <Link to={plugin.url} className="btn-primary mt-6 inline-flex">
        {section.buttonLabel || `View ${plugin.label}`}
      </Link>
    </div>
  )
}

function PluginContent({ pluginSlug, data }: { pluginSlug: string; data: any }) {
  if (!data) return <div className="text-gray-600">This plugin content is not available right now.</div>

  if (pluginSlug === 'restaurant') {
    const items = data.items || []
    if (items.length === 0) return <div className="text-gray-600">No menu items have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.slice(0, 6).map((item: any) => (
          <article key={item.id} className="overflow-hidden rounded-lg bg-white shadow">
            {item.image && <img src={resolveAssetUrl(item.image)} alt={item.name} className="h-40 w-full object-cover" />}
            <div className="p-4">
              <div className="flex justify-between gap-3">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="font-bold text-blue-600">${Number(item.price || 0).toFixed(2)}</p>
              </div>
              {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'real-estate') {
    const listings = data.listings || []
    if (listings.length === 0) return <div className="text-gray-600">No listings have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {listings.slice(0, 4).map((listing: any) => (
          <article key={listing.id} className="overflow-hidden rounded-lg bg-white shadow">
            {listing.image && <img src={resolveAssetUrl(listing.image)} alt={listing.title} className="h-44 w-full object-cover" />}
            <div className="p-4">
              <p className="font-bold text-blue-600">{formatCurrency(listing.price)}</p>
              <h3 className="mt-1 font-bold text-gray-900">{listing.title}</h3>
              {listing.address && <p className="mt-1 text-sm text-gray-500">{listing.address}</p>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'booking') {
    const slots = data.slots || []
    if (slots.length === 0) return <div className="text-gray-600">No appointment times are currently available.</div>

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {slots.slice(0, 6).map((slot: any) => (
          <div key={slot.id} className="rounded-lg bg-white p-4 shadow">
            <p className="font-bold text-gray-900">{formatDate(slot.date)}</p>
            <p className="text-gray-600">{slot.startTime} - {slot.endTime}</p>
            {Array.isArray(slot.locationTypes) && slot.locationTypes.length > 0 && (
              <p className="mt-2 text-sm text-blue-600">{slot.locationTypes.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const plugins = data.plugins || []
  if (plugins.length === 0) return <div className="text-gray-600">No plugins are active right now.</div>

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {plugins.slice(0, 4).map((plugin: any) => (
        <div key={plugin.id || plugin.slug} className="rounded-lg bg-white p-4 shadow">
          <h3 className="font-bold text-gray-900">{plugin.name}</h3>
          <p className="mt-2 text-sm text-gray-600">{plugin.description}</p>
        </div>
      ))}
    </div>
  )
}

function formatCurrency(value: number | string) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

function formatDate(value: string) {
  if (!value) return 'Available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
