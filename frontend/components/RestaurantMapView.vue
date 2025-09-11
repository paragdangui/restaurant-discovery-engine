<template>
  <div class="relative w-full h-full">
    <!-- Map Container -->
    <div class="w-full h-full" ref="mapContainer">
      <GoogleMap
        :api-key="mapApiKey"
        :center="mapCenter"
        :zoom="mapZoom"
        :options="mapOptions"
        @ready="onMapReady"
        @click="onMapClick"
        class="w-full h-full"
      >
        <!-- Restaurant Markers -->
        <Marker
          v-for="restaurant in visibleRestaurants"
          :key="restaurant.id"
          :position="{ lat: restaurant.latitude, lng: restaurant.longitude }"
          :options="getMarkerOptions(restaurant)"
          @click="selectRestaurant(restaurant)"
        />
        
        <!-- User Location Marker -->
        <Marker
          v-if="userLocation"
          :position="userLocation"
          :options="userLocationMarkerOptions"
        />
        
        <!-- Search Area Circle -->
        <Circle
          v-if="searchArea"
          :center="searchArea.center"
          :radius="searchArea.radius"
          :options="circleOptions"
        />
        
        <!-- Info Window for Selected Restaurant -->
        <InfoWindow
          v-if="selectedRestaurant && selectedRestaurantPosition"
          :position="selectedRestaurantPosition"
          :options="infoWindowOptions"
          @closeclick="closeInfoWindow"
        >
          <div class="p-3 min-w-[280px]">
            <div class="flex items-start space-x-3">
              <img
                v-if="selectedRestaurant.photos && selectedRestaurant.photos.length > 0"
                :src="selectedRestaurant.photos[0]"
                :alt="selectedRestaurant.name"
                class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 text-sm truncate">
                  {{ selectedRestaurant.name }}
                </h3>
                <div class="flex items-center mt-1">
                  <div class="flex items-center">
                    <StarIcon class="w-4 h-4 text-yellow-400 fill-current" />
                    <span class="ml-1 text-sm text-gray-600">{{ selectedRestaurant.rating }}</span>
                  </div>
                  <span class="mx-2 text-gray-300">•</span>
                  <span class="text-sm text-gray-600">{{ formatPrice(selectedRestaurant.priceLevel) }}</span>
                </div>
                <p class="text-xs text-gray-500 mt-1 truncate">
                  {{ selectedRestaurant.address }}
                </p>
              </div>
            </div>
            <div class="mt-3 flex space-x-2">
              <button
                @click="$emit('view-details', selectedRestaurant)"
                class="flex-1 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700"
              >
                View Details
              </button>
              <button
                @click="getDirections(selectedRestaurant)"
                class="px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50"
              >
                Directions
              </button>
            </div>
          </div>
        </InfoWindow>
      </GoogleMap>
    </div>
    
    <!-- Map Controls -->
    <div class="absolute top-4 right-4 flex flex-col space-y-2">
      <!-- Map Type Toggle -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          v-for="type in mapTypes"
          :key="type.value"
          @click="changeMapType(type.value)"
          :class="[
            'w-full px-3 py-2 text-xs font-medium transition-colors',
            currentMapType === type.value
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          {{ type.label }}
        </button>
      </div>
      
      <!-- Zoom Controls -->
      <div class="bg-white rounded-lg shadow-md">
        <button
          @click="zoomIn"
          class="block w-full px-3 py-2 text-gray-700 hover:bg-gray-50 text-lg font-bold border-b border-gray-200"
        >
          +
        </button>
        <button
          @click="zoomOut"
          class="block w-full px-3 py-2 text-gray-700 hover:bg-gray-50 text-lg font-bold"
        >
          −
        </button>
      </div>
      
      <!-- Current Location Button -->
      <button
        @click="centerOnUserLocation"
        :disabled="locationLoading"
        class="bg-white rounded-lg shadow-md p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <component
          :is="locationLoading ? 'div' : 'MapPinIcon'"
          :class="locationLoading ? 'animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full' : 'h-5 w-5'"
        />
      </button>
    </div>
    
    <!-- Floating Search Box -->
    <div v-if="showFloatingSearch" class="absolute top-4 left-4 right-20 z-10">
      <div class="bg-white rounded-lg shadow-lg p-3">
        <div class="flex items-center space-x-2">
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            v-model="floatingSearchQuery"
            type="text"
            placeholder="Search this area..."
            class="flex-1 outline-none text-sm"
            @keyup.enter="searchInArea"
          />
          <button
            @click="searchInArea"
            class="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700"
          >
            Search
          </button>
        </div>
      </div>
    </div>
    
    <!-- Map Legend -->
    <div v-if="showLegend" class="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
      <h4 class="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span class="text-xs text-gray-600">Premium ($$$+)</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-xs text-gray-600">Moderate ($$)</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-xs text-gray-600">Budget ($)</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span class="text-xs text-gray-600">Your Location</span>
        </div>
      </div>
    </div>
    
    <!-- Cluster Info -->
    <div v-if="clusterInfo" class="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3">
      <div class="text-xs text-gray-600">
        Showing {{ visibleRestaurants.length }} of {{ totalRestaurants }} restaurants
      </div>
      <div v-if="searchArea" class="text-xs text-gray-500 mt-1">
        Within {{ (searchArea.radius / 1000).toFixed(1) }}km of search center
      </div>
    </div>
  </div>
</template>

<script setup>
import { GoogleMap, Marker, InfoWindow, Circle } from 'vue3-google-map';
import { 
  StarIcon, 
  MapPinIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/vue/24/outline';

const props = defineProps({
  restaurants: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedRestaurantId: {
    type: [String, Number],
    default: null
  },
  showFloatingSearch: {
    type: Boolean,
    default: true
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  searchRadius: {
    type: Number,
    default: 5000
  }
});

const emit = defineEmits([
  'restaurant-select', 
  'view-details', 
  'area-search', 
  'bounds-change',
  'location-change'
]);

// Reactive data
const mapContainer = ref(null);
const map = ref(null);
const mapCenter = ref({ lat: 40.7589, lng: -73.9851 }); // Default to NYC
const mapZoom = ref(13);
const currentMapType = ref('roadmap');
const userLocation = ref(null);
const locationLoading = ref(false);
const searchArea = ref(null);
const floatingSearchQuery = ref('');
const selectedRestaurant = ref(null);
const selectedRestaurantPosition = ref(null);

// Configuration
const mapApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const mapTypes = [
  { value: 'roadmap', label: 'Map' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'hybrid', label: 'Hybrid' }
];

const userLocationMarkerOptions = {
  icon: {
    path: google?.maps?.SymbolPath?.CIRCLE || 0,
    scale: 8,
    fillColor: '#4F46E5',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2
  }
};

const circleOptions = {
  fillColor: '#4F46E5',
  fillOpacity: 0.1,
  strokeColor: '#4F46E5',
  strokeOpacity: 0.3,
  strokeWeight: 1
};

const infoWindowOptions = {
  pixelOffset: (google?.maps?.Size ? new google.maps.Size(0, -30) : { width: 0, height: -30 })
};

// Computed properties
const visibleRestaurants = computed(() => {
  return props.restaurants.filter(restaurant => 
    restaurant.latitude && 
    restaurant.longitude &&
    restaurant.latitude !== 0 &&
    restaurant.longitude !== 0
  );
});

const totalRestaurants = computed(() => props.restaurants.length);

const clusterInfo = computed(() => ({
  visible: visibleRestaurants.value.length,
  total: totalRestaurants.value
}));

// Methods
const getMarkerOptions = (restaurant) => {
  const priceLevel = restaurant.priceLevel || 1;
  let color = '#10B981'; // Green for budget
  
  if (priceLevel >= 4) color = '#DC2626'; // Red for premium
  else if (priceLevel >= 3) color = '#F59E0B'; // Orange for expensive
  else if (priceLevel >= 2) color = '#3B82F6'; // Blue for moderate
  
  return {
    icon: {
      path: google?.maps?.SymbolPath?.CIRCLE || 0,
      scale: 8,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2
    },
    title: restaurant.name
  };
};

const selectRestaurant = (restaurant) => {
  selectedRestaurant.value = restaurant;
  selectedRestaurantPosition.value = {
    lat: restaurant.latitude,
    lng: restaurant.longitude
  };
  emit('restaurant-select', restaurant);
};

const closeInfoWindow = () => {
  selectedRestaurant.value = null;
  selectedRestaurantPosition.value = null;
};

const formatPrice = (priceLevel) => {
  if (!priceLevel) return '';
  return '$'.repeat(priceLevel);
};

const onMapReady = (mapInstance) => {
  map.value = mapInstance;
  
  // Set up bounds change listener
  mapInstance.addListener('bounds_changed', () => {
    const bounds = mapInstance.getBounds();
    if (bounds) {
      emit('bounds-change', {
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
      });
    }
  });
  
  // Initialize user location
  getCurrentLocation();
};

const onMapClick = (event) => {
  closeInfoWindow();
};

const changeMapType = (type) => {
  currentMapType.value = type;
  if (map.value) {
    map.value.setMapTypeId(type);
  }
};

const zoomIn = () => {
  if (map.value) {
    mapZoom.value = Math.min(mapZoom.value + 1, 20);
    map.value.setZoom(mapZoom.value);
  }
};

const zoomOut = () => {
  if (map.value) {
    mapZoom.value = Math.max(mapZoom.value - 1, 1);
    map.value.setZoom(mapZoom.value);
  }
};

const getCurrentLocation = async () => {
  if (!navigator.geolocation) return;
  
  locationLoading.value = true;
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });
    
    const { latitude, longitude } = position.coords;
    userLocation.value = { lat: latitude, lng: longitude };
    emit('location-change', { lat: latitude, lng: longitude });
  } catch (error) {
    console.error('Error getting location:', error);
  } finally {
    locationLoading.value = false;
  }
};

const centerOnUserLocation = async () => {
  if (userLocation.value) {
    mapCenter.value = userLocation.value;
    if (map.value) {
      map.value.panTo(userLocation.value);
    }
  } else {
    await getCurrentLocation();
    if (userLocation.value) {
      mapCenter.value = userLocation.value;
      if (map.value) {
        map.value.panTo(userLocation.value);
      }
    }
  }
};

const searchInArea = () => {
  if (!map.value || !floatingSearchQuery.value.trim()) return;
  
  const center = map.value.getCenter();
  const bounds = map.value.getBounds();
  
  // Calculate approximate radius from bounds
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const radius = google?.maps?.geometry?.spherical?.computeDistanceBetween(
    center, ne
  ) || props.searchRadius;
  
  searchArea.value = {
    center: { lat: center.lat(), lng: center.lng() },
    radius: Math.min(radius, 25000) // Max 25km
  };
  
  emit('area-search', {
    query: floatingSearchQuery.value.trim(),
    center: searchArea.value.center,
    radius: searchArea.value.radius
  });
};

const getDirections = (restaurant) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
  window.open(url, '_blank');
};

// Watch for selected restaurant changes from parent
watch(() => props.selectedRestaurantId, (newId) => {
  if (newId) {
    const restaurant = visibleRestaurants.value.find(r => r.id === newId);
    if (restaurant) {
      selectRestaurant(restaurant);
      
      // Pan to restaurant
      const position = { lat: restaurant.latitude, lng: restaurant.longitude };
      mapCenter.value = position;
      if (map.value) {
        map.value.panTo(position);
      }
    }
  } else {
    closeInfoWindow();
  }
});

// Watch for restaurants changes and fit bounds
watch(() => props.restaurants, (newRestaurants) => {
  if (newRestaurants.length > 0 && map.value) {
    const bounds = new google.maps.LatLngBounds();
    
    // Include user location if available
    if (userLocation.value) {
      bounds.extend(userLocation.value);
    }
    
    // Include all restaurants
    visibleRestaurants.value.forEach(restaurant => {
      bounds.extend({ lat: restaurant.latitude, lng: restaurant.longitude });
    });
    
    // Only fit bounds if we have multiple points
    if (visibleRestaurants.value.length > 1 || userLocation.value) {
      map.value.fitBounds(bounds, { padding: 50 });
    }
  }
}, { immediate: true });

// Lifecycle
onMounted(() => {
  // Initialize search area if radius is provided
  if (props.searchRadius && userLocation.value) {
    searchArea.value = {
      center: userLocation.value,
      radius: props.searchRadius
    };
  }
});
</script>

<style scoped>
/* Map container needs explicit dimensions */
.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

/* Info window styling */
:deep(.gm-ui-hover-effect) {
  opacity: 0.6;
}

:deep(.gm-style-iw) {
  padding: 0;
}

:deep(.gm-style-iw-c) {
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

:deep(.gm-style-iw-d) {
  overflow: hidden !important;
}

/* Marker clustering styles */
:deep(.cluster) {
  background: #4F46E5;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

/* Control button hover states */
.map-controls button:hover {
  background-color: #f9fafb;
}

/* Floating search animation */
.floating-search-enter-active,
.floating-search-leave-active {
  transition: all 0.3s ease;
}

.floating-search-enter-from,
.floating-search-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>