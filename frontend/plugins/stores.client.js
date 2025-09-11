export default defineNuxtPlugin(() => {
  // Auto-import all stores
  const { useRestaurantStore } = useNuxtData('restaurant-store') || {}
  const { useFavoriteStore } = useNuxtData('favorite-store') || {}
  const { useAIStore } = useNuxtData('ai-store') || {}

  // Make stores globally available
  return {
    provide: {
      restaurantStore: useRestaurantStore,
      favoriteStore: useFavoriteStore,
      aiStore: useAIStore
    }
  }
})