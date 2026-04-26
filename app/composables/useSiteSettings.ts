/**
 * Composable to access site settings loaded by the theme plugin.
 * Settings are fetched once at app boot and stored in useState('siteSettings').
 */
export const useSiteSettings = () => {
  const settings = useState<Record<string, any>>('siteSettings', () => ({}))

  const get = (key: string, fallback: string = ''): string => {
    return settings.value?.[key] || fallback
  }

  // Convenient getters for commonly used contact info
  const contactPhone = computed(() => get('contact_phone'))
  const contactHotline = computed(() => get('contact_hotline'))
  const contactEmail = computed(() => get('contact_email'))
  const contactAddress = computed(() => get('contact_address'))
  const siteName = computed(() => get('site_name', 'LG Tech'))

  return {
    settings,
    get,
    contactPhone,
    contactHotline,
    contactEmail,
    contactAddress,
    siteName,
  }
}
