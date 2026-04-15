import { useEffect, useState } from 'react'
import { FiEdit, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

const emptyForm = {
  service: '',
  description: '',
  price: '',
  unit: 'project',
  sortOrder: '0',
  isActive: true
}

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchServices = async () => {
    try {
      setLoading(true)
      setServices(await adminAPI.getServicePackages())
    } catch (err: any) {
      setError(err.error || 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, price: Number(formData.price), sortOrder: Number(formData.sortOrder || 0) }
      if (editingId) {
        await adminAPI.updateServicePackage(editingId, payload)
        setMessage('Service updated')
      } else {
        await adminAPI.createServicePackage(payload)
        setMessage('Service created')
      }
      resetForm()
      fetchServices()
    } catch (err: any) {
      setError(err.error || 'Failed to save service')
    }
  }

  const handleEdit = (service: any) => {
    setEditingId(String(service.id))
    setFormData({
      service: service.service || '',
      description: service.description || '',
      price: String(service.price || ''),
      unit: service.unit || 'project',
      sortOrder: String(service.sortOrder || 0),
      isActive: service.isActive !== false
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await adminAPI.deleteServicePackage(id)
    setMessage('Service deleted')
    fetchServices()
  }

  return (
    <AdminLayout title="A La Carte Services">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pricing Page Services</h2>
          <p className="text-gray-600">These services appear on the public pricing page.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="inline-flex items-center gap-2 btn-primary">
          {showForm ? <FiX /> : <FiPlus />}
          {showForm ? 'Close Form' : 'Add Service'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Service name" value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
            <input type="number" min="0" step="0.01" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
            <input type="text" placeholder="Unit, e.g. project, day, hour" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
            <input type="number" placeholder="Sort order" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
            Show on pricing page
          </label>
          <button type="submit" className="btn-primary">{editingId ? 'Save Service' : 'Create Service'}</button>
        </form>
      )}

      {loading ? <PageSkeleton /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="card p-6">
              <div className="flex justify-between gap-4 mb-3">
                <h3 className="text-xl font-bold text-gray-900">{service.service}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{service.isActive ? 'Shown' : 'Hidden'}</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">${Number(service.price || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mb-4">per {service.unit}</p>
              <p className="text-gray-600 mb-6">{service.description || 'No description'}</p>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(service)} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><FiEdit /> Edit</button>
                <button onClick={() => handleDelete(String(service.id))} className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2 /> Delete</button>
              </div>
            </div>
          ))}
          {services.length === 0 && <div className="card p-8 text-center text-gray-600 lg:col-span-3">No services yet.</div>}
        </div>
      )}
    </AdminLayout>
  )
}
