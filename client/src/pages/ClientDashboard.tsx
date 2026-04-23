import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiDownload, FiMessageSquare, FiCheckCircle, FiClock, FiKey } from 'react-icons/fi'
import { licensesAPI, projectsAPI } from '../services/api'
import { PageSkeleton } from '../components/SkeletonLoaders'
import ClientLayout from '../components/ClientLayout'

export default function ClientDashboard() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [licenseStatus, setLicenseStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userId = localStorage.getItem('userId')
    const email = localStorage.getItem('userEmail')

    if (!token || !userId) {
      navigate('/login')
      return
    }

    setUserEmail(email || '')
    fetchProjects(userId)
    licensesAPI.getClientLicense(userId).then(setLicenseStatus).catch(() => setLicenseStatus(null))
  }, [navigate])

  const fetchProjects = async (userId: string) => {
    try {
      setLoading(true)
      setError('')
      const data = await projectsAPI.getClientProjects(userId)
      setProjects(data)
    } catch (err: any) {
      setError(err.error || 'Unable to load projects')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="inline mr-2" />
      case 'in-progress':
        return <FiClock className="inline mr-2" />
      default:
        return null
    }
  }

  return (
    <ClientLayout title="Client Dashboard">
        <p className="mb-6 text-sm text-gray-600 sm:mb-8 sm:text-base">Welcome back! Manage your projects here.</p>

        {/* User Info */}
        <div className="card mb-6 p-4 sm:mb-8 sm:p-6">
          <p className="text-gray-600">Logged in as: <span className="font-bold text-gray-900">{userEmail}</span></p>
        </div>

        {licenseStatus && (
          <div className={`mb-6 rounded-2xl border p-4 sm:mb-8 sm:p-6 ${
            licenseStatus.hasActiveLicense ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
          }`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiKey /> CMS License
                </p>
                <h2 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                  {licenseStatus.hasActiveLicense ? 'Your CMS access is active' : 'Your CMS license needs attention'}
                </h2>
                <p className="mt-2 text-gray-600">
                  {licenseStatus.hasActiveLicense
                    ? 'Your monthly license is active, and new updates will roll out automatically when we deploy them.'
                    : 'Renew or assign a CMS license to keep using the CMS and receiving updates.'}
                </p>
              </div>
              <Link to="/client-dashboard/license" className="btn-primary">
                Manage License
              </Link>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:mb-8">
          <Link to="/client-dashboard/billing" className="card p-4 font-semibold text-blue-600 hover:shadow-lg transition">
            Billing
          </Link>
          <Link to="/client-dashboard/settings" className="card p-4 font-semibold text-blue-600 hover:shadow-lg transition">
            Account Settings
          </Link>
          <Link to="/client-dashboard/tickets" className="card p-4 font-semibold text-blue-600 hover:shadow-lg transition">
            Support Tickets
          </Link>
        </div>

        {/* Projects */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">Your Projects</h2>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <PageSkeleton />
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card p-4 transition hover:shadow-lg sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{project.title}</h3>
                    <p className="text-gray-600 mt-1">{project.description}</p>
                  </div>
                  <span className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {(project.status || 'pending').replace('-', ' ').charAt(0).toUpperCase() + (project.status || 'pending').replace('-', ' ').slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-gray-600">
                    Due: <span className="font-bold text-gray-900">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not scheduled'}</span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button className="flex items-center justify-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition hover:bg-blue-50">
                      <FiDownload size={18} /> Download
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
                      <FiMessageSquare size={18} /> Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-600">
              No projects have been assigned to your account yet.
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 lg:mt-12">
          {[
            { label: 'Total Projects', value: projects.length },
            { label: 'Completed', value: projects.filter(p => p.status === 'completed').length },
            { label: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length }
          ].map((stat, i) => (
            <div key={i} className="card p-4 text-center sm:p-6">
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="card mt-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">Have questions about your projects? Our team is here to help.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
              Contact Support
            </button>
            <button className="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition hover:bg-blue-50">
              View FAQ
            </button>
          </div>
        </div>
    </ClientLayout>
  )
}
