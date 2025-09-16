import { defineStore } from 'pinia'
import axios from 'axios'

// Route all frontend calls through Nuxt proxy
const API_BASE_URL = '/api'

export const useAIStore = defineStore('ai', {
  state: () => ({
    // Recommendations
    recommendations: [],
    personalizedRecommendations: [],
    recommendationHistory: [],
    
    // Review analysis
    reviewSummaries: new Map(),
    sentimentAnalysis: new Map(),
    
    // Menu analysis
    menuAnalysis: new Map(),
    dietaryCompatibility: new Map(),
    
    // User preferences
    userPreferences: {
      dietaryRestrictions: [],
      allergies: [],
      preferredCuisines: [],
      pricePreference: null,
      atmospher: [],
      diningStyle: null
    },
    
    // AI chat/assistant
    chatMessages: [],
    chatSuggestions: [],
    
    // Loading states
    recommendationsLoading: false,
    reviewAnalysisLoading: false,
    menuAnalysisLoading: false,
    chatLoading: false,
    
    // Error handling
    error: null,
    lastError: null,
    
    // Settings
    enableAI: true,
    usePersonalization: true,
    analysisLanguage: 'en',
    
    // Cache
    analysisCache: new Map(),
    cacheTimeout: 30 * 60 * 1000, // 30 minutes
    
    // Analytics
    interactionHistory: [],
    preferenceHistory: []
  }),

  getters: {
    // Get recommendations by type
    getRecommendationsByType: (state) => (type) => {
      return state.recommendations.filter(rec => rec.type === type)
    },
    
    // Get review summary for restaurant
    getReviewSummary: (state) => (restaurantId) => {
      return state.reviewSummaries.get(restaurantId)
    },
    
    // Get sentiment analysis for restaurant
    getSentimentAnalysis: (state) => (restaurantId) => {
      return state.sentimentAnalysis.get(restaurantId)
    },
    
    // Get menu analysis for restaurant
    getMenuAnalysis: (state) => (restaurantId) => {
      return state.menuAnalysis.get(restaurantId)
    },
    
    // Check dietary compatibility
    getDietaryCompatibility: (state) => (restaurantId) => {
      return state.dietaryCompatibility.get(restaurantId)
    },
    
    // Get active dietary restrictions
    activeDietaryRestrictions: (state) => {
      return state.userPreferences.dietaryRestrictions.filter(restriction => 
        restriction.active
      )
    },
    
    // Get recent chat messages
    recentChatMessages: (state) => {
      return state.chatMessages.slice(-20)
    },
    
    // Check if AI features are available
    isAIAvailable: (state) => state.enableAI,
    
    // Get personalization status
    isPersonalizationEnabled: (state) => state.usePersonalization,
    
    // Get cached analysis
    getCachedAnalysis: (state) => (key) => {
      const cached = state.analysisCache.get(key)
      if (!cached) return null
      
      const now = Date.now()
      if (now - cached.timestamp > state.cacheTimeout) {
        state.analysisCache.delete(key)
        return null
      }
      
      return cached.data
    }
  },

  actions: {
    // Generate personalized recommendations
    async generateRecommendations(restaurants, searchContext = {}) {
      if (!this.enableAI) return []
      
      this.recommendationsLoading = true
      this.error = null
      
      try {
        // Align with backend route: GET /restaurants/recommendations with preferences in query
        const response = await axios.get(`${API_BASE_URL}/restaurants/recommendations`, {
          params: {
            preferences: JSON.stringify({ ...this.userPreferences, ...searchContext }),
          }
        })

        const payload = Array.isArray(response.data) ? response.data : response.data?.recommendations || []
        // Normalize to recommendation objects containing restaurant
        this.recommendations = payload
        this.personalizedRecommendations = Array.isArray(payload)
          ? payload.filter(rec => rec.personalized || rec.matchScore >= 0.7)
          : []
        
        // Add to history
        this.recommendationHistory.unshift({
          recommendations: response.data.recommendations,
          context: searchContext,
          timestamp: Date.now()
        })
        
        // Limit history size
        if (this.recommendationHistory.length > 50) {
          this.recommendationHistory = this.recommendationHistory.slice(0, 50)
        }
        
        return response.data
        
      } catch (error) {
        console.error('Error generating recommendations:', error)
        this.error = error.response?.data?.message || 'Failed to generate recommendations'
        this.lastError = this.error
        
        // Return fallback recommendations
        return this.generateFallbackRecommendations(restaurants)
      } finally {
        this.recommendationsLoading = false
      }
    },
    
    // Analyze restaurant reviews
    async analyzeReviews(externalId, force = false) {
      if (!this.enableAI) return null
      
      // Check cache first
      if (!force) {
        const cached = this.getCachedAnalysis(`reviews-${externalId}`)
        if (cached) return cached
      }
      
      this.reviewAnalysisLoading = true
      
      try {
        // Use backend route that returns reviews with sentiment and generate a simple summary client-side
        const response = await axios.get(
          `${API_BASE_URL}/restaurants/${externalId}/reviews`
        )

        const reviews = response.data?.reviews || []
        const sentiment = reviews.map(r => r.sentiment).filter(Boolean)
        const summary = {
          overallSentiment: sentiment.length
            ? sentiment.reduce((acc, s) => ({
                score: acc.score + (s.score || 0),
                confidence: Math.min(1, (acc.confidence + (s.confidence || 0)) / 2),
                label: acc.label
              }), { score: 0, confidence: 0.7, label: 'neutral', keywords: [] })
            : { score: 0, confidence: 0.7, label: 'neutral', keywords: [] },
          commonPraises: [],
          commonComplaints: [],
          topMentions: [],
          recommendationStatus: 'mixed'
        }

        // Store in state
        this.reviewSummaries.set(externalId, summary)
        this.sentimentAnalysis.set(externalId, sentiment)

        // Cache the result
        this.analysisCache.set(`reviews-${externalId}`, {
          data: { summary, sentiment },
          timestamp: Date.now()
        })
        
        return response.data
        
      } catch (error) {
        console.error('Error analyzing reviews:', error)
        this.error = error.response?.data?.message || 'Failed to analyze reviews'
        throw error
      } finally {
        this.reviewAnalysisLoading = false
      }
    },
    
    // Analyze menu for dietary restrictions
    async analyzeMenuForDietary(externalId, dietaryRestrictions = null) {
      if (!this.enableAI) return null
      
      const restrictions = dietaryRestrictions || this.activeDietaryRestrictions
      if (!restrictions.length) return null
      
      // Check cache
      const cacheKey = `menu-dietary-${externalId}-${restrictions.map(r => r.id).join(',')}`
      const cached = this.getCachedAnalysis(cacheKey)
      if (cached) return cached
      
      this.menuAnalysisLoading = true
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/restaurants/${externalId}/analyze-menu`,
          {
            dietaryRestrictions: restrictions,
            language: this.analysisLanguage
          }
        )
        
        const analysis = response.data
        
        // Store in state
        this.menuAnalysis.set(externalId, analysis.menuAnalysis)
        this.dietaryCompatibility.set(externalId, analysis.compatibility)
        
        // Cache the result
        this.analysisCache.set(cacheKey, {
          data: analysis,
          timestamp: Date.now()
        })
        
        return analysis
        
      } catch (error) {
        console.error('Error analyzing menu:', error)
        this.error = error.response?.data?.message || 'Failed to analyze menu'
        throw error
      } finally {
        this.menuAnalysisLoading = false
      }
    },
    
    // Chat with AI assistant
    async sendChatMessage(message, context = {}) {
      if (!this.enableAI) return null
      
      this.chatLoading = true
      
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        type: 'user',
        message,
        timestamp: Date.now()
      }
      this.chatMessages.push(userMessage)
      
      try {
        const response = await axios.post(`${API_BASE_URL}/ai/chat`, {
          message,
          context,
          userPreferences: this.userPreferences,
          chatHistory: this.recentChatMessages.slice(-10)
        })
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          message: response.data.message,
          suggestions: response.data.suggestions || [],
          data: response.data.data,
          timestamp: Date.now()
        }
        
        this.chatMessages.push(aiMessage)
        this.chatSuggestions = response.data.suggestions || []
        
        // Track interaction
        this.interactionHistory.push({
          type: 'chat',
          input: message,
          output: response.data.message,
          timestamp: Date.now()
        })
        
        return response.data
        
      } catch (error) {
        console.error('Error in AI chat:', error)
        this.error = error.response?.data?.message || 'Failed to process message'
        
        // Add error message to chat
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now()
        }
        this.chatMessages.push(errorMessage)
        
        throw error
      } finally {
        this.chatLoading = false
      }
    },
    
    // Update user preferences
    async updateUserPreferences(preferences) {
      this.userPreferences = { ...this.userPreferences, ...preferences }
      
      // Track preference changes
      this.preferenceHistory.push({
        preferences: { ...this.userPreferences },
        timestamp: Date.now()
      })
      
      // Sync with backend if enabled
      if (this.usePersonalization) {
        try {
          await axios.post(`${API_BASE_URL}/ai/preferences`, this.userPreferences)
        } catch (error) {
          console.error('Error syncing preferences:', error)
        }
      }
    },
    
    // Add dietary restriction
    addDietaryRestriction(restriction) {
      if (!this.userPreferences.dietaryRestrictions.some(r => r.id === restriction.id)) {
        this.userPreferences.dietaryRestrictions.push(restriction)
        this.updateUserPreferences({})
      }
    },
    
    // Remove dietary restriction
    removeDietaryRestriction(restrictionId) {
      this.userPreferences.dietaryRestrictions = this.userPreferences.dietaryRestrictions
        .filter(r => r.id !== restrictionId)
      this.updateUserPreferences({})
    },
    
    // Generate dining suggestions
    async generateDiningSuggestions(occasion, partySize, preferences = {}) {
      if (!this.enableAI) return []
      
      this.recommendationsLoading = true
      
      try {
        const response = await axios.post(`${API_BASE_URL}/ai/dining-suggestions`, {
          occasion,
          partySize,
          preferences: { ...this.userPreferences, ...preferences },
          location: preferences.location
        })
        
        return response.data.suggestions
        
      } catch (error) {
        console.error('Error generating dining suggestions:', error)
        this.error = error.response?.data?.message || 'Failed to generate suggestions'
        return []
      } finally {
        this.recommendationsLoading = false
      }
    },
    
    // Get restaurant insights
    async getRestaurantInsights(restaurantId) {
      if (!this.enableAI) return null
      
      const cacheKey = `insights-${restaurantId}`
      const cached = this.getCachedAnalysis(cacheKey)
      if (cached) return cached
      
      this.reviewAnalysisLoading = true
      
      try {
        const response = await axios.get(
          `${API_BASE_URL}/restaurants/${restaurantId}/insights`
        )
        
        const insights = response.data
        
        // Cache the result
        this.analysisCache.set(cacheKey, {
          data: insights,
          timestamp: Date.now()
        })
        
        return insights
        
      } catch (error) {
        console.error('Error getting restaurant insights:', error)
        this.error = error.response?.data?.message || 'Failed to get insights'
        throw error
      } finally {
        this.reviewAnalysisLoading = false
      }
    },
    
    // Fallback recommendations (when AI is unavailable)
    generateFallbackRecommendations(restaurants) {
      // Simple recommendation logic based on rating and popularity
      const recommendations = restaurants
        .filter(r => r.rating >= 4.0)
        .sort((a, b) => {
          // Sort by rating * review count (popularity score)
          const scoreA = (a.rating || 0) * (a.reviewCount || 0)
          const scoreB = (b.rating || 0) * (b.reviewCount || 0)
          return scoreB - scoreA
        })
        .slice(0, 5)
        .map(restaurant => ({
          id: `fallback-${restaurant.id}`,
          restaurantId: restaurant.id,
          restaurant,
          type: 'popular',
          reason: 'Highly rated and popular',
          score: 0.8,
          personalized: false
        }))
      
      this.recommendations = recommendations
      return { recommendations }
    },
    
    // Clear chat history
    clearChatHistory() {
      this.chatMessages = []
      this.chatSuggestions = []
    },
    
    // Clear analysis cache
    clearAnalysisCache() {
      this.analysisCache.clear()
      this.reviewSummaries.clear()
      this.sentimentAnalysis.clear()
      this.menuAnalysis.clear()
      this.dietaryCompatibility.clear()
    },
    
    // Toggle AI features
    toggleAI(enabled) {
      this.enableAI = enabled
    },
    
    // Toggle personalization
    togglePersonalization(enabled) {
      this.usePersonalization = enabled
    },
    
    // Reset store
    resetStore() {
      this.recommendations = []
      this.personalizedRecommendations = []
      this.recommendationHistory = []
      this.chatMessages = []
      this.chatSuggestions = []
      this.error = null
      this.lastError = null
      this.clearAnalysisCache()
      this.interactionHistory = []
      this.preferenceHistory = []
    }
  },

  // Persist user preferences and settings
  persist: {
    key: 'ai-store',
    // Guard localStorage for SSR; use no-op storage on server
    storage: typeof window !== 'undefined' ? window.localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    pick: [
      'userPreferences',
      'enableAI',
      'usePersonalization',
      'analysisLanguage',
      'chatMessages',
      'interactionHistory',
      'preferenceHistory'
    ]
  }
})
