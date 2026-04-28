const ALLOWED_TAGS = new Set(['A', 'B', 'BR', 'DIV', 'EM', 'I', 'LI', 'OL', 'P', 'SPAN', 'STRONG', 'U', 'UL'])
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']
const ALLOWED_LINK_CLASSES = new Set(['inline-rich-button'])

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function decodeHtmlEntities(value: string) {
  if (!value) return ''
  const parser = new DOMParser()
  const documentNode = parser.parseFromString(`<textarea>${value}</textarea>`, 'text/html')
  return documentNode.querySelector('textarea')?.value || value
}

function hasMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function getSafeStyles(styleValue: string) {
  const colorMatch = String(styleValue || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)
  const backgroundMatch = String(styleValue || '').match(/(?:^|;)\s*background-color\s*:\s*([^;]+)/i)
  return {
    color: colorMatch?.[1]?.trim() || '',
    backgroundColor: backgroundMatch?.[1]?.trim() || ''
  }
}

function sanitizeHref(href: string) {
  const value = String(href || '').trim()
  if (!value) return ''
  if (value.startsWith('/') || value.startsWith('#')) return value

  try {
    const parsed = new URL(value, window.location.origin)
    if (SAFE_PROTOCOLS.includes(parsed.protocol)) return parsed.href
  } catch (error) {
    return ''
  }

  return ''
}

export function sanitizeRichTextHtml(value: string) {
  if (!value) return ''

  const parser = new DOMParser()
  const documentNode = parser.parseFromString(`<div>${value}</div>`, 'text/html')
  const root = documentNode.body.firstElementChild as HTMLElement | null
  if (!root) return ''

  const sanitizeChildren = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child)
        return
      }

      const element = child as HTMLElement
      if (!ALLOWED_TAGS.has(element.tagName)) {
        element.replaceWith(...Array.from(element.childNodes))
        sanitizeChildren(node)
        return
      }

      Array.from(element.attributes).forEach((attribute) => {
        const { name, value: attributeValue } = attribute
        if (name === 'href' && element.tagName === 'A') {
          const safeHref = sanitizeHref(attributeValue)
          if (safeHref) {
            element.setAttribute('href', safeHref)
            if (/^https?:/i.test(safeHref)) {
              element.setAttribute('target', '_blank')
              element.setAttribute('rel', 'noreferrer noopener')
            } else {
              element.removeAttribute('target')
              element.removeAttribute('rel')
            }
          } else {
            element.removeAttribute('href')
            element.removeAttribute('target')
            element.removeAttribute('rel')
          }
          return
        }

        if (name === 'class' && element.tagName === 'A') {
          const safeClasses = String(attributeValue || '')
            .split(/\s+/)
            .map((token) => token.trim())
            .filter((token) => ALLOWED_LINK_CLASSES.has(token))
          if (safeClasses.length > 0) element.setAttribute('class', safeClasses.join(' '))
          else element.removeAttribute('class')
          return
        }

        if (name === 'style') {
          const { color, backgroundColor } = getSafeStyles(attributeValue)
          const nextStyles = [
            color ? `color: ${color};` : '',
            backgroundColor ? `background-color: ${backgroundColor};` : ''
          ].filter(Boolean)
          if (nextStyles.length > 0) element.setAttribute('style', nextStyles.join(' '))
          else element.removeAttribute('style')
          return
        }

        if (name === 'target' || name === 'rel') return
        element.removeAttribute(name)
      })

      if (element.tagName !== 'A') {
        element.removeAttribute('target')
        element.removeAttribute('rel')
      }

      sanitizeChildren(element)
    })
  }

  sanitizeChildren(root)
  return root.innerHTML.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ')
}

export function normalizeRichTextHtml(value?: string | null) {
  const source = String(value || '')
  if (!source.trim()) return ''
  if (hasMarkup(source)) return sanitizeRichTextHtml(source)
  return escapeHtml(decodeHtmlEntities(source).replace(/\u00A0/g, ' ')).replace(/\n/g, '<br>')
}
