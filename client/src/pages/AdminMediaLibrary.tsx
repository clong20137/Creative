import { useEffect, useMemo, useState } from 'react'
import { FiCopy, FiDownload, FiFileText, FiImage, FiSearch, FiTrash2, FiUpload, FiVideo } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024
const MEDIA_ACCEPT = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip'

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function formatBytes(value: number) {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function MediaIcon({ type }: { type: string }) {
  if (type === 'image') return <FiImage />
  if (type === 'video') return <FiVideo />
  return <FiFileText />
}

export default function AdminMediaLibrary() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchAssets = async () => {
    try {
      setLoading(true)
      setAssets(await adminAPI.getMedia(typeFilter))
    } catch (err: any) {
      setError(err.error || 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [typeFilter])

  const filteredAssets = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return assets
    return assets.filter(asset => [asset.title, asset.originalName, asset.filename, asset.altText, asset.mimeType].some(value => String(value || '').toLowerCase().includes(term)))
  }, [assets, query])

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      setError('')
      setUploading(true)
      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_SIZE) {
          throw new Error(`${file.name} is larger than 25 MB.`)
        }
        const dataUrl = await readFileAsDataUrl(file)
        await adminAPI.uploadMedia({
          dataUrl,
          originalName: file.name,
          title: file.name
        })
      }
      setMessage(`${files.length} media file${files.length === 1 ? '' : 's'} uploaded`)
      await fetchAssets()
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setMessage('Media URL copied')
  }

  const updateAsset = async (asset: any, updates: any) => {
    try {
      const updated = await adminAPI.updateMedia(String(asset.id), { ...asset, ...updates })
      setAssets(current => current.map(item => item.id === updated.id ? updated : item))
      setMessage('Media details saved')
    } catch (err: any) {
      setError(err.error || 'Failed to update media')
    }
  }

  const deleteAsset = async (asset: any) => {
    if (!window.confirm(`Delete ${asset.title || asset.filename}?`)) return
    try {
      await adminAPI.deleteMedia(String(asset.id))
      setAssets(current => current.filter(item => item.id !== asset.id))
      setMessage('Media asset deleted')
    } catch (err: any) {
      setError(err.error || 'Failed to delete media')
    }
  }

  return (
    <AdminLayout title="Media Library">
      {message && <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">{message}</div>}
      {error && <div className="mb-6 rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">{error}</div>}

      <section className="card mb-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
            <p className="text-gray-600">Upload and reuse images, videos, PDFs, and documents across the admin portal.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700">
            <FiUpload />
            {uploading ? 'Uploading...' : 'Upload Media'}
            <input
              type="file"
              multiple
              accept={MEDIA_ACCEPT}
              className="hidden"
              onChange={(e) => {
                uploadFiles(e.target.files)
                e.target.value = ''
              }}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[12rem_1fr]">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border px-4 py-2">
            <option value="all">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="other">Other</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-gray-600">
            <FiSearch />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media" className="w-full border-0 bg-transparent p-0 outline-none" />
          </label>
        </div>
      </section>

      {loading ? <PageSkeleton /> : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map(asset => (
            <article key={asset.id} className="card overflow-hidden">
              <div className="flex h-56 items-center justify-center bg-gray-100">
                {asset.mediaType === 'image' ? (
                  <img src={resolveAssetUrl(asset.url)} alt={asset.altText || asset.title || ''} className="h-full w-full object-cover" />
                ) : asset.mediaType === 'video' ? (
                  <video src={resolveAssetUrl(asset.url)} className="h-full w-full object-cover" controls />
                ) : (
                  <div className="text-center text-gray-600">
                    <MediaIcon type={asset.mediaType} />
                    <p className="mt-3 font-bold">{asset.originalName || asset.filename}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-600">{asset.mediaType} / {formatBytes(Number(asset.size || 0))}</p>
                    <h3 className="mt-1 break-words text-lg font-bold text-gray-900">{asset.title || asset.originalName || asset.filename}</h3>
                  </div>
                  <MediaIcon type={asset.mediaType} />
                </div>
                <input defaultValue={asset.title || ''} onBlur={(e) => updateAsset(asset, { title: e.target.value })} placeholder="Title" className="w-full rounded-lg border px-3 py-2" />
                <input defaultValue={asset.altText || ''} onBlur={(e) => updateAsset(asset, { altText: e.target.value })} placeholder="Alt text / description" className="w-full rounded-lg border px-3 py-2" />
                <p className="break-all rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{asset.url}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyUrl(asset.url)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold hover:bg-gray-50"><FiCopy /> Copy URL</button>
                  <a href={resolveAssetUrl(asset.url)} download className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold hover:bg-gray-50"><FiDownload /> Download</a>
                  <button type="button" onClick={() => deleteAsset(asset)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"><FiTrash2 /> Delete</button>
                </div>
              </div>
            </article>
          ))}
          {filteredAssets.length === 0 && <div className="card p-8 text-center text-gray-600 md:col-span-2 xl:col-span-3">No media found.</div>}
        </div>
      )}
    </AdminLayout>
  )
}
