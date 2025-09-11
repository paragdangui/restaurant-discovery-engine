<template>
  <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 group overflow-hidden">
    <!-- Image Section -->
    <div class="relative h-48 overflow-hidden">
      <img
        v-if="restaurant.photos && restaurant.photos.length > 0"
        :src="restaurant.photos[0]"
        :alt="restaurant.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div 
        v-else 
        class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
      >
        <BuildingStorefrontIcon class="w-16 h-16 text-gray-400" />
      </div>
      
      <!-- Overlay with quick actions -->
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end justify-end p-3">
        <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            @click.stop="toggleFavorite"
            :class="[
              'p-2 rounded-full transition-colors',
              isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'
            ]"
          >
            <HeartIcon :class="['w-4 h-4', isFavorite ? 'fill-current' : '']" />
          </button>
          <button
            @click.stop="shareRestaurant"
            class="p-2 rounded-full bg-white text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ShareIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <!-- Status badges -->
      <div class="absolute top-3 left-3 flex flex-col space-y-1">
        <span v-if="restaurant.isClosed" class="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
          Closed
        </span>
        <span v-else-if="isOpenNow" class="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
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
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {{ restaurant.name }}
          </h3>
          <div v-if="restaurant.categories && restaurant.categories.length > 0" class="flex items-center mt-1">
            <span class="text-sm text-gray-600">{{ formatCategories(restaurant.categories) }}</span>
          </div>
        </div>
        
        <!-- Rating -->
        <div v-if="restaurant.rating" class="flex items-center ml-3">
          <div class="flex items-center">
            <StarIcon class="w-4 h-4 text-yellow-400 fill-current" />
            <span class="ml-1 text-sm font-medium text-gray-900">{{ restaurant.rating }}</span>
          </div>
          <span v-if="restaurant.reviewCount" class="ml-1 text-xs text-gray-500">
            ({{ restaurant.reviewCount }})
          </span>
        </div>
      </div>
      
      <!-- Description -->
      <p v-if="restaurant.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
        {{ restaurant.description }}
      </p>
      
      <!-- Details -->
      <div class="space-y-2 mb-4">
        <div class="flex items-center text-sm text-gray-600">
          <MapPinIcon class="w-4 h-4 mr-2 flex-shrink-0" />
          <span class="truncate">{{ restaurant.address }}</span>
        </div>
        
        <div v-if="restaurant.phone" class="flex items-center text-sm text-gray-600">
          <PhoneIcon class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ restaurant.phone }}</span>
        </div>
        
        <div v-if="formattedHours" class="flex items-center text-sm text-gray-600">
          <ClockIcon class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ formattedHours }}</span>
        </div>
      </div>
      
      <!-- Tags/Features -->
      <div v-if="restaurant.transactions && restaurant.transactions.length > 0" class="flex flex-wrap gap-1 mb-4">
        <span 
          v-for="transaction in restaurant.transactions" 
          :key="transaction"
          class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
        >
          {{ formatTransaction(transaction) }}
        </span>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center justify-between">
        <div class="flex space-x-2">
          <button
            @click="$emit('view-details', restaurant)"
            class="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            View Details
          </button>
          <button
            v-if="restaurant.url"
            @click="openYelp"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Yelp
          </button>
        </div>
        
        <!-- More actions dropdown -->
        <div class="relative">
          <button
            @click="showMoreActions = !showMoreActions"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <EllipsisVerticalIcon class="w-5 h-5" />
          </button>
          
          <div
            v-if="showMoreActions"
            class="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
          >
            <button
              @click="$emit('edit', restaurant); showMoreActions = false"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <PencilIcon class="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              @click="getDirections"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <MapIcon class="w-4 h-4 mr-2" />
              Get Directions
            </button>
            <button
              @click="$emit('add-to-list', restaurant); showMoreActions = false"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              Add to List
            </button>
            <hr class="my-1" />
            <button
              @click="$emit('delete', restaurant); showMoreActions = false"
              class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
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
  }
});

const emit = defineEmits(['edit', 'delete', 'view-details', 'add-to-list', 'toggle-favorite']);

// Reactive data
const showMoreActions = ref(false);
const isFavorite = ref(false);

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

const openYelp = () => {
  if (props.restaurant.url) {
    window.open(props.restaurant.url, '_blank');
  }
};

const getDirections = () => {
  if (props.restaurant.latitude && props.restaurant.longitude) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${props.restaurant.latitude},${props.restaurant.longitude}`;
    window.open(url, '_blank');
  }
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