// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Modules
  modules: [
    '@nuxt/ui',
    '@nuxt/image',
  ],

  // CSS
  css: ['~/assets/css/main.css'],

  // Runtime config
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api/v1',
      appName: 'Lgtech',
    }
  },

  // Nitro server config
  nitro: {
    routeRules: {
      '/api/**': { proxy: (process.env.NUXT_API_PROXY_TARGET || 'http://localhost:8901') + '/api/**' },
      '/storage/**': { proxy: (process.env.NUXT_API_PROXY_TARGET || 'http://localhost:8901') + '/storage/**' },
    },
  },

  // App config
  app: {
    head: {
      title: 'LG Tech - Thiết bị điện cao cấp',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Lgtech - Website bán hàng công nghệ, sản phẩm chính hãng giá tốt' },
      ],
      link: [
        // `key` lets the theme plugin override this when site_favicon is set in admin.
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', key: 'site-favicon' }
      ]
    }
  },

  // Route rules for rendering strategy
  routeRules: {
    '/': { isr: 300 },
    '/products/**': { isr: 60 },
    '/categories/**': { isr: 300 },
    '/blog/**': { swr: 3600 },

    '/cart': { ssr: false },
    '/checkout/**': { ssr: false },
    '/account/**': { ssr: false },
  },

  // Disable automatic prefetch on NuxtLinks (too many links → payload storm)
  experimental: {
    defaults: {
      nuxtLink: {
        prefetch: false,
      },
    },
  },

  // TypeScript
  typescript: {
    strict: true
  }
})

