<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-5xl font-bold mb-6">
            Discover Amazing Restaurants
          </h1>
          <p class="text-xl mb-8 max-w-2xl mx-auto">
            Find the perfect dining experience near you. Explore cuisines, read reviews, and discover hidden gems.
          </p>
          <div class="flex justify-center gap-4">
            <NuxtLink
              to="/restaurants"
              class="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Explore Restaurants
            </NuxtLink>
            <button
              class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-surface">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-text mb-4">
            Why Choose RestaurantFinder?
          </h2>
          <p class="text-xl text-text-secondary">
            Discover what makes us the best choice for finding great restaurants
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-primary-600 text-2xl">🍽️</span>
            </div>
            <h3 class="text-xl font-semibold mb-2">Curated Selection</h3>
            <p class="text-text-secondary">
              Hand-picked restaurants with verified reviews and ratings
            </p>
          </div>
          
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-primary-600 text-2xl">📍</span>
            </div>
            <h3 class="text-xl font-semibold mb-2">Location Based</h3>
            <p class="text-text-secondary">
              Find restaurants near you with accurate location data
            </p>
          </div>
          
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-primary-600 text-2xl">⭐</span>
            </div>
            <h3 class="text-xl font-semibold mb-2">Trusted Reviews</h3>
            <p class="text-text-secondary">
              Read authentic reviews from real customers
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>