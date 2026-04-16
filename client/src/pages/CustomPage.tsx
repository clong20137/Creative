import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import PageSections from '../components/PageSections'
import { customPagesAPI, siteSettingsAPI } from '../services/api'
import EditableBuiltInPage from './EditableBuiltInPage'
import NotFound from './NotFound'

export default function CustomPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const [page, setPage] = useState<any>(null)
  const [builtInPageKey, setBuiltInPageKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true)
        setNotFound(false)
        setBuiltInPageKey('')
        const settings = await siteSettingsAPI.getSettings()
        const matchedPage = Object.entries(settings.pageMetadata || {}).find(([, metadata]: any) => metadata?.pageUrl === location.pathname)
        if (matchedPage) {
          setBuiltInPageKey(matchedPage[0])
          return
        }
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
  }, [slug, location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading page...</div>
      </div>
    )
  }

  if (builtInPageKey) return <EditableBuiltInPage pageKey={builtInPageKey} />
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

      {sections.length > 0 ? (
        <PageSections sections={sections} />
      ) : (
        <section className="section-padding">
          <div className="container max-w-4xl">
            <div className="prose prose-lg max-w-none">
              {String(page.content || '').split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-5 text-gray-700 leading-relaxed whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
