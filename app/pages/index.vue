<script setup lang="ts">
import type { Product, Category, Brand, Post } from '~/types'

interface HomepageSection {
  category: { id: number; name: string; slug: string; description: string | null; image: string | null }
  children: { id: number; name: string; slug: string }[]
  product_count: number
  products: Product[]
}

interface BannerSlide {
  id: number; title: string; description: string | null; badge: string | null
  image: string; link: string | null; position: string; sort_order: number
  metadata: { gradient?: string; cta_label?: string; cta_link?: string; cta2_label?: string; cta2_link?: string; glow_a?: string; glow_b?: string } | null
}

const config = useRuntimeConfig()
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

const {
  homepageHeroTitle, homepageHeroSubtitle,
  homepagePrimaryCtaLabel, homepagePrimaryCtaUrl,
  homepageSecondaryCtaLabel, homepageSecondaryCtaUrl,
  homepageBrandIntroTitle, homepageBrandIntroContent,
  homepageUspItems, homepageTargetCustomers,
  homepageCaseStudies, homepageTestimonials, homepageApplicationImages,
  resolveMediaUrl,
} = useSiteSettings()

// Fetch all data
const { data: sections } = await useFetch<HomepageSection[]>(`${config.public.apiBase}/categories/homepage-sections`, { default: () => [] })
const { data: featuredProducts } = await useFetch<Product[]>(`${config.public.apiBase}/products/featured`, { default: () => [] })
const { data: featuredPosts } = await useFetch<Post[]>(`${config.public.apiBase}/blog/featured`, { default: () => [] })
const { data: heroBanners } = await useFetch<BannerSlide[]>(`${config.public.apiBase}/banners`, { params: { position: 'hero' }, default: () => [] })
const { data: videos } = await useFetch<any[]>(`${config.public.apiBase}/videos`, { default: () => [] })
const { data: catalogues } = await useFetch<any[]>(`${config.public.apiBase}/catalogues`, { default: () => [] })

const mainSlides = computed(() => {
  const banners = heroBanners.value ?? []
  if (banners.length === 0) return [{ image: '', link: '/san-pham', title: 'LG Tech' }]
  return banners.map(b => ({ image: b.image || '', link: b.metadata?.cta_link || b.link || '/san-pham', title: b.title || '' }))
})

const getDiscount = (p: Product) => { if (!p.sale_price || !p.price || p.price <= 0) return 0; const pct = Math.round((1 - p.sale_price / p.price) * 100); return pct > 0 && pct < 100 ? pct : 0 }

// Featured section: tab 0 = featured, tab 1+ = root categories
const featuredTab = ref<number>(0)
const featuredTabs = computed(() => {
  const tabs: { label: string; slug: string | null }[] = [{ label: 'Sản phẩm nổi bật', slug: null }]
  for (const s of (sections.value ?? [])) {
    tabs.push({ label: s.category.name, slug: s.category.slug })
  }
  return tabs
})

const featuredGridProducts = computed((): Product[] => {
  if (featuredTab.value === 0) {
    // Show featured products from API
    if (featuredProducts.value && featuredProducts.value.length > 0) return featuredProducts.value.slice(0, 8)
    // Fallback: collect from all sections (not just is_featured)
    const all = (sections.value ?? []).flatMap(s => s.products)
    return all.slice(0, 8)
  }
  // Show products from the selected category section
  const sIdx = featuredTab.value - 1
  const sec = (sections.value ?? [])[sIdx]
  if (!sec) return []
  return sec.products.slice(0, 8)
})

const featuredGridLink = computed(() => {
  if (featuredTab.value === 0) return '/san-pham'
  const sIdx = featuredTab.value - 1
  const sec = (sections.value ?? [])[sIdx]
  return sec ? `/${sec.category.slug}` : '/san-pham'
})

// Get product link
function productLink(product: Product): string {
  const catSlug = product.category?.slug || 'san-pham'
  return `/${catSlug}/${product.slug}`
}

// Video popup
const showVideoPopup = ref(false)
const activeVideo = ref<any>(null)

function openVideo(video: any) {
  activeVideo.value = video
  showVideoPopup.value = true
}
function closeVideo() {
  showVideoPopup.value = false
  setTimeout(() => { activeVideo.value = null }, 300)
}

const processedEmbed = computed(() => {
  if (!activeVideo.value?.embed_code) return ''
  let code = activeVideo.value.embed_code
  code = code.replace(/width="\d+"/g, 'width="100%"')
  code = code.replace(/height="\d+"/g, 'height="100%"')
  // Also ensure iframe has style for full container fill
  if (code.includes('<iframe') && !code.includes('style=')) {
    code = code.replace('<iframe', '<iframe style="width:100%;height:100%"')
  }
  return code
})

// Catalogue download
async function downloadCatalogue(catalogue: any) {
  try {
    await $fetch(`${config.public.apiBase}/catalogues/${catalogue.id}/download`, { method: 'POST' })
  } catch {}
  window.open(catalogue.file_url, '_blank')
}

useSeoMeta({ title: 'LG Tech - Thiết bị điện cao cấp', description: 'LG Tech - Chuyên cung cấp ổ cắm, công tắc, thiết bị điện cao cấp.' })

// Banner slider
const currentSlide = ref(0)
const slideDirection = ref<'next' | 'prev'>('next')
const isSlideTransitioning = ref(false)
let mainSlideTimer: ReturnType<typeof setInterval> | null = null

function goToSlide(idx: number) {
  if (idx === currentSlide.value || isSlideTransitioning.value) return
  slideDirection.value = idx > currentSlide.value ? 'next' : 'prev'
  isSlideTransitioning.value = true
  currentSlide.value = idx
  resetMainTimer()
  setTimeout(() => { isSlideTransitioning.value = false }, 600)
}
function nextSlide() { goToSlide((currentSlide.value + 1) % mainSlides.value.length) }
function prevSlide() { goToSlide((currentSlide.value - 1 + mainSlides.value.length) % mainSlides.value.length) }
function resetMainTimer() { if (mainSlideTimer) clearInterval(mainSlideTimer); mainSlideTimer = setInterval(nextSlide, 5000) }

onMounted(() => { resetMainTimer() })
onUnmounted(() => { if (mainSlideTimer) clearInterval(mainSlideTimer) })

// Collage images from active tab products
const collageImages = computed(() => {
  const products = featuredGridProducts.value
  return products.filter(p => p.images?.[0]).slice(0, 4).map(p => ({ url: p.images![0]!.url, name: p.name, slug: productLink(p) }))
})

// Featured category list for the collage panel
const featuredCats = computed(() => {
  return (sections.value ?? []).slice(0, 5).map(s => s.category.name)
})

// Scroll reveal
const sectionRefs = ref<(HTMLElement | null)[]>([])
const revealedSections = reactive(new Set<number>())

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement
        const idx = sectionRefs.value.indexOf(el)
        if (idx !== -1) revealedSections.add(idx)
        el.querySelectorAll('[data-product-card]').forEach((card, i) => { setTimeout(() => card.classList.add('is-visible'), i * 80) })
        observer.unobserve(el)
      }
    })
  }, { threshold: 0.08 })
  nextTick(() => { sectionRefs.value.forEach((el) => { if (el) observer.observe(el) }) })
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div>
    <!-- ============ HERO BANNER ============ -->
    <section class="bg-[#f5f0e8]">
      <div class="container mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-4 sm:pb-6">
        <!-- Hero Banner -->
        <div class="hero-banner rounded-xl sm:rounded-2xl" style="position: relative; overflow: hidden;">
          <TransitionGroup :name="slideDirection === 'next' ? 'slide-next' : 'slide-prev'" tag="div" class="absolute inset-0 w-full h-full">
            <div v-for="(slide, si) in mainSlides" v-show="si === currentSlide" :key="si" class="absolute inset-0 w-full h-full">
              <img v-if="slide.image" :src="slide.image" :alt="slide.title" class="block w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-gradient-to-br from-[#f0e4d0] to-[#e6d5bc] flex items-center justify-center">
                <span class="text-3xl font-bold text-[#8b7355]">LG Tech</span>
              </div>
            </div>
          </TransitionGroup>
          <!-- Nav arrows -->
          <button @click="prevSlide" class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center transition-colors shadow-md" aria-label="Previous">
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button @click="nextSlide" class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center transition-colors shadow-md" aria-label="Next">
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <!-- Dots -->
          <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); z-index: 20; display: flex; gap: 6px;">
            <button v-for="(_, di) in mainSlides" :key="di" @click="goToSlide(di)"
              class="h-2 sm:h-3 rounded-full transition-all duration-300"
              :class="di === currentSlide ? 'w-6 sm:w-8 bg-[#c8102e]' : 'w-2 sm:w-3 bg-white/60 hover:bg-white/80'"
              :aria-label="`Slide ${di + 1}`" />
          </div>
          <!-- Hero overlay text + dual CTA (only when admin sets a hero title) -->
          <div v-if="homepageHeroTitle" class="hidden sm:flex absolute inset-y-0 left-0 z-20 max-w-[55%] flex-col justify-center px-8 lg:px-12 bg-gradient-to-r from-black/40 to-transparent text-white">
            <p v-if="homepageHeroSubtitle" class="text-sm uppercase tracking-[0.2em] opacity-80 mb-2">{{ homepageHeroSubtitle }}</p>
            <h1 class="text-3xl lg:text-5xl font-black leading-tight mb-5">{{ homepageHeroTitle }}</h1>
            <div class="flex flex-wrap gap-3">
              <NuxtLink v-if="homepagePrimaryCtaLabel" :to="homepagePrimaryCtaUrl || '/san-pham'" class="bg-[#c8102e] hover:bg-red-700 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                {{ homepagePrimaryCtaLabel }}
              </NuxtLink>
              <NuxtLink v-if="homepageSecondaryCtaLabel" :to="homepageSecondaryCtaUrl || '/lien-he'" class="border border-white/70 hover:bg-white hover:text-gray-900 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                {{ homepageSecondaryCtaLabel }}
              </NuxtLink>
            </div>
          </div>
          <!-- CTA button - fallback when no hero overlay text -->
          <NuxtLink v-else :to="mainSlides[currentSlide]?.link || '/san-pham'" class="hidden sm:block absolute bottom-5 right-5 z-20 bg-white hover:bg-gray-50 text-gray-800 text-sm font-medium px-5 py-2.5 rounded-lg shadow-md transition-colors border border-gray-200">
            Xem thêm
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ============ BRAND INTRO + USP ============ -->
    <section v-if="homepageBrandIntroTitle || homepageUspItems.length" class="bg-white border-y border-[#e0d9cd]">
      <div class="container mx-auto px-4 py-10 sm:py-14">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div v-if="homepageBrandIntroTitle" class="lg:col-span-5">
            <span class="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#c8102e] mb-2">Thương hiệu</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{{ homepageBrandIntroTitle }}</h2>
            <p v-if="homepageBrandIntroContent" class="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{{ homepageBrandIntroContent }}</p>
            <div class="flex flex-wrap gap-3 mt-5">
              <NuxtLink v-if="homepagePrimaryCtaLabel" :to="homepagePrimaryCtaUrl || '/san-pham'" class="bg-[#c8102e] hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                {{ homepagePrimaryCtaLabel }}
              </NuxtLink>
              <NuxtLink v-if="homepageSecondaryCtaLabel" :to="homepageSecondaryCtaUrl || '/lien-he'" class="border border-gray-300 hover:border-gray-900 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                {{ homepageSecondaryCtaLabel }}
              </NuxtLink>
            </div>
          </div>
          <div v-if="homepageUspItems.length" class="lg:col-span-7 grid grid-cols-2 sm:grid-cols-2 gap-4">
            <div v-for="(usp, ui) in homepageUspItems" :key="ui" class="rounded-xl border border-gray-100 p-4 bg-[#fafaf7] hover:border-[#c8102e]/30 transition-colors">
              <div class="text-2xl mb-2">{{ usp.icon }}</div>
              <h3 class="font-bold text-sm text-gray-900 mb-1">{{ usp.title }}</h3>
              <p class="text-xs text-gray-600 leading-relaxed">{{ usp.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ TARGET CUSTOMERS ============ -->
    <section v-if="homepageTargetCustomers.length" class="bg-[#f5f0e8] border-b border-[#e0d9cd]">
      <div class="container mx-auto px-4 py-10 sm:py-12">
        <div class="text-center max-w-2xl mx-auto mb-8">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Phù hợp với mọi không gian</h2>
          <p class="text-gray-600 mt-2 text-sm">LG Tech đồng hành cùng các công trình từ dân dụng tới thương mại cao cấp.</p>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="(t, ti) in homepageTargetCustomers" :key="ti" class="bg-white rounded-2xl p-5 text-center border border-gray-100 hover:shadow-md transition-shadow">
            <div class="text-3xl mb-2">{{ t.icon }}</div>
            <h3 class="font-bold text-gray-900 text-sm mb-1">{{ t.title }}</h3>
            <p class="text-xs text-gray-600 leading-relaxed">{{ t.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ APPLICATION IMAGES (real-world usage) ============ -->
    <section v-if="homepageApplicationImages.length" class="bg-white border-b border-[#e0d9cd]">
      <div class="container mx-auto px-4 py-10 sm:py-12">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Ứng dụng thực tế</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <figure v-for="(img, ii) in homepageApplicationImages" :key="ii" class="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 group">
            <img :src="resolveMediaUrl(img.image)" :alt="img.caption || ''" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <figcaption v-if="img.caption" class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-medium p-3">{{ img.caption }}</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ============ CASE STUDIES ============ -->
    <section v-if="homepageCaseStudies.length" class="bg-[#f5f0e8] border-b border-[#e0d9cd]">
      <div class="container mx-auto px-4 py-10 sm:py-12">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Dự án tiêu biểu</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <article v-for="(cs, ci) in homepageCaseStudies" :key="ci" class="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
            <div class="aspect-[16/10] bg-gray-100 overflow-hidden">
              <img v-if="cs.image" :src="resolveMediaUrl(cs.image)" :alt="cs.title || ''" class="w-full h-full object-cover" />
            </div>
            <div class="p-4">
              <p v-if="cs.location" class="text-[11px] uppercase tracking-wider text-[#c8102e] font-bold mb-1">{{ cs.location }}</p>
              <h3 class="font-bold text-gray-900 text-base mb-1">{{ cs.title }}</h3>
              <p v-if="cs.description" class="text-sm text-gray-600 line-clamp-3">{{ cs.description }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ============ TESTIMONIALS ============ -->
    <section v-if="homepageTestimonials.length" class="bg-white border-b border-[#e0d9cd]">
      <div class="container mx-auto px-4 py-10 sm:py-12">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">Khách hàng nói gì về chúng tôi</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <blockquote v-for="(tm, mi) in homepageTestimonials" :key="mi" class="bg-[#fafaf7] rounded-2xl p-5 border border-gray-100">
            <p class="text-sm text-gray-700 italic leading-relaxed mb-4">"{{ tm.content }}"</p>
            <div class="flex items-center gap-3">
              <img v-if="tm.avatar" :src="resolveMediaUrl(tm.avatar)" :alt="tm.name || ''" class="w-10 h-10 rounded-full object-cover bg-gray-200" />
              <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{{ (tm.name || '?').charAt(0) }}</div>
              <div>
                <p class="font-semibold text-sm text-gray-900">{{ tm.name }}</p>
                <p v-if="tm.role" class="text-xs text-gray-500">{{ tm.role }}</p>
              </div>
            </div>
          </blockquote>
        </div>
      </div>
    </section>

    <!-- ============ KHÁM PHÁ SẢN PHẨM NỔI BẬT ============ -->
    <section class="bg-[#f5f0e8] pb-10">
      <div class="container mx-auto px-4">
        <!-- Section Title + Category Tabs -->
        <div class="mb-4 sm:mb-6">
          <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3">Khám phá sản phẩm nổi bật</h2>
          <div class="flex items-center gap-1.5 sm:gap-1 flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-hide pb-1">
            <button v-for="(tab, ti) in featuredTabs" :key="ti" @click="featuredTab = ti"
              :class="['px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0',
                featuredTab === ti
                  ? 'bg-[#c8102e] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200']">
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Collage: Left Info + Right Product Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- Left info panel -->
          <div class="hidden lg:flex lg:col-span-3 bg-white rounded-2xl p-6 flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-10 h-10 rounded-lg bg-[#c8102e] flex items-center justify-center text-white font-black text-xs">LG</div>
                <div class="leading-tight">
                  <span class="text-[9px] font-bold text-[#c8102e] uppercase tracking-wider">Technology</span><br/>
                  <span class="text-[9px] font-bold text-[#c8102e] uppercase tracking-wider">For Life</span>
                </div>
              </div>
              <h3 class="text-[#c8102e] text-lg font-bold uppercase mb-1">Khám Phá</h3>
              <h3 class="text-[#c8102e] text-lg font-bold uppercase mb-1">Dòng Sản Phẩm</h3>
              <h2 class="text-4xl md:text-5xl font-black text-[#c8102e] mb-4 leading-tight" style="font-family: serif;">NỔI BẬT</h2>
              <NuxtLink :to="featuredGridLink" class="inline-block border-2 border-gray-800 text-gray-800 text-xs font-semibold px-5 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors mb-6">
                Mua ngay
              </NuxtLink>
            </div>
            <ul class="space-y-1.5">
              <li v-for="cat in featuredCats" :key="cat" class="flex items-center gap-2 text-[#c8102e] font-medium text-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-[#c8102e]"></span>
                {{ cat }}
              </li>
            </ul>
          </div>

          <!-- Right product grid (responds to tab) -->
          <div class="lg:col-span-9">
            <div v-if="featuredGridProducts.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <NuxtLink v-for="product in featuredGridProducts" :key="product.id"
                :to="productLink(product)" :prefetch="false" data-product-card
                class="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[#c8102e]/30 transition-all group">
                <div class="relative aspect-square bg-[#f0ebe3] flex items-center justify-center overflow-hidden">
                  <img v-if="product.images?.[0]" :src="product.images[0].url" :alt="product.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div v-else class="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white bg-[#c8102e]">{{ product.name.charAt(0) }}</div>
                  <div v-if="getDiscount(product)" class="absolute top-2 left-2 bg-[#c8102e] text-white text-xs font-bold px-2 py-1 rounded-lg">-{{ getDiscount(product) }}%</div>
                  <div v-if="product.is_featured" class="absolute top-2 right-2 bg-amber-400 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded">HOT</div>
                </div>
                <div class="p-3">
                  <h3 class="font-semibold text-xs text-gray-900 line-clamp-2 mb-1.5 group-hover:text-[#c8102e] transition-colors">{{ product.name }}</h3>
                  <div v-if="(product.sale_price || product.price) > 0" class="flex items-end gap-1.5">
                    <span class="text-sm font-bold text-[#c8102e]">{{ fmt(product.sale_price || product.price) }}₫</span>
                    <span v-if="product.sale_price" class="text-[10px] text-gray-400 line-through">{{ fmt(product.price) }}₫</span>
                  </div>
                  <span v-else class="text-sm font-bold text-amber-600">Liên hệ</span>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="flex items-center justify-center h-full min-h-[300px] bg-white rounded-xl text-gray-400">
              <p>Chưa có sản phẩm nào.</p>
            </div>
          </div>
        </div>

        <!-- View All Button -->
        <div class="text-center mt-6">
          <NuxtLink :to="featuredGridLink" :prefetch="false"
            class="inline-block bg-[#c8102e] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors">
            Xem tất cả
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ============ CATEGORY PRODUCT SECTIONS ============ -->
    <template v-for="(section, sIdx) in sections ?? []" :key="section.category.id">
      <section
        :ref="(el: any) => { if (el?.$el || el) sectionRefs[sIdx] = (el.$el || el) as HTMLElement }"
        class="py-10 bg-[#f5f0e8] border-t border-[#e0d9cd]"
      >
        <div class="container mx-auto px-4">
          <!-- Section Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div class="flex items-center gap-3">
              <div class="w-1 h-8 rounded-full bg-[#c8102e]" />
              <div>
                <h2 class="text-2xl font-bold text-gray-900">{{ section.category.name }}</h2>
                <p class="text-sm text-gray-500">{{ section.product_count }} sản phẩm</p>
              </div>
            </div>
            <NuxtLink :to="`/${section.category.slug}`" :prefetch="false"
              class="text-[#c8102e] hover:text-red-700 font-medium text-sm flex items-center gap-1">
              Xem tất cả
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </NuxtLink>
          </div>

          <!-- Product Grid -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <NuxtLink v-for="product in section.products.slice(0, 8)" :key="product.id"
              :to="productLink(product)" :prefetch="false" data-product-card
              class="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[#c8102e]/30 transition-all group">
              <div class="relative aspect-square bg-[#f0ebe3] flex items-center justify-center overflow-hidden">
                <img v-if="product.images?.[0]" :src="product.images[0].url" :alt="product.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div v-else class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white bg-[#c8102e]">{{ product.name.charAt(0) }}</div>
                <div v-if="getDiscount(product)" class="absolute top-2 left-2 bg-[#c8102e] text-white text-xs font-bold px-2 py-1 rounded-lg">-{{ getDiscount(product) }}%</div>
                <div v-if="product.is_featured" class="absolute top-2 right-2 bg-amber-400 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded">HOT</div>
              </div>
              <div class="p-4">
                <h3 class="font-semibold text-sm text-gray-900 line-clamp-2 mb-2 group-hover:text-[#c8102e] transition-colors">{{ product.name }}</h3>
                <div v-if="(product.sale_price || product.price) > 0" class="flex items-end gap-2">
                  <span class="text-base font-bold text-[#c8102e]">{{ fmt(product.sale_price || product.price) }}₫</span>
                  <span v-if="product.sale_price" class="text-xs text-gray-400 line-through">{{ fmt(product.price) }}₫</span>
                </div>
                <span v-else class="text-base font-bold text-amber-600">Liên hệ</span>
              </div>
            </NuxtLink>
          </div>

          <!-- View All Button -->
          <div class="text-center mt-6">
            <NuxtLink :to="`/${section.category.slug}`" :prefetch="false"
              class="inline-block bg-[#c8102e] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors">
              Xem tất cả
            </NuxtLink>
          </div>
        </div>
      </section>
    </template>

    <!-- ============ VIDEOS SECTION ============ -->
    <section v-if="videos && videos.length > 0" class="py-12 bg-[#f5f0e8] border-t border-[#e0d9cd]">
      <div class="container mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-6" style="font-family: serif;">Videos</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="video in videos.slice(0, 8)" :key="video.id" class="group cursor-pointer" @click="openVideo(video)">
            <div class="video-card relative">
              <img v-if="video.thumbnail" :src="video.thumbnail" :alt="video.title" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-[#e8e2d8] flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
              </div>
              <div class="play-btn">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <p class="text-sm text-gray-700 mt-2 line-clamp-2 group-hover:text-[#c8102e] transition-colors">{{ video.title }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Video Popup Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showVideoPopup && activeVideo" class="fixed inset-0 z-[100] flex items-center justify-center" @click.self="closeVideo">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div class="relative w-full max-w-4xl mx-4 animate-scale-in">
            <button @click="closeVideo" class="absolute -top-10 right-0 text-white/80 hover:text-white text-sm flex items-center gap-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              Đóng
            </button>
            <!-- Embed video -->
            <div v-if="activeVideo.source === 'embed' && activeVideo.embed_code" class="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl" v-html="processedEmbed"></div>
            <!-- Uploaded video -->
            <div v-else-if="activeVideo.video_url" class="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <video :src="activeVideo.video_url" controls autoplay class="w-full h-full"></video>
            </div>
            <div class="mt-3 text-center">
              <h3 class="text-white text-lg font-semibold">{{ activeVideo.title }}</h3>
              <p v-if="activeVideo.description" class="text-white/60 text-sm mt-1">{{ activeVideo.description }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============ DOWNLOAD CATALOGUE ============ -->
    <section v-if="catalogues && catalogues.length > 0" class="py-12 bg-[#f5f0e8] border-t border-[#e0d9cd]">
      <div class="container mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-6" style="font-family: serif;">Download catalogue</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="cat in catalogues" :key="cat.id" class="catalogue-card group">
            <div class="flex items-start gap-4">
              <div class="w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#e8e2d8] flex items-center justify-center">
                <img v-if="cat.cover_image" :src="cat.cover_image" :alt="cat.title" class="w-full h-full object-cover" />
                <svg v-else class="w-8 h-8 text-[#c8102e]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div class="flex-1">
                <h4 class="text-[#c8102e] font-bold text-sm mb-1">{{ cat.title }}</h4>
                <p v-if="cat.description" class="text-xs text-gray-500 line-clamp-2 mb-3">{{ cat.description }}</p>
                <button @click="downloadCatalogue(cat)" class="inline-flex items-center gap-1.5 bg-[#c8102e] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ TIN NỔI BẬT ============ -->
    <section v-if="featuredPosts && featuredPosts.length > 0" class="py-12 bg-[#f5f0e8] border-t border-[#e0d9cd]">
      <div class="container mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-bold text-[#c8102e] mb-6" style="font-family: serif;">Tin nổi bật</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <NuxtLink v-for="post in featuredPosts.slice(0, 4)" :key="post.id" :to="`/tin-tuc/${post.slug}`" class="group">
            <div class="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
              <div class="relative h-44 bg-[#e8e2d8] overflow-hidden">
                <img v-if="post.featured_image" :src="post.featured_image" :alt="post.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div class="p-4">
                <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-[#c8102e] transition-colors">{{ post.title }}</h3>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span class="text-[#c8102e] font-medium">Tin tức</span>
                  <span>{{ new Date(post.published_at || post.created_at || new Date()).toLocaleDateString('vi-VN') }}</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Video popup animations */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>