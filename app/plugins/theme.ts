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

    // Dynamic favicon from site_favicon setting (resolve relative URLs against API origin).
    // Uses key 'site-favicon' to override the default <link rel=icon> declared in nuxt.config.ts.
    const favicon = String(settings.site_favicon || '').trim()
    if (favicon) {
      const apiBase = String(config.public.apiBase || '')
      const backendOrigin = apiBase.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '')
      const faviconUrl = /^https?:\/\//i.test(favicon)
        ? favicon
        : backendOrigin + (favicon.startsWith('/') ? favicon : '/' + favicon)
      // Guess MIME type from extension (browsers respect this for tab icons).
      const ext = (faviconUrl.split('?')[0]?.split('.').pop() || '').toLowerCase()
      const typeMap: Record<string, string> = {
        png: 'image/png', svg: 'image/svg+xml', ico: 'image/x-icon',
        jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
      }
      const type = typeMap[ext] || 'image/png'
      useHead({
        link: [{ rel: 'icon', type, href: faviconUrl, key: 'site-favicon' }],
      })

      // Browsers cache favicon aggressively; on the client patch the existing
      // <link rel=icon> in <head> so the new icon shows up without a hard reload.
      if (import.meta.client && typeof document !== 'undefined') {
        const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]')
        links.forEach(l => l.parentNode?.removeChild(l))
        const link = document.createElement('link')
        link.rel = 'icon'
        link.type = type
        link.href = faviconUrl
        document.head.appendChild(link)
      }
    }

    // Dynamic site title via site_name
    if (settings.site_name) {
      const siteName = String(settings.site_name)
      useHead({ titleTemplate: (t?: string) => (t ? `${t} | ${siteName}` : siteName) })
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
