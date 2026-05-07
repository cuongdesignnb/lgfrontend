<script setup lang="ts">
import type { Post, PostCategory } from '~/types'

interface BlogResponse {
  posts: Post[]
  meta: {
    current_page: number
    last_page: number
    total: number
  }
}

interface BlogCategory extends PostCategory {
  posts_count: number
}

const config = useRuntimeConfig()

// Filters
const search = ref('')
const category = ref('')

// Fetch posts
const { data, status, refresh } = await useFetch<BlogResponse>(
  `${config.public.apiBase}/blog`,
  {
    params: computed(() => ({
      search: search.value || undefined,
      category: category.value || undefined,
    })),
    watch: [search, category],
    default: () => ({ posts: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  }
)

const posts = computed(() => data.value?.posts || [])
const meta = computed(() => data.value?.meta || { current_page: 1, last_page: 1, total: 0 })

// Fetch categories
const { data: categoriesData } = await useFetch<BlogCategory[]>(`${config.public.apiBase}/blog/categories`)
const categories = computed(() => categoriesData.value || [])

// Format date
const formatDate = (date: string | null) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

useSeoMeta({
  title: 'Blog & Tin tức - Lgtech',
  description: 'Tin tức công nghệ, hướng dẫn build PC, review sản phẩm mới nhất',
})
</script>

<template>
  <div class="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
    <h1 class="text-2xl sm:text-3xl font-bold mb-5 sm:mb-8">Blog & Tin tức</h1>

    <div class="grid lg:grid-cols-4 gap-5 lg:gap-8">
      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-4 sm:space-y-6 order-1 lg:order-none">
        <!-- Search -->
        <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
          <h3 class="font-semibold mb-3 text-sm sm:text-base">Tìm kiếm</h3>
          <input
            v-model="search"
            type="text"
            placeholder="Tìm bài viết..."
            class="w-full px-3 sm:px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
        </div>

        <!-- Categories: chips on mobile, list on desktop -->
        <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
          <h3 class="font-semibold mb-3 text-sm sm:text-base">Danh mục</h3>
          <!-- Horizontal chip scroller on mobile -->
          <div class="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1 lg:hidden">
            <button
              :class="[
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                !category ? 'bg-primary-50 text-primary-700 border-primary-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              ]"
              @click="category = ''"
            >
              Tất cả
            </button>
            <button
              v-for="cat in categories"
              :key="cat.id"
              :class="[
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
                category === cat.slug ? 'bg-primary-50 text-primary-700 border-primary-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              ]"
              @click="category = cat.slug"
            >
              {{ cat.name }} ({{ cat.posts_count }})
            </button>
          </div>
          <!-- Vertical list on desktop -->
          <ul class="hidden lg:block space-y-2">
            <li>
              <button
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg text-sm',
                  !category ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                ]"
                @click="category = ''"
              >
                Tất cả
              </button>
            </li>
            <li v-for="cat in categories" :key="cat.id">
              <button
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg flex justify-between gap-2 text-sm',
                  category === cat.slug ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                ]"
                @click="category = cat.slug"
              >
                <span class="truncate">{{ cat.name }}</span>
                <span class="text-gray-400 shrink-0">({{ cat.posts_count }})</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Posts -->
      <div class="lg:col-span-3 order-2">
        <div v-if="status === 'pending'" class="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div v-for="i in 4" :key="i" class="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div class="aspect-video bg-gray-200"></div>
            <div class="p-4 space-y-3">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-6 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        <div v-else-if="posts.length === 0" class="text-center py-12">
          <p class="text-6xl mb-4">📝</p>
          <p class="text-base sm:text-xl text-gray-500">Chưa có bài viết nào</p>
        </div>

        <div v-else class="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <NuxtLink
            v-for="post in posts"
            :key="post.id"
            :to="`/tin-tuc/${post.slug}`"
            class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <!-- Image -->
            <div class="aspect-video bg-gray-100">
              <img
                v-if="post.featured_image"
                :src="post.featured_image"
                :alt="post.title"
                class="w-full h-full object-cover"
              >
              <div v-else class="w-full h-full flex items-center justify-center text-4xl">
                📰
              </div>
            </div>

            <!-- Content -->
            <div class="p-3 sm:p-4">
              <div class="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                <span v-if="post.category" class="text-primary-600">{{ post.category.name }}</span>
                <span v-if="post.category" class="text-gray-300">•</span>
                <span>{{ formatDate(post.published_at) }}</span>
              </div>
              <h2 class="font-bold text-base sm:text-lg mb-2 line-clamp-2 hover:text-primary-600 break-words">
                {{ post.title }}
              </h2>
              <p class="text-gray-600 text-xs sm:text-sm line-clamp-2 break-words">
                {{ post.excerpt }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <div v-if="meta.last_page > 1" class="flex flex-wrap justify-center mt-6 sm:mt-8 gap-2">
          <UButton
            v-for="page in meta.last_page"
            :key="page"
            :variant="page === meta.current_page ? 'solid' : 'outline'"
            size="sm"
          >
            {{ page }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
