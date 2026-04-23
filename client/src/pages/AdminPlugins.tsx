import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiExternalLink, FiSettings } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, pluginsAPI } from '../services/api'

function formatPrice(price: number | string) {
  return Number(price || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

export default function AdminPlugins() {
  const [plugins, setPlugins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()

  const fetchPlugins = async () => {
    try {
      setLoading(true)
      setPlugins(await adminAPI.getPlugins())
    } catch (err: any) {
      setError(err.error || 'Failed to load plugins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlugins()
  }, [])

  useEffect(() => {
    const payment = searchParams.get('plugin_payment')
    if (payment === 'success') setMessage('Plugin payment received. Stripe will activate it after the webhook confirms the payment.')
    if (payment === 'cancelled') setError('Plugin payment was cancelled.')
  }, [searchParams])

  const togglePlugin = async (plugin: any) => {
    try {
      setError('')
      const updated = await adminAPI.updatePlugin(plugin.slug, {
        isEnabled: !plugin.isEnabled
      })
      setPlugins(current => current.map(item => item.id === updated.id ? updated : item))
      setMessage(updated.isEnabled ? `${updated.name} activated` : `${updated.name} deactivated`)
    } catch (err: any) {
      setError(err.error || 'Failed to update plugin')
    }
  }

  const purchasePlugin = async (plugin: any) => {
    try {
      setError('')
      const session = await pluginsAPI.createPluginCheckoutSession(plugin.slug)
      window.location.href = session.url
    } catch (err: any) {
      setError(err.error || 'Failed to start plugin checkout')
    }
  }

  return (
    <AdminLayout title="Plugins">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      <div className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Plugin Marketplace</h2>
          <p className="text-sm text-gray-600 sm:text-base">Purchase, activate, and manage optional website plugins.</p>
        </div>
      </div>

      {loading ? <PageSkeleton /> : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
          {plugins.map((plugin) => (
            <section key={plugin.id} className="card p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">{plugin.name}</h3>
                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{plugin.category}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${plugin.isPurchased ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {plugin.isPurchased ? 'Purchased' : 'Not purchased'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${plugin.isEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {plugin.isEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mb-4 text-sm text-gray-600 sm:text-base">{plugin.description}</p>
                  <p className="text-2xl font-bold text-blue-600 sm:text-3xl">{formatPrice(plugin.price)}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {plugin.isPurchased ? (
                    <>
                      <Link to={`/admin/plugins/${plugin.slug}`} className="inline-flex w-full items-center justify-center gap-2 btn-primary sm:w-auto">
                        <FiSettings /> Manage
                      </Link>
                      <button onClick={() => togglePlugin(plugin)} className="w-full btn-secondary sm:w-auto">
                        {plugin.isEnabled ? 'Deactivate' : 'Activate'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => purchasePlugin(plugin)} className="w-full btn-primary sm:w-auto">
                      Purchase Plugin
                    </button>
                  )}
                  {plugin.demoUrl && plugin.isEnabled && (
                    <Link to={plugin.demoUrl} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 sm:w-auto">
                      <FiExternalLink /> View Demo
                    </Link>
                  )}
                </div>
              </div>
            </section>
          ))}
          {plugins.length === 0 && <div className="card p-6 text-center text-gray-600 sm:p-8 xl:col-span-2">No plugins are available yet.</div>}
        </div>
      )}
    </AdminLayout>
  )
}
