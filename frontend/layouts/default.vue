<template>
	<div class="min-h-screen bg-surface-50 text-surface-900 flex flex-col">
		<header class="material-nav sticky top-0 z-50">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-8">
						<NuxtLink to="/" class="text-2xl font-bold text-primary-600 flex items-center space-x-2">
							<span class="text-3xl">🍽️</span>
							<span>RestaurantFinder</span>
						</NuxtLink>
						<nav class="hidden md:flex space-x-1">
							<NuxtLink
								to="/"
								class="material-nav-item"
								:class="{ 'active': $route.path === '/' }"
							>
								Home
							</NuxtLink>
							<NuxtLink
								to="/restaurants"
								class="material-nav-item"
								:class="{ 'active': $route.path === '/restaurants' }"
							>
								Restaurants
							</NuxtLink>
							<NuxtLink
								to="/discover"
								class="material-nav-item"
								:class="{ 'active': $route.path === '/discover' }"
							>
								Discover
							</NuxtLink>
						</nav>
					</div>
					<div class="hidden md:flex items-center space-x-3">
						<button class="material-button-outlined">
							Sign In
						</button>
						<button class="material-button-primary">
							Get Started
						</button>
					</div>
					<!-- Mobile menu button -->
					<div class="md:hidden">
						<button 
							@click="mobileMenuOpen = !mobileMenuOpen"
							class="material-nav-item"
							type="button"
						>
							<span class="sr-only">Open main menu</span>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
					</div>
				</div>
				
				<!-- Mobile Navigation -->
				<div v-if="mobileMenuOpen" class="md:hidden mt-4 pb-3 space-y-1">
					<NuxtLink
						to="/"
						class="material-nav-item block"
						:class="{ 'active': $route.path === '/' }"
						@click="mobileMenuOpen = false"
					>
						Home
					</NuxtLink>
					<NuxtLink
						to="/restaurants"
						class="material-nav-item block"
						:class="{ 'active': $route.path === '/restaurants' }"
						@click="mobileMenuOpen = false"
					>
						Restaurants
					</NuxtLink>
					<NuxtLink
						to="/discover"
						class="material-nav-item block"
						:class="{ 'active': $route.path === '/discover' }"
						@click="mobileMenuOpen = false"
					>
						Discover
					</NuxtLink>
					<div class="pt-3 space-y-2">
						<button class="material-button-outlined w-full">
							Sign In
						</button>
						<button class="material-button-primary w-full">
							Get Started
						</button>
					</div>
				</div>
			</div>
		</header>

		<main class="flex-1">
			<slot />
		</main>

		<footer class="bg-surface-800 text-white mt-auto">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div class="col-span-1 md:col-span-2">
						<div class="flex items-center space-x-2 mb-4">
							<span class="text-3xl">🍽️</span>
							<span class="text-2xl font-bold text-white">RestaurantFinder</span>
						</div>
						<p class="text-surface-300 max-w-md">
							Discover amazing restaurants, explore cuisines, and find your perfect dining experience. 
							Your culinary journey starts here.
						</p>
					</div>
					
					<div>
						<h3 class="text-lg font-semibold text-white mb-4">Quick Links</h3>
						<ul class="space-y-2">
							<li><NuxtLink to="/" class="text-surface-300 hover:text-primary-400 transition-colors">Home</NuxtLink></li>
							<li><NuxtLink to="/restaurants" class="text-surface-300 hover:text-primary-400 transition-colors">Restaurants</NuxtLink></li>
							<li><NuxtLink to="/discover" class="text-surface-300 hover:text-primary-400 transition-colors">Discover</NuxtLink></li>
						</ul>
					</div>
					
					<div>
						<h3 class="text-lg font-semibold text-white mb-4">Support</h3>
						<ul class="space-y-2">
							<li><a href="#" class="text-surface-300 hover:text-primary-400 transition-colors">Help Center</a></li>
							<li><a href="#" class="text-surface-300 hover:text-primary-400 transition-colors">Contact Us</a></li>
							<li><a href="#" class="text-surface-300 hover:text-primary-400 transition-colors">Privacy Policy</a></li>
						</ul>
					</div>
				</div>
				
				<div class="border-t border-surface-700 mt-8 pt-8 text-center">
					<p class="text-surface-400">
						&copy; 2024 Restaurant Discovery Engine. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup>
const mobileMenuOpen = ref(false)
</script>

<style scoped>
	.router-link-active {
		@apply text-primary-600;
	}
</style>
