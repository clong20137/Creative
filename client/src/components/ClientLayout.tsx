import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiFileText, FiGrid, FiHelpCircle, FiHome, FiKey, FiLogOut, FiSettings } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { subscriptionsAPI } from '../services/api'

const clientLinks = [
  { label: 'Dashboard', path: '/client-dashboard', icon: FiHome },
  { label: 'License', path: '/client-dashboard/license', icon: FiKey },
  { label: 'Billing', path: '/client-dashboard/billing', icon: FiFileText },
  { label: 'Plugins', path: '/client-dashboard/plugins', icon: FiGrid },
  { label: 'Tickets', path: '/client-dashboard/tickets', icon: FiHelpCircle },
  { label: 'Settings', path: '/client-dashboard/settings', icon: FiSettings }
]

export default function ClientLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [licenseState, setLicenseState] = useState<{ loading: boolean; hasActiveLicense: boolean; license: any | null }>({
    loading: true,
    hasActiveLicense: false,
    license: null
  })
  const currentPath = location.pathname
  const inactiveAllowedPaths = useMemo(() => new Set([
    '/client-dashboard/license',
    '/client-dashboard/billing',
    '/client-dashboard/settings'
  ]), [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userId = localStorage.getItem('userId')
    if (!token || localStorage.getItem('userRole') !== 'client' || !userId) {
      navigate('/login')
      return
    }

    let cancelled = false
    subscriptionsAPI.getClientLicense(userId)
      .then((data: any) => {
        if (cancelled) return
        setLicenseState({
          loading: false,
          hasActiveLicense: Boolean(data?.hasActiveLicense),
          license: data?.license || null
        })
        if (!data?.hasActiveLicense && !inactiveAllowedPaths.has(currentPath)) {
          navigate('/client-dashboard/license')
        }
      })
      .catch(() => {
        if (cancelled) return
        setLicenseState({ loading: false, hasActiveLicense: false, license: null })
        if (!inactiveAllowedPaths.has(currentPath)) navigate('/client-dashboard/license')
      })

    return () => {
      cancelled = true
    }
  }, [currentPath, inactiveAllowedPaths, navigate])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/client-dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                Client Portal
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${
                  licenseState.hasActiveLicense
                    ? 'bg-green-100 text-green-800'
                    : licenseState.loading
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-red-100 text-red-700'
                }`}>
                  {licenseState.loading
                    ? 'Checking license...'
                    : licenseState.hasActiveLicense
                      ? 'CMS License Active'
                      : 'License Required'}
                </span>
                {licenseState.license?.renewalDate && (
                  <span className="text-gray-500">
                    Renewal {new Date(licenseState.license.renewalDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FiLogOut /> Logout
            </button>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {clientLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/client-dashboard'}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`
                  }
                >
                  <Icon size={16} />
                  {link.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="container py-8">
        {!licenseState.loading && !licenseState.hasActiveLicense && !inactiveAllowedPaths.has(currentPath) && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            Your CMS license is inactive. Billing, license management, and account settings are still available while you renew access.
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
