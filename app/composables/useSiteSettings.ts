/**
 * Composable to access site settings loaded by the theme plugin.
 * Settings are fetched once at app boot and stored in useState('siteSettings').
 */
export const useSiteSettings = () => {
  const settings = useState<Record<string, any>>('siteSettings', () => ({}))
  const config = useRuntimeConfig()

  const get = (key: string, fallback: string = ''): string => {
    return settings.value?.[key] || fallback
  }

  // Resolve a media URL: if it begins with `/storage/` or `/`, prefix with API origin.
  // Returns empty string if input falsy.
  const resolveMediaUrl = (raw: string | null | undefined): string => {
    if (!raw) return ''
    const url = String(raw).trim()
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    // Compute backend base from apiBase by stripping trailing /api/v1
    const apiBase = String(config.public.apiBase || '')
    const backendOrigin = apiBase.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '')
    if (!backendOrigin) return url
    return backendOrigin + (url.startsWith('/') ? url : '/' + url)
  }

  // Convenient getters for commonly used contact info
  const contactPhone = computed(() => get('contact_phone'))
  const contactHotline = computed(() => get('contact_hotline'))
  const contactEmail = computed(() => get('contact_email'))
  const contactAddress = computed(() => get('contact_address'))
  const businessHours = computed(() => get('business_hours'))
  const siteName = computed(() => get('site_name', 'LG Tech'))
  const siteTagline = computed(() => get('site_tagline'))
  const siteLogo = computed(() => resolveMediaUrl(get('site_logo')))
  const siteFavicon = computed(() => resolveMediaUrl(get('site_favicon')))

  // Social
  const socialFacebook = computed(() => get('social_facebook'))
  const socialYoutube = computed(() => get('social_youtube'))
  const socialTiktok = computed(() => get('social_tiktok'))
  const socialZalo = computed(() => get('social_zalo'))
  const socialInstagram = computed(() => get('social_instagram'))

  // Map: prefer `contact_map`; fall back to `google_map_embed`
  const contactMap = computed(() => get('contact_map') || get('google_map_embed'))

  // Homepage
  const homepageHeroTitle = computed(() => get('homepage_hero_title'))
  const homepageHeroSubtitle = computed(() => get('homepage_hero_subtitle'))
  const homepagePrimaryCtaLabel = computed(() => get('homepage_primary_cta_label'))
  const homepagePrimaryCtaUrl = computed(() => get('homepage_primary_cta_url'))
  const homepageSecondaryCtaLabel = computed(() => get('homepage_secondary_cta_label'))
  const homepageSecondaryCtaUrl = computed(() => get('homepage_secondary_cta_url'))
  const homepageBrandIntroTitle = computed(() => get('homepage_brand_intro_title'))
  const homepageBrandIntroContent = computed(() => get('homepage_brand_intro_content'))

  // Generic JSON parse helper for setting values stored as JSON strings
  const parseJson = <T = any>(key: string, fallback: T): T => {
    const v = settings.value?.[key]
    if (!v) return fallback
    if (typeof v !== 'string') return v as T
    try { return JSON.parse(v) as T } catch { return fallback }
  }

  const homepageUspItems = computed(() => parseJson<Array<{ icon: string; title: string; desc: string }>>('homepage_usp_items', []))
  const homepageCaseStudies = computed(() => parseJson<Array<any>>('homepage_case_studies', []))
  const homepageTestimonials = computed(() => parseJson<Array<any>>('homepage_testimonials', []))
  const homepageApplicationImages = computed(() => parseJson<Array<any>>('homepage_application_images', []))
  const homepageTargetCustomers = computed(() => parseJson<Array<any>>('homepage_target_customers', []))

  return {
    settings,
    get,
    resolveMediaUrl,
    parseJson,
    contactPhone,
    contactHotline,
    contactEmail,
    contactAddress,
    businessHours,
    siteName,
    siteTagline,
    siteLogo,
    siteFavicon,
    socialFacebook,
    socialYoutube,
    socialTiktok,
    socialZalo,
    socialInstagram,
    contactMap,
    homepageHeroTitle,
    homepageHeroSubtitle,
    homepagePrimaryCtaLabel,
    homepagePrimaryCtaUrl,
    homepageSecondaryCtaLabel,
    homepageSecondaryCtaUrl,
    homepageBrandIntroTitle,
    homepageBrandIntroContent,
    homepageUspItems,
    homepageCaseStudies,
    homepageTestimonials,
    homepageApplicationImages,
    homepageTargetCustomers,
  }
}
