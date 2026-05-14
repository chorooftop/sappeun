export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'sappeun-theme'
const LIGHT_THEME_COLOR = '#F4F8F5'
const DARK_THEME_COLOR = '#0F1713'

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'

  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

export function writeStoredThemePreference(theme: ThemePreference) {
  if (typeof window === 'undefined') return

  try {
    if (theme === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Theme still applies for the current page even when storage is blocked.
  }
}

function getSystemThemeColor() {
  if (typeof window === 'undefined') return LIGHT_THEME_COLOR
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? DARK_THEME_COLOR
    : LIGHT_THEME_COLOR
}

function updateThemeColor(theme: ThemePreference) {
  const color =
    theme === 'dark'
      ? DARK_THEME_COLOR
      : theme === 'light'
        ? LIGHT_THEME_COLOR
        : getSystemThemeColor()

  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.content = color
    })
}

export function applyThemePreference(theme: ThemePreference) {
  const root = document.documentElement

  if (theme === 'system') {
    root.removeAttribute('data-theme')
    root.style.removeProperty('color-scheme')
    updateThemeColor(theme)
    return
  }

  root.dataset.theme = theme
  root.style.colorScheme = theme
  updateThemeColor(theme)
}
