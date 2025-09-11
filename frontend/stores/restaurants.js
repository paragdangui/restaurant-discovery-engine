import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api'

export const useRestaurantStore = defineStore('restaurants', {
  state: () => ({
    // Restaurant data
    restaurants: [],
    currentRestaurant: null,
    searchResults: [],
    nearbyRestaurants: [],
    trendingRestaurants: [],
    
    // Search and filters
    searchQuery: '',
    searchLocation: '',
    searchFilters: {
      cuisines: [],
      priceRange: [],
      rating: null,
      distance: null,
      openNow: false,
      sortBy: 'relevance'
    },
    
    // Map state
    mapCenter: { lat: 40.7589, lng: -73.9851 },
    mapBounds: null,
    userLocation: null,
    selectedRestaurantId: null,
    
    // Loading states
    loading: false,
    searchLoading: false,
    detailLoading: false,
    nearbyLoading: false,
    
    // Pagination
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    pageSize: 20,
    
    // Error handling
    error: null,
    lastSearchError: null,
    
    // Cache management
    searchCache: new Map(),
    lastSearchTime: null,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    
    // Search history
    searchHistory: [],
    maxHistoryItems: 10
  }),

  getters: {
    // Get restaurants with filters applied
    filteredRestaurants: (state) => {
      let filtered = [...state.restaurants]
      
      // Apply cuisine filter
      if (state.searchFilters.cuisines.length > 0) {
        filtered = filtered.filter(restaurant => 
          restaurant.categories?.some(cat => 
            state.searchFilters.cuisines.includes(cat.title)
          )
        )
      }
      
      // Apply price filter
      if (state.searchFilters.priceRange.length > 0) {
        filtered = filtered.filter(restaurant => 
          state.searchFilters.priceRange.includes(restaurant.priceLevel?.toString())
        )
      }
      
      // Apply rating filter
      if (state.searchFilters.rating) {
        filtered = filtered.filter(restaurant => 
          restaurant.rating >= state.searchFilters.rating
        )
      }
      
      // Apply open now filter
      if (state.searchFilters.openNow) {
        filtered = filtered.filter(restaurant => !restaurant.isClosed)
      }
      
      return filtered
    },
    
    // Get restaurants within current map bounds
    restaurantsInBounds: (state) => {
      if (!state.mapBounds) return state.restaurants
      
      return state.restaurants.filter(restaurant => {
        if (!restaurant.latitude || !restaurant.longitude) return false
        
        return restaurant.latitude >= state.mapBounds.south &&
               restaurant.latitude <= state.mapBounds.north &&
               restaurant.longitude >= state.mapBounds.west &&
               restaurant.longitude <= state.mapBounds.east
      })
    },
    
    // Get unique cuisines from current restaurants
    availableCuisines: (state) => {
      const cuisines = new Set()
      state.restaurants.forEach(restaurant => {
        restaurant.categories?.forEach(cat => cuisines.add(cat.title))
      })
      return Array.from(cuisines).sort()
    },
    
    // Check if there are active filters
    hasActiveFilters: (state) => {
      return state.searchFilters.cuisines.length > 0 ||
             state.searchFilters.priceRange.length > 0 ||
             state.searchFilters.rating !== null ||
             state.searchFilters.distance !== null ||
             state.searchFilters.openNow
    },
    
    // Get search cache key
    getSearchCacheKey: (state) => (params) => {
      return JSON.stringify({
        query: params.query || state.searchQuery,
        location: params.location || state.searchLocation,
        filters: params.filters || state.searchFilters,
        bounds: params.bounds || state.mapBounds
      })
    },
    
    // Check if search is cached and still valid
    isSearchCached: (state) => (cacheKey) => {
      const cached = state.searchCache.get(cacheKey)
      if (!cached) return false
      
      const now = Date.now()
      return now - cached.timestamp < state.cacheTimeout
    }
  },

  actions: {
    // Search restaurants via Yelp API
    async searchRestaurants(params = {}) {
      const searchParams = {
        query: params.query || this.searchQuery,
        location: params.location || this.searchLocation,
        ...params.filters,
        page: params.page || this.currentPage,
        limit: params.limit || this.pageSize
      }
      
      // Generate cache key
      const cacheKey = this.getSearchCacheKey(searchParams)
      
      // Check cache first
      if (this.isSearchCached(cacheKey)) {
        const cached = this.searchCache.get(cacheKey)
        this.restaurants = cached.data.restaurants
        this.totalCount = cached.data.total
        this.totalPages = Math.ceil(cached.data.total / this.pageSize)
        return cached.data
      }
      
      this.searchLoading = true
      this.lastSearchError = null
      
      try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/search`, {
          params: searchParams
        })
        
        const { restaurants, total, page } = response.data
        
        // Update state
        this.restaurants = restaurants
        this.searchResults = restaurants
        this.totalCount = total
        this.currentPage = page
        this.totalPages = Math.ceil(total / this.pageSize)
        
        // Update search parameters
        if (searchParams.query) this.searchQuery = searchParams.query
        if (searchParams.location) this.searchLocation = searchParams.location
        
        // Cache the results
        this.searchCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        })
        
        // Add to search history
        this.addToSearchHistory({
          query: searchParams.query,
          location: searchParams.location,
          timestamp: Date.now()
        })
        
        this.lastSearchTime = Date.now()
        this.error = null
        
        return response.data
        
      } catch (error) {
        console.error('Error searching restaurants:', error)
        this.lastSearchError = error.response?.data?.message || 'Failed to search restaurants'
        this.error = this.lastSearchError
        throw error
      } finally {
        this.searchLoading = false
      }
    },
    
    // Get restaurants near a location
    async getNearbyRestaurants(lat, lng, radius = 5000) {
      this.nearbyLoading = true
      
      try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/nearby`, {
          params: { lat, lng, radius }
        })
        
        this.nearbyRestaurants = response.data
        return response.data
        
      } catch (error) {
        console.error('Error fetching nearby restaurants:', error)
        this.error = error.response?.data?.message || 'Failed to fetch nearby restaurants'
        throw error
      } finally {
        this.nearbyLoading = false
      }
    },
    
    // Get trending restaurants
    async getTrendingRestaurants() {
      this.loading = true
      
      try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/trending`)
        this.trendingRestaurants = response.data
        return response.data
        
      } catch (error) {
        console.error('Error fetching trending restaurants:', error)
        this.error = error.response?.data?.message || 'Failed to fetch trending restaurants'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Get restaurant details
    async getRestaurantDetails(id) {
      this.detailLoading = true
      
      try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/${id}`)
        this.currentRestaurant = response.data
        return response.data
        
      } catch (error) {
        console.error('Error fetching restaurant details:', error)
        this.error = error.response?.data?.message || 'Failed to fetch restaurant details'
        throw error
      } finally {
        this.detailLoading = false
      }
    },
    
    // Sync restaurant from Yelp
    async syncRestaurantFromYelp(yelpId) {
      this.loading = true
      
      try {
        const response = await axios.post(`${API_BASE_URL}/restaurants/${yelpId}/sync`)
        return response.data
        
      } catch (error) {
        console.error('Error syncing restaurant:', error)
        this.error = error.response?.data?.message || 'Failed to sync restaurant'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Search in map area
    async searchInMapArea(query, center, radius) {
      return this.searchRestaurants({
        query,
        location: `${center.lat},${center.lng}`,
        radius,
        sortBy: 'distance'
      })
    },
    
    // Update search filters
    updateFilters(filters) {
      this.searchFilters = { ...this.searchFilters, ...filters }
    },
    
    // Clear search filters
    clearFilters() {
      this.searchFilters = {
        cuisines: [],
        priceRange: [],
        rating: null,
        distance: null,
        openNow: false,
        sortBy: 'relevance'
      }
    },
    
    // Set map center and bounds
    setMapCenter(center) {
      this.mapCenter = center
    },
    
    setMapBounds(bounds) {
      this.mapBounds = bounds
    },
    
    setUserLocation(location) {
      this.userLocation = location
      this.mapCenter = location
    },
    
    // Select restaurant on map
    selectRestaurant(restaurantId) {
      this.selectedRestaurantId = restaurantId
    },
    
    clearSelection() {
      this.selectedRestaurantId = null
      this.currentRestaurant = null
    },
    
    // Pagination
    async goToPage(page) {
      if (page < 1 || page > this.totalPages) return
      
      this.currentPage = page
      return this.searchRestaurants({ page })
    },
    
    async nextPage() {
      return this.goToPage(this.currentPage + 1)
    },
    
    async previousPage() {
      return this.goToPage(this.currentPage - 1)
    },
    
    // Search history management
    addToSearchHistory(searchItem) {
      // Remove duplicate entries
      this.searchHistory = this.searchHistory.filter(item => 
        item.query !== searchItem.query || item.location !== searchItem.location
      )
      
      // Add to beginning
      this.searchHistory.unshift(searchItem)
      
      // Limit history size
      if (this.searchHistory.length > this.maxHistoryItems) {
        this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems)
      }
    },
    
    clearSearchHistory() {
      this.searchHistory = []
    },
    
    removeFromSearchHistory(index) {
      this.searchHistory.splice(index, 1)
    },
    
    // Cache management
    clearCache() {
      this.searchCache.clear()
    },
    
    // Clear all data
    resetStore() {
      this.restaurants = []
      this.currentRestaurant = null
      this.searchResults = []
      this.nearbyRestaurants = []
      this.trendingRestaurants = []
      this.searchQuery = ''
      this.searchLocation = ''
      this.clearFilters()
      this.selectedRestaurantId = null
      this.currentPage = 1
      this.totalPages = 0
      this.totalCount = 0
      this.error = null
      this.lastSearchError = null
      this.clearCache()
    }
  },

  // Persist state to localStorage
  persist: {
    key: 'restaurant-store',
    storage: localStorage,
    pick: ['searchHistory', 'searchFilters', 'userLocation', 'mapCenter']
  }
})