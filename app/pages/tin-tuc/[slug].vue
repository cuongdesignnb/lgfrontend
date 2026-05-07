<script setup lang="ts">
import type { Post } from '~/types'

interface PostDetailResponse {
  post: Post
  related: Post[]
}

const config = useRuntimeConfig()
const route = useRoute()

const slug = route.params.slug as string

// Fetch post
const { data } = await useFetch<PostDetailResponse>(`${config.public.apiBase}/blog/${slug}`)

const post = computed(() => data.value?.post)
const relatedPosts = computed(() => data.value?.related || [])

// Format date
const formatDate = (date: string | null) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// SEO
useSeoMeta({
  title: () => post.value?.title ? `${post.value.title} - Lgtech` : 'Bài viết - Lgtech',
  description: () => post.value?.excerpt || post.value?.meta_description,
})
</script>

<template>
  <div class="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
    <template v-if="post">
      <!-- Breadcrumb -->
      <nav class="mb-4 sm:mb-6 text-xs sm:text-sm overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
        <NuxtLink to="/" class="text-gray-500 hover:text-primary-600">Trang chủ</NuxtLink>
        <span class="mx-2 text-gray-400">/</span>
        <NuxtLink to="/tin-tuc" class="text-gray-500 hover:text-primary-600">Tin tức</NuxtLink>
        <template v-if="post.category">
          <span class="mx-2 text-gray-400">/</span>
          <span class="text-gray-500">{{ post.category.name }}</span>
        </template>
      </nav>

      <div class="grid lg:grid-cols-4 gap-5 lg:gap-8">
        <!-- Main Content -->
        <article class="lg:col-span-3 min-w-0">
          <!-- Header -->
          <header class="mb-6 sm:mb-8">
            <div class="flex items-center flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              <span v-if="post.category" class="px-2 py-1 bg-primary-100 text-primary-700 rounded">
                {{ post.category.name }}
              </span>
              <span>{{ formatDate(post.published_at) }}</span>
              <span class="text-gray-300">•</span>
              <span>{{ post.view_count }} lượt xem</span>
            </div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 break-words">{{ post.title }}</h1>
            <p v-if="post.excerpt" class="text-base sm:text-xl text-gray-600 break-words">{{ post.excerpt }}</p>
          </header>

          <!-- Featured Image -->
          <div v-if="post.featured_image" class="mb-6 sm:mb-8 rounded-xl overflow-hidden">
            <img
              :src="post.featured_image"
              :alt="post.title"
              class="w-full h-auto"
            >
          </div>

          <!-- Content -->
          <div class="prose prose-sm sm:prose-base lg:prose-lg max-w-none break-words" v-html="post.body"></div>

          <!-- Tags -->
          <div v-if="post.tags?.length" class="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t">
            <h3 class="font-semibold mb-3 text-sm sm:text-base">Tags:</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in post.tags"
                :key="tag.id"
                class="px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Author -->
          <div v-if="post.author" class="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-xl flex items-center gap-3 sm:gap-4">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0">
              {{ post.author.name?.[0] }}
            </div>
            <div class="min-w-0">
              <p class="font-semibold break-words">{{ post.author.name }}</p>
              <p class="text-gray-500 text-xs sm:text-sm">Tác giả</p>
            </div>
          </div>

          <!-- Share -->
          <div class="mt-6 sm:mt-8 flex items-center flex-wrap gap-3 sm:gap-4">
            <span class="text-gray-500 text-sm">Chia sẻ:</span>
            <a
              :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent($route.fullPath)}`"
              target="_blank"
              rel="noopener"
              class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
              aria-label="Chia sẻ Facebook"
            >
              f
            </a>
            <a
              :href="`https://twitter.com/intent/tweet?url=${encodeURIComponent($route.fullPath)}&text=${encodeURIComponent(post.title)}`"
              target="_blank"
              rel="noopener"
              class="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600"
              aria-label="Chia sẻ X"
            >
              𝕏
            </a>
          </div>
        </article>

        <!-- Sidebar -->
        <aside class="lg:col-span-1 space-y-4 sm:space-y-6">
          <!-- Related Posts -->
          <div v-if="relatedPosts.length" class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
            <h3 class="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Bài viết liên quan</h3>
            <div class="space-y-3 sm:space-y-4">
              <NuxtLink
                v-for="related in relatedPosts"
                :key="related.id"
                :to="`/tin-tuc/${related.slug}`"
                class="flex gap-3 hover:opacity-80"
              >
                <div class="w-20 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  <img
                    v-if="related.featured_image"
                    :src="related.featured_image"
                    :alt="related.title"
                    class="w-full h-full object-cover"
                  >
                </div>
                <div class="min-w-0">
                  <h4 class="text-xs sm:text-sm font-medium line-clamp-2 break-words">{{ related.title }}</h4>
                  <p class="text-[11px] sm:text-xs text-gray-500 mt-1">{{ formatDate(related.published_at) }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Back to Blog -->
          <NuxtLink
            to="/tin-tuc"
            class="block text-center px-4 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
          >
            ← Quay lại Tin tức
          </NuxtLink>
        </aside>
      </div>
    </template>

    <template v-else>
      <div class="text-center py-12">
        <p class="text-gray-500">Đang tải...</p>
      </div>
    </template>
  </div>
</template>
