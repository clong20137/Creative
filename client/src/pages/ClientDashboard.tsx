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
        return 'client-project-status client-project-status-completed'
      case 'in-progress':
        return 'client-project-status client-project-status-progress'
      case 'pending':
        return 'client-project-status client-project-status-pending'
      default:
        return 'client-project-status client-project-status-default'
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
        <p className="client-dashboard-intro mb-6 text-sm sm:mb-8 sm:text-base">Welcome back! Manage your projects here.</p>

        {/* User Info */}
        <div className="client-dashboard-card card mb-6 p-4 sm:mb-8 sm:p-6">
          <p className="client-dashboard-copy">Logged in as: <span className="client-dashboard-strong font-bold">{userEmail}</span></p>
        </div>

        {licenseStatus && (
          <div className={`client-dashboard-license-card mb-6 rounded-2xl border p-4 sm:mb-8 sm:p-6 ${
            licenseStatus.hasActiveLicense ? 'client-dashboard-license-card-active' : 'client-dashboard-license-card-inactive'
          }`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="client-dashboard-license-eyebrow inline-flex items-center gap-2 text-sm font-semibold">
                  <FiKey /> CMS License
                </p>
                <h2 className="client-dashboard-license-heading mt-2 text-xl font-bold sm:text-2xl">
                  {licenseStatus.hasActiveLicense ? 'Your CMS access is active' : 'Your CMS license needs attention'}
                </h2>
                <p className="client-dashboard-license-copy mt-2">
                  {licenseStatus.hasActiveLicense
                    ? 'Your monthly license is active, and new updates will roll out automatically when we deploy them.'
                    : 'Renew or assign a CMS license to keep using the CMS and receiving updates.'}
                </p>
              </div>
              <Link to="/client-dashboard/license" className="btn-primary client-dashboard-license-button">
                Manage License
              </Link>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:mb-8">
          <Link to="/client-dashboard/billing" className="client-dashboard-shortcut card p-4 font-semibold transition hover:shadow-lg">
            Billing
          </Link>
          <Link to="/client-dashboard/settings" className="client-dashboard-shortcut card p-4 font-semibold transition hover:shadow-lg">
            Account Settings
          </Link>
          <Link to="/client-dashboard/tickets" className="client-dashboard-shortcut card p-4 font-semibold transition hover:shadow-lg">
            Support Tickets
          </Link>
        </div>

        {/* Projects */}
        <div>
          <h2 className="client-dashboard-heading mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">Your Projects</h2>
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
              <div key={project.id} className="client-dashboard-card card p-4 transition hover:shadow-lg sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="client-dashboard-strong text-lg font-bold sm:text-xl">{project.title}</h3>
                    <p className="client-dashboard-copy mt-1">{project.description}</p>
                  </div>
                  <span className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {(project.status || 'pending').replace('-', ' ').charAt(0).toUpperCase() + (project.status || 'pending').replace('-', ' ').slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="client-dashboard-copy text-sm">Progress</span>
                    <span className="client-dashboard-strong text-sm font-bold">{project.progress}%</span>
                  </div>
                  <div className="client-project-progress-track h-2 w-full rounded-full">
                    <div
                      className="client-project-progress-fill h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="client-dashboard-border flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
                  <div className="client-dashboard-copy text-sm">
                    Due: <span className="client-dashboard-strong font-bold">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not scheduled'}</span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button className="btn-secondary flex items-center justify-center gap-2 px-4 py-2">
                      <FiDownload size={18} /> Download
                    </button>
                    <button className="btn-primary flex items-center justify-center gap-2 px-4 py-2">
                      <FiMessageSquare size={18} /> Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="client-dashboard-card card p-8 text-center client-dashboard-copy">
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
            <div key={i} className="client-dashboard-card card p-4 text-center sm:p-6">
              <p className="client-dashboard-copy text-sm">{stat.label}</p>
              <p className="client-dashboard-accent mt-2 text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="client-dashboard-support card mt-8 p-4 sm:p-6">
          <h3 className="client-dashboard-strong mb-2 text-lg font-bold">Need Help?</h3>
          <p className="client-dashboard-copy mb-4">Have questions about your projects? Our team is here to help.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button className="btn-primary px-4 py-2">
              Contact Support
            </button>
            <button className="btn-secondary px-4 py-2">
              View FAQ
            </button>
          </div>
        </div>
    </ClientLayout>
  )
}
