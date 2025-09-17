export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  css: [
    '@/assets/css/main.css',
    'swiper/css',
    'swiper/css/navigation',
    'swiper/css/pagination'
  ],
  // Expose a public API base for use in components/composables
  // Defaults to '/api' so local dev routes through the Vite proxy.
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      favoritesApiEnabled: process.env.FAVORITES_API_ENABLED === 'true'
    }
  },
  app: {
    head: {
      title: 'Restaurant Discovery Engine',
      meta: [
        { name: 'description', content: 'Discover and explore amazing restaurants' }
      ]
    }
  },
  typescript: {
    strict: true
  },
  build: {
    transpile: ['@vue-leaflet/vue-leaflet']
  },
  vite: {
    server: {
      proxy: {
        '/api': {
          // Use explicit backend URL if provided; default to localhost for local dev.
          target: process.env.API_BASE_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  },
  // Ensure SSR/server requests also proxy to the backend
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: `${process.env.API_BASE_URL || 'http://localhost:3001'}/**`
      }
    }
  }
})
