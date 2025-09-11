<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with Search -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <RestaurantSearchBar 
          @search="handleSearch"
          @location-change="handleLocationChange"
        />
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex h-[calc(100vh-88px)]">
      <!-- Results Sidebar -->
      <div 
        class="bg-white border-r border-gray-200 overflow-hidden transition-all duration-300"
        :class="[
          showResults ? (isMapView ? 'w-96' : 'w-full') : 'w-0',
          !showResults && 'border-r-0'
        ]"
      >
        <!-- Results Header -->
        <div class="p-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                {{ searchResults.length }} restaurants found
              </h2>
              <p v-if="searchQuery" class="text-sm text-gray-600">
                for "{{ searchQuery }}" {{ searchLocation ? `in ${searchLocation}` : '' }}
              </p>
            </div>
            
            <!-- View Toggle -->
            <div class="flex items-center space-x-2">
              <div class="bg-white rounded-lg border border-gray-300 p-1 flex">
                <button
                  @click="toggleView('list')"
                  :class="[
                    'p-2 rounded text-sm font-medium transition-colors',
                    !isMapView ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  ]"
                >
                  <ListBulletIcon class="h-4 w-4" />
                </button>
                <button
                  @click="toggleView('map')"
                  :class="[
                    'p-2 rounded text-sm font-medium transition-colors',
                    isMapView ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  ]"
                >
                  <MapIcon class="h-4 w-4" />
                </button>
                <button
                  @click="toggleView('split')"
                  :class="[
                    'p-2 rounded text-sm font-medium transition-colors',
                    isMapView && showResults ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  ]"
                >
                  <Squares2X2Icon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Sort and Filter Controls -->
          <div class="flex items-center justify-between">
            <!-- Sort Dropdown -->
            <div class="relative">
              <select 
                v-model="sortBy" 
                @change="handleSortChange"
                class="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="relevance">Relevance</option>
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="review_count">Most Reviewed</option>
                <option value="price">Price</option>
              </select>
            </div>
            
            <!-- Active Filters -->
            <div class="flex items-center space-x-2">
              <span 
                v-if="hasActiveFilters" 
                class="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full"
              >
                {{ activeFiltersCount }} filters active
              </span>
            </div>
          </div>
        </div>
        
        <!-- Results List -->
        <div class="flex-1 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="searchLoading" class="p-4">
            <div class="space-y-4">
              <div v-for="i in 5" :key="i" class="animate-pulse">
                <div class="h-48 bg-gray-200 rounded-lg mb-4"></div>
              </div>
            </div>
          </div>
          
          <!-- No Results -->
          <div v-else-if="!searchLoading && searchResults.length === 0" class="p-8 text-center">
            <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-4 text-lg font-medium text-gray-900">No restaurants found</h3>
            <p class="mt-2 text-gray-500">Try adjusting your search or filters</p>
          </div>
          
          <!-- Results -->
          <div v-else class="divide-y divide-gray-200">
            <div 
              v-for="restaurant in paginatedResults" 
              :key="restaurant.id"
              class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              :class="{ 'bg-blue-50 border-l-4 border-blue-500': selectedRestaurantId === restaurant.id }"
              @click="selectRestaurant(restaurant)"
            >
              <RestaurantCard 
                :restaurant="restaurant"
                :distance="getDistanceText(restaurant)"
                @view-details="viewRestaurantDetails"
                @edit="editRestaurant"
                @delete="deleteRestaurant"
                @add-to-list="addToFavorites"
                @toggle-favorite="toggleFavorite"
              />
            </div>
          </div>
          
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="p-4 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {{ (currentPage - 1) * pageSize + 1 }} to 
                {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }} results
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="previousPage"
                  :disabled="currentPage === 1"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span class="px-3 py-2 text-sm font-medium text-gray-900">
                  {{ currentPage }} of {{ totalPages }}
                </span>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Map View -->
      <div 
        v-show="isMapView" 
        class="flex-1 relative"
      >
        <RestaurantMapView
          :restaurants="searchResults"
          :loading="searchLoading"
          :selected-restaurant-id="selectedRestaurantId"
          @restaurant-select="selectRestaurant"
          @view-details="viewRestaurantDetails"
          @area-search="handleAreaSearch"
          @bounds-change="handleMapBoundsChange"
          @location-change="handleLocationChange"
        />
        
        <!-- Map Overlay Controls -->
        <div class="absolute top-4 left-4 z-20">
          <button
            v-if="isMapView && showResults"
            @click="toggleSidebar"
            class="bg-white rounded-lg shadow-md p-2 text-gray-700 hover:bg-gray-50"
          >
            <Bars3Icon v-if="showResults" class="h-5 w-5" />
            <XMarkIcon v-else class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- AI Recommendations Panel -->
    <div 
      v-if="showRecommendations && recommendations.length > 0" 
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 max-h-64 overflow-hidden"
    >
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <SparklesIcon class="h-5 w-5 text-primary-600" />
            <h3 class="font-medium text-gray-900">AI Recommendations</h3>
          </div>
          <button
            @click="showRecommendations = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        
        <div class="flex space-x-4 overflow-x-auto pb-2">
          <div 
            v-for="recommendation in recommendations.slice(0, 5)" 
            :key="recommendation.id"
            class="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100"
            @click="selectRestaurant(recommendation.restaurant)"
          >
            <div class="flex items-start space-x-3">
              <img
                v-if="recommendation.restaurant.photos?.length"
                :src="recommendation.restaurant.photos[0]"
                :alt="recommendation.restaurant.name"
                class="w-12 h-12 rounded-lg object-cover"
              />
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-900 truncate">
                  {{ recommendation.restaurant.name }}
                </h4>
                <p class="text-xs text-gray-600 mt-1">
                  {{ recommendation.reason }}
                </p>
                <div class="flex items-center mt-1">
                  <StarIcon class="w-3 h-3 text-yellow-400 fill-current" />
                  <span class="ml-1 text-xs text-gray-600">
                    {{ recommendation.restaurant.rating }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Restaurant Detail Modal -->
    <RestaurantDetailModal
      v-if="showDetailModal"
      :restaurant="selectedRestaurant"
      :show="showDetailModal"
      @close="closeDetailModal"
      @edit="editRestaurant"
      @delete="deleteRestaurant"
      @add-to-favorites="addToFavorites"
    />
  </div>
</template>

<script setup>
import { 
  MagnifyingGlassIcon, 
  MapIcon, 
  ListBulletIcon,
  Squares2X2Icon,
  Bars3Icon,
  XMarkIcon,
  StarIcon,
  SparklesIcon
} from '@heroicons/vue/24/outline'

// Stores
const restaurantStore = useRestaurantStore()
const favoriteStore = useFavoriteStore()  
const aiStore = useAIStore()

// Page meta
definePageMeta({
  title: 'Discover Restaurants',
  description: 'Discover and explore restaurants near you'
})

// Reactive data
const isMapView = ref(false)
const showResults = ref(true)
const showRecommendations = ref(true)
const showDetailModal = ref(false)
const selectedRestaurant = ref(null)

// Computed properties from stores
const searchResults = computed(() => restaurantStore.restaurants)
const searchLoading = computed(() => restaurantStore.searchLoading)
const searchQuery = computed(() => restaurantStore.searchQuery)
const searchLocation = computed(() => restaurantStore.searchLocation)
const hasActiveFilters = computed(() => restaurantStore.hasActiveFilters)
const activeFiltersCount = computed(() => {
  let count = 0
  if (restaurantStore.searchFilters.cuisines.length > 0) count++
  if (restaurantStore.searchFilters.priceRange.length > 0) count++
  if (restaurantStore.searchFilters.openNow) count++
  if (restaurantStore.searchFilters.rating) count++
  if (restaurantStore.searchFilters.distance) count++
  return count
})

const selectedRestaurantId = computed(() => restaurantStore.selectedRestaurantId)
const currentPage = computed(() => restaurantStore.currentPage)
const totalPages = computed(() => restaurantStore.totalPages)
const totalCount = computed(() => restaurantStore.totalCount)
const pageSize = computed(() => restaurantStore.pageSize)
const recommendations = computed(() => aiStore.recommendations)

// Local reactive data
const sortBy = ref('relevance')

// Pagination
const paginatedResults = computed(() => {
  // Results are already paginated from the API
  return searchResults.value
})

// Methods
const handleSearch = async (searchParams) => {
  try {
    showResults.value = true
    await restaurantStore.searchRestaurants({
      query: searchParams.query,
      location: searchParams.location,
      filters: {
        cuisines: searchParams.cuisines || [],
        priceRange: searchParams.prices || [],
        openNow: searchParams.openNow || false,
        distance: searchParams.distance || null,
        rating: searchParams.minRating || null,
        sortBy: sortBy.value
      }
    })
    
    // Generate AI recommendations if enabled
    if (aiStore.enableAI && searchResults.value.length > 0) {
      await aiStore.generateRecommendations(searchResults.value, {
        searchQuery: searchParams.query,
        location: searchParams.location
      })
    }
    
  } catch (error) {
    console.error('Search error:', error)
  }
}

const handleLocationChange = (location) => {
  restaurantStore.setUserLocation(location)
}

const handleAreaSearch = (searchData) => {
  handleSearch({
    query: searchData.query,
    location: `${searchData.center.lat},${searchData.center.lng}`,
    radius: searchData.radius
  })
}

const handleMapBoundsChange = (bounds) => {
  restaurantStore.setMapBounds(bounds)
}

const handleSortChange = () => {
  if (searchQuery.value || searchLocation.value) {
    handleSearch({
      query: searchQuery.value,
      location: searchLocation.value,
      sortBy: sortBy.value
    })
  }
}

const selectRestaurant = (restaurant) => {
  restaurantStore.selectRestaurant(restaurant.id)
}

const toggleView = (view) => {
  if (view === 'list') {
    isMapView.value = false
    showResults.value = true
  } else if (view === 'map') {
    isMapView.value = true
    showResults.value = false
  } else if (view === 'split') {
    isMapView.value = true
    showResults.value = true
  }
}

const toggleSidebar = () => {
  showResults.value = !showResults.value
}

const viewRestaurantDetails = (restaurant) => {
  selectedRestaurant.value = restaurant
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedRestaurant.value = null
}

const editRestaurant = (restaurant) => {
  // Navigate to edit page or open edit modal
  navigateTo(`/restaurants/${restaurant.id}/edit`)
}

const deleteRestaurant = async (restaurant) => {
  if (confirm('Are you sure you want to delete this restaurant?')) {
    try {
      await restaurantStore.deleteRestaurant(restaurant.id)
      // Remove from current results
      await handleSearch({
        query: searchQuery.value,
        location: searchLocation.value
      })
    } catch (error) {
      console.error('Delete error:', error)
    }
  }
}

const addToFavorites = async (restaurant) => {
  try {
    await favoriteStore.addFavorite(restaurant.id)
  } catch (error) {
    console.error('Add to favorites error:', error)
  }
}

const toggleFavorite = async (restaurant, isFavorite) => {
  try {
    await favoriteStore.toggleFavorite(restaurant)
  } catch (error) {
    console.error('Toggle favorite error:', error)
  }
}

const getDistanceText = (restaurant) => {
  if (!restaurant.distance) return null
  
  const distance = restaurant.distance
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  } else {
    return `${(distance / 1000).toFixed(1)}km`
  }
}

// Pagination methods
const nextPage = () => {
  restaurantStore.nextPage()
}

const previousPage = () => {
  restaurantStore.previousPage()
}

// Lifecycle
onMounted(async () => {
  // Load trending restaurants on page load
  try {
    await restaurantStore.getTrendingRestaurants()
    showResults.value = true
  } catch (error) {
    console.error('Error loading initial data:', error)
  }
})
</script>

<style scoped>
/* Custom scrollbar for results list */
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

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Loading animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>