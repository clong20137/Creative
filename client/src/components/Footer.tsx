import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveAssetUrl, siteSettingsAPI } from '../services/api'
import { applyThemeSettings } from '../utils/theme'

type FooterNavigationItem = {
  label: string
  url: string
  isActive?: boolean
  sortOrder?: number
}

type FooterNavigationColumn = {
  title: string
  sortOrder?: number
  isActive?: boolean
  links?: FooterNavigationItem[]
}

const defaultFooterLinks: FooterNavigationItem[] = [
  { label: 'Home', url: '/', isActive: true, sortOrder: 0 },
  { label: 'Portfolio', url: '/portfolio', isActive: true, sortOrder: 10 },
  { label: 'Services', url: '/services', isActive: true, sortOrder: 20 },
  { label: 'Pricing', url: '/pricing', isActive: true, sortOrder: 30 }
]

function normalizeFooterLink(item: any, index = 0): FooterNavigationItem {
  return {
    label: item?.label || 'Footer Link',
    url: item?.url || '/',
    isActive: item?.isActive !== false,
    sortOrder: Number(item?.sortOrder ?? index * 10)
  }
}

function normalizeFooterColumn(item: any, index = 0): FooterNavigationColumn {
  return {
    title: item?.title || `Footer Column ${index + 1}`,
    sortOrder: Number(item?.sortOrder ?? index * 10),
    isActive: item?.isActive !== false,
    links: Array.isArray(item?.links) ? item.links.map(normalizeFooterLink) : []
  }
}

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [settings, setSettings] = useState<any>({
    siteName: 'Creative by Caleb',
    logoUrl: '',
    logoSize: 40,
    footerDescription: 'Transforming ideas into stunning visual experiences through web design, photography, and videography.',
    contactEmail: 'hello@creativestudio.com',
    footerNavigationItems: defaultFooterLinks,
    footerNavigationColumns: [
      { title: 'Quick Links', sortOrder: 0, isActive: true, links: defaultFooterLinks },
      {
        title: 'Services',
        sortOrder: 10,
        isActive: true,
        links: [
          { label: 'Web Design', url: '/services', isActive: true, sortOrder: 0 },
          { label: 'Photography', url: '/services', isActive: true, sortOrder: 10 },
          { label: 'Videography', url: '/services', isActive: true, sortOrder: 20 },
          { label: 'Branding', url: '/services', isActive: true, sortOrder: 30 }
        ]
      }
    ]
  })
  const socialLinks = [
    { url: settings.facebookUrl, icon: FiFacebook, label: 'Facebook' },
    { url: settings.instagramUrl, icon: FiInstagram, label: 'Instagram' },
    { url: settings.twitterUrl, icon: FiTwitter, label: 'Twitter' },
    { url: settings.linkedinUrl, icon: FiLinkedin, label: 'LinkedIn' }
  ].filter(link => link.url)
  const footerColumns: FooterNavigationColumn[] = (
    Array.isArray(settings.footerNavigationColumns) && settings.footerNavigationColumns.length
      ? settings.footerNavigationColumns
      : [
          { title: 'Quick Links', sortOrder: 0, isActive: true, links: Array.isArray(settings.footerNavigationItems) && settings.footerNavigationItems.length ? settings.footerNavigationItems : defaultFooterLinks },
          {
            title: 'Services',
            sortOrder: 10,
            isActive: true,
            links: [
              { label: 'Web Design', url: '/services', isActive: true, sortOrder: 0 },
              { label: 'Photography', url: '/services', isActive: true, sortOrder: 10 },
              { label: 'Videography', url: '/services', isActive: true, sortOrder: 20 },
              { label: 'Branding', url: '/services', isActive: true, sortOrder: 30 }
            ]
          }
        ]
  )
    .map(normalizeFooterColumn)
    .filter((column: FooterNavigationColumn) => column.isActive !== false)
    .sort((a: FooterNavigationColumn, b: FooterNavigationColumn) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const nextSettings = await siteSettingsAPI.getSettings()
        applyThemeSettings(nextSettings)
        setSettings(nextSettings)
      } catch (error) {
        console.error('Error loading footer settings:', error)
      }
    }

    fetchSettings()
  }, [])

  return (
    <footer className="site-footer py-10 md:py-12">
      <div className="container">
        <div className="mb-8 grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-[1.2fr_2fr_1fr]">
          {/* Company Info */}
          <div className="max-w-xl">
            {settings.logoUrl ? (
              <img
                src={resolveAssetUrl(settings.logoUrl)}
                alt={settings.siteName}
                className="mb-4 w-auto object-contain"
                style={{ height: `${Math.min(Math.max(Number(settings.logoSize) || 40, 24), 96)}px` }}
              />
            ) : <h3 className="text-2xl font-bold mb-4">{settings.siteName}</h3>}
            <p className="max-w-md text-sm leading-7 text-gray-400 md:text-base">
              {settings.footerDescription}
            </p>
          </div>

          <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${footerColumns.length > 2 ? 'xl:grid-cols-3' : ''}`}>
            {footerColumns.map((column) => {
              const links = (column.links || [])
                .map(normalizeFooterLink)
                .filter((link) => link.isActive !== false)
                .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))

              if (links.length === 0) return null

              return (
                <div key={`${column.title}-${column.sortOrder || 0}`}>
                  <h4 className="mb-4 text-base font-semibold md:text-lg">{column.title}</h4>
                  <ul className="space-y-2.5 text-sm text-gray-400 md:text-base">
                    {links.map((link) => (
                      <li key={`${column.title}-${link.label}-${link.url}`}>
                        <Link to={link.url} className="transition hover:text-white">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="mb-4 text-base font-semibold md:text-lg">Connect</h4>
            <p className="mb-4 break-words text-sm text-gray-400 md:text-base">{settings.contactEmail}</p>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a key={link.label} href={link.url} aria-label={link.label} className="text-gray-400 transition hover:text-white">
                    <Icon size={20} />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 md:pt-8">
          <div className="flex flex-col gap-4 text-sm text-gray-400 md:flex-row md:items-center md:justify-between md:text-base">
            <p className="text-center md:text-left">&copy; {currentYear} {settings.siteName}. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
              <a href="#" className="transition hover:text-white">Privacy Policy</a>
              <a href="#" className="transition hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
