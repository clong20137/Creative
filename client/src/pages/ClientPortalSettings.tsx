import { useState, useEffect } from 'react'
import { FiEdit2, FiSave, FiX, FiLock, FiMail } from 'react-icons/fi'
import { usersAPI } from '../services/api'
import ClientLayout from '../components/ClientLayout'

export default function ClientPortalSettings() {
  const [profile, setProfile] = useState<any>(null)
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [message, setMessage] = useState('')
  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')

  // Editing state
  const [formData, setFormData] = useState<any>({})
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [emailData, setEmailData] = useState({ newEmail: '', password: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [profileData, preferencesData] = await Promise.all([
        usersAPI.getProfile(),
        usersAPI.getPreferences()
      ])
      setProfile(profileData)
      setPreferences(preferencesData)
      setFormData(profileData)
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage('Error loading settings')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      await usersAPI.updateProfile(formData)
      setProfile(formData)
      setEditing(false)
      setMessage('Profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating profile')
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    
    try {
      await usersAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordModal(false)
      setMessage('Password changed successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error changing password')
    }
  }

  const handleEmailChange = async () => {
    try {
      await usersAPI.updateEmail({
        newEmail: emailData.newEmail,
        password: emailData.password
      })
      setProfile((prev: any) => ({ ...prev, email: emailData.newEmail }))
      setEmailData({ newEmail: '', password: '' })
      setShowEmailModal(false)
      setMessage('Email updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating email')
    }
  }

  const handlePreferenceChange = async (key: string, value: any) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value }
      await usersAPI.updatePreferences(updatedPrefs)
      setPreferences(updatedPrefs)
      setMessage('Preferences updated')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating preferences')
    }
  }

  const handleTwoFactorToggle = async () => {
    try {
      const nextValue = !profile?.twoFactorEnabled
      await usersAPI.updateTwoFactor(nextValue)
      setProfile((prev: any) => ({ ...prev, twoFactorEnabled: nextValue, twoFactorMethod: nextValue ? 'email' : null }))
      setTwoFactorSetup(null)
      setMessage(nextValue ? 'Email two-factor authentication enabled' : 'Two-factor authentication disabled')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating two-factor authentication')
    }
  }

  const startAuthenticatorSetup = async () => {
    try {
      setTwoFactorSetup(await usersAPI.startTwoFactorSetup())
    } catch (error) {
      setMessage('Error starting authenticator setup')
    }
  }

  const confirmAuthenticatorSetup = async () => {
    try {
      await usersAPI.confirmTwoFactorSetup(twoFactorCode)
      setProfile((prev: any) => ({ ...prev, twoFactorEnabled: true, twoFactorMethod: 'app' }))
      setTwoFactorSetup(null)
      setTwoFactorCode('')
      setMessage('Authenticator app two-factor authentication enabled')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Invalid authenticator code')
    }
  }

  const qrUrl = twoFactorSetup
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFactorSetup.otpauthUrl)}`
    : ''

  if (loading) {
    return (
      <ClientLayout title="Account Settings">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout title="Account Settings">
        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Profile Information</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              <FiEdit2 /> {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSaveProfile}
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white transition hover:bg-green-700"
              >
                <FiSave /> Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
          <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Two-Factor Authentication</h2>
          <p className="text-gray-600 mb-6">
            Add an extra sign-in check with email codes or an authenticator app on your phone.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={handleTwoFactorToggle} className={profile?.twoFactorEnabled ? 'btn-secondary' : 'btn-primary'}>
              {profile?.twoFactorEnabled ? 'Disable 2FA' : 'Enable Email 2FA'}
            </button>
            <button type="button" onClick={startAuthenticatorSetup} className="btn-secondary">
              Set Up Authenticator App
            </button>
          </div>
          {profile?.twoFactorEnabled && (
            <p className="mt-4 text-sm text-blue-700">
              Current method: {profile.twoFactorMethod === 'app' ? 'Authenticator app' : 'Email code'}
            </p>
          )}
          {twoFactorSetup && (
            <div className="mt-6 space-y-3 max-w-md">
              <img src={qrUrl} alt="Authenticator QR code" className="w-44 h-44 border rounded-lg" />
              <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded">{twoFactorSetup.secret}</p>
              <input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="Authenticator code" className="w-full px-4 py-2 border rounded-lg" />
              <button type="button" onClick={confirmAuthenticatorSetup} className="btn-primary">Confirm App 2FA</button>
            </div>
          )}
        </div>

        {/* Email & Password Section */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* Email */}
          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiMail className="text-blue-600 text-xl" />
              <h3 className="text-xl font-bold text-gray-900">Email Address</h3>
            </div>
            <p className="text-gray-600 mb-4">{profile?.email}</p>
            <button
              onClick={() => setShowEmailModal(true)}
              className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              Change Email
            </button>
          </div>

          {/* Password */}
          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiLock className="text-blue-600 text-xl" />
              <h3 className="text-xl font-bold text-gray-900">Password</h3>
            </div>
            <p className="text-gray-600 mb-4">Last changed: Never</p>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
          <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-4">
              <div>
                <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive updates about your account</p>
              </div>
              <input
                type="checkbox"
                checked={preferences?.emailNotifications !== false}
                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-4">
              <div>
                <h4 className="font-semibold text-gray-900">Invoice Reminders</h4>
                <p className="text-sm text-gray-600">Reminders for upcoming invoice due dates</p>
              </div>
              <input
                type="checkbox"
                checked={preferences?.invoiceReminders !== false}
                onChange={(e) => handlePreferenceChange('invoiceReminders', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-4">
              <div>
                <h4 className="font-semibold text-gray-900">Marketing Emails</h4>
                <p className="text-sm text-gray-600">Promotional offers and news</p>
              </div>
              <input
                type="checkbox"
                checked={preferences?.marketingEmails === true}
                onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-600 hover:text-gray-900">
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Update Password
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Change Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-600 hover:text-gray-900">
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
                <input
                  type="email"
                  value={emailData.newEmail}
                  onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password (for verification)</label>
                <input
                  type="password"
                  value={emailData.password}
                  onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleEmailChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Update Email
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  )
}
