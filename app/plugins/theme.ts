/**
 * Plugin to fetch site appearance settings from the API
 * and apply them as CSS custom properties on the :root element.
 * Runs on both server (SSR) and client for consistent theming.
 */
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()

  // Mapping: setting key → CSS custom property name
  const colorMap: Record<string, string> = {
    primary_color: '--color-primary',
    primary_color_hover: '--color-primary-hover',
    secondary_color: '--color-secondary',
    background_color: '--color-bg',
    text_color: '--color-text',
    header_bg_color: '--color-header-bg',
    footer_bg_color: '--color-footer-bg',
  }

  try {
    const { data } = await useFetch<Record<string, string>>(`${config.public.apiBase}/settings`, {
      key: 'site-settings',
      default: () => ({}),
    })

    const settings = data.value || {}

    // Store globally
    const siteSettings = useState('siteSettings', () => settings)
    siteSettings.value = settings

    // Build CSS variables string
    const styleEntries: string[] = []
    for (const [key, cssVar] of Object.entries(colorMap)) {
      if (settings[key]) {
        styleEntries.push(`${cssVar}: ${settings[key]}`)
      }
    }

    if (styleEntries.length > 0) {
      useHead({
        style: [
          {
            innerHTML: `:root { ${styleEntries.join('; ')} }`,
          },
        ],
      })
    }

    // Also apply directly on client for instant updates
    if (import.meta.client && typeof document !== 'undefined') {
      const root = document.documentElement
      for (const [key, cssVar] of Object.entries(colorMap)) {
        if (settings[key]) {
          root.style.setProperty(cssVar, settings[key])
        }
      }
    }
  } catch (e) {
    console.warn('[theme] Failed to load settings:', e)
  }
})
