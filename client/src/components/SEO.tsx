import { useEffect } from 'react'

type SEOProps = {
  title: string
  description: string
  path?: string
  image?: string
  noIndex?: boolean
  structuredData?: Record<string, any> | Record<string, any>[]
}

const DEFAULT_IMAGE = '/og-image.jpg'

function getSiteName() {
  return document.documentElement.dataset.siteName || 'Creative by Caleb'
}

function getSiteUrl() {
  return (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')
}

export function normalizeSeoPath(path = '/') {
  const value = String(path || '/').trim()
  if (!value || value === '/') return '/'
  const prefixed = value.startsWith('/') ? value : `/${value}`
  const normalized = prefixed.replace(/\/{2,}/g, '/')
  return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

function upsertMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  element.content = content
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.appendChild(element)
  }
  element.href = href
}

export default function SEO({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  noIndex = false,
  structuredData
}: SEOProps) {
  useEffect(() => {
    const siteUrl = getSiteUrl()
    const normalizedPath = normalizeSeoPath(path)
    const canonicalUrl = `${siteUrl}${normalizedPath}`
    const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
    const siteName = getSiteName()
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`

    document.title = fullTitle
    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'description'
      return meta
    }, description)
    upsertMeta('meta[name="robots"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      return meta
    }, noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')

    upsertLink('canonical', canonicalUrl)

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      return meta
    }, fullTitle)
    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      return meta
    }, description)
    upsertMeta('meta[property="og:type"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:type')
      return meta
    }, 'website')
    upsertMeta('meta[property="og:url"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:url')
      return meta
    }, canonicalUrl)
    upsertMeta('meta[property="og:image"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:image')
      return meta
    }, imageUrl)

    upsertMeta('meta[name="twitter:card"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'twitter:card'
      return meta
    }, 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'twitter:title'
      return meta
    }, fullTitle)
    upsertMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'twitter:description'
      return meta
    }, description)
    upsertMeta('meta[name="twitter:image"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'twitter:image'
      return meta
    }, imageUrl)

    document.querySelectorAll('script[data-seo-jsonld="true"]').forEach(script => script.remove())
    if (structuredData) {
      const jsonLd = document.createElement('script')
      jsonLd.type = 'application/ld+json'
      jsonLd.dataset.seoJsonld = 'true'
      jsonLd.text = JSON.stringify(structuredData)
      document.head.appendChild(jsonLd)
    }
  }, [title, description, path, image, noIndex, structuredData])

  return null
}

function normalizeAreaServed(values: any[]) {
  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .map((name) => ({ '@type': 'City', name }))
}

export function localBusinessSchema(path = '/', settings: any = {}, pageKey?: string) {
  const siteUrl = getSiteUrl()
  const normalizedPath = normalizeSeoPath(path)
  const businessType = String(settings?.localSeoBusinessType || 'ProfessionalService').trim() || 'ProfessionalService'
  const primaryAreas = normalizeAreaServed(Array.isArray(settings?.localSeoServiceAreas) ? settings.localSeoServiceAreas : [])
  const primaryPhone = String(settings?.phone || '').trim()
  const primaryEmail = String(settings?.contactEmail || '').trim()
  const primaryLocation = {
    '@context': 'https://schema.org',
    '@type': businessType,
    name: getSiteName(),
    url: `${siteUrl}${normalizedPath}`,
    telephone: primaryPhone || undefined,
    email: primaryEmail || undefined,
    priceRange: String(settings?.localSeoPriceRange || '').trim() || undefined,
    areaServed: primaryAreas,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [settings?.locationLine1, settings?.locationLine2].filter(Boolean).join(', ') || undefined,
      addressLocality: primaryAreas[0]?.name || undefined,
      addressRegion: undefined,
      addressCountry: 'US'
    },
    geo: settings?.localSeoPrimaryLatitude && settings?.localSeoPrimaryLongitude ? {
      '@type': 'GeoCoordinates',
      latitude: settings.localSeoPrimaryLatitude,
      longitude: settings.localSeoPrimaryLongitude
    } : undefined,
    sameAs: [settings?.facebookUrl, settings?.instagramUrl, settings?.twitterUrl, settings?.linkedinUrl].filter(Boolean)
  }

  const locationSchemas = Array.isArray(settings?.localSeoLocations)
    ? settings.localSeoLocations
      .map((location: any) => {
        const name = String(location?.name || '').trim()
        const city = String(location?.city || '').trim()
        const region = String(location?.region || '').trim()
        const serviceAreas = normalizeAreaServed(String(location?.serviceAreasText || '').split('\n'))
        if (!name || !city) return null
        return {
          '@context': 'https://schema.org',
          '@type': businessType,
          name,
          url: location?.url ? `${siteUrl}${normalizeSeoPath(location.url)}` : `${siteUrl}${normalizedPath}`,
          telephone: String(location?.phone || primaryPhone || '').trim() || undefined,
          email: String(location?.email || primaryEmail || '').trim() || undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: [location?.addressLine1, location?.addressLine2].filter(Boolean).join(', ') || undefined,
            addressLocality: city,
            addressRegion: region || undefined,
            postalCode: String(location?.postalCode || '').trim() || undefined,
            addressCountry: String(location?.country || 'US').trim() || 'US'
          },
          geo: location?.latitude && location?.longitude ? {
            '@type': 'GeoCoordinates',
            latitude: location.latitude,
            longitude: location.longitude
          } : undefined,
          areaServed: serviceAreas.length ? serviceAreas : undefined
        }
      })
      .filter(Boolean)
    : []

  if (pageKey === 'contact' || pageKey === 'services' || pageKey === 'home') {
    return [primaryLocation, ...locationSchemas]
  }

  return primaryLocation
}
