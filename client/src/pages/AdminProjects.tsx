import { useEffect, useState } from 'react'
import { FiEdit, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, projectsAPI } from '../services/api'

const emptyProjectForm = {
  clientId: '',
  title: '',
  description: '',
  category: 'web-design',
  status: 'pending',
  progress: '0',
  startDate: '',
  dueDate: '',
  budget: '',
  spent: '0',
  notes: ''
}

export default function AdminProjects() {
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyProjectForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [clientsData, projectsData] = await Promise.all([
        adminAPI.getClients(),
        adminAPI.getProjects()
      ])
      setClients(clientsData)
      setProjects(projectsData)
    } catch (err: any) {
      setError(err.error || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setFormData(emptyProjectForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        clientId: Number(formData.clientId),
        progress: Number(formData.progress || 0),
        budget: formData.budget ? Number(formData.budget) : null,
        spent: Number(formData.spent || 0),
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null
      }

      if (editingId) {
        await projectsAPI.updateProject(editingId, payload)
        setMessage('Project updated')
      } else {
        await projectsAPI.createProject(payload)
        setMessage('Project created')
      }

      resetForm()
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to save project')
    }
  }

  const handleEdit = (project: any) => {
    setEditingId(String(project.id))
    setFormData({
      clientId: String(project.clientId || ''),
      title: project.title || '',
      description: project.description || '',
      category: project.category || 'web-design',
      status: project.status || 'pending',
      progress: String(project.progress || 0),
      startDate: project.startDate ? String(project.startDate).slice(0, 10) : '',
      dueDate: project.dueDate ? String(project.dueDate).slice(0, 10) : '',
      budget: project.budget ? String(project.budget) : '',
      spent: project.spent ? String(project.spent) : '0',
      notes: project.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return

    try {
      await projectsAPI.deleteProject(id)
      setMessage('Project deleted')
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to delete project')
    }
  }

  return (
    <AdminLayout title="Projects">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Projects</h2>
          <p className="text-gray-600">Create projects, assign them to clients, and track progress.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="inline-flex items-center gap-2 btn-primary">
          {showForm ? <FiX /> : <FiPlus />}
          {showForm ? 'Close Form' : 'Add Project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required>
              <option value="">Assign to client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name} ({client.email})</option>)}
            </select>
            <input type="text" placeholder="Project title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
          </div>
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={3} />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="web-design">Web Design</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="branding">Branding</option>
            </select>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
            <input type="number" min="0" max="100" placeholder="Progress" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input type="number" min="0" step="0.01" placeholder="Budget" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input type="number" min="0" step="0.01" placeholder="Spent" value={formData.spent} onChange={(e) => setFormData({ ...formData, spent: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <textarea placeholder="Internal notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={2} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editingId ? 'Save Project' : 'Create Project'}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Budget</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3"><p className="font-semibold text-gray-900">{project.title}</p><p className="text-sm text-gray-600">{project.category?.replace('-', ' ')}</p></td>
                  <td className="px-6 py-3 text-sm text-gray-700">{project.User?.name || 'Unassigned'}</td>
                  <td className="px-6 py-3 text-sm text-gray-700 capitalize">{project.status?.replace('-', ' ')}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{project.progress || 0}%</td>
                  <td className="px-6 py-3 text-sm text-gray-700">${Number(project.budget || 0).toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleEdit(project)} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"><FiEdit /> Edit</button>
                      <button onClick={() => handleDelete(String(project.id))} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"><FiTrash2 /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-600">No projects yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
