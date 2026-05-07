<script setup lang="ts">
const config = useRuntimeConfig()
const { getHeaders } = useCartSession()
const toast = useToast()

interface CartItem {
  id: number
  product_id: number
  quantity: number
  product: {
    id: number
    name: string
    slug: string
    price: number
    sale_price: number | null
    quantity: number
    images?: { url: string }[]
    category?: { slug: string } | null
  }
}

// Fetch cart
const { data, refresh, status } = await useFetch<{ items: CartItem[], total: number }>(
  `${config.public.apiBase}/cart`,
  { default: () => ({ items: [], total: 0 }), headers: getHeaders() }
)

const cartItems = computed(() => data.value?.items || [])
const cartTotal = computed(() => data.value?.total || 0)

// Update quantity
const updating = ref<number | null>(null)
const updateQuantity = async (item: CartItem, quantity: number) => {
  if (quantity < 1 || quantity > item.product.quantity) return
  
  updating.value = item.id
  try {
    await $fetch(`${config.public.apiBase}/cart/items/${item.id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: { quantity },
    })
    await refresh()
  } catch (error) {
    console.error('Error updating quantity:', error)
    toast.add({ title: 'Lỗi', description: 'Không thể cập nhật số lượng.', icon: 'i-heroicons-exclamation-triangle', color: 'error' })
  } finally {
    updating.value = null
  }
}

// Remove item
const removing = ref<number | null>(null)
const removeItem = async (itemId: number) => {
  removing.value = itemId
  try {
    await $fetch(`${config.public.apiBase}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    await refresh()
    toast.add({ title: 'Đã xóa', description: 'Sản phẩm đã được xóa khỏi giỏ hàng.', icon: 'i-heroicons-check-circle', color: 'success' })
  } catch (error) {
    console.error('Error removing item:', error)
    toast.add({ title: 'Lỗi', description: 'Không thể xóa sản phẩm.', icon: 'i-heroicons-exclamation-triangle', color: 'error' })
  } finally {
    removing.value = null
  }
}

// Clear cart
const clearing = ref(false)
const clearCart = async () => {
  if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return
  
  clearing.value = true
  try {
    await $fetch(`${config.public.apiBase}/cart`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    await refresh()
    toast.add({ title: 'Đã xóa', description: 'Giỏ hàng đã được xóa toàn bộ.', icon: 'i-heroicons-check-circle', color: 'success' })
  } catch (error) {
    console.error('Error clearing cart:', error)
    toast.add({ title: 'Lỗi', description: 'Không thể xóa giỏ hàng.', icon: 'i-heroicons-exclamation-triangle', color: 'error' })
  } finally {
    clearing.value = false
  }
}

// Get item price
const getItemPrice = (item: CartItem) => {
  return item.product.sale_price || item.product.price
}

const getItemTotal = (item: CartItem) => {
  return getItemPrice(item) * item.quantity
}

useSeoMeta({
  title: 'Giỏ hàng - Lgtech',
})
</script>

<template>
  <div class="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
    <h1 class="text-2xl sm:text-3xl font-bold mb-5 sm:mb-8">Giỏ hàng</h1>

    <div v-if="status === 'pending'" class="text-center py-12">
      <p class="text-gray-500">Đang tải...</p>
    </div>

    <div v-else-if="cartItems.length === 0" class="text-center py-12">
      <p class="text-6xl mb-4">🛒</p>
      <p class="text-lg sm:text-xl text-gray-500 mb-6">Giỏ hàng của bạn đang trống</p>
      <UButton to="/" size="lg">Tiếp tục mua sắm</UButton>
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-5 lg:gap-8">
      <!-- Cart Items -->
      <div class="lg:col-span-2 space-y-3 sm:space-y-4">
        <div
          v-for="item in cartItems"
          :key="item.id"
          class="bg-white rounded-xl shadow-sm p-3 sm:p-4"
        >
          <div class="flex gap-3 sm:gap-4">
            <!-- Product Image -->
            <NuxtLink :to="`/${item.product.category?.slug || 'san-pham'}/${item.product.slug}`" class="flex-shrink-0">
              <div class="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  v-if="item.product.images?.[0]"
                  :src="item.product.images[0].url"
                  :alt="item.product.name"
                  class="w-full h-full object-cover"
                >
                <div v-else class="w-full h-full flex items-center justify-center text-2xl sm:text-3xl">
                  📦
                </div>
              </div>
            </NuxtLink>

            <!-- Product Info + per-unit price + line total -->
            <div class="flex-1 min-w-0 flex flex-col">
              <NuxtLink :to="`/${item.product.category?.slug || 'san-pham'}/${item.product.slug}`">
                <h3 class="font-semibold text-sm sm:text-base hover:text-primary-600 line-clamp-2 break-words">
                  {{ item.product.name }}
                </h3>
              </NuxtLink>

              <div class="flex items-baseline justify-between gap-2 mt-1">
                <p class="text-xs sm:text-sm text-gray-500">
                  Đơn giá:
                  <span class="text-primary-600 font-semibold">{{ new Intl.NumberFormat('vi-VN').format(getItemPrice(item)) }}₫</span>
                </p>
                <p class="font-bold text-sm sm:text-lg text-gray-900 whitespace-nowrap">
                  {{ new Intl.NumberFormat('vi-VN').format(getItemTotal(item)) }}₫
                </p>
              </div>
            </div>
          </div>

          <!-- Quantity controls + Remove (own row, full-width on mobile) -->
          <div class="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <!-- Quantity -->
            <div class="flex items-center border rounded">
              <button
                class="w-9 h-9 sm:px-3 sm:py-1 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                :disabled="item.quantity <= 1 || updating === item.id"
                @click="updateQuantity(item, item.quantity - 1)"
                aria-label="Giảm"
              >−</button>
              <span class="px-3 py-1 min-w-[40px] text-center text-sm font-semibold">
                {{ item.quantity }}
              </span>
              <button
                class="w-9 h-9 sm:px-3 sm:py-1 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                :disabled="item.quantity >= item.product.quantity || updating === item.id"
                @click="updateQuantity(item, item.quantity + 1)"
                aria-label="Tăng"
              >+</button>
            </div>

            <!-- Remove -->
            <button
              class="text-sm text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1.5"
              :disabled="removing === item.id"
              @click="removeItem(item.id)"
            >
              <span>🗑️</span>
              <span>Xóa</span>
            </button>
          </div>
        </div>

        <!-- Clear Cart -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 sm:pt-4">
          <UButton
            variant="ghost"
            color="error"
            :loading="clearing"
            @click="clearCart"
          >
            Xóa toàn bộ giỏ hàng
          </UButton>
          <NuxtLink to="/" class="text-primary-600 hover:underline text-sm">
            ← Tiếp tục mua sắm
          </NuxtLink>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-4">
          <h2 class="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Tóm tắt đơn hàng</h2>

          <div class="space-y-2.5 sm:space-y-3 mb-4 text-sm">
            <div class="flex justify-between gap-3">
              <span class="text-gray-600">Tạm tính ({{ cartItems.length }} SP)</span>
              <span class="text-right whitespace-nowrap">{{ new Intl.NumberFormat('vi-VN').format(cartTotal) }}₫</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-gray-600">Phí vận chuyển</span>
              <span class="text-green-600 text-right whitespace-nowrap">Miễn phí</span>
            </div>
          </div>

          <div class="border-t pt-3 sm:pt-4 mb-5 sm:mb-6">
            <div class="flex justify-between gap-3 text-base sm:text-lg font-bold">
              <span>Tổng cộng</span>
              <span class="text-primary-600 text-right whitespace-nowrap">{{ new Intl.NumberFormat('vi-VN').format(cartTotal) }}₫</span>
            </div>
          </div>

          <UButton to="/thanh-toan" size="lg" block>
            Tiến hành thanh toán
          </UButton>

          <p class="text-[11px] sm:text-xs text-gray-500 text-center mt-3 sm:mt-4">
            Miễn phí vận chuyển cho đơn hàng từ 500.000₫
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
