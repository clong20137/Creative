const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function cleanString(value, maxLength = 255) {
  return String(value || '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLength)
}

export function cleanMultiline(value, maxLength = 5000) {
  return String(value || '')
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLength)
}

export function isValidEmail(value) {
  return emailPattern.test(String(value || '').trim())
}

export function sanitizeUserForResponse(user) {
  if (!user) return user
  const source = typeof user.toJSON === 'function' ? user.toJSON() : user
  const {
    password,
    twoFactorCode,
    twoFactorSecret,
    passwordResetCode,
    passwordResetExpires,
    ...safeUser
  } = source
  return safeUser
}
