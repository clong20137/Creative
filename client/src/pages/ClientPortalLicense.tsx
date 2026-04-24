import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiClock, FiGlobe, FiKey, FiRefreshCw, FiShoppingCart, FiXCircle } from 'react-icons/fi'
import ClientLayout from '../components/ClientLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { licensesAPI } from '../services/api'

export default function ClientPortalLicense() {
  const clientId = localStorage.getItem('userId') || ''
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [licenseStatus, setLicenseStatus] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [entitlements, setEntitlements] = useState<any>(null)
  const [licensedDomain, setLicensedDomain] = useState('')
  const [submittingPlanId, setSubmittingPlanId] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<'cancel' | 'reactivate' | ''>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchLicense = useCallback(async () => {
    if (!clientId) return
    try {
      setLoading(true)
      const [licenseData, plansData, entitlementsData] = await Promise.all([
        licensesAPI.getClientLicense(clientId),
        licensesAPI.getLicensePlans(),
        licensesAPI.getClientEntitlements(clientId)
      ])
      setLicenseStatus(licenseData)
      setPlans(plansData)
      setEntitlements(entitlementsData)
      setLicensedDomain((current) => current || licenseData?.license?.licensedDomain || '')
    } catch (fetchError: any) {
      setLicenseStatus(null)
      setPlans([])
      setEntitlements(null)
      setError(fetchError.error || 'Failed to load license information')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('checkout') === 'success') {
      setMessage('License checkout completed. We are refreshing your account status now.')
    } else if (params.get('checkout') === 'cancelled') {
      setMessage('License checkout was cancelled.')
    }
    fetchLicense()
  }, [fetchLicense, location.search])

  const license = licenseStatus?.license
  const hasActiveLicense = Boolean(licenseStatus?.hasActiveLicense)
  const activePlanId = license?.planId ? String(license.planId) : ''
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => Number(a.price || 0) - Number(b.price || 0)), [plans])

  const startCheckout = async (planId: string) => {
    try {
      setError('')
      setMessage('')
      setSubmittingPlanId(planId)
      const session = await licensesAPI.createLicenseCheckoutSession(clientId, {
        planId,
        licensedDomain
      })
      if (session?.url) {
        window.location.href = session.url
        return
      }
      setError('Unable to start checkout')
    } catch (checkoutError: any) {
      setError(checkoutError.error || 'Failed to start license checkout')
    } finally {
      setSubmittingPlanId('')
    }
  }

  const handleCancel = async () => {
    try {
      setActionLoading('cancel')
      setError('')
      setMessage('')
      await licensesAPI.cancelClientLicense(clientId)
      setMessage('Cancellation scheduled. Your license will stay active through the current paid period.')
      await fetchLicense()
    } catch (cancelError: any) {
      setError(cancelError.error || 'Failed to cancel license')
    } finally {
      setActionLoading('')
    }
  }

  const handleReactivate = async () => {
    try {
      setActionLoading('reactivate')
      setError('')
      setMessage('')
      await licensesAPI.reactivateClientLicense(clientId)
      setMessage('License reactivated.')
      await fetchLicense()
    } catch (reactivateError: any) {
      setError(reactivateError.error || 'Failed to reactivate license')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <ClientLayout title="CMS License">
      {message && <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <section className={`rounded-2xl border p-4 sm:p-6 lg:p-8 ${hasActiveLicense ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiKey /> License Status
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  {hasActiveLicense ? 'Your CMS license is active' : 'Choose a CMS license to unlock the full platform'}
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600">
                  {hasActiveLicense
                    ? license?.cancelAtPeriodEnd
                      ? 'Your license is still active, but cancellation is scheduled for the end of the current billing period.'
                      : 'This account can use the CMS, receive updates, and access the full client-side editing experience.'
                    : 'Pick a license plan below to start your monthly CMS subscription, set the licensed domain, and unlock all CMS features.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={fetchLicense} className="btn-secondary inline-flex items-center gap-2">
                  <FiRefreshCw /> Refresh Status
                </button>
                <Link to="/client-dashboard/billing" className="btn-primary">
                  Open Billing
                </Link>
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

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            {[
              { label: 'Page Limit', value: entitlements?.maxPages || 'Unlimited' },
              { label: 'Media Limit', value: entitlements?.maxMediaItems || 'Unlimited' },
              { label: 'Storage', value: entitlements?.maxStorageMb ? `${entitlements.maxStorageMb} MB` : 'Unlimited' },
              { label: 'Team Members', value: entitlements?.maxTeamMembers || 'Unlimited' }
            ].map((item) => (
              <div key={item.label} className="card p-4 sm:p-6">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr,1fr] xl:gap-6">
            <div className="card p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">License Details</h3>
                {license?.cancelAtPeriodEnd ? (
                  <button onClick={handleReactivate} disabled={actionLoading === 'reactivate'} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
                    <FiRefreshCw /> {actionLoading === 'reactivate' ? 'Reactivating...' : 'Reactivate'}
                  </button>
                ) : hasActiveLicense ? (
                  <button onClick={handleCancel} disabled={actionLoading === 'cancel'} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-3 font-semibold text-red-700 hover:bg-red-200 disabled:opacity-60">
                    <FiXCircle /> {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel At Period End'}
                  </button>
                ) : null}
              </div>

              {license ? (
                <div className="mt-6 space-y-4 text-gray-700">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">License Key</p>
                    <p className="mt-2 break-all font-mono text-sm text-gray-900">{license.licenseKey || 'Generated when checkout completes'}</p>
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
                      <li className="inline-flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-blue-900">
                        <FiCheckCircle className="mt-0.5 shrink-0" />
                        <span>Plugins: {entitlements?.allowAllPlugins ? 'All enabled plugins' : ((entitlements?.allowedPluginSlugs || []).join(', ') || 'No plugins included')}</span>
                      </li>
                      <li className={`inline-flex items-start gap-2 rounded-xl p-3 ${entitlements?.whiteLabelEnabled ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-600'}`}>
                        <FiCheckCircle className="mt-0.5 shrink-0" />
                        <span>White-label controls: {entitlements?.whiteLabelEnabled ? 'Included' : 'Not included'}</span>
                      </li>
                      <li className={`inline-flex items-start gap-2 rounded-xl p-3 ${entitlements?.backupsEnabled ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-600'}`}>
                        <FiCheckCircle className="mt-0.5 shrink-0" />
                        <span>Backups: {entitlements?.backupsEnabled ? 'Included' : 'Not included'}</span>
                      </li>
                      <li className={`inline-flex items-start gap-2 rounded-xl p-3 ${entitlements?.auditLogEnabled ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-600'}`}>
                        <FiCheckCircle className="mt-0.5 shrink-0" />
                        <span>Audit log: {entitlements?.auditLogEnabled ? 'Included' : 'Not included'}</span>
                      </li>
                      <li className={`inline-flex items-start gap-2 rounded-xl p-3 ${entitlements?.customDomainEnabled ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-600'}`}>
                        <FiCheckCircle className="mt-0.5 shrink-0" />
                        <span>Custom domains: {entitlements?.customDomainEnabled ? 'Included' : 'Not included'}</span>
                      </li>
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
                <h3 className="text-xl font-bold text-gray-900">Set Your Licensed Domain</h3>
                <p className="mt-4 text-gray-600">Use the primary domain where this CMS license will run. You can update it before starting checkout.</p>
                <label className="mt-4 block text-sm font-semibold text-gray-700">
                  Licensed domain
                  <input value={licensedDomain} onChange={(e) => setLicensedDomain(e.target.value)} placeholder="example.com" className="mt-2 w-full rounded-lg border px-4 py-3" />
                </label>
              </div>

              <div className="card p-4 sm:p-6 lg:p-8">
                <h3 className="text-xl font-bold text-gray-900">How updates work</h3>
                <div className="mt-4 space-y-3 text-gray-600">
                  <p>Active licenses stay on the selected update channel.</p>
                  <p>Stable is best for most sites. Early Access gets new features sooner.</p>
                  <p>When we deploy a new release, active licensed sites receive those updates automatically.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Choose a License Plan</h3>
              <p className="mt-2 text-gray-600">Start a new CMS subscription, renew on a different tier, or move to a different update channel.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {sortedPlans.map((plan) => {
                const isCurrent = activePlanId && activePlanId === String(plan.id)
                return (
                  <article key={plan.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${isCurrent ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{plan.updateChannel === 'early-access' ? 'Early Access' : 'Stable'}</p>
                        <h4 className="mt-2 text-2xl font-bold text-gray-900">{plan.name}</h4>
                      </div>
                      {isCurrent && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Current</span>}
                    </div>
                    {plan.description && <p className="mt-3 text-gray-600">{plan.description}</p>}
                    <div className="mt-6">
                      <span className="text-4xl font-bold text-gray-900">${Number(plan.price || 0).toLocaleString()}</span>
                      <span className="ml-2 text-gray-500">/{plan.billingCycle === 'annually' ? 'year' : plan.billingCycle === 'quarterly' ? 'quarter' : 'month'}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">Pages: <span className="font-semibold text-gray-900">{plan.maxPages || 'Unlimited'}</span></div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">Media: <span className="font-semibold text-gray-900">{plan.maxMediaItems || 'Unlimited'}</span></div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">Storage: <span className="font-semibold text-gray-900">{plan.maxStorageMb ? `${plan.maxStorageMb} MB` : 'Unlimited'}</span></div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">Team: <span className="font-semibold text-gray-900">{plan.maxTeamMembers || 'Unlimited'}</span></div>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {(Array.isArray(plan.features) ? plan.features : []).map((feature: string, index: number) => (
                        <li key={`${plan.id}-${index}`} className="flex items-start gap-2 text-sm text-gray-700">
                          <FiCheckCircle className="mt-0.5 shrink-0 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {(!Array.isArray(plan.features) || plan.features.length === 0) && (
                        <li className="text-sm text-gray-500">No extra feature list has been added for this plan yet.</li>
                      )}
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <FiCheckCircle className="mt-0.5 shrink-0 text-green-600" />
                        <span>Plugins: {plan.allowAllPlugins !== false ? 'All plugins allowed' : ((plan.allowedPluginSlugs || []).join(', ') || 'No plugins included')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <FiCheckCircle className="mt-0.5 shrink-0 text-green-600" />
                        <span>White-label: {plan.whiteLabelEnabled ? 'Included' : 'Not included'}</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <FiCheckCircle className="mt-0.5 shrink-0 text-green-600" />
                        <span>Backups: {plan.backupsEnabled ? 'Included' : 'Not included'}</span>
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => startCheckout(String(plan.id))}
                      disabled={submittingPlanId === String(plan.id)}
                      className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <FiShoppingCart />
                      {submittingPlanId === String(plan.id)
                        ? 'Opening Checkout...'
                        : hasActiveLicense
                          ? isCurrent
                            ? 'Renew Or Update Plan'
                            : 'Switch To This Plan'
                          : 'Start CMS License'}
                    </button>
                  </article>
                )
              })}
              {sortedPlans.length === 0 && (
                <div className="rounded-xl border bg-gray-50 p-6 text-gray-600">
                  No CMS license plans are available yet.
                </div>
              )}
            </div>
          </section>

          <section className="card p-4 sm:p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900">Need help with your license?</h3>
            <p className="mt-4 text-gray-600">
              We can help update the licensed domain, move you between tiers, or troubleshoot a renewal.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/client-dashboard/tickets" className="btn-secondary inline-flex items-center justify-center gap-2">
                Request License Help <FiArrowRight />
              </Link>
            </div>
          </section>
        </div>
      )}
    </ClientLayout>
  )
}
