import SiteSetting from '../models/SiteSetting.js'

export async function verifyTurnstileToken(token, ip) {
  const settings = await SiteSetting.findByPk(1)
  const secret = process.env.TURNSTILE_SECRET_KEY || settings?.turnstileSecretKey

  if (!secret) return true
  if (!token) return false

  const formData = new URLSearchParams()
  formData.append('secret', secret)
  formData.append('response', token)
  if (ip) formData.append('remoteip', ip)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  })
  const result = await response.json()
  return Boolean(result.success)
}
