import { useState, useCallback, useEffect } from 'react'
import { FiDownload, FiCreditCard, FiRefreshCw, FiX } from 'react-icons/fi'
import { invoicesAPI, subscriptionsAPI } from '../services/api'
import { PageSkeleton } from '../components/SkeletonLoaders'
import ClientLayout from '../components/ClientLayout'

export default function ClientPortalBilling() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const clientId = localStorage.getItem('userId') || ''

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [invoicesData, subData] = await Promise.all([
        invoicesAPI.getClientInvoices(clientId),
        subscriptionsAPI.getClientSubscription(clientId)
      ])
      setInvoices(invoicesData)
      setSubscription(subData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const paymentStatus = new URLSearchParams(window.location.search).get('payment')
    if (paymentStatus === 'success') {
      setPaymentMessage('Payment received. Your invoice status will update shortly.')
      fetchData()
    }
    if (paymentStatus === 'cancelled') {
      setPaymentMessage('Payment was cancelled. No charge was made.')
    }
  }, [fetchData])

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setPaymentError('')
      const session = await invoicesAPI.createCheckoutSession(invoiceId)
      if (session.url) {
        window.location.href = session.url
      }
    } catch (error: any) {
      console.error('Error starting payment:', error)
      setPaymentError(error.error || 'Payment processing is not configured yet')
    }
  }

  const downloadInvoice = (invoiceId: string) => {
    window.open(invoicesAPI.getDownloadUrl(invoiceId), '_blank')
  }

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await subscriptionsAPI.cancelSubscription(String(subscription.id))
        fetchData()
      } catch (error) {
        console.error('Error canceling subscription:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ClientLayout title="Billing">
        {/* Subscription Section */}
        {paymentMessage && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {paymentMessage}
          </div>
        )}
        {paymentError && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            {paymentError}
          </div>
        )}

        <div className="mb-8 sm:mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">My Subscription</h2>
          {loading ? (
            <PageSkeleton />
          ) : subscription ? (
            <div className="card p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Plan</p>
                  <p className="text-xl font-bold text-gray-900 capitalize sm:text-2xl">{subscription.tier}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Billing Cycle</p>
                  <p className="text-xl font-bold text-gray-900 sm:text-2xl">${subscription.price}/{subscription.billingCycle}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
              </div>

              <div className="mt-8 border-t pt-8">
                <h3 className="font-bold text-gray-900 mb-4">Included Features:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subscription.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex items-center justify-center gap-2 btn-primary"
                >
                  <FiRefreshCw /> Upgrade Plan
                </button>
                {subscription.status === 'active' && (
                  <button
                    onClick={handleCancelSubscription}
                    className="flex items-center justify-center gap-2 btn-secondary"
                  >
                    <FiX /> Cancel Subscription
                  </button>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p>Next renewal date: <strong>{new Date(subscription.renewalDate).toLocaleDateString()}</strong></p>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="mb-4 text-gray-600">You don't have an active subscription</p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="btn-primary"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Invoices Section */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">Invoices & Billing</h2>
          {loading ? (
            <PageSkeleton />
          ) : invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="card p-4 transition hover:shadow-lg sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-gray-900">{invoice.invoiceNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Issued: {new Date(invoice.issueDate).toLocaleDateString()} | Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-left lg:mr-6 lg:text-right">
                    <p className="text-xl font-bold text-gray-900 sm:text-2xl">${invoice.total.toLocaleString()}</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => downloadInvoice(String(invoice.id))}
                      className="flex items-center justify-center rounded-lg bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200"
                    >
                      <FiDownload size={20} />
                    </button>
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => handlePayInvoice(String(invoice.id))}
                        className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                      >
                        <FiCreditCard size={16} /> Pay Now
                      </button>
                    )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-600">No invoices yet</p>
            </div>
          )}
        </div>
      

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Choose Your Plan</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { name: 'Starter', price: 1500, features: ['5 Projects', 'Basic Support'] },
                { name: 'Professional', price: 3500, features: ['Unlimited Projects', 'Priority Support'] },
                { name: 'Enterprise', price: 7500, features: ['Everything', 'Dedicated Support'] }
              ].map((plan, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">{plan.name}</h4>
                  <p className="mb-4 text-xl font-bold text-blue-600 sm:text-2xl">${plan.price}</p>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f, j) => (
                      <li key={j} className="text-sm text-gray-600">- {f}</li>
                    ))}
                  </ul>
                  <button className="w-full btn-primary text-sm">Select</button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </ClientLayout>
  )
}

