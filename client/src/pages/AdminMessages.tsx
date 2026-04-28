import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, formSubmissionsAPI } from '../services/api'

const messageGroups = [
  { status: 'new', label: 'New', empty: 'No new items.' },
  { status: 'read', label: 'Read', empty: 'No read items.' },
  { status: 'archived', label: 'Archived', empty: 'No archived items.' }
]

function StatusCount({ status, count }: { status: string; count: number }) {
  return (
    <span className={`rounded px-2 py-1 text-xs font-semibold ${
      status === 'new'
        ? 'bg-red-100 text-red-700'
        : status === 'read'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-700'
    }`}>
      {count}
    </span>
  )
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([])
  const [formSubmissions, setFormSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = async () => {
    setLoading(true)
    const [contactData, formData] = await Promise.all([
      adminAPI.getContactMessages(),
      formSubmissionsAPI.getSubmissions()
    ])
    setMessages(contactData)
    setFormSubmissions(formData)
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await adminAPI.updateContactMessage(id, { status })
    await fetchMessages()
    window.dispatchEvent(new Event('admin-notifications-refresh'))
  }

  const updateSubmissionStatus = async (id: string, status: string) => {
    await formSubmissionsAPI.updateSubmission(id, { status })
    await fetchMessages()
  }

  return (
    <AdminLayout title="Messages">
      {loading ? <PageSkeleton /> : (
        <div className="space-y-10">
          {messages.length === 0 && formSubmissions.length === 0 ? (
            <div className="card p-8 text-center text-gray-600">No messages yet.</div>
          ) : (
            <>
              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact Messages</h2>
                  <p className="mt-1 text-sm text-gray-600">Messages sent through the standard contact form and hero contact flows.</p>
                </div>
                {messageGroups.map((group) => {
                  const groupMessages = messages.filter((message) => message.status === group.status)
                  return (
                    <section key={`contact-${group.status}`}>
                      <div className="mb-4 flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900">{group.label}</h3>
                        <StatusCount status={group.status} count={groupMessages.length} />
                      </div>
                      <div className="space-y-4">
                        {groupMessages.map((message) => (
                          <div key={message.id} className="card p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-gray-900">{message.name}</h4>
                                <p className="text-sm text-gray-600">{message.email} / {message.phone || 'No phone'}</p>
                                <p className="text-sm text-gray-600">{message.company || 'No company'} / {message.service || 'No service selected'}</p>
                                <p className="mt-4 text-gray-700">{message.message}</p>
                              </div>
                              <select value={message.status} onChange={(e) => updateStatus(String(message.id), e.target.value)} className="px-3 py-2 border rounded-lg bg-white">
                                <option value="new">New</option>
                                <option value="read">Read</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>
                          </div>
                        ))}
                        {groupMessages.length === 0 && <div className="card p-6 text-center text-gray-600">{group.empty}</div>}
                      </div>
                    </section>
                  )
                })}
              </section>

              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Custom Form Submissions</h2>
                  <p className="mt-1 text-sm text-gray-600">Submissions from custom form builder sections placed anywhere in the site.</p>
                </div>
                {messageGroups.map((group) => {
                  const groupSubmissions = formSubmissions.filter((submission) => submission.status === group.status)
                  return (
                    <section key={`custom-${group.status}`}>
                      <div className="mb-4 flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900">{group.label}</h3>
                        <StatusCount status={group.status} count={groupSubmissions.length} />
                      </div>
                      <div className="space-y-4">
                        {groupSubmissions.map((submission) => (
                          <div key={submission.id} className="card p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h4 className="text-xl font-bold text-gray-900">{submission.formName}</h4>
                                  {submission.pageTitle && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{submission.pageTitle}</span>}
                                  {submission.pagePath && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{submission.pagePath}</span>}
                                </div>
                                <p className="mt-2 text-sm text-gray-600">
                                  {submission.name || 'No name provided'}
                                  {submission.email ? ` / ${submission.email}` : ''}
                                  {submission.phone ? ` / ${submission.phone}` : ''}
                                </p>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                  {(Array.isArray(submission.fields) ? submission.fields : []).map((field: any, index: number) => (
                                    <div key={`${submission.id}-${field.id || index}`} className="rounded-lg border bg-gray-50 p-3">
                                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{field.label}</div>
                                      <div className="mt-2 break-words text-sm text-gray-800">
                                        {field.type === 'checkbox' ? (field.value ? 'Yes' : 'No') : (field.value || '—')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <select value={submission.status} onChange={(e) => updateSubmissionStatus(String(submission.id), e.target.value)} className="px-3 py-2 border rounded-lg bg-white">
                                <option value="new">New</option>
                                <option value="read">Read</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>
                          </div>
                        ))}
                        {groupSubmissions.length === 0 && <div className="card p-6 text-center text-gray-600">{group.empty}</div>}
                      </div>
                    </section>
                  )
                })}
              </section>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
