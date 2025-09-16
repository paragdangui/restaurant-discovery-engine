<template>
  <div class="relative w-full h-full">
    <!-- Map Container -->
    <div class="w-full h-full" ref="mapContainer">
      <client-only>
        <l-map
          ref="map"
          :zoom="mapZoom"
          :center="mapCenter"
          @ready="onMapReady"
          @click="onMapClick"
          class="w-full h-full"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />

          <!-- Restaurant Markers -->
          <l-marker
            v-for="restaurant in visibleRestaurants"
            :key="restaurant.id"
            :lat-lng="[restaurant.latitude, restaurant.longitude]"
            @click="selectRestaurant(restaurant)"
          >
            <l-icon :icon-url="getMarkerIcon(restaurant)" :icon-size="[32, 32]" />
          </l-marker>

          <!-- User Location Marker -->
          <l-marker
            v-if="userLocation"
            :lat-lng="userLocation"
          >
            <l-icon :icon-url="userLocationIcon" :icon-size="[32, 32]" />
          </l-marker>

          <!-- Search Area Circle -->
          <l-circle
            v-if="searchArea"
            :lat-lng="searchArea.center"
            :radius="searchArea.radius"
            :color="circleOptions.color"
            :fill-color="circleOptions.fillColor"
            :fill-opacity="circleOptions.fillOpacity"
          />

          <!-- Info Window for Selected Restaurant -->
          <l-popup v-if="selectedRestaurant" :lat-lng="[selectedRestaurant.latitude, selectedRestaurant.longitude]">
            <div class="p-3 min-w-[280px]">
              <div class="flex items-start space-x-3">
                <img
                  v-if="selectedRestaurant.photos && selectedRestaurant.photos.length > 0"
                  :src="selectedRestaurant.photos[0]"
                  :alt="selectedRestaurant.name"
                  class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-surface-900 text-sm truncate">
                    {{ selectedRestaurant.name }}
                  </h3>
                  <div class="flex items-center mt-1">
                    <div class="flex items-center">
                      <StarIcon class="w-4 h-4 text-warning-400 fill-current" />
                      <span class="ml-1 text-sm text-surface-600">{{ selectedRestaurant.rating }}</span>
                    </div>
                    <span class="mx-2 text-surface-300">•</span>
                    <span class="text-sm text-surface-600">{{ formatPrice(selectedRestaurant.priceLevel) }}</span>
                  </div>
                  <p class="text-xs text-surface-500 mt-1 truncate">
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
                  class="px-3 py-2 border border-surface-300 text-surface-700 text-xs font-medium rounded hover:bg-surface-50"
                >
                  Directions
                </button>
              </div>
            </div>
          </l-popup>
        </l-map>
      </client-only>
    </div>

    <!-- Map Controls -->
    <div class="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
      <!-- Zoom Controls -->
      <div class="bg-white rounded-lg shadow-md">
        <button
          @click="zoomIn"
          class="block w-full px-3 py-2 text-surface-700 hover:bg-surface-50 text-lg font-bold border-b border-surface-200"
        >
          +
        </button>
        <button
          @click="zoomOut"
          class="block w-full px-3 py-2 text-surface-700 hover:bg-surface-50 text-lg font-bold"
        >
          −
        </button>
      </div>

      <!-- Current Location Button -->
      <button
        @click="centerOnUserLocation"
        :disabled="locationLoading"
        class="bg-white rounded-lg shadow-md p-2 text-surface-700 hover:bg-surface-50 disabled:opacity-50"
      >
        <component
          :is="locationLoading ? 'div' : 'MapPinIcon'"
          :class="locationLoading ? 'animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full' : 'h-5 w-5'"
        />
      </button>
    </div>

    <!-- Floating Search Box -->
    <div v-if="showFloatingSearch" class="absolute top-4 left-4 right-20 z-[1000]">
      <div class="bg-white rounded-lg shadow-lg p-3">
        <div class="flex items-center space-x-2">
          <MagnifyingGlassIcon class="h-5 w-5 text-surface-400 flex-shrink-0" />
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
    <div v-if="showLegend" class="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 z-[1000]">
      <h4 class="text-xs font-semibold text-surface-900 mb-2">Legend</h4>
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-error-500 rounded-full"></div>
          <span class="text-xs text-surface-600">Premium ($$$+)</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-info-500 rounded-full"></div>
          <span class="text-xs text-surface-600">Moderate ($$)</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-secondary-500 rounded-full"></div>
          <span class="text-xs text-surface-600">Budget ($)</span>
        </div>
        <div class="flex items-center space-x-2">
          <img :src="userLocationIcon" class="w-4 h-4" />
          <span class="text-xs text-surface-600">Your Location</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { StarIcon, MapPinIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import 'leaflet/dist/leaflet.css';
import { LMap, LTileLayer, LMarker, LPopup, LCircle, LIcon } from '@vue-leaflet/vue-leaflet';
// Important: do not import leaflet at module scope in SSR
// We'll lazy-load it on client inside onMounted
let Leaflet = null;

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
const mapCenter = ref([40.7589, -73.9851]); // Default to NYC
const mapZoom = ref(13);
const userLocation = ref(null);
const locationLoading = ref(false);
const searchArea = ref(null);
const floatingSearchQuery = ref('');
const selectedRestaurant = ref(null);

// Configuration
const circleOptions = {
  color: '#D97F71', // primary-600 (coral)
  fillColor: '#D97F71',
  fillOpacity: 0.1,
};

const userLocationIcon = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#D97F71" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>');

// Computed properties
const visibleRestaurants = computed(() => {
  return props.restaurants.filter(restaurant =>
    restaurant.latitude &&
    restaurant.longitude &&
    restaurant.latitude !== 0 &&
    restaurant.longitude !== 0
  );
});

// Methods
const getMarkerIcon = (restaurant) => {
  const priceLevel = restaurant.priceLevel || 1;
  let color = '#86B66F'; // Secondary-600 for budget

  if (priceLevel >= 4) color = '#EB6A62'; // Error-500 for premium
  else if (priceLevel >= 3) color = '#E3C969'; // Warning-600 for expensive
  else if (priceLevel >= 2) color = '#7E7F9A'; // Info-500 for moderate

  return 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`);
};

const selectRestaurant = (restaurant) => {
  selectedRestaurant.value = restaurant;
  emit('restaurant-select', restaurant);
};

const closeInfoWindow = () => {
  selectedRestaurant.value = null;
};

const formatPrice = (priceLevel) => {
  if (!priceLevel) return '';
  return '$'.repeat(priceLevel);
};

const onMapReady = (mapInstance) => {
  // Vue Leaflet may pass either the Leaflet map or a component wrapper
  const lmap = mapInstance && mapInstance.leafletObject ? mapInstance.leafletObject : mapInstance;
  map.value = lmap;

  if (map.value && typeof map.value.on === 'function') {
    map.value.on('moveend', () => {
      if (!map.value || typeof map.value.getBounds !== 'function') return;
      const bounds = map.value.getBounds();
      emit('bounds-change', {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    });
  }

  getCurrentLocation();
};

const onMapClick = () => {
  closeInfoWindow();
};

const zoomIn = () => {
  if (map.value && typeof map.value.zoomIn === 'function') {
    map.value.zoomIn();
  }
};

const zoomOut = () => {
  if (map.value && typeof map.value.zoomOut === 'function') {
    map.value.zoomOut();
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
    userLocation.value = [latitude, longitude];
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
    if (map.value && typeof map.value.panTo === 'function') {
      map.value.panTo(userLocation.value);
    }
  } else {
    await getCurrentLocation();
    if (userLocation.value) {
      mapCenter.value = userLocation.value;
      if (map.value && typeof map.value.panTo === 'function') {
        map.value.panTo(userLocation.value);
      }
    }
  }
};

const searchInArea = () => {
  if (!map.value || !floatingSearchQuery.value.trim()) return;

  const center = map.value.getCenter();
  const bounds = map.value.getBounds();
  const radius = center.distanceTo(bounds.getNorthEast());

  searchArea.value = {
    center: [center.lat, center.lng],
    radius: Math.min(radius, 25000) // Max 25km
  };

  emit('area-search', {
    query: floatingSearchQuery.value.trim(),
    center: { lat: center.lat, lng: center.lng },
    radius: searchArea.value.radius
  });
};

const getDirections = (restaurant) => {
  const url = `https://www.openstreetmap.org/directions?from=&to=${restaurant.latitude},${restaurant.longitude}`;
  window.open(url, '_blank');
};

// Watch for selected restaurant changes from parent
watch(() => props.selectedRestaurantId, (newId) => {
  if (newId) {
    const restaurant = visibleRestaurants.value.find(r => r.id === newId);
    if (restaurant) {
      selectRestaurant(restaurant);

      // Pan to restaurant
      const position = [restaurant.latitude, restaurant.longitude];
      mapCenter.value = position;
      if (map.value && typeof map.value.panTo === 'function') {
        map.value.panTo(position);
      }
    }
  } else {
    closeInfoWindow();
  }
});

// Watch for restaurants changes and fit bounds
watch(() => props.restaurants, (newRestaurants) => {
  if (newRestaurants.length > 0 && map.value && typeof map.value.fitBounds === 'function') {
    // Ensure Leaflet is loaded on client before using it
    if (!Leaflet) return;
    const bounds = Leaflet.latLngBounds();

    // Include user location if available
    if (userLocation.value) {
      bounds.extend(userLocation.value);
    }

    // Include all restaurants
    visibleRestaurants.value.forEach(restaurant => {
      bounds.extend([restaurant.latitude, restaurant.longitude]);
    });

    // Only fit bounds if we have multiple points
    if (visibleRestaurants.value.length > 1 || userLocation.value) {
      map.value.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}, { immediate: true });

onMounted(async () => {
  // Lazy-load Leaflet on client only to avoid SSR "window is not defined"
  if (!Leaflet) {
    const mod = await import('leaflet');
    Leaflet = mod.default || mod;
  }

  // Initialize search area if radius is provided
  if (props.searchRadius && userLocation.value) {
    searchArea.value = {
      center: userLocation.value,
      radius: props.searchRadius
    };
  }
});
</script>

<style>
/* You might need to adjust z-index values based on your layout */
.leaflet-pane {
  z-index: 1;
}
.leaflet-control {
  z-index: 2;
}
.leaflet-top, .leaflet-bottom {
    z-index: 1000;
}
</style>
