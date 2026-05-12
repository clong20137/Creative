import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomBytes, randomUUID } from 'crypto'
import { DataTypes } from 'sequelize'
import CustomPage from '../models/CustomPage.js'
import SiteDemo from '../models/SiteDemo.js'
import PortfolioItem from '../models/PortfolioItem.js'
import ServicePackage from '../models/ServicePackage.js'
import CMSLicense from '../models/CMSLicense.js'
import MediaAsset from '../models/MediaAsset.js'
import { ensureActiveUser, requireRole, verifyToken } from '../utils/auth.js'
import { appendBuiltInPageRevision, buildPageRevisionEntry, getBuiltInPageRevisionSnapshot, getOrCreateSiteSettings } from './site-settings.js'
import { ensureSiteDemos } from './site-demos.js'
import { cleanString } from '../utils/validation.js'
import { createAuditLog } from '../utils/audit.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.resolve(__dirname, '../../uploads')
let customPagesSchemaReady = false
const PAGE_REVISION_LIMIT = 25

const BUILDER_SITE_SETTING_KEYS = new Set([
  'heroTitle',
  'heroSubtitle',
  'heroPrimaryLabel',
  'heroPrimaryUrl',
  'heroSecondaryLabel',
  'heroSecondaryUrl',
  'heroMediaType',
  'heroMediaUrl',
  'whatWeDoHeader',
  'whatWeDoEnabled',
  'whatWeDo',
  'featuredWork',
  'pageHeaders',
  'pageMetadata',
  'pageSections',
  'reusableSections',
  'pageRevisions',
  'services',
  'webDesignPackages',
  'faqs',
  'googleReviewsEnabled',
  'googlePlaceId',
  'googleApiKey',
  'testimonials'
])

const mediaMimeExtensions = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
}

router.use(verifyToken, ensureActiveUser, requireRole('builder', 'admin'))

async function ensureCustomPagesSchema() {
  if (customPagesSchemaReady) return

  const queryInterface = CustomPage.sequelize.getQueryInterface()
  const table = await queryInterface.describeTable('CustomPages').catch(() => null)
  if (!table) return

  const addColumn = async (name, config) => {
    if (table[name]) return
    await queryInterface.addColumn('CustomPages', name, config).catch((error) => {
      if (!String(error?.message || '').includes('Duplicate column')) throw error
    })
  }

  await addColumn('previewToken', {
    type: DataTypes.STRING,
    allowNull: true
  })
  await addColumn('showPageHeader', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  await addColumn('ownerClientId', {
    type: DataTypes.INTEGER,
    allowNull: true
  })
  await addColumn('revisions', {
    type: DataTypes.JSON,
    allowNull: true
  })

  customPagesSchemaReady = true
}

function buildCustomPageRevisionEntry(page, req, label = '') {
  return {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    label: String(label || page?.title || 'Page revision'),
    actorName: String(req.user?.name || '').trim(),
    actorEmail: String(req.user?.email || '').trim(),
    snapshot: {
      title: page.title,
      slug: page.slug,
      headerTitle: page.headerTitle,
      headerSubtitle: page.headerSubtitle,
      showPageHeader: page.showPageHeader !== false,
      content: page.content || '',
      sections: Array.isArray(page.sections) ? page.sections : [],
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      isPublished: page.isPublished === true,
      previewToken: page.previewToken || '',
      sortOrder: Number(page.sortOrder || 0)
    }
  }
}

function appendCustomPageRevision(page, revision) {
  const revisions = Array.isArray(page.revisions) ? page.revisions : []
  page.revisions = [revision, ...revisions].slice(0, PAGE_REVISION_LIMIT)
}

function getMediaType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/') || mimeType.includes('word')) return 'document'
  return 'other'
}

function decodeUploadDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    const error = new Error('Unsupported upload format')
    error.statusCode = 400
    throw error
  }

  const mimeType = match[1]
  const extension = mediaMimeExtensions[mimeType]
  if (!extension) {
    const error = new Error('This file type is not supported')
    error.statusCode = 400
    throw error
  }

  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > 45 * 1024 * 1024) {
    const error = new Error('Upload is too large')
    error.statusCode = 413
    throw error
  }

  return { mimeType, extension, buffer }
}

async function storeUpload(dataUrl, originalName = '') {
  const { mimeType, extension, buffer } = decodeUploadDataUrl(dataUrl)
  await fs.mkdir(uploadsDir, { recursive: true })
  const filename = `${randomUUID()}.${extension}`
  const filePath = path.join(uploadsDir, filename)
  await fs.writeFile(filePath, buffer)

  return {
    filename,
    originalName,
    url: `/api/uploads/${filename}`,
    mimeType,
    mediaType: getMediaType(mimeType),
    size: buffer.length,
    visibility: 'public'
  }
}

async function getBuilderScope(req) {
  if (req.userRole === 'admin') {
    return { ownerClientId: null, cmsLicenseId: null, isAdmin: true }
  }

  const user = req.activeUser
  const ownerClientId = Number(user?.ownerClientId || 0)
  const cmsLicenseId = Number(user?.cmsLicenseId || 0)
  if (!ownerClientId || !cmsLicenseId) {
    const error = new Error('This builder account is not linked to an active CMS license.')
    error.statusCode = 403
    throw error
  }

  const license = await CMSLicense.findOne({
    where: {
      id: cmsLicenseId,
      clientId: ownerClientId,
      status: 'active'
    }
  })

  if (!license) {
    const error = new Error('This builder account no longer has an active CMS license.')
    error.statusCode = 403
    throw error
  }

  return { ownerClientId, cmsLicenseId, isAdmin: false }
}

function sanitizeBuilderSiteSettings(settings) {
  const data = typeof settings.toJSON === 'function' ? settings.toJSON() : settings
  return Array.from(BUILDER_SITE_SETTING_KEYS).reduce((safe, key) => {
    safe[key] = data[key]
    return safe
  }, {})
}

function sanitizeBuilderPayload(body = {}) {
  return Object.keys(body).reduce((safe, key) => {
    if (BUILDER_SITE_SETTING_KEYS.has(key)) safe[key] = body[key]
    return safe
  }, {})
}

router.get('/site-settings', async (req, res) => {
  try {
    await getBuilderScope(req)
    const settings = await getOrCreateSiteSettings()
    res.json(sanitizeBuilderSiteSettings(settings))
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.put('/site-settings', async (req, res) => {
  try {
    const scope = await getBuilderScope(req)
    const settings = await getOrCreateSiteSettings()
    const payload = sanitizeBuilderPayload(req.body || {})
    const revisionPageKey = String(req.body?.pageRevisionPageKey || '').trim()
    if (revisionPageKey) {
      appendBuiltInPageRevision(settings, revisionPageKey, buildPageRevisionEntry({
        label: `${revisionPageKey} page`,
        snapshot: getBuiltInPageRevisionSnapshot(revisionPageKey, settings),
        actorName: req.user?.name,
        actorEmail: req.user?.email
      }))
      payload.pageRevisions = settings.pageRevisions
    }
    await settings.update(payload)
    await createAuditLog(req, {
      action: 'builder.site-settings.updated',
      targetType: 'site-settings',
      targetId: settings.id,
      summary: `Builder updated site content settings`,
      details: {
        changedKeys: Object.keys(payload),
        ownerClientId: scope.ownerClientId,
        cmsLicenseId: scope.cmsLicenseId
      }
    })
    res.json(sanitizeBuilderSiteSettings(settings))
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/site-settings/page-revisions/:pageKey', async (req, res) => {
  try {
    await getBuilderScope(req)
    const settings = await getOrCreateSiteSettings()
    const pageKey = String(req.params.pageKey || '').trim()
    const revisions = settings.pageRevisions && typeof settings.pageRevisions === 'object'
      ? settings.pageRevisions[pageKey]
      : []
    res.json(Array.isArray(revisions) ? revisions : [])
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.post('/site-settings/page-revisions/:pageKey/:revisionId/restore', async (req, res) => {
  try {
    const scope = await getBuilderScope(req)
    const settings = await getOrCreateSiteSettings()
    const pageKey = String(req.params.pageKey || '').trim()
    const revisions = settings.pageRevisions && typeof settings.pageRevisions === 'object'
      ? settings.pageRevisions[pageKey]
      : []
    const revision = Array.isArray(revisions) ? revisions.find((item) => String(item.id) === String(req.params.revisionId)) : null
    if (!revision?.snapshot) return res.status(404).json({ error: 'Revision not found' })

    appendBuiltInPageRevision(settings, pageKey, buildPageRevisionEntry({
      label: `${pageKey} before restore`,
      snapshot: getBuiltInPageRevisionSnapshot(pageKey, settings),
      actorName: req.user?.name,
      actorEmail: req.user?.email
    }))
    const payload = { ...revision.snapshot, pageRevisions: settings.pageRevisions }
    await settings.update(payload)
    await createAuditLog(req, {
      action: 'builder.site-settings.page-revision.restored',
      targetType: 'site-settings',
      targetId: settings.id,
      summary: `Builder restored ${pageKey} page revision`,
      details: {
        pageKey,
        revisionId: revision.id,
        ownerClientId: scope.ownerClientId,
        cmsLicenseId: scope.cmsLicenseId
      }
    })
    res.json(settings)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/pages', async (req, res) => {
  try {
    await getBuilderScope(req)
    await ensureCustomPagesSchema()
    const pages = await CustomPage.findAll({ order: [['createdAt', 'DESC']] })
    res.json(pages)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.post('/pages', async (req, res) => {
  try {
    const scope = await getBuilderScope(req)
    await ensureCustomPagesSchema()
    const page = await CustomPage.create({
      title: cleanString(req.body.title, 160) || 'New Page',
      slug: cleanString(req.body.slug, 200),
      headerTitle: cleanString(req.body.headerTitle, 160),
      headerSubtitle: cleanString(req.body.headerSubtitle, 500),
      metaTitle: cleanString(req.body.metaTitle, 160),
      metaDescription: cleanString(req.body.metaDescription, 320),
      sections: Array.isArray(req.body.sections) ? req.body.sections : [],
      revisions: [],
      isPublished: req.body.isPublished !== false,
      previewToken: req.body.previewToken || null,
      ownerClientId: scope.ownerClientId || null
    })
    await createAuditLog(req, {
      action: 'builder.page.created',
      targetType: 'custom-page',
      targetId: page.id,
      summary: `Builder created page "${page.title}"`,
      details: {
        ownerClientId: scope.ownerClientId,
        cmsLicenseId: scope.cmsLicenseId
      }
    })
    res.status(201).json(page)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.put('/pages/:id', async (req, res) => {
  try {
    const scope = await getBuilderScope(req)
    await ensureCustomPagesSchema()
    const page = await CustomPage.findByPk(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    appendCustomPageRevision(page, buildCustomPageRevisionEntry(page, req))
    await page.update({
      title: cleanString(req.body.title, 160) || page.title,
      slug: cleanString(req.body.slug, 200) || page.slug,
      headerTitle: cleanString(req.body.headerTitle, 160) || '',
      headerSubtitle: cleanString(req.body.headerSubtitle, 500) || '',
      metaTitle: cleanString(req.body.metaTitle, 160) || '',
      metaDescription: cleanString(req.body.metaDescription, 320) || '',
      sections: Array.isArray(req.body.sections) ? req.body.sections : page.sections,
      revisions: page.revisions,
      isPublished: req.body.isPublished !== false,
      previewToken: req.body.previewToken === undefined ? page.previewToken : req.body.previewToken
    })
    await createAuditLog(req, {
      action: 'builder.page.updated',
      targetType: 'custom-page',
      targetId: page.id,
      summary: `Builder updated page "${page.title}"`,
      details: {
        ownerClientId: scope.ownerClientId,
        cmsLicenseId: scope.cmsLicenseId
      }
    })
    res.json(page)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/pages/:id/revisions', async (req, res) => {
  try {
    await getBuilderScope(req)
    await ensureCustomPagesSchema()
    const page = await CustomPage.findByPk(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json(Array.isArray(page.revisions) ? page.revisions : [])
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.post('/pages/:id/revisions/:revisionId/restore', async (req, res) => {
  try {
    const scope = await getBuilderScope(req)
    await ensureCustomPagesSchema()
    const page = await CustomPage.findByPk(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    const revisions = Array.isArray(page.revisions) ? page.revisions : []
    const revision = revisions.find((item) => String(item.id) === String(req.params.revisionId))
    if (!revision?.snapshot) return res.status(404).json({ error: 'Revision not found' })

    appendCustomPageRevision(page, buildCustomPageRevisionEntry(page, req, `${page.title} before restore`))
    await page.update({
      ...revision.snapshot,
      revisions: page.revisions
    })
    await createAuditLog(req, {
      action: 'builder.page.revision.restored',
      targetType: 'custom-page',
      targetId: page.id,
      summary: `Builder restored revision for "${page.title}"`,
      details: {
        revisionId: revision.id,
        ownerClientId: scope.ownerClientId,
        cmsLicenseId: scope.cmsLicenseId
      }
    })
    res.json({ page, revisions: page.revisions })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.delete('/pages/:id', async (req, res) => {
  try {
    const scope = await getBuilderScope(req)
    await ensureCustomPagesSchema()
    const page = await CustomPage.findByPk(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    const title = page.title
    await page.destroy()
    await createAuditLog(req, {
      action: 'builder.page.deleted',
      targetType: 'custom-page',
      targetId: req.params.id,
      summary: `Builder deleted page "${title}"`,
      details: {
        ownerClientId: scope.ownerClientId,
        cmsLicenseId: scope.cmsLicenseId
      }
    })
    res.json({ message: 'Page deleted' })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.post('/pages/:id/preview-link', async (req, res) => {
  try {
    await getBuilderScope(req)
    await ensureCustomPagesSchema()
    const page = await CustomPage.findByPk(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    if (!page.previewToken) {
      page.previewToken = randomBytes(16).toString('hex')
      await page.save()
    }
    res.json({ previewToken: page.previewToken })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.post('/pages/:id/preview-link/regenerate', async (req, res) => {
  try {
    await getBuilderScope(req)
    await ensureCustomPagesSchema()
    const page = await CustomPage.findByPk(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    page.previewToken = randomBytes(16).toString('hex')
    await page.save()
    res.json({ previewToken: page.previewToken })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.post('/uploads', async (req, res) => {
  try {
    const scope = await getBuilderScope(req)
    const stored = await storeUpload(req.body.dataUrl, req.body.originalName || '')
    await MediaAsset.create({
      ...stored,
      title: req.body.title || req.body.originalName || stored.filename,
      altText: req.body.altText || '',
      folder: req.body.folder || 'Uncategorized',
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      visibility: 'public'
    })
    await createAuditLog(req, {
      action: 'builder.media.created',
      targetType: 'media',
      targetId: stored.filename,
      summary: `Builder uploaded media "${stored.originalName || stored.filename}"`,
      details: {
        ownerClientId: scope.ownerClientId,
        cmsLicenseId: scope.cmsLicenseId
      }
    })
    res.status(201).json({ url: stored.url })
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/site-demos', async (req, res) => {
  try {
    await getBuilderScope(req)
    await ensureSiteDemos()
    const demos = await SiteDemo.findAll({ where: { isActive: true }, order: [['name', 'ASC']] })
    res.json(demos)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/portfolio-items', async (req, res) => {
  try {
    await getBuilderScope(req)
    const items = await PortfolioItem.findAll({ order: [['createdAt', 'DESC']] })
    res.json(items)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

router.get('/service-packages', async (req, res) => {
  try {
    await getBuilderScope(req)
    const items = await ServicePackage.findAll({ order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']] })
    res.json(items)
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

export default router
