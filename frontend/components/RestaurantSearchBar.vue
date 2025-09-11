<template>
  <div class="relative">
    <!-- Main Search Input -->
    <div class="relative flex items-center">
      <div class="relative flex-1">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search restaurants, cuisines, or dishes..."
          class="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          @keyup.enter="performSearch"
          @input="onSearchInput"
        />
        
        <!-- Voice Search Button -->
        <button
          v-if="speechRecognitionSupported"
          @click="toggleVoiceSearch"
          :class="[
            'absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full p-1',
            isListening ? 'animate-pulse bg-red-500 text-white' : 'text-gray-400 hover:text-primary-500'
          ]"
        >
          <MicrophoneIcon class="h-4 w-4" />
        </button>
      </div>
      
      <!-- Location Input -->
      <div class="relative ml-3 flex-shrink-0">
        <MapPinIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          v-model="location"
          type="text"
          placeholder="Location"
          class="w-48 rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          @keyup.enter="performSearch"
        />
        
        <!-- Use Current Location Button -->
        <button
          @click="getCurrentLocation"
          :disabled="locationLoading"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-primary-500 disabled:opacity-50"
        >
          <component :is="locationLoading ? 'div' : 'LocationSearchingIcon'" 
            :class="locationLoading ? 'animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full' : 'h-4 w-4'" 
          />
        </button>
      </div>
      
      <!-- Filter Toggle Button -->
      <button
        @click="showFilters = !showFilters"
        :class="[
          'ml-3 flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
          showFilters || hasActiveFilters ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        ]"
      >
        <FunnelIcon class="mr-2 h-4 w-4" />
        Filters
        <span v-if="activeFiltersCount > 0" class="ml-2 rounded-full bg-white bg-opacity-20 px-2 py-0.5 text-xs">
          {{ activeFiltersCount }}
        </span>
      </button>
      
      <!-- Search Button -->
      <button
        @click="performSearch"
        :disabled="!searchQuery.trim() && !location.trim()"
        class="ml-3 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Search
      </button>
    </div>
    
    <!-- Auto-suggestions Dropdown -->
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        @click="selectSuggestion(suggestion)"
        class="flex cursor-pointer items-center px-4 py-2 hover:bg-gray-50"
      >
        <MagnifyingGlassIcon class="mr-3 h-4 w-4 text-gray-400" />
        <div>
          <div class="text-sm font-medium text-gray-900">{{ suggestion.text }}</div>
          <div class="text-xs text-gray-500">{{ suggestion.type }}</div>
        </div>
      </div>
    </div>
    
    <!-- Recent Searches Dropdown -->
    <div
      v-if="showRecent && recentSearches.length > 0"
      class="absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div class="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
        Recent Searches
      </div>
      <div
        v-for="(recent, index) in recentSearches"
        :key="index"
        @click="selectRecentSearch(recent)"
        class="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-50"
      >
        <div class="flex items-center">
          <ClockIcon class="mr-3 h-4 w-4 text-gray-400" />
          <span class="text-sm text-gray-900">{{ recent.query }}</span>
          <span class="ml-2 text-xs text-gray-500">in {{ recent.location }}</span>
        </div>
        <button
          @click.stop="removeRecentSearch(index)"
          class="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
    
    <!-- Advanced Filters Panel -->
    <div v-if="showFilters" class="absolute top-full left-0 right-0 z-40 mt-1 rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <!-- Cuisine Types -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Cuisine Types</label>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            <div v-for="cuisine in cuisineTypes" :key="cuisine" class="flex items-center">
              <input
                :id="cuisine"
                v-model="selectedCuisines"
                :value="cuisine"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label :for="cuisine" class="ml-2 text-sm text-gray-700">{{ cuisine }}</label>
            </div>
          </div>
        </div>
        
        <!-- Price Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
          <div class="space-y-2">
            <div v-for="price in priceRanges" :key="price.value" class="flex items-center">
              <input
                :id="price.value"
                v-model="selectedPrices"
                :value="price.value"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label :for="price.value" class="ml-2 text-sm text-gray-700">{{ price.label }}</label>
            </div>
          </div>
        </div>
        
        <!-- Additional Filters -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Options</label>
          <div class="space-y-2">
            <div class="flex items-center">
              <input
                id="openNow"
                v-model="openNow"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="openNow" class="ml-2 text-sm text-gray-700">Open Now</label>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Distance</label>
              <select v-model="distance" class="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="">Any Distance</option>
                <option value="1000">Within 1 km</option>
                <option value="5000">Within 5 km</option>
                <option value="10000">Within 10 km</option>
                <option value="25000">Within 25 km</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select v-model="minRating" class="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Filter Actions -->
      <div class="mt-4 flex items-center justify-between">
        <button
          @click="clearFilters"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear All Filters
        </button>
        <div class="flex space-x-2">
          <button
            @click="showFilters = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            @click="applyFilters"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  FunnelIcon, 
  MicrophoneIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';

const emit = defineEmits(['search', 'location-change']);

// Reactive data
const searchQuery = ref('');
const location = ref('');
const showFilters = ref(false);
const showSuggestions = ref(false);
const showRecent = ref(false);
const locationLoading = ref(false);
const isListening = ref(false);

// Filters
const selectedCuisines = ref([]);
const selectedPrices = ref([]);
const openNow = ref(false);
const distance = ref('');
const minRating = ref('');

// Speech recognition
const speechRecognitionSupported = ref(false);
let recognition = null;

// Data
const suggestions = ref([]);
const recentSearches = ref([
  { query: 'Italian restaurants', location: 'New York' },
  { query: 'Best pizza', location: 'Brooklyn' },
  { query: 'Sushi near me', location: 'Manhattan' },
]);

const cuisineTypes = [
  'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'French', 
  'Thai', 'American', 'Mediterranean', 'Korean', 'Vietnamese', 'Greek'
];

const priceRanges = [
  { value: '1', label: '$ - Inexpensive' },
  { value: '2', label: '$$ - Moderate' },
  { value: '3', label: '$$$ - Expensive' },
  { value: '4', label: '$$$$ - Very Expensive' }
];

// Computed
const hasActiveFilters = computed(() => 
  selectedCuisines.value.length > 0 || 
  selectedPrices.value.length > 0 || 
  openNow.value || 
  distance.value || 
  minRating.value
);

const activeFiltersCount = computed(() => {
  let count = 0;
  if (selectedCuisines.value.length > 0) count++;
  if (selectedPrices.value.length > 0) count++;
  if (openNow.value) count++;
  if (distance.value) count++;
  if (minRating.value) count++;
  return count;
});

// Methods
const performSearch = () => {
  if (!searchQuery.value.trim() && !location.value.trim()) return;
  
  const searchParams = {
    query: searchQuery.value.trim(),
    location: location.value.trim(),
    cuisines: selectedCuisines.value,
    prices: selectedPrices.value,
    openNow: openNow.value,
    distance: distance.value ? parseInt(distance.value) : null,
    minRating: minRating.value ? parseFloat(minRating.value) : null
  };
  
  // Add to recent searches
  if (searchQuery.value.trim()) {
    const recent = { query: searchQuery.value.trim(), location: location.value.trim() };
    recentSearches.value = [recent, ...recentSearches.value.filter(r => 
      r.query !== recent.query || r.location !== recent.location
    )].slice(0, 5);
  }
  
  emit('search', searchParams);
  showFilters.value = false;
  showSuggestions.value = false;
};

const onSearchInput = useDebounceFn(() => {
  if (searchQuery.value.trim().length > 2) {
    // Simulate API call for suggestions
    suggestions.value = [
      { text: searchQuery.value.trim() + ' restaurants', type: 'restaurants' },
      { text: searchQuery.value.trim() + ' near me', type: 'location-based' },
    ];
    showSuggestions.value = true;
    showRecent.value = false;
  } else {
    showSuggestions.value = false;
    showRecent.value = searchQuery.value.trim().length === 0;
  }
}, 300);

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.text;
  showSuggestions.value = false;
  performSearch();
};

const selectRecentSearch = (recent) => {
  searchQuery.value = recent.query;
  location.value = recent.location;
  showRecent.value = false;
  performSearch();
};

const removeRecentSearch = (index) => {
  recentSearches.value.splice(index, 1);
};

const getCurrentLocation = async () => {
  if (!navigator.geolocation) return;
  
  locationLoading.value = true;
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    const { latitude, longitude } = position.coords;
    // You would typically reverse geocode these coordinates
    location.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    emit('location-change', { latitude, longitude });
  } catch (error) {
    console.error('Error getting location:', error);
  } finally {
    locationLoading.value = false;
  }
};

const initSpeechRecognition = () => {
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      isListening.value = true;
    };
    
    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      searchQuery.value = result;
      isListening.value = false;
    };
    
    recognition.onerror = () => {
      isListening.value = false;
    };
    
    recognition.onend = () => {
      isListening.value = false;
    };
    
    speechRecognitionSupported.value = true;
  }
};

const toggleVoiceSearch = () => {
  if (!recognition) return;
  
  if (isListening.value) {
    recognition.stop();
  } else {
    recognition.start();
  }
};

const clearFilters = () => {
  selectedCuisines.value = [];
  selectedPrices.value = [];
  openNow.value = false;
  distance.value = '';
  minRating.value = '';
};

const applyFilters = () => {
  showFilters.value = false;
  if (searchQuery.value.trim() || location.value.trim()) {
    performSearch();
  }
};

// Lifecycle
onMounted(() => {
  initSpeechRecognition();
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      showSuggestions.value = false;
      showRecent.value = false;
      showFilters.value = false;
    }
  });
});

// Focus handling
watchEffect(() => {
  if (searchQuery.value === '' && !showSuggestions.value) {
    showRecent.value = true;
  }
});
</script>