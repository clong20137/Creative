import { useCallback, useEffect, useState } from 'react'
import { FiCheckCircle, FiClock, FiCreditCard } from 'react-icons/fi'
import ClientLayout from '../components/ClientLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI } from '../services/api'

export default function ClientPortalPlugins() {
  const [plugins, setPlugins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true)
      setPlugins(await pluginsAPI.getClientPlugins())
    } catch (error) {
      console.error('Error fetching plugins:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlugins()
  }, [fetchPlugins])

  useEffect(() => {
    const pluginPaymentStatus = new URLSearchParams(window.location.search).get('plugin_payment')
    if (pluginPaymentStatus === 'success') {
      setMessage('Plugin payment received. Your plugin will show as purchased after Stripe confirms the payment.')
      fetchPlugins()
    }
    if (pluginPaymentStatus === 'cancelled') {
      setMessage('Plugin payment was cancelled. No charge was made.')
    }
  }, [fetchPlugins])

  const handlePurchasePlugin = async (slug: string) => {
    try {
      setErrorMessage('')
      const session = await pluginsAPI.createPluginCheckoutSession(slug)
      window.location.href = session.url
    } catch (error: any) {
      setErrorMessage(error.error || 'Plugin checkout is not configured yet')
    }
  }

  return (
    <ClientLayout title="Website Plugins">
      {message && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
          {message}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Available Website Plugins</h2>
        <p className="mt-2 text-gray-600">Add optional features to your website without mixing them into billing history.</p>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : plugins.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {plugins.map((plugin) => {
            const purchase = plugin.clientPurchase
            const isPurchased = purchase?.status === 'active'
            const isPending = purchase?.status === 'pending'
            const isAllowedByPlan = plugin.planAccess?.allowed !== false
            const restrictionReason = plugin.planAccess?.reason || ''

            return (
              <div key={plugin.id} className="card p-4 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{plugin.name}</h3>
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${isPurchased ? 'bg-green-100 text-green-800' : isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                    {isPurchased ? <FiCheckCircle /> : isPending ? <FiClock /> : <FiCreditCard />}
                    {isPurchased ? 'Purchased' : isPending ? 'Payment pending' : 'Available'}
                  </span>
                </div>
                <p className="mb-5 text-gray-600">{plugin.description}</p>
                {!isAllowedByPlan && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {restrictionReason}
                  </div>
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xl font-bold text-blue-600 sm:text-2xl">
                    {Number(plugin.price || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </p>
                  {isPurchased ? (
                    <span className="font-semibold text-green-700">Installed on your account</span>
                  ) : (
                    <button onClick={() => handlePurchasePlugin(plugin.slug)} disabled={!isAllowedByPlan} className="w-full btn-primary disabled:opacity-50 sm:w-auto">
                      {isAllowedByPlan ? 'Purchase Plugin' : 'Upgrade Required'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-600">No plugins are available right now</p>
        </div>
      )}
    </ClientLayout>
  )
}
