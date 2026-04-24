import AuditLog from '../models/AuditLog.js'
import User from '../models/User.js'

let auditLogSchemaReady = false

export async function ensureAuditLogSchema() {
  if (auditLogSchemaReady) return
  await AuditLog.sync()
  auditLogSchemaReady = true
}

export async function createAuditLog(req, entry = {}) {
  try {
    await ensureAuditLogSchema()
    let actorEmail = req?.userEmail || null
    let actorRole = req?.userRole || null

    if (req?.userId && (!actorEmail || !actorRole)) {
      const actor = await User.findByPk(req.userId, { attributes: ['email', 'role'] }).catch(() => null)
      actorEmail = actorEmail || actor?.email || null
      actorRole = actorRole || actor?.role || null
    }

    return await AuditLog.create({
      actorUserId: req?.userId || null,
      actorEmail,
      actorRole,
      action: String(entry.action || 'unknown'),
      targetType: String(entry.targetType || 'system'),
      targetId: entry.targetId !== undefined && entry.targetId !== null ? String(entry.targetId) : null,
      summary: String(entry.summary || 'Admin activity recorded'),
      details: entry.details && typeof entry.details === 'object' ? entry.details : {}
    })
  } catch (error) {
    console.error('Audit log error:', error)
    return null
  }
}
