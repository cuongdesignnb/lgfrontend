<script setup lang="ts">
// Default layout for the storefront
const config = useRuntimeConfig()
const cart = useCart()
const auth = useAuth()
const route = useRoute()

// Fetch cart on mount
onMounted(() => {
  cart.fetchCart()
})

// ─── AJAX Search ───────────────────────────────────────
const searchOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const searchTotal = ref(0)
let searchTimer: ReturnType<typeof setTimeout> | null = null

function openSearch() {
  searchOpen.value = true
  nextTick(() => {
    const input = document.getElementById('header-search-input')
    input?.focus()
  })
}

function closeSearch() {
  searchOpen.value = false
  searchQuery.value = ''
  searchResults.value = []
}

watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!val || val.trim().length < 2) {
    searchResults.value = []
    searchTotal.value = 0
    return
  }
  searchLoading.value = true
  searchTimer = setTimeout(async () => {
    try {
      const data = await $fetch<any>(`${config.public.apiBase}/products`, {
        params: { search: val.trim(), per_page: 6 },
      })
      searchResults.value = data.data || []
      searchTotal.value = data.total || 0
    } catch (e) {
      searchResults.value = []
      searchTotal.value = 0
    }
    searchLoading.value = false
  }, 350)
})

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price) + '₫'
}

function goToProduct(item: any) {
  const categorySlug = item.category?.slug || 'san-pham'
  navigateTo(`/${categorySlug}/${item.slug}`)
  closeSearch()
}

function goToSearchPage() {
  navigateTo(`/tim-kiem?q=${encodeURIComponent(searchQuery.value)}`)
  closeSearch()
}

// ─── Site Settings (dynamic phone, email, logo, social, etc.) ────────
const {
  contactPhone, contactHotline, contactEmail, contactAddress,
  siteName, siteLogo, contactMap,
  socialFacebook, socialYoutube, socialTiktok, socialZalo, socialInstagram,
} = useSiteSettings()

// Detect map embed type: full <iframe ...> snippet vs URL
const mapEmbedHtml = computed(() => {
  const v = String(contactMap.value || '').trim()
  if (!v) return ''
  if (/<iframe[\s\S]+<\/iframe>/i.test(v)) return v
  // Looks like a URL — wrap in iframe
  if (/^https?:\/\//i.test(v)) {
    const safe = v.replace(/"/g, '&quot;')
    return `<iframe src="${safe}" width="100%" height="100%" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`
  }
  return ''
})

const hasAnySocial = computed(() => Boolean(
  socialFacebook.value || socialYoutube.value || socialTiktok.value || socialZalo.value || socialInstagram.value
))

// ─── Mobile menu drawer shared state (avoid mounting MegaMenu twice) ───
const mobileMenuOpen = useState<boolean>('mobileMenuOpen', () => false)
function openMobileMenu() { mobileMenuOpen.value = true }
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#f5f0e8]">
    <!-- Header -->
    <header class="bg-white sticky top-0 z-50 shadow-sm">
      <div class="container mx-auto px-3 sm:px-4">
        <!-- Row 1: Logo + Nav + Actions -->
        <div class="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4 lg:gap-6">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 shrink-0" :aria-label="siteName">
            <img
              v-if="siteLogo"
              :src="siteLogo"
              :alt="siteName"
              class="object-contain block"
              style="height:40px;width:auto;max-width:160px;"
            >
            <div
              v-else
              class="w-10 h-10 rounded-full bg-[#c8102e] flex items-center justify-center text-white font-bold text-lg tracking-tight border-2 border-[#c8102e]"
            >
              <span class="text-sm font-black">LG</span>
            </div>
          </NuxtLink>

          <!-- Desktop Nav -->
          <div class="hidden lg:block flex-1">
            <MegaMenu :is-mobile="false" />
          </div>

          <!-- Right actions -->
          <div class="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
            <!-- Search -->
            <button
              @click="openSearch"
              class="p-2 text-gray-600 hover:text-[#c8102e] rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Tìm kiếm"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <!-- Account -->
            <NuxtLink
              :to="auth.isAuthenticated.value ? '/tai-khoan' : '/dang-nhap'"
              class="p-2 text-gray-600 hover:text-[#c8102e] flex items-center gap-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span v-if="auth.isAuthenticated.value" class="hidden xl:inline text-sm font-medium">{{ auth.user.value?.name }}</span>
            </NuxtLink>

            <!-- Cart -->
            <NuxtLink to="/gio-hang" class="p-2 text-gray-600 hover:text-[#c8102e] relative rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span
                v-if="cart.itemCount.value > 0"
                class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#c8102e] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white"
              >
                {{ cart.itemCount.value > 99 ? '99+' : cart.itemCount.value }}
              </span>
            </NuxtLink>

            <!-- Mobile menu trigger -->
            <MegaMenu class="lg:hidden" :is-mobile="true" />
          </div>
        </div>
      </div>
    </header>

    <!-- ===== Search Overlay ===== -->
    <Teleport to="body">
      <Transition name="search-overlay">
        <div v-if="searchOpen" class="fixed inset-0 z-[100]" @click.self="closeSearch">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeSearch"></div>

          <!-- Search panel -->
          <div class="relative max-w-2xl mx-auto mt-16 sm:mt-24 px-4">
            <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <!-- Search input -->
              <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  id="header-search-input"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  class="flex-1 text-base text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                  @keydown.escape="closeSearch"
                  @keydown.enter="searchQuery.trim() && goToSearchPage()"
                >
                <button @click="closeSearch" class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Results -->
              <div class="max-h-[60vh] overflow-y-auto">
                <!-- Loading -->
                <div v-if="searchLoading" class="flex items-center justify-center py-8">
                  <svg class="animate-spin h-6 w-6 text-[#c8102e]" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>

                <!-- Results list -->
                <div v-else-if="searchResults.length > 0">
                  <button
                    v-for="item in searchResults"
                    :key="item.id"
                    @click="goToProduct(item)"
                    class="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div class="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      <img
                        v-if="item.images?.[0]"
                        :src="item.images[0].url"
                        :alt="item.name"
                        class="w-full h-full object-cover"
                      >
                      <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-800 truncate">{{ item.name }}</p>
                      <p v-if="item.category" class="text-xs text-gray-400 mt-0.5">{{ item.category.name }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-sm font-bold text-[#c8102e]">
                        {{ formatPrice(item.sale_price || item.price) }}
                      </p>
                      <p v-if="item.sale_price" class="text-xs text-gray-400 line-through">
                        {{ formatPrice(item.price) }}
                      </p>
                    </div>
                  </button>

                  <!-- View all -->
                  <button
                    v-if="searchTotal > 6"
                    @click="goToSearchPage"
                    class="w-full py-3 text-center text-sm font-medium text-[#c8102e] hover:bg-red-50 transition-colors"
                  >
                    Xem tất cả {{ searchTotal }} kết quả →
                  </button>
                </div>

                <!-- No results -->
                <div v-else-if="searchQuery.trim().length >= 2 && !searchLoading" class="py-10 text-center">
                  <svg class="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <p class="text-gray-500 text-sm">Không tìm thấy sản phẩm nào</p>
                  <p class="text-gray-400 text-xs mt-1">Thử từ khóa khác hoặc tìm theo danh mục</p>
                </div>

                <!-- Hint -->
                <div v-else-if="!searchLoading" class="py-8 text-center">
                  <p class="text-gray-400 text-sm">Nhập ít nhất 2 ký tự để tìm kiếm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Main content (bottom padding handled by global CSS so content clears the
         mobile tab bar + iOS safe area) -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- ===== Mobile Bottom Tab Bar ===== -->
    <nav id="mobile-tab-bar" class="fixed bottom-0 left-0 right-0 z-50 lg:hidden mobile-tab-bar">
      <div class="flex items-stretch justify-around h-[62px] px-1">
        <!-- Trang chủ -->
        <NuxtLink
          to="/"
          :class="[
            'mobile-tab-item',
            route.path === '/' ? 'mobile-tab-active' : ''
          ]"
        >
          <svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span>Trang chủ</span>
        </NuxtLink>

        <!-- Sản phẩm: opens shared mobile menu drawer (instant, no route fallback) -->
        <button
          type="button"
          class="mobile-tab-item"
          @click="openMobileMenu"
          aria-label="Mở menu sản phẩm"
        >
          <svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
          <span>Sản phẩm</span>
        </button>

        <!-- Giỏ hàng -->
        <NuxtLink
          to="/gio-hang"
          :class="[
            'mobile-tab-item',
            route.path.startsWith('/gio-hang') ? 'mobile-tab-active' : ''
          ]"
        >
          <div class="relative">
            <svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
            </svg>
            <span
              v-if="cart.itemCount.value > 0"
              class="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-[#c8102e] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white"
            >
              {{ cart.itemCount.value > 99 ? '99+' : cart.itemCount.value }}
            </span>
          </div>
          <span>Giỏ hàng</span>
        </NuxtLink>

        <!-- Gọi điện (thay Đăng nhập) -->
        <a
          :href="`tel:${contactHotline || contactPhone}`"
          class="mobile-tab-item mobile-tab-call"
        >
          <div class="mobile-tab-call-icon">
            <svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </div>
          <span>Gọi điện</span>
        </a>
      </div>
    </nav>

    <!-- Footer -->
    <footer class="bg-[#ece7df] text-gray-800 border-t border-[#d9d3c7]">
      <div class="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <!-- About -->
          <div>
            <h3 class="text-lg font-bold mb-4">Về LG Tech</h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-3">
              Là thương hiệu cho các sản phẩm điện tử, điện dân dụng cao cấp đã được bảo hộ bởi cục sở hữu trí tuệ. Với mục tiêu là đơn vị sản xuất, phân phối các sản phẩm điện tử cao cấp.
            </p>
            <p class="text-gray-700 text-sm font-semibold">Công ty Cổ Phần Đầu Tư Công Nghệ Linh Gia</p>
            <ul class="text-gray-600 text-sm mt-2">
              <li>• Mã số doanh nghiệp: 0108914506</li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h3 class="text-lg font-bold mb-4">Liên hệ với chúng tôi</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li v-if="contactAddress">Địa chỉ: {{ contactAddress }}</li>
              <li v-if="contactHotline || contactPhone">
                Hotline:
                <a v-if="contactHotline" :href="`tel:${contactHotline}`" class="text-blue-600 hover:underline">{{ contactHotline }}</a>
                <template v-if="contactHotline && contactPhone"> - </template>
                <a v-if="contactPhone" :href="`tel:${contactPhone}`" class="text-blue-600 hover:underline">{{ contactPhone }}</a>
              </li>
              <li v-if="contactEmail">Email: <a :href="`mailto:${contactEmail}`" class="text-blue-600 hover:underline">{{ contactEmail }}</a></li>
            </ul>
            <template v-if="hasAnySocial">
              <h4 class="text-base font-bold mt-4 mb-2">Kết nối với chúng tôi</h4>
              <div class="flex flex-wrap gap-2">
                <a v-if="socialFacebook" :href="socialFacebook" target="_blank" rel="noopener" aria-label="Facebook" class="w-9 h-9 rounded-full bg-[#1877F2] hover:opacity-90 flex items-center justify-center text-white transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88V14.9H7.9v-2.9h2.54V9.79c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.9h-2.34v6.98C18.34 21.13 22 16.99 22 12z"/></svg>
                </a>
                <a v-if="socialYoutube" :href="socialYoutube" target="_blank" rel="noopener" aria-label="YouTube" class="w-9 h-9 rounded-full bg-[#FF0000] hover:opacity-90 flex items-center justify-center text-white transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>
                </a>
                <a v-if="socialTiktok" :href="socialTiktok" target="_blank" rel="noopener" aria-label="TikTok" class="w-9 h-9 rounded-full bg-black hover:opacity-90 flex items-center justify-center text-white transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 6.7a4.8 4.8 0 01-2.9-1 4.8 4.8 0 01-1.8-3H11v12.5a2.7 2.7 0 11-2.7-2.7c.3 0 .5 0 .8.1V9a5.7 5.7 0 105.7 5.7V9a7.4 7.4 0 004.8 1.8V6.9c0 0-.1 0-.1 0z"/></svg>
                </a>
                <a v-if="socialInstagram" :href="socialInstagram" target="_blank" rel="noopener" aria-label="Instagram" class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 flex items-center justify-center text-white transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zm0 2.1c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.6a4.1 4.1 0 110 8.2 4.1 4.1 0 010-8.2zm0 6.8a2.7 2.7 0 100-5.4 2.7 2.7 0 000 5.4zm5.2-7a1 1 0 110 1.9 1 1 0 010-1.9z"/></svg>
                </a>
                <a v-if="socialZalo" :href="socialZalo" target="_blank" rel="noopener" aria-label="Zalo" class="w-9 h-9 rounded-full bg-[#0068FF] hover:opacity-90 flex items-center justify-center text-white transition">
                  <span class="text-[10px] font-extrabold">Zalo</span>
                </a>
              </div>
            </template>
          </div>

          <!-- Support -->
          <div>
            <h3 class="text-lg font-bold mb-4">Hỗ trợ khách hàng</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><NuxtLink to="/gioi-thieu" class="hover:text-[#c8102e] transition-colors">Giới thiệu về LG Tech</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-[#c8102e] transition-colors">Chính sách đại lý</NuxtLink></li>
              <li><NuxtLink to="/bao-hanh" class="hover:text-[#c8102e] transition-colors">Chính sách bảo hành</NuxtLink></li>
              <li><NuxtLink to="/van-chuyen" class="hover:text-[#c8102e] transition-colors">Chính sách giao hàng</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-[#c8102e] transition-colors">Chính sách đổi trả hàng</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-[#c8102e] transition-colors">Chính sách bảo mật thông tin</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-[#c8102e] transition-colors">Chính sách và quy định chung</NuxtLink></li>
            </ul>
          </div>
        </div>
        <!-- Map -->
        <div v-if="mapEmbedHtml" class="mt-10">
          <h3 class="text-lg font-bold mb-3">Bản đồ</h3>
          <div class="w-full aspect-[16/9] sm:aspect-[21/9] rounded-lg overflow-hidden border border-[#d9d3c7] bg-white" v-html="mapEmbedHtml" />
        </div>
      </div>
      <div class="bg-[#3a3a3a] text-center text-sm text-gray-300 py-3">
        Copyright {{ new Date().getFullYear() }} © {{ siteName }}
      </div>
    </footer>
  </div>
</template>

<style>
/* Search overlay transition */
.search-overlay-enter-active { transition: opacity 0.2s ease; }
.search-overlay-leave-active { transition: opacity 0.15s ease; }
.search-overlay-enter-from,
.search-overlay-leave-to { opacity: 0; }

/* ===== Mobile Bottom Tab Bar ===== */
.mobile-tab-bar {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mobile-tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  padding: 6px 2px;
  color: #6b7280;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.15s ease;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.mobile-tab-item:active {
  transform: scale(0.92);
}

.mobile-tab-active {
  color: var(--color-primary, #c8102e);
}

.mobile-tab-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 3px;
  border-radius: 0 0 6px 6px;
  background: var(--color-primary, #c8102e);
}

/* Call button special styling */
.mobile-tab-call {
  color: #059669;
}

.mobile-tab-call-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
  animation: callPulse 2.5s ease-in-out infinite;
  margin-top: -10px;
}

@keyframes callPulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35); }
  50% { box-shadow: 0 4px 20px rgba(5, 150, 105, 0.55); }
}

.mobile-tab-call span {
  color: #059669;
  font-weight: 700;
}
</style>
