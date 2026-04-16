import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

const pageTabs = ['Homepage', 'Headers', 'Services Page', 'Pricing Page', 'Testimonials', 'Custom Pages']

const emptySettings = {
  heroTitle: '',
  heroSubtitle: '',
  heroPrimaryLabel: '',
  heroPrimaryUrl: '',
  heroSecondaryLabel: '',
  heroSecondaryUrl: '',
  heroMediaType: 'none',
  heroMediaUrl: '',
  pageHeaders: {} as Record<string, { title: string; subtitle: string }>,
  whatWeDo: [] as any[],
  featuredWork: [] as any[],
  services: [] as any[],
  webDesignPackages: [] as any[],
  faqs: [] as any[],
  googleReviewsEnabled: false,
  googlePlaceId: '',
  googleApiKey: '',
  testimonials: [] as any[]
}

const pageHeaderLabels: Record<string, string> = {
  portfolio: 'Portfolio',
  services: 'Services',
  pricing: 'Pricing',
  plugins: 'Plugins',
  contact: 'Contact'
}

function getActivePayload(settings: typeof emptySettings, activeTab: string) {
  const payloadMap: Record<string, string[]> = {
    Homepage: [
      'heroTitle',
      'heroSubtitle',
      'heroPrimaryLabel',
      'heroPrimaryUrl',
      'heroSecondaryLabel',
      'heroSecondaryUrl',
      'heroMediaType',
      'heroMediaUrl',
      'whatWeDo',
      'featuredWork'
    ],
    Headers: ['pageHeaders'],
    'Services Page': ['services'],
    'Pricing Page': ['webDesignPackages', 'faqs'],
    Testimonials: ['googleReviewsEnabled', 'googlePlaceId', 'googleApiKey', 'testimonials']
  }

  return (payloadMap[activeTab] || []).reduce((payload: any, key) => {
    payload[key] = (settings as any)[key]
    return payload
  }, {})
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminPages() {
  const [activeTab, setActiveTab] = useState('Homepage')
  const [settings, setSettings] = useState(emptySettings)
  const [pages, setPages] = useState<any[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>('new')
  const [pageDraft, setPageDraft] = useState<any>({
    title: '',
    slug: '',
    headerTitle: '',
    headerSubtitle: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
    sortOrder: 0
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [settingsData, pagesData] = await Promise.all([adminAPI.getSiteSettings(), adminAPI.getPages()])
        setSettings({ ...emptySettings, ...settingsData })
        setPages(pagesData)
      } catch (err: any) {
        setError(err.error || 'Failed to load pages')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }))

  const updateListItem = (key: string, index: number, field: string, value: any) => {
    setSettings(prev => {
      const list = [...((prev as any)[key] || [])]
      list[index] = { ...list[index], [field]: value }
      return { ...prev, [key]: list }
    })
  }

  const addListItem = (key: string) => setSettings(prev => ({ ...prev, [key]: [...((prev as any)[key] || []), {}] }))
  const removeListItem = (key: string, index: number) => setSettings(prev => ({ ...prev, [key]: ((prev as any)[key] || []).filter((_: any, i: number) => i !== index) }))

  const updatePageHeader = (page: string, field: 'title' | 'subtitle', value: string) => {
    setSettings(prev => ({
      ...prev,
      pageHeaders: {
        ...(prev.pageHeaders || {}),
        [page]: {
          ...(prev.pageHeaders?.[page] || {}),
          [field]: value
        }
      }
    }))
  }

  const saveSettingsTab = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setMessage('Saving page edits...')
      const payload = getActivePayload(settings, activeTab)
      await adminAPI.updateSiteSettings(payload)
      setMessage('Page edits saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save page edits')
    }
  }

  const selectPage = (page: any) => {
    setSelectedPageId(String(page.id))
    setPageDraft(page)
  }

  const startNewPage = () => {
    setSelectedPageId('new')
    setPageDraft({
      title: '',
      slug: '',
      headerTitle: '',
      headerSubtitle: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      isPublished: false,
      sortOrder: pages.length * 10
    })
  }

  const updatePageDraft = (field: string, value: any) => {
    setPageDraft((current: any) => ({
      ...current,
      [field]: value,
      ...(field === 'title' && !current.slug ? { slug: makeSlug(value) } : {})
    }))
  }

  const saveCustomPage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setMessage('Saving page...')
      const savedPage = selectedPageId === 'new'
        ? await adminAPI.createPage(pageDraft)
        : await adminAPI.updatePage(selectedPageId, pageDraft)

      setPages(current => {
        const withoutSaved = current.filter(page => page.id !== savedPage.id)
        return [...withoutSaved, savedPage].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      })
      setSelectedPageId(String(savedPage.id))
      setPageDraft(savedPage)
      setMessage('Custom page saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save custom page')
    }
  }

  const deleteCustomPage = async () => {
    if (selectedPageId === 'new') return

    try {
      await adminAPI.deletePage(selectedPageId)
      setPages(current => current.filter(page => String(page.id) !== selectedPageId))
      startNewPage()
      setMessage('Custom page deleted')
    } catch (err: any) {
      setError(err.error || 'Failed to delete custom page')
    }
  }

  return (
    <AdminLayout title="Website Pages">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}
      {loading ? <PageSkeleton /> : (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pageTabs.map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Custom Pages' ? (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
              <div className="card p-4 space-y-3">
                <button type="button" onClick={startNewPage} className={`w-full rounded-lg px-4 py-2 text-left font-semibold ${selectedPageId === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  Add New Page
                </button>
                {pages.map(page => (
                  <button key={page.id} type="button" onClick={() => selectPage(page)} className={`w-full rounded-lg px-4 py-2 text-left font-semibold ${selectedPageId === String(page.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {page.title}
                    <span className="block text-xs font-normal">{page.isPublished ? `/${page.slug}` : 'Draft'}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={saveCustomPage} className="card p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={pageDraft.title || ''} onChange={(e) => updatePageDraft('title', e.target.value)} placeholder="Page title" className="px-4 py-2 border rounded-lg" required />
                  <input value={pageDraft.slug || ''} onChange={(e) => updatePageDraft('slug', makeSlug(e.target.value))} placeholder="page-url" className="px-4 py-2 border rounded-lg" required />
                  <input value={pageDraft.headerTitle || ''} onChange={(e) => updatePageDraft('headerTitle', e.target.value)} placeholder="Header title" className="px-4 py-2 border rounded-lg" />
                  <input type="number" value={pageDraft.sortOrder ?? 0} onChange={(e) => updatePageDraft('sortOrder', Number(e.target.value))} placeholder="Sort order" className="px-4 py-2 border rounded-lg" />
                  <textarea value={pageDraft.headerSubtitle || ''} onChange={(e) => updatePageDraft('headerSubtitle', e.target.value)} placeholder="Header subtitle" rows={2} className="px-4 py-2 border rounded-lg md:col-span-2" />
                  <input value={pageDraft.metaTitle || ''} onChange={(e) => updatePageDraft('metaTitle', e.target.value)} placeholder="SEO title" className="px-4 py-2 border rounded-lg" />
                  <input value={pageDraft.metaDescription || ''} onChange={(e) => updatePageDraft('metaDescription', e.target.value)} placeholder="SEO description" className="px-4 py-2 border rounded-lg" />
                  <textarea value={pageDraft.content || ''} onChange={(e) => updatePageDraft('content', e.target.value)} placeholder="Page content" rows={12} className="px-4 py-2 border rounded-lg md:col-span-2" />
                </div>
                <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                  <input type="checkbox" checked={Boolean(pageDraft.isPublished)} onChange={(e) => updatePageDraft('isPublished', e.target.checked)} />
                  Publish this page
                </label>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="btn-primary">Save Page</button>
                  {selectedPageId !== 'new' && <button type="button" onClick={deleteCustomPage} className="btn-secondary text-red-600">Delete Page</button>}
                </div>
              </form>
            </section>
          ) : (
            <form onSubmit={saveSettingsTab} className="space-y-6">
              <div className="card p-6 space-y-6">
                {activeTab === 'Homepage' && (
                  <section className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={settings.heroTitle || ''} onChange={(e) => handleChange('heroTitle', e.target.value)} placeholder="Homepage headline" className="px-4 py-2 border rounded-lg md:col-span-2" />
                      <textarea value={settings.heroSubtitle || ''} onChange={(e) => handleChange('heroSubtitle', e.target.value)} placeholder="Homepage description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                      <input value={settings.heroPrimaryLabel || ''} onChange={(e) => handleChange('heroPrimaryLabel', e.target.value)} placeholder="Primary button label" className="px-4 py-2 border rounded-lg" />
                      <input value={settings.heroPrimaryUrl || ''} onChange={(e) => handleChange('heroPrimaryUrl', e.target.value)} placeholder="Primary button URL" className="px-4 py-2 border rounded-lg" />
                      <input value={settings.heroSecondaryLabel || ''} onChange={(e) => handleChange('heroSecondaryLabel', e.target.value)} placeholder="Secondary button label" className="px-4 py-2 border rounded-lg" />
                      <input value={settings.heroSecondaryUrl || ''} onChange={(e) => handleChange('heroSecondaryUrl', e.target.value)} placeholder="Secondary button URL" className="px-4 py-2 border rounded-lg" />
                      <select value={settings.heroMediaType || 'none'} onChange={(e) => handleChange('heroMediaType', e.target.value)} className="px-4 py-2 border rounded-lg">
                        <option value="none">No media</option>
                        <option value="image">Image banner</option>
                        <option value="video">Video banner</option>
                      </select>
                      <input value={settings.heroMediaUrl || ''} onChange={(e) => handleChange('heroMediaUrl', e.target.value)} placeholder="Image or video URL" className="px-4 py-2 border rounded-lg" />
                    </div>
                    <ListEditor title="What We Do" listKey="whatWeDo" items={settings.whatWeDo} fields={['title', 'desc']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} />
                    <ListEditor title="Featured Work" listKey="featuredWork" items={settings.featuredWork} fields={['title', 'category', 'image', 'description']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} />
                  </section>
                )}

                {activeTab === 'Headers' && (
                  <section className="space-y-4">
                    {Object.entries(pageHeaderLabels).map(([page, label]) => {
                      const header = settings.pageHeaders?.[page] || { title: '', subtitle: '' }
                      return (
                        <div key={page} className="rounded-lg border p-4">
                          <h3 className="mb-3 text-lg font-bold text-gray-900">{label}</h3>
                          <div className="grid grid-cols-1 gap-3">
                            <input value={header.title || ''} onChange={(e) => updatePageHeader(page, 'title', e.target.value)} placeholder={`${label} title`} className="px-4 py-2 border rounded-lg" />
                            <textarea value={header.subtitle || ''} onChange={(e) => updatePageHeader(page, 'subtitle', e.target.value)} placeholder={`${label} subtitle`} rows={2} className="px-4 py-2 border rounded-lg" />
                          </div>
                        </div>
                      )
                    })}
                  </section>
                )}

                {activeTab === 'Services Page' && <ListEditor title="Services Page" listKey="services" items={settings.services} fields={['title', 'description', 'features', 'url', 'image']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} />}
                {activeTab === 'Pricing Page' && (
                  <section className="space-y-6">
                    <ListEditor title="Web Design Packages" listKey="webDesignPackages" items={settings.webDesignPackages} fields={['name', 'description', 'price', 'billingPeriod', 'features']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} />
                    <ListEditor title="FAQ" listKey="faqs" items={settings.faqs} fields={['q', 'a']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} />
                  </section>
                )}
                {activeTab === 'Testimonials' && (
                  <section className="space-y-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={settings.googleReviewsEnabled} onChange={(e) => handleChange('googleReviewsEnabled', e.target.checked)} />
                      Pull testimonials from Google Reviews
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={settings.googlePlaceId || ''} onChange={(e) => handleChange('googlePlaceId', e.target.value)} placeholder="Google Place ID" className="px-4 py-2 border rounded-lg" />
                      <input value={settings.googleApiKey || ''} onChange={(e) => handleChange('googleApiKey', e.target.value)} placeholder="Google API Key" className="px-4 py-2 border rounded-lg" />
                    </div>
                    <ListEditor title="Manual Testimonials" listKey="testimonials" items={settings.testimonials} fields={['name', 'company', 'role', 'image', 'text']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} />
                  </section>
                )}
              </div>
              <button type="submit" className="btn-primary">Save Page Edits</button>
            </form>
          )}
        </div>
      )}
    </AdminLayout>
  )
}

function ListEditor({ title, listKey, items, fields, updateListItem, addListItem, removeListItem }: any) {
  const getFeatures = (item: any) => Array.isArray(item.features)
    ? item.features
    : String(item.features || '').split('\n').filter(Boolean)

  const updateFeature = (index: number, featureIndex: number, value: string) => {
    const currentItem = items[index] || {}
    const features = [...getFeatures(currentItem)]
    features[featureIndex] = value
    updateListItem(listKey, index, 'features', features)
  }

  const addFeature = (index: number) => {
    const currentItem = items[index] || {}
    updateListItem(listKey, index, 'features', [...getFeatures(currentItem), ''])
  }

  const removeFeature = (index: number, featureIndex: number) => {
    const currentItem = items[index] || {}
    updateListItem(listKey, index, 'features', getFeatures(currentItem).filter((_: string, i: number) => i !== featureIndex))
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {(items || []).map((item: any, index: number) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3">
            {fields.map((field: string) => (
              <div key={field}>
                {field === 'features' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Features</p>
                    {getFeatures(item).map((feature: string, featureIndex: number) => (
                      <div key={featureIndex} className="flex gap-2">
                        <input value={feature} onChange={(e) => updateFeature(index, featureIndex, e.target.value)} placeholder="Feature" className="min-w-0 flex-1 px-4 py-2 border rounded-lg" />
                        <button type="button" onClick={() => removeFeature(index, featureIndex)} className="px-3 py-2 border rounded-lg text-red-600 hover:bg-red-50">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addFeature(index)} className="btn-secondary">Add Feature</button>
                  </div>
                ) : (
                  <textarea
                    value={Array.isArray(item[field]) ? item[field].join('\n') : item[field] || ''}
                    onChange={(e) => updateListItem(listKey, index, field, e.target.value)}
                    placeholder={field}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={field === 'description' || field === 'text' ? 3 : 1}
                  />
                )}
              </div>
            ))}
            <button type="button" onClick={() => removeListItem(listKey, index)} className="btn-secondary">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => addListItem(listKey)} className="btn-secondary">Add {title}</button>
      </div>
    </section>
  )
}
