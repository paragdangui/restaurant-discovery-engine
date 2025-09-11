<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="$emit('close')"
    >
      <div class="flex min-h-screen items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          @click="$emit('close')"
        ></div>
        
        <!-- Modal Content -->
        <div
          class="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h2 class="text-xl font-semibold text-gray-900 truncate">
                  {{ restaurant?.name }}
                </h2>
                <div class="flex items-center mt-1 space-x-4">
                  <div v-if="restaurant?.rating" class="flex items-center">
                    <div class="flex items-center">
                      <StarIcon class="w-4 h-4 text-yellow-400 fill-current" />
                      <span class="ml-1 text-sm font-medium text-gray-900">{{ restaurant.rating }}</span>
                    </div>
                    <span v-if="restaurant.reviewCount" class="ml-1 text-xs text-gray-500">
                      ({{ restaurant.reviewCount }} reviews)
                    </span>
                  </div>
                  <span v-if="restaurant?.priceLevel" class="text-sm text-gray-600">
                    {{ '$'.repeat(restaurant.priceLevel) }}
                  </span>
                  <span 
                    v-if="restaurant?.categories && restaurant.categories.length > 0" 
                    class="text-sm text-gray-600"
                  >
                    {{ formatCategories(restaurant.categories) }}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center space-x-2 ml-4">
                <!-- Action Buttons -->
                <button
                  @click="toggleFavorite"
                  :class="[
                    'p-2 rounded-full transition-colors',
                    isFavorite ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:text-red-500'
                  ]"
                >
                  <HeartIcon :class="['w-5 h-5', isFavorite ? 'fill-current' : '']" />
                </button>
                
                <button
                  @click="shareRestaurant"
                  class="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ShareIcon class="w-5 h-5" />
                </button>
                
                <button
                  @click="$emit('close')"
                  class="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Content -->
          <div class="overflow-y-auto max-h-[calc(90vh-80px)]">
            <!-- Image Gallery -->
            <div v-if="restaurant?.photos && restaurant.photos.length > 0" class="relative">
              <div class="h-64 md:h-80 overflow-hidden">
                <img
                  :src="currentPhoto"
                  :alt="restaurant.name"
                  class="w-full h-full object-cover"
                />
              </div>
              
              <!-- Photo Navigation -->
              <div v-if="restaurant.photos.length > 1" class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div class="flex space-x-2">
                  <button
                    v-for="(photo, index) in restaurant.photos.slice(0, 5)"
                    :key="index"
                    @click="currentPhotoIndex = index"
                    :class="[
                      'w-3 h-3 rounded-full transition-colors',
                      currentPhotoIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'
                    ]"
                  />
                </div>
              </div>
              
              <!-- Photo Counter -->
              <div class="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {{ currentPhotoIndex + 1 }} / {{ restaurant.photos.length }}
              </div>
            </div>
            
            <div class="p-6 space-y-6">
              <!-- Status and Quick Info -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <span 
                    v-if="restaurant?.isClosed" 
                    class="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full"
                  >
                    Closed
                  </span>
                  <span 
                    v-else-if="isOpenNow" 
                    class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
                  >
                    Open Now
                  </span>
                  
                  <span v-if="distance" class="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                    {{ distance }}
                  </span>
                </div>
                
                <div class="flex space-x-2">
                  <button
                    v-if="restaurant?.url"
                    @click="openYelp"
                    class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View on Yelp
                  </button>
                  <button
                    @click="getDirections"
                    class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
              
              <!-- Description -->
              <div v-if="restaurant?.description">
                <h3 class="text-lg font-medium text-gray-900 mb-2">About</h3>
                <p class="text-gray-600">{{ restaurant.description }}</p>
              </div>
              
              <!-- Contact Information -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">Contact & Location</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Address -->
                  <div class="flex items-start space-x-3">
                    <MapPinIcon class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p class="text-sm font-medium text-gray-900">Address</p>
                      <p class="text-sm text-gray-600">{{ restaurant?.address }}</p>
                    </div>
                  </div>
                  
                  <!-- Phone -->
                  <div v-if="restaurant?.phone" class="flex items-start space-x-3">
                    <PhoneIcon class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p class="text-sm font-medium text-gray-900">Phone</p>
                      <a :href="`tel:${restaurant.phone}`" class="text-sm text-primary-600 hover:text-primary-700">
                        {{ restaurant.phone }}
                      </a>
                    </div>
                  </div>
                  
                  <!-- Website -->
                  <div v-if="restaurant?.website" class="flex items-start space-x-3">
                    <GlobeAltIcon class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p class="text-sm font-medium text-gray-900">Website</p>
                      <a 
                        :href="restaurant.website" 
                        target="_blank"
                        class="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                  
                  <!-- Hours -->
                  <div v-if="restaurant?.hours && restaurant.hours.length > 0" class="flex items-start space-x-3">
                    <ClockIcon class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p class="text-sm font-medium text-gray-900">Hours</p>
                      <div class="text-sm text-gray-600">
                        <p v-if="todayHours">
                          Today: {{ formatHours(todayHours) }}
                        </p>
                        <button
                          @click="showAllHours = !showAllHours"
                          class="text-primary-600 hover:text-primary-700 mt-1"
                        >
                          {{ showAllHours ? 'Hide' : 'Show all hours' }}
                        </button>
                        <div v-if="showAllHours" class="mt-2 space-y-1">
                          <div v-for="(hours, index) in restaurant.hours" :key="index">
                            <span class="font-medium">{{ getDayName(hours.day) }}:</span>
                            {{ formatHours(hours) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Features -->
              <div v-if="restaurant?.transactions && restaurant.transactions.length > 0">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Services</h3>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="transaction in restaurant.transactions" 
                    :key="transaction"
                    class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                  >
                    {{ formatTransaction(transaction) }}
                  </span>
                </div>
              </div>
              
              <!-- AI Insights -->
              <div v-if="aiInsights" class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-3">
                  <SparklesIcon class="w-5 h-5 text-purple-600" />
                  <h3 class="text-lg font-medium text-gray-900">AI Insights</h3>
                </div>
                
                <!-- Review Summary -->
                <div v-if="aiInsights.reviewSummary" class="mb-4">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">What customers are saying</h4>
                  <p class="text-sm text-gray-600">{{ aiInsights.reviewSummary }}</p>
                </div>
                
                <!-- Dietary Compatibility -->
                <div v-if="aiInsights.dietaryCompatibility" class="mb-4">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Dietary Options</h4>
                  <div class="flex flex-wrap gap-2">
                    <span 
                      v-for="diet in aiInsights.dietaryCompatibility" 
                      :key="diet"
                      class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                    >
                      {{ diet }}
                    </span>
                  </div>
                </div>
                
                <!-- Best Time to Visit -->
                <div v-if="aiInsights.bestTime" class="mb-4">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Best time to visit</h4>
                  <p class="text-sm text-gray-600">{{ aiInsights.bestTime }}</p>
                </div>
                
                <!-- Recommendations -->
                <div v-if="aiInsights.recommendations && aiInsights.recommendations.length > 0">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Recommended dishes</h4>
                  <div class="flex flex-wrap gap-2">
                    <span 
                      v-for="dish in aiInsights.recommendations" 
                      :key="dish"
                      class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                    >
                      {{ dish }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Recent Reviews -->
              <div v-if="recentReviews && recentReviews.length > 0">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Reviews</h3>
                <div class="space-y-4">
                  <div 
                    v-for="review in recentReviews.slice(0, 3)" 
                    :key="review.id"
                    class="border border-gray-200 rounded-lg p-4"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-2">
                        <img 
                          v-if="review.user?.imageUrl"
                          :src="review.user.imageUrl" 
                          :alt="review.user.name"
                          class="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ review.user?.name || 'Anonymous' }}</p>
                          <div class="flex items-center">
                            <div class="flex">
                              <StarIcon 
                                v-for="i in 5" 
                                :key="i"
                                :class="[
                                  'w-3 h-3',
                                  i <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                ]" 
                              />
                            </div>
                            <span class="ml-2 text-xs text-gray-500">
                              {{ formatReviewDate(review.timeCreated) }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p class="text-sm text-gray-600">{{ review.text }}</p>
                  </div>
                </div>
                
                <button
                  v-if="restaurant?.reviewCount > 3"
                  @click="viewAllReviews"
                  class="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all {{ restaurant.reviewCount }} reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { 
  XMarkIcon, 
  StarIcon, 
  HeartIcon, 
  ShareIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  GlobeAltIcon,
  SparklesIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  restaurant: {
    type: Object,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  },
  distance: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'edit', 'delete', 'add-to-favorites'])

// Stores
const favoriteStore = useFavoriteStore()
const aiStore = useAIStore()

// Reactive data
const currentPhotoIndex = ref(0)
const showAllHours = ref(false)
const isFavorite = ref(false)
const aiInsights = ref(null)
const recentReviews = ref([])

// Computed properties
const currentPhoto = computed(() => {
  if (!props.restaurant?.photos || props.restaurant.photos.length === 0) return null
  return props.restaurant.photos[currentPhotoIndex.value]
})

const isOpenNow = computed(() => {
  if (!props.restaurant?.hours) return false
  return !props.restaurant.isClosed
})

const todayHours = computed(() => {
  if (!props.restaurant?.hours) return null
  const today = new Date().getDay()
  return props.restaurant.hours.find(h => h.day === today)
})

// Methods
const formatCategories = (categories) => {
  return categories.map(cat => cat.title).slice(0, 3).join(', ')
}

const formatTransaction = (transaction) => {
  const transactionMap = {
    pickup: 'Pickup',
    delivery: 'Delivery',
    restaurant_reservation: 'Reservations'
  }
  return transactionMap[transaction] || transaction
}

const formatHours = (hours) => {
  if (!hours.isOpenNow) return 'Closed'
  if (hours.start && hours.end) {
    return `${hours.start} - ${hours.end}`
  }
  return 'Open'
}

const getDayName = (dayIndex) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayIndex] || 'Unknown'
}

const formatReviewDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const toggleFavorite = async () => {
  try {
    await favoriteStore.toggleFavorite(props.restaurant)
    isFavorite.value = favoriteStore.isFavorite(props.restaurant.id)
  } catch (error) {
    console.error('Error toggling favorite:', error)
  }
}

const shareRestaurant = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.restaurant.name,
        text: `Check out ${props.restaurant.name}`,
        url: props.restaurant.url || window.location.href
      })
    } catch (error) {
      console.log('Error sharing:', error)
    }
  } else {
    // Fallback to clipboard
    const text = `${props.restaurant.name} - ${props.restaurant.address}`
    navigator.clipboard.writeText(text)
  }
}

const openYelp = () => {
  if (props.restaurant?.url) {
    window.open(props.restaurant.url, '_blank')
  }
}

const getDirections = () => {
  if (props.restaurant?.latitude && props.restaurant?.longitude) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${props.restaurant.latitude},${props.restaurant.longitude}`
    window.open(url, '_blank')
  }
}

const viewAllReviews = () => {
  // Navigate to reviews page or open reviews modal
  if (props.restaurant?.url) {
    window.open(props.restaurant.url, '_blank')
  }
}

const loadAIInsights = async () => {
  if (!aiStore.enableAI || !props.restaurant) return
  
  try {
    const insights = await aiStore.getRestaurantInsights(props.restaurant.id)
    aiInsights.value = insights
  } catch (error) {
    console.error('Error loading AI insights:', error)
  }
}

const loadRecentReviews = async () => {
  if (!props.restaurant?.yelpId) return
  
  try {
    // This would call the backend API to get recent reviews
    // For now, we'll use mock data
    recentReviews.value = []
  } catch (error) {
    console.error('Error loading reviews:', error)
  }
}

// Watch for restaurant changes
watch(() => props.restaurant, async (newRestaurant) => {
  if (newRestaurant) {
    currentPhotoIndex.value = 0
    showAllHours.value = false
    isFavorite.value = favoriteStore.isFavorite(newRestaurant.id)
    
    // Load additional data
    await Promise.all([
      loadAIInsights(),
      loadRecentReviews()
    ])
  }
}, { immediate: true })

// Handle escape key removed for build compatibility
</script>

<style scoped>
/* Modal animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Prevent body scroll when modal is open */
body:has(.modal-open) {
  overflow: hidden;
}

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>