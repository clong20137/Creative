import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        setProjects(await adminAPI.getProjects())
      } catch (err: any) {
        setError(err.error || 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <AdminLayout title="Projects">
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}
      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Budget</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-semibold text-gray-900">{project.title}</p>
                    <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">{project.User?.name || 'Unassigned'}</td>
                  <td className="px-6 py-3 text-sm text-gray-700 capitalize">{project.category?.replace('-', ' ') || '-'}</td>
                  <td className="px-6 py-3 text-sm text-gray-700 capitalize">{project.status?.replace('-', ' ')}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{project.progress || 0}%</td>
                  <td className="px-6 py-3 text-sm text-gray-700">${Number(project.budget || 0).toLocaleString()}</td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-600">No projects yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
