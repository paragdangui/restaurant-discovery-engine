<template>
  <div :class="['material-card group overflow-hidden hover:scale-[1.02] transition-all duration-300', compact ? '!p-4' : '']">
    <!-- Image Section -->
    <div :class="['relative overflow-hidden', compact ? 'aspect-[4/3]' : 'aspect-[16/9]']">
      <img
        v-if="photosToShow.length > 0"
        :src="photosToShow[currentImageIndex]"
        :alt="restaurant.name"
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-surface-200 to-surface-300 flex items-center justify-center"
      >
        <BuildingStorefrontIcon class="w-16 h-16 text-surface-400" />
      </div>

      <!-- Simple carousel controls -->
      <button
        v-if="photosToShow.length > 1"
        @click.stop="prevImage"
        class="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20"
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        v-if="photosToShow.length > 1"
        @click.stop="nextImage"
        class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20"
        aria-label="Next image"
      >
        ›
      </button>

      <!-- Photo counter -->
      <div v-if="photosToShow.length > 1" class="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded z-20">
        {{ currentImageIndex + 1 }} / {{ photosToShow.length }}
      </div>
      
      <!-- Overlay with quick actions -->
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end justify-end p-3 z-10 pointer-events-none">
        <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <button
            @click.stop="toggleFavorite"
            :class="[
              'p-2 rounded-full transition-colors',
              isFavorite ? 'bg-error-500 text-white' : 'bg-white text-surface-600 hover:text-error-500'
            ]"
          >
            <HeartIcon :class="['w-4 h-4', isFavorite ? 'fill-current' : '']" />
          </button>
          <button
            @click.stop="shareRestaurant"
            class="p-2 rounded-full bg-white text-surface-600 hover:text-primary-600 transition-colors"
          >
            <ShareIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <!-- Status badges -->
      <div class="absolute top-3 left-3 flex flex-col space-y-1">
        <span v-if="restaurant.isClosed" class="px-2 py-1 bg-error-500 text-white text-xs font-medium rounded-full">
          Closed
        </span>
        <span v-else-if="isOpenNow" class="px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
          Open Now
        </span>
        <span v-if="restaurant.priceLevel" class="px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full">
          {{ '$'.repeat(restaurant.priceLevel) }}
        </span>
      </div>
      
      <!-- Distance badge -->
      <div v-if="distance" class="absolute top-3 right-3">
        <span class="px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full">
          {{ distance }}
        </span>
      </div>
    </div>
    
    <!-- Content Section -->
    <div :class="[compact ? 'p-3' : 'p-4']">
      <!-- Header -->
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-surface-900 truncate group-hover:text-primary-600 transition-colors">
            {{ restaurant.name }}
          </h3>
          <div v-if="restaurant.categories && restaurant.categories.length > 0" class="flex items-center mt-1">
            <span class="text-sm text-surface-600">{{ formatCategories(restaurant.categories) }}</span>
          </div>
        </div>
        
        <!-- Rating -->
        <div v-if="restaurant.rating" class="flex items-center ml-3">
          <div class="flex items-center">
            <StarIcon class="w-4 h-4 text-warning-400 fill-current" />
            <span class="ml-1 text-sm font-medium text-surface-900">{{ restaurant.rating }}</span>
          </div>
          <span v-if="restaurant.reviewCount" class="ml-1 text-xs text-surface-500">
            ({{ restaurant.reviewCount }})
          </span>
        </div>
      </div>
      
      <!-- Description -->
      <p v-if="restaurant.description" class="text-sm text-surface-600 mb-3 line-clamp-2">
        {{ restaurant.description }}
      </p>
      
      <!-- Details -->
      <div :class="['space-y-2', compact ? 'mb-3' : 'mb-4']">
        <div class="flex items-center text-sm text-surface-600">
          <MapPinIcon class="w-4 h-4 mr-2 flex-shrink-0" />
          <span class="truncate">{{ restaurant.address }}</span>
        </div>
        
        <div v-if="restaurant.phone" class="flex items-center text-sm text-surface-600">
          <PhoneIcon class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ restaurant.phone }}</span>
        </div>
        
        <div v-if="formattedHours" class="flex items-center text-sm text-surface-600">
          <ClockIcon class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ formattedHours }}</span>
        </div>
      </div>
      
      <!-- Tags/Features -->
      <div v-if="restaurant.transactions && restaurant.transactions.length > 0" class="flex flex-wrap gap-1 mb-4">
        <span 
          v-for="transaction in restaurant.transactions" 
          :key="transaction"
          class="px-2 py-1 bg-info-100 text-info-800 text-xs font-medium rounded-full"
        >
          {{ formatTransaction(transaction) }}
        </span>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center justify-between">
        <div class="flex space-x-2">
          <button
            @click="$emit('view-details', restaurant)"
            class="material-button-primary"
          >
            View Details
          </button>
          <button
            v-if="restaurant.url"
            @click="openWebsite"
            class="material-button-outlined"
          >
            Website
          </button>
        </div>
        
        <!-- More actions dropdown -->
        <div class="relative">
          <button
            @click="showMoreActions = !showMoreActions"
            class="p-2 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <EllipsisVerticalIcon class="w-5 h-5" />
          </button>
          
          <div
            v-if="showMoreActions"
            class="absolute right-0 top-full mt-1 w-48 bg-white border border-surface-200 rounded-lg shadow-material-4 z-20"
          >
            <button
              @click="$emit('edit', restaurant); showMoreActions = false"
              class="w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center transition-colors"
            >
              <PencilIcon class="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              @click="getDirections"
              class="w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center transition-colors"
            >
              <MapIcon class="w-4 h-4 mr-2" />
              Get Directions
            </button>
            <button
              @click="$emit('add-to-list', restaurant); showMoreActions = false"
              class="w-full px-4 py-2 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center transition-colors"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              Add to List
            </button>
            <hr class="my-1" />
            <button
              @click="$emit('delete', restaurant); showMoreActions = false"
              class="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 flex items-center transition-colors"
            >
              <TrashIcon class="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  BuildingStorefrontIcon,
  HeartIcon,
  ShareIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  MapIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
  restaurant: {
    type: Object,
    required: true
  },
  distance: {
    type: String,
    default: null
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete', 'view-details', 'add-to-list', 'toggle-favorite']);

// Reactive data
const showMoreActions = ref(false);
const isFavorite = ref(false);
const currentImageIndex = ref(0);

// Computed properties
const isOpenNow = computed(() => {
  if (!props.restaurant.hours) return false;
  // This would need to be properly implemented with real time checking
  return !props.restaurant.isClosed;
});

const formattedHours = computed(() => {
  if (!props.restaurant.hours || !props.restaurant.hours.length) return null;
  const todayHours = props.restaurant.hours[0];
  if (!todayHours.is_open_now) return 'Closed';
  // This would need proper formatting based on current day
  return 'Open';
});

// Ensure at least 5 images by appending deterministic placeholders
const photosToShow = computed(() => {
  const existing = Array.isArray(props.restaurant.photos) ? props.restaurant.photos.filter(Boolean) : [];
  const needed = Math.max(0, 5 - existing.length);
  const seedBase = encodeURIComponent(String(props.restaurant.id || props.restaurant.externalId || props.restaurant.name || 'restaurant'));
  const placeholders = Array.from({ length: needed }, (_, i) => `https://picsum.photos/seed/${seedBase}-${i}/800/600`);
  return [...existing, ...placeholders];
});

// Methods
const formatCategories = (categories) => {
  return categories.map(cat => cat.title).slice(0, 2).join(', ');
};

const formatTransaction = (transaction) => {
  const transactionMap = {
    pickup: 'Pickup',
    delivery: 'Delivery',
    restaurant_reservation: 'Reservations'
  };
  return transactionMap[transaction] || transaction;
};

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value;
  emit('toggle-favorite', props.restaurant, isFavorite.value);
};

const shareRestaurant = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.restaurant.name,
        text: `Check out ${props.restaurant.name} - ${props.restaurant.cuisine}`,
        url: props.restaurant.url || window.location.href
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  } else {
    // Fallback to clipboard
    const text = `${props.restaurant.name} - ${props.restaurant.address}`;
    navigator.clipboard.writeText(text);
    // You could show a toast here
  }
};

const openWebsite = () => {
  if (props.restaurant.url) {
    window.open(props.restaurant.url, '_blank');
  }
};

const getDirections = () => {
  if (props.restaurant.latitude && props.restaurant.longitude) {
    const url = `https://www.openstreetmap.org/directions?from=&to=${props.restaurant.latitude},${props.restaurant.longitude}`;
    window.open(url, '_blank');
  }
};

const nextImage = () => {
  if (photosToShow.value.length === 0) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % photosToShow.value.length;
};

const prevImage = () => {
  if (photosToShow.value.length === 0) return;
  currentImageIndex.value = (currentImageIndex.value - 1 + photosToShow.value.length) % photosToShow.value.length;
};

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      showMoreActions.value = false;
    }
  });
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
