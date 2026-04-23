import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiClock, FiGlobe, FiKey, FiRefreshCw } from 'react-icons/fi'
import ClientLayout from '../components/ClientLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { licensesAPI } from '../services/api'

export default function ClientPortalLicense() {
  const clientId = localStorage.getItem('userId') || ''
  const [loading, setLoading] = useState(true)
  const [licenseStatus, setLicenseStatus] = useState<any>(null)

  const fetchLicense = useCallback(async () => {
    try {
      setLoading(true)
      const data = await licensesAPI.getClientLicense(clientId)
      setLicenseStatus(data)
    } catch (error) {
      setLicenseStatus(null)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchLicense()
  }, [fetchLicense])

  const license = licenseStatus?.license
  const hasActiveLicense = Boolean(licenseStatus?.hasActiveLicense)

  return (
    <ClientLayout title="CMS License">
      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <section className={`rounded-2xl border p-4 sm:p-6 lg:p-8 ${
            hasActiveLicense ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
          }`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiKey /> License Status
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  {hasActiveLicense ? 'Monthly CMS license is active' : 'A CMS license is required'}
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600">
                  {hasActiveLicense
                    ? 'This account can use the CMS and receives pushed updates automatically whenever a new release is deployed.'
                    : 'Assign or renew a CMS license to unlock the portal, continue using the CMS, and stay on the active update channel.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/client-dashboard/billing" className="btn-primary">
                  Manage Billing
                </Link>
                <button onClick={fetchLicense} className="btn-secondary inline-flex items-center gap-2">
                  <FiRefreshCw /> Refresh Status
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[
              { label: 'Status', value: hasActiveLicense ? 'Active' : (license?.status || 'Inactive') },
              { label: 'Plan', value: license?.planName || 'No license assigned' },
              { label: 'Update Channel', value: license?.updateChannel === 'early-access' ? 'Early Access' : 'Stable' },
              { label: 'Renewal', value: license?.renewalDate ? new Date(license.renewalDate).toLocaleDateString() : 'Not scheduled' }
            ].map((item) => (
              <div key={item.label} className="card p-4 sm:p-6">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr,1fr] xl:gap-6">
            <div className="card p-4 sm:p-6 lg:p-8">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">License Details</h3>
              {license ? (
                <div className="mt-6 space-y-4 text-gray-700">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">License Key</p>
                    <p className="mt-2 break-all font-mono text-sm text-gray-900">{license.licenseKey || 'Generated when a CMS plan is assigned'}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="inline-flex items-center gap-2 text-sm text-gray-500"><FiGlobe /> Licensed Domain</p>
                      <p className="mt-2 font-semibold text-gray-900">{license.licensedDomain || 'Not set yet'}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="inline-flex items-center gap-2 text-sm text-gray-500"><FiClock /> Last Validation</p>
                      <p className="mt-2 font-semibold text-gray-900">
                        {license.lastValidatedAt ? new Date(license.lastValidatedAt).toLocaleString() : 'Waiting for first validation'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Included with this license</p>
                    <ul className="mt-4 grid gap-3 md:grid-cols-2">
                      {(license.features || []).map((feature: string, index: number) => (
                        <li key={`${feature}-${index}`} className="inline-flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-blue-900">
                          <FiCheckCircle className="mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {(!license.features || license.features.length === 0) && (
                        <li className="rounded-xl bg-gray-50 p-4 text-gray-500">No additional feature list has been added yet.</li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl bg-gray-50 p-6 text-gray-600">
                  No CMS license has been assigned to this account yet.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="card p-4 sm:p-6 lg:p-8">
                <h3 className="text-xl font-bold text-gray-900">How updates work</h3>
                <div className="mt-4 space-y-3 text-gray-600">
                  <p>Active licenses stay on your selected update channel.</p>
                  <p>When a new CMS release is deployed, the update is pushed out automatically.</p>
                  <p>Stable is best for most clients. Early Access is useful if you want newer features sooner.</p>
                </div>
              </div>

              <div className="card p-4 sm:p-6 lg:p-8">
                <h3 className="text-xl font-bold text-gray-900">Need to renew or upgrade?</h3>
                <p className="mt-4 text-gray-600">
                  We can assign a new monthly CMS plan, switch your update channel, or update the licensed domain.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link to="/client-dashboard/billing" className="btn-primary inline-flex items-center justify-center gap-2">
                    Open Billing <FiArrowRight />
                  </Link>
                  <Link to="/client-dashboard/tickets" className="btn-secondary inline-flex items-center justify-center gap-2">
                    Request License Help <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </ClientLayout>
  )
}
