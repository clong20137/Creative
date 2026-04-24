import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

const actionOptions = [
  { value: '', label: 'All actions' },
  { value: 'site-settings.updated', label: 'Settings updates' },
  { value: 'page.created', label: 'Page created' },
  { value: 'page.updated', label: 'Page updated' },
  { value: 'page.deleted', label: 'Page deleted' },
  { value: 'backup.created', label: 'Backup created' },
  { value: 'backup.imported', label: 'Backup imported' },
  { value: 'backup.restored', label: 'Backup restored' },
  { value: 'backup.deleted', label: 'Backup deleted' },
  { value: 'media.created', label: 'Media created' },
  { value: 'media.updated', label: 'Media updated' },
  { value: 'media.deleted', label: 'Media deleted' },
  { value: 'user.created', label: 'User created' },
  { value: 'user.updated', label: 'User updated' },
  { value: 'user.deleted', label: 'User deleted' },
  { value: 'license.assigned', label: 'License assigned' },
  { value: 'license.cancelled', label: 'License cancelled' }
]

const targetOptions = [
  { value: '', label: 'All targets' },
  { value: 'site-settings', label: 'Site settings' },
  { value: 'page', label: 'Pages' },
  { value: 'backup', label: 'Backups' },
  { value: 'media', label: 'Media' },
  { value: 'user', label: 'Users' },
  { value: 'license', label: 'Licenses' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'plugin', label: 'Plugins' },
  { value: 'site-demo', label: 'Site demos' },
  { value: 'contact-message', label: 'Messages' }
]

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function prettyAction(action: string) {
  return String(action || '')
    .replace(/\./g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')
  const [query, setQuery] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminAPI.getAuditLogs({
        action: action || undefined,
        targetType: targetType || undefined,
        q: query.trim() || undefined,
        limit: 150
      })
      setLogs(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [action, query, targetType])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const visibleLogs = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return logs
    return logs.filter((entry) => {
      const haystack = [
        entry.summary,
        entry.actorEmail,
        entry.targetType,
        entry.targetId
      ].join(' ').toLowerCase()
      return haystack.includes(search)
    })
  }, [logs, query])

  return (
    <AdminLayout title="Activity Log">
      {loading ? <PageSkeleton /> : (
        <div className="space-y-6">
          <div className="card p-4 sm:p-6">
            <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search summary, email, or target"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Action</span>
                <select value={action} onChange={(event) => setAction(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm">
                  {actionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Target</span>
                <select value={targetType} onChange={(event) => setTargetType(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm">
                  {targetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <div className="flex items-end">
                <button type="button" onClick={fetchLogs} className="btn-primary h-11 w-full justify-center md:w-auto">
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {visibleLogs.length === 0 ? (
            <div className="card p-8 text-center text-gray-600">No activity matched those filters yet.</div>
          ) : (
            <div className="space-y-4">
              {visibleLogs.map((entry) => (
                <article key={entry.id} className="card p-4 sm:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {prettyAction(entry.action)}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {entry.targetType}
                        </span>
                        {entry.targetId ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            #{entry.targetId}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{entry.summary}</h2>
                      <p className="text-sm text-gray-600">
                        {entry.actorEmail || 'Unknown admin'}{entry.actorRole ? ` (${entry.actorRole})` : ''}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 md:text-right">
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>

                  {entry.details && Object.keys(entry.details).length > 0 ? (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Details</div>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-gray-700">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
