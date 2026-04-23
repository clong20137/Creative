const stores = new Map()

function getStore(name) {
  if (!stores.has(name)) stores.set(name, new Map())
  return stores.get(name)
}

export function createRateLimiter({ name, windowMs, max, keyGenerator, message }) {
  const store = getStore(name)

  return (req, res, next) => {
    const key = String((keyGenerator ? keyGenerator(req) : req.ip) || req.ip || 'unknown')
    const now = Date.now()
    const attempts = (store.get(key) || []).filter((time) => now - time < windowMs)
    attempts.push(now)
    store.set(key, attempts)

    if (attempts.length > max) {
      return res.status(429).json({ error: message || 'Too many requests. Please try again later.' })
    }

    return next()
  }
}
