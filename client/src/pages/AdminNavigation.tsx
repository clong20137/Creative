import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

const defaultNavigationItems = [
  { label: 'Home', url: '/', isActive: true, sortOrder: 0 },
  { label: 'Portfolio', url: '/portfolio', isActive: true, sortOrder: 10 },
  { label: 'Services', url: '/services', isActive: true, sortOrder: 20 },
  { label: 'Pricing', url: '/pricing', isActive: true, sortOrder: 30 },
  { label: 'Plugins', url: '/plugins', isActive: true, sortOrder: 40 },
  { label: 'Contact', url: '/contact', isActive: true, sortOrder: 50 }
]

export default function AdminNavigation() {
  const [items, setItems] = useState<any[]>(defaultNavigationItems)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const settings = await adminAPI.getSiteSettings()
        setItems(Array.isArray(settings.navigationItems) && settings.navigationItems.length ? settings.navigationItems : defaultNavigationItems)
      } catch (err: any) {
        setError(err.error || 'Failed to load navigation')
      } finally {
        setLoading(false)
      }
    }

    fetchNavigation()
  }, [])

  const updateItem = (index: number, field: string, value: any) => {
    setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  const addItem = () => {
    setItems(current => [
      ...current,
      { label: 'New Page', url: '/new-page', isActive: true, sortOrder: current.length * 10 }
    ])
  }

  const removeItem = (index: number) => {
    setItems(current => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const saveNavigation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setMessage('Saving navigation...')
      const sortedItems = [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      await adminAPI.updateSiteSettings({ navigationItems: sortedItems })
      setItems(sortedItems)
      setMessage('Navigation saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save navigation')
    }
  }

  return (
    <AdminLayout title="Navigation">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}
      {loading ? <PageSkeleton /> : (
        <form onSubmit={saveNavigation} className="space-y-6">
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Public Website Menu</h2>
              <p className="text-gray-600">Choose which links appear in the main navigation and where they go.</p>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_7rem_auto_auto] md:items-center">
                  <input
                    value={item.label || ''}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    value={item.url || ''}
                    onChange={(e) => updateItem(index, 'url', e.target.value)}
                    placeholder="/page-url"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    value={item.sortOrder ?? 0}
                    onChange={(e) => updateItem(index, 'sortOrder', Number(e.target.value))}
                    placeholder="Order"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={item.isActive !== false}
                      onChange={(e) => updateItem(index, 'isActive', e.target.checked)}
                    />
                    Active
                  </label>
                  <button type="button" onClick={() => removeItem(index)} className="btn-secondary text-red-600">
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addItem} className="btn-secondary">
              Add Navigation Item
            </button>
          </div>

          <button type="submit" className="btn-primary">Save Navigation</button>
        </form>
      )}
    </AdminLayout>
  )
}
