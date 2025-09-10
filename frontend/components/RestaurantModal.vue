<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black bg-opacity-50" @click="close"></div>
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">
            {{ isEditing ? 'Edit Restaurant' : 'Add Restaurant' }}
          </h2>
          <button @click="close" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">&times;</span>
          </button>
        </div>
        
        <form @submit.prevent="save">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Cuisine *
              </label>
              <input
                v-model="form.cuisine"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                v-model="form.address"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Rating (1-5)
              </label>
              <input
                v-model.number="form.rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              @click="close"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {{ loading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const { $fetch } = useNuxtApp()
const config = useRuntimeConfig()

const props = defineProps({
  modelValue: Boolean,
  restaurant: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const form = ref({
  name: '',
  description: '',
  cuisine: '',
  address: '',
  phone: '',
  rating: null
})

const isEditing = computed(() => !!props.restaurant?.id)

// Watch for restaurant changes
watch(() => props.restaurant, (newRestaurant) => {
  if (newRestaurant) {
    form.value = { ...newRestaurant }
  } else {
    resetForm()
  }
}, { immediate: true })

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    cuisine: '',
    address: '',
    phone: '',
    rating: null
  }
}

const close = () => {
  emit('update:modelValue', false)
  resetForm()
}

const save = async () => {
  loading.value = true
  try {
    const url = isEditing.value 
      ? `${config.public.apiBase}/restaurants/${props.restaurant.id}`
      : `${config.public.apiBase}/restaurants`
    
    const method = isEditing.value ? 'PATCH' : 'POST'
    
    await $fetch(url, {
      method,
      body: form.value
    })
    
    emit('saved')
  } catch (error) {
    console.error('Failed to save restaurant:', error)
  } finally {
    loading.value = false
  }
}
</script>