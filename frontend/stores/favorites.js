import { defineStore } from 'pinia'
import axios from 'axios'

// Route through Nuxt proxy when API is enabled; otherwise operate locally
const API_BASE_URL = '/api'
const API_ENABLED = (process.env.FAVORITES_API_ENABLED === 'true')

export const useFavoriteStore = defineStore('favorites', {
  state: () => ({
    // Favorites data
    favorites: [],
    collections: [],
    currentCollection: null,
    
    // Loading states
    loading: false,
    addingFavorite: false,
    removingFavorite: false,
    collectionsLoading: false,
    
    // Error handling
    error: null,
    
    // Local storage for offline support
    localFavorites: new Set(),
    syncPending: []
  }),

  getters: {
    // Get favorites by collection
    favoritesByCollection: (state) => (collectionId) => {
      if (!collectionId) return state.favorites
      return state.favorites.filter(fav => fav.collectionId === collectionId)
    },
    
    // Check if restaurant is favorited
    isFavorite: (state) => (restaurantId) => {
      return state.favorites.some(fav => fav.restaurantId === restaurantId) ||
             state.localFavorites.has(restaurantId)
    },
    
    // Get favorite by restaurant ID
    getFavoriteByRestaurant: (state) => (restaurantId) => {
      return state.favorites.find(fav => fav.restaurantId === restaurantId)
    },
    
    // Get collections with favorite counts
    collectionsWithCounts: (state) => {
      return state.collections.map(collection => ({
        ...collection,
        favoriteCount: state.favorites.filter(fav => fav.collectionId === collection.id).length
      }))
    },
    
    // Get default collection
    defaultCollection: (state) => {
      return state.collections.find(col => col.isDefault) || state.collections[0]
    },
    
    // Get recent favorites (last 10)
    recentFavorites: (state) => {
      return [...state.favorites]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    },
    
    // Get favorites by cuisine type
    favoritesByCuisine: (state) => {
      const cuisineMap = new Map()
      
      state.favorites.forEach(favorite => {
        if (favorite.restaurant?.categories) {
          favorite.restaurant.categories.forEach(category => {
            const cuisine = category.title
            if (!cuisineMap.has(cuisine)) {
              cuisineMap.set(cuisine, [])
            }
            cuisineMap.get(cuisine).push(favorite)
          })
        }
      })
      
      return cuisineMap
    },
    
    // Get total favorites count
    totalFavorites: (state) => state.favorites.length + state.localFavorites.size,
    
    // Check if sync is pending
    hasPendingSync: (state) => state.syncPending.length > 0
  },

  actions: {
    // Fetch user's favorites
    async fetchFavorites(userId) {
      this.loading = true
      this.error = null

      try {
        if (!API_ENABLED) {
          // Local-only mode: just return current favorites
          return this.favorites
        }

        const response = await axios.get(`${API_BASE_URL}/favorites`, {
          params: { userId }
        })

        this.favorites = response.data
        // Clear local flags for items that exist on server
        response.data.forEach(fav => {
          this.localFavorites.delete(fav.restaurantId)
        })
        return response.data
      } catch (error) {
        console.error('Error fetching favorites:', error)
        this.error = error.response?.data?.message || 'Failed to fetch favorites'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Add restaurant to favorites
    async addFavorite(restaurantId, collectionId = null, notes = '') {
      this.addingFavorite = true
      this.error = null
      
      try {
        if (!API_ENABLED) {
          // Local-only favorite object
          const local = {
            id: `local-${Date.now()}`,
            restaurantId,
            collectionId: collectionId || this.defaultCollection?.id || null,
            notes,
            createdAt: new Date().toISOString()
          }
          this.favorites.push(local)
          this.localFavorites.add(restaurantId)
          return local
        }

        const favoriteData = {
          restaurantId,
          collectionId: collectionId || this.defaultCollection?.id,
          notes
        }

        const response = await axios.post(`${API_BASE_URL}/favorites`, favoriteData)

        // Add to favorites array
        this.favorites.push(response.data)

        // Remove from local favorites if it was there
        this.localFavorites.delete(restaurantId)

        return response.data

      } catch (error) {
        console.error('Error adding favorite:', error)
        
        // Add to local favorites for offline support
        this.localFavorites.add(restaurantId)
        this.syncPending.push({
          action: 'add',
          restaurantId,
          collectionId,
          notes,
          timestamp: Date.now()
        })
        
        this.error = error.response?.data?.message || 'Failed to add favorite'
        throw error
      } finally {
        this.addingFavorite = false
      }
    },
    
    // Remove restaurant from favorites
    async removeFavorite(restaurantId) {
      this.removingFavorite = true
      this.error = null
      
      try {
        const favorite = this.getFavoriteByRestaurant(restaurantId)
        if (API_ENABLED && favorite) {
          await axios.delete(`${API_BASE_URL}/favorites/${favorite.id}`)
        }
        // Remove from favorites array
        if (favorite) {
          this.favorites = this.favorites.filter(fav => fav.id !== favorite.id)
        }

        // Remove from local favorites
        this.localFavorites.delete(restaurantId)

        return true

      } catch (error) {
        console.error('Error removing favorite:', error)
        
        // Add to sync pending for offline support
        this.syncPending.push({
          action: 'remove',
          restaurantId,
          timestamp: Date.now()
        })
        
        this.error = error.response?.data?.message || 'Failed to remove favorite'
        throw error
      } finally {
        this.removingFavorite = false
      }
    },
    
    // Toggle favorite status
    async toggleFavorite(restaurant, collectionId = null, notes = '') {
      const restaurantId = restaurant.id
      
      if (this.isFavorite(restaurantId)) {
        return this.removeFavorite(restaurantId)
      } else {
        return this.addFavorite(restaurantId, collectionId, notes)
      }
    },
    
    // Update favorite notes
    async updateFavoriteNotes(favoriteId, notes) {
      this.loading = true
      this.error = null
      
      try {
        if (!API_ENABLED) {
          const index = this.favorites.findIndex(fav => fav.id === favoriteId)
          if (index !== -1) {
            this.favorites[index] = { ...this.favorites[index], notes }
          }
          return this.favorites[index]
        }

        const response = await axios.patch(`${API_BASE_URL}/favorites/${favoriteId}`, {
          notes
        })
        
        // Update in favorites array
        const index = this.favorites.findIndex(fav => fav.id === favoriteId)
        if (index !== -1) {
          this.favorites[index] = response.data
        }
        
        return response.data
        
      } catch (error) {
        console.error('Error updating favorite notes:', error)
        this.error = error.response?.data?.message || 'Failed to update notes'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Move favorite to different collection
    async moveFavoriteToCollection(favoriteId, newCollectionId) {
      this.loading = true
      this.error = null
      
      try {
        if (!API_ENABLED) {
          const index = this.favorites.findIndex(fav => fav.id === favoriteId)
          if (index !== -1) {
            this.favorites[index] = { ...this.favorites[index], collectionId: newCollectionId }
          }
          return this.favorites[index]
        }

        const response = await axios.patch(`${API_BASE_URL}/favorites/${favoriteId}`, {
          collectionId: newCollectionId
        })
        
        // Update in favorites array
        const index = this.favorites.findIndex(fav => fav.id === favoriteId)
        if (index !== -1) {
          this.favorites[index] = response.data
        }
        
        return response.data
        
      } catch (error) {
        console.error('Error moving favorite:', error)
        this.error = error.response?.data?.message || 'Failed to move favorite'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Fetch collections
    async fetchCollections(userId) {
      this.collectionsLoading = true
      this.error = null
      
      try {
        if (!API_ENABLED) {
          // Minimal local collections
          if (this.collections.length === 0) {
            this.collections = [{ id: 'local-default', name: 'Favorites', isDefault: true }]
          }
          return this.collections
        }

        const response = await axios.get(`${API_BASE_URL}/collections`, {
          params: { userId }
        })
        
        this.collections = response.data
        return response.data
        
      } catch (error) {
        console.error('Error fetching collections:', error)
        this.error = error.response?.data?.message || 'Failed to fetch collections'
        throw error
      } finally {
        this.collectionsLoading = false
      }
    },
    
    // Create new collection
    async createCollection(name, description = '', isDefault = false) {
      this.collectionsLoading = true
      this.error = null
      
      try {
        if (!API_ENABLED) {
          const col = { id: `local-col-${Date.now()}`, name, description, isDefault }
          this.collections.push(col)
          return col
        }

        const response = await axios.post(`${API_BASE_URL}/collections`, {
          name,
          description,
          isDefault
        })
        
        this.collections.push(response.data)
        return response.data
        
      } catch (error) {
        console.error('Error creating collection:', error)
        this.error = error.response?.data?.message || 'Failed to create collection'
        throw error
      } finally {
        this.collectionsLoading = false
      }
    },
    
    // Update collection
    async updateCollection(collectionId, updates) {
      this.collectionsLoading = true
      this.error = null
      
      try {
        if (!API_ENABLED) {
          const index = this.collections.findIndex(col => col.id === collectionId)
          if (index !== -1) {
            this.collections[index] = { ...this.collections[index], ...updates }
          }
          return this.collections[index]
        }

        const response = await axios.patch(`${API_BASE_URL}/collections/${collectionId}`, updates)
        
        // Update in collections array
        const index = this.collections.findIndex(col => col.id === collectionId)
        if (index !== -1) {
          this.collections[index] = response.data
        }
        
        return response.data
        
      } catch (error) {
        console.error('Error updating collection:', error)
        this.error = error.response?.data?.message || 'Failed to update collection'
        throw error
      } finally {
        this.collectionsLoading = false
      }
    },
    
    // Delete collection
    async deleteCollection(collectionId) {
      this.collectionsLoading = true
      this.error = null
      
      try {
        if (API_ENABLED) {
          await axios.delete(`${API_BASE_URL}/collections/${collectionId}`)
        }
        
        // Remove from collections array
        this.collections = this.collections.filter(col => col.id !== collectionId)
        
        // Move favorites from deleted collection to default collection
        const defaultCol = this.defaultCollection
        if (defaultCol) {
          this.favorites.forEach(favorite => {
            if (favorite.collectionId === collectionId) {
              favorite.collectionId = defaultCol.id
            }
          })
        }
        
        return true
        
      } catch (error) {
        console.error('Error deleting collection:', error)
        this.error = error.response?.data?.message || 'Failed to delete collection'
        throw error
      } finally {
        this.collectionsLoading = false
      }
    },
    
    // Sync pending changes (for offline support)
    async syncPendingChanges() {
      if (this.syncPending.length === 0) return
      
      this.loading = true
      const successful = []
      const failed = []
      
      for (const pending of this.syncPending) {
        try {
          if (pending.action === 'add') {
            await this.addFavorite(pending.restaurantId, pending.collectionId, pending.notes)
            successful.push(pending)
          } else if (pending.action === 'remove') {
            await this.removeFavorite(pending.restaurantId)
            successful.push(pending)
          }
        } catch (error) {
          failed.push(pending)
        }
      }
      
      // Remove successful syncs from pending
      this.syncPending = this.syncPending.filter(pending => 
        !successful.includes(pending)
      )
      
      this.loading = false
      
      return {
        successful: successful.length,
        failed: failed.length
      }
    },
    
    // Export favorites
    exportFavorites(format = 'json') {
      const data = {
        favorites: this.favorites,
        collections: this.collections,
        exportedAt: new Date().toISOString()
      }
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2)
      } else if (format === 'csv') {
        // Convert to CSV format
        const headers = ['Restaurant Name', 'Address', 'Rating', 'Collection', 'Notes', 'Added Date']
        const rows = this.favorites.map(fav => [
          fav.restaurant?.name || 'Unknown',
          fav.restaurant?.address || '',
          fav.restaurant?.rating || '',
          this.collections.find(col => col.id === fav.collectionId)?.name || 'Default',
          fav.notes || '',
          new Date(fav.createdAt).toLocaleDateString()
        ])
        
        return [headers, ...rows].map(row => row.join(',')).join('\n')
      }
    },
    
    // Import favorites
    async importFavorites(data, format = 'json') {
      this.loading = true
      
      try {
        let favorites = []
        
        if (format === 'json') {
          const parsed = JSON.parse(data)
          favorites = parsed.favorites || []
        }
        
        // Import each favorite
        for (const favorite of favorites) {
          await this.addFavorite(
            favorite.restaurantId,
            favorite.collectionId,
            favorite.notes
          )
        }
        
        return favorites.length
        
      } catch (error) {
        console.error('Error importing favorites:', error)
        this.error = 'Failed to import favorites'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Clear all favorites (with confirmation)
    async clearAllFavorites() {
      this.loading = true
      
      try {
        if (API_ENABLED) {
          await axios.delete(`${API_BASE_URL}/favorites/all`)
        }
        this.favorites = []
        this.localFavorites.clear()
        this.syncPending = []
        
        return true
        
      } catch (error) {
        console.error('Error clearing favorites:', error)
        this.error = error.response?.data?.message || 'Failed to clear favorites'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Reset store
    resetStore() {
      this.favorites = []
      this.collections = []
      this.currentCollection = null
      this.error = null
      this.localFavorites.clear()
      this.syncPending = []
    }
  },

  // Persist local favorites and sync queue
  persist: {
    key: 'favorite-store',
    // Guard localStorage for SSR; use no-op storage on server
    storage: typeof window !== 'undefined' ? window.localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    pick: ['localFavorites', 'syncPending']
  }
})
