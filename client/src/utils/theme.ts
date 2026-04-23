const themeDefaults = {
  themeFontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  themeBackgroundColor: '#ffffff',
  themeSurfaceColor: '#ffffff',
  themeHeadingColor: '#111827',
  themeBodyColor: '#374151',
  themePrimaryColor: '#2563eb',
  themePrimaryHoverColor: '#1d4ed8',
  themeSecondaryColor: '#e5e7eb',
  themeSecondaryHoverColor: '#d1d5db',
  themeButtonTextColor: '#ffffff',
  themeLinkColor: '#2563eb',
  themeButtonRadius: 8,
  themeCardRadius: 8,
  themeShadowPreset: 'medium',
  themeSpacingScale: 1
}

const shadowPresets: Record<string, string> = {
  none: 'none',
  soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
  medium: '0 10px 25px rgba(15, 23, 42, 0.12)',
  strong: '0 18px 40px rgba(15, 23, 42, 0.18)'
}

export function applyThemeSettings(settings: any = {}) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const getNumber = (value: any, fallback: number) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : fallback
  }

  root.style.setProperty('--theme-font-family', String(settings.themeFontFamily || themeDefaults.themeFontFamily))
  root.style.setProperty('--theme-background', String(settings.themeBackgroundColor || themeDefaults.themeBackgroundColor))
  root.style.setProperty('--theme-surface', String(settings.themeSurfaceColor || themeDefaults.themeSurfaceColor))
  root.style.setProperty('--theme-heading', String(settings.themeHeadingColor || themeDefaults.themeHeadingColor))
  root.style.setProperty('--theme-body', String(settings.themeBodyColor || themeDefaults.themeBodyColor))
  root.style.setProperty('--theme-primary', String(settings.themePrimaryColor || themeDefaults.themePrimaryColor))
  root.style.setProperty('--theme-primary-hover', String(settings.themePrimaryHoverColor || themeDefaults.themePrimaryHoverColor))
  root.style.setProperty('--theme-secondary', String(settings.themeSecondaryColor || themeDefaults.themeSecondaryColor))
  root.style.setProperty('--theme-secondary-hover', String(settings.themeSecondaryHoverColor || themeDefaults.themeSecondaryHoverColor))
  root.style.setProperty('--theme-button-text', String(settings.themeButtonTextColor || themeDefaults.themeButtonTextColor))
  root.style.setProperty('--theme-link', String(settings.themeLinkColor || themeDefaults.themeLinkColor))
  root.style.setProperty('--theme-button-radius', `${getNumber(settings.themeButtonRadius, themeDefaults.themeButtonRadius)}px`)
  root.style.setProperty('--theme-card-radius', `${getNumber(settings.themeCardRadius, themeDefaults.themeCardRadius)}px`)
  root.style.setProperty('--theme-spacing-scale', String(getNumber(settings.themeSpacingScale, themeDefaults.themeSpacingScale)))
  root.style.setProperty('--theme-shadow', shadowPresets[String(settings.themeShadowPreset || themeDefaults.themeShadowPreset)] || shadowPresets.medium)
}

