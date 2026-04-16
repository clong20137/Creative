import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { customPagesAPI, resolveAssetUrl } from '../services/api'
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
    const plugin = pluginLinks[section.pluginSlug] || pluginLinks.plugins
    return (
      <div className="rounded-lg border bg-gray-50 p-6">
        <h2 className="text-2xl font-bold text-gray-900">{section.title || plugin.label}</h2>
        {section.body && <p className="mt-3 text-gray-600 whitespace-pre-line">{section.body}</p>}
        <a href={plugin.url} className="btn-primary mt-5 inline-flex">
          {section.buttonLabel || `View ${plugin.label}`}
        </a>
      </div>
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
