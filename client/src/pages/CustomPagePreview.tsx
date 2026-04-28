import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import PageSections, { RichTextContent } from '../components/PageSections'
import { customPagesAPI } from '../services/api'
import NotFound from './NotFound'

export default function CustomPagePreview() {
  const { token = '' } = useParams()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true)
        setNotFound(false)
        const data = await customPagesAPI.getPreviewPage(token)
        setPage(data)
      } catch (error) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading preview...</div>
      </div>
    )
  }

  if (notFound || !page) return <NotFound />
  const sections = Array.isArray(page.sections) ? page.sections : []

  return (
    <div>
      <SEO
        title={`${page.metaTitle || page.headerTitle || page.title} Preview`}
        description={page.metaDescription || page.headerSubtitle || stripHtmlText(page.content || '')}
        path={`/preview/page/${token}`}
        noIndex
      />
      <div className="border-b bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
        Private preview link
      </div>
      {page.showPageHeader !== false && (
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 text-white">
          <div className="container text-center">
            <h1 className="mb-6 text-5xl font-bold">{page.headerTitle || page.title}</h1>
            {page.headerSubtitle && <RichTextContent html={page.headerSubtitle} className="mx-auto max-w-3xl text-xl" />}
          </div>
        </section>
      )}

      {sections.length > 0 ? (
        <PageSections sections={sections} />
      ) : (
        <section className="section-padding">
          <div className="container max-w-4xl">
            <RichTextContent html={page.content} className="prose prose-lg max-w-none text-gray-700" />
          </div>
        </section>
      )}
    </div>
  )
}

function stripHtmlText(value: string) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
}
