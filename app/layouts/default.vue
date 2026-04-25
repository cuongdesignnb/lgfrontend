<script setup lang="ts">
// Default layout for the storefront
const config = useRuntimeConfig()
const cart = useCart()
const auth = useAuth()

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
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#f5f0e8]">
    <!-- Header -->
    <header class="bg-white sticky top-0 z-50 shadow-sm">
      <div class="container mx-auto px-4">
        <!-- Row 1: Logo + Nav + Actions -->
        <div class="flex items-center justify-between h-16 gap-6">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
            <div class="w-10 h-10 rounded-full bg-[#c8102e] flex items-center justify-center text-white font-bold text-lg tracking-tight border-2 border-[#c8102e]">
              <span class="text-sm font-black">LG</span>
            </div>
          </NuxtLink>

          <!-- Desktop Nav -->
          <div class="hidden lg:block flex-1">
            <MegaMenu />
          </div>

          <!-- Right actions -->
          <div class="flex items-center gap-3">
            <!-- Search -->
            <button 
              @click="openSearch"
              class="p-2 text-gray-600 hover:text-[#c8102e] rounded-lg hover:bg-gray-50 transition-colors"
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
            <MegaMenu class="lg:hidden" />
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

    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-[#ece7df] text-gray-800 border-t border-[#d9d3c7]">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <li>Địa chỉ: Khu Đô Thị Ao Sào, Hoàng Mai, Hà Nội. <a href="#" class="text-blue-600 hover:underline">(Bản đồ đường đi)</a></li>
              <li>Hotline: <a href="tel:0987113911" class="text-blue-600 hover:underline">0987113911</a> - <a href="tel:0982557272" class="text-blue-600 hover:underline">0982557272</a></li>
              <li>Email: <a href="mailto:admin@lgtech.vn" class="text-blue-600 hover:underline">admin@lgtech.vn</a></li>
            </ul>
            <h4 class="text-base font-bold mt-4 mb-2">Kết nối với chúng tôi</h4>
            <div class="flex gap-3">
              <a href="#" class="w-8 h-8 bg-gray-400 rounded-full"></a>
              <a href="#" class="w-8 h-8 bg-gray-400 rounded-full"></a>
              <a href="#" class="w-8 h-8 bg-gray-400 rounded-full"></a>
              <a href="#" class="w-8 h-8 bg-gray-400 rounded-full"></a>
            </div>
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
      </div>
      <div class="bg-[#3a3a3a] text-center text-sm text-gray-300 py-3">
        Copyright 2026 © LG Tech
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
</style>
