import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, any>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
  }
}

let turnstileScriptPromise: Promise<void> | null = null

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScriptPromise) return turnstileScriptPromise

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit']")
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })

  return turnstileScriptPromise
}

export default function TurnstileWidget({
  siteKey,
  onVerify
}: {
  siteKey?: string
  onVerify: (token: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string>('')

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let mounted = true

    loadTurnstileScript()
      .then(() => {
        if (!mounted || !window.turnstile || !containerRef.current || widgetIdRef.current) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          'expired-callback': () => onVerify(''),
          'error-callback': () => onVerify('')
        })
      })
      .catch(() => onVerify(''))

    return () => {
      mounted = false
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = ''
      }
    }
  }, [siteKey, onVerify])

  if (!siteKey) return null

  return <div ref={containerRef} className="min-h-[65px]" />
}
