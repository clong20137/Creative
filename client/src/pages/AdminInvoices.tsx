import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        setInvoices(await adminAPI.getInvoices())
      } catch (err: any) {
        setError(err.error || 'Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  return (
    <AdminLayout title="Invoices">
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}
      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Invoice</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Issued</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{invoice.User?.name || 'Unknown'}</td>
                  <td className="px-6 py-3 text-sm text-gray-700 capitalize">{invoice.status}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">${Number(invoice.total || 0).toLocaleString()}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-600">No invoices yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
