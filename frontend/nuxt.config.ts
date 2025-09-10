export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@tailwindcss/vite'
  ],
  css: ['@/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001'
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
  }
})