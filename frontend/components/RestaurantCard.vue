<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
    <div class="p-6">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-xl font-semibold text-text">{{ restaurant.name }}</h3>
        <div v-if="restaurant.rating" class="flex items-center">
          <span class="text-yellow-400">★</span>
          <span class="ml-1 text-text-secondary text-sm">{{ restaurant.rating }}</span>
        </div>
      </div>
      
      <p v-if="restaurant.description" class="text-text-secondary mb-3 line-clamp-2">
        {{ restaurant.description }}
      </p>
      
      <div class="space-y-2 mb-4">
        <div class="flex items-center text-sm text-text-secondary">
          <span class="mr-2">🍽️</span>
          <span>{{ restaurant.cuisine }}</span>
        </div>
        
        <div class="flex items-center text-sm text-text-secondary">
          <span class="mr-2">📍</span>
          <span>{{ restaurant.address }}</span>
        </div>
        
        <div v-if="restaurant.phone" class="flex items-center text-sm text-text-secondary">
          <span class="mr-2">📞</span>
          <span>{{ restaurant.phone }}</span>
        </div>
      </div>
      
      <div class="flex justify-end space-x-2">
        <button
          @click="$emit('edit', restaurant)"
          class="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 transition-colors"
        >
          Edit
        </button>
        <button
          @click="$emit('delete', restaurant)"
          class="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['edit', 'delete'])

defineProps({
  restaurant: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>