import { useEffect, useState } from 'react'
import SEO, { localBusinessSchema } from '../components/SEO'
import PageSections from '../components/PageSections'
import { siteSettingsAPI } from '../services/api'

const pageDefaults: Record<string, any> = {
  home: {
    pageTitle: 'Homepage',
    pageUrl: '/'
  },
  portfolio: {
    pageTitle: 'Portfolio',
    pageUrl: '/portfolio'
  },
  services: {
    pageTitle: 'Services',
    pageUrl: '/services'
  },
  pricing: {
    pageTitle: 'Pricing',
    pageUrl: '/pricing'
  },
  plugins: {
    pageTitle: 'Plugins',
    pageUrl: '/plugins'
  },
  creativecms: {
    pageTitle: 'CreativeCMS',
    pageUrl: '/creativecms-platform'
  },
  contact: {
    pageTitle: 'Contact',
    pageUrl: '/contact'
  }
}

export default function EditableBuiltInPage({ pageKey }: { pageKey: string }) {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const defaults = pageDefaults[pageKey] || pageDefaults.home
  const legacyHeader = settings.pageHeaders?.[pageKey] || {}
  const metadata = { ...defaults, ...legacyHeader, ...(settings.pageMetadata?.[pageKey] || {}) }
  const savedSections = Array.isArray(settings.pageSections?.[pageKey]) ? settings.pageSections[pageKey] : []
  const sections = savedSections

  useEffect(() => {
    siteSettingsAPI.getSettings()
      .then(setSettings)
      .catch(() => setSettings({}))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl text-gray-600">Loading page...</div></div>

  return (
    <div>
      <SEO
        title={metadata.metaTitle || metadata.headerTitle || metadata.pageTitle}
        description={metadata.metaDescription || metadata.description || metadata.headerSubtitle || ''}
        path={metadata.pageUrl || defaults.pageUrl}
        structuredData={['home', 'services', 'contact'].includes(pageKey) ? localBusinessSchema(metadata.pageUrl || defaults.pageUrl, settings, pageKey) : undefined}
      />
      <PageSections sections={sections} />
    </div>
  )
}
