import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, usersAPI } from '../services/api'

const emptySettings = {
  siteName: '',
  faviconUrl: '',
  contactEmail: '',
  phone: '',
  hours: '',
  locationLine1: '',
  locationLine2: '',
  footerDescription: '',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  linkedinUrl: ''
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(emptySettings)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const userId = localStorage.getItem('userId') || ''

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const [data, profile] = await Promise.all([
          adminAPI.getSiteSettings(),
          usersAPI.getProfile()
        ])
        setSettings({ ...emptySettings, ...data })
        setTwoFactorEnabled(Boolean(profile.twoFactorEnabled))
      } catch (err: any) {
        setError(err.error || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminAPI.updateSiteSettings(settings)
      setMessage('Site settings saved')
      document.title = settings.siteName || 'Creative Studio'
    } catch (err: any) {
      setError(err.error || 'Failed to save settings')
    }
  }

  const handleTwoFactorToggle = async () => {
    try {
      const nextValue = !twoFactorEnabled
      await adminAPI.updateTwoFactor(userId, nextValue)
      setTwoFactorEnabled(nextValue)
      setMessage(nextValue ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled')
    } catch (err: any) {
      setError(err.error || 'Failed to update two-factor authentication')
    }
  }

  return (
    <AdminLayout title="Site Settings">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 card p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Generic Site Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={settings.siteName} onChange={(e) => handleChange('siteName', e.target.value)} placeholder="Site name" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.faviconUrl || ''} onChange={(e) => handleChange('faviconUrl', e.target.value)} placeholder="Favicon URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={settings.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} placeholder="Contact email" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone number" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.hours} onChange={(e) => handleChange('hours', e.target.value)} placeholder="Business hours" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.locationLine1} onChange={(e) => handleChange('locationLine1', e.target.value)} placeholder="Location line 1" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.locationLine2} onChange={(e) => handleChange('locationLine2', e.target.value)} placeholder="Location line 2" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 md:col-span-2" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Footer and Social Links</h2>
              <textarea value={settings.footerDescription} onChange={(e) => handleChange('footerDescription', e.target.value)} placeholder="Footer description" rows={3} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={settings.facebookUrl || ''} onChange={(e) => handleChange('facebookUrl', e.target.value)} placeholder="Facebook URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.instagramUrl || ''} onChange={(e) => handleChange('instagramUrl', e.target.value)} placeholder="Instagram URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.twitterUrl || ''} onChange={(e) => handleChange('twitterUrl', e.target.value)} placeholder="Twitter URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <input value={settings.linkedinUrl || ''} onChange={(e) => handleChange('linkedinUrl', e.target.value)} placeholder="LinkedIn URL" className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </section>

            <button type="submit" className="btn-primary">Save Settings</button>
          </form>

          <aside className="card p-6 h-fit">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Two-Factor Authentication</h2>
            <p className="text-gray-600 mb-6">
              When enabled, this admin account will receive a verification code by email after entering the correct password.
            </p>
            <button onClick={handleTwoFactorToggle} className={twoFactorEnabled ? 'btn-secondary w-full' : 'btn-primary w-full'}>
              {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </aside>
        </div>
      )}
    </AdminLayout>
  )
}
