<template>
	<div class="min-h-screen bg-background text-text">
		<header class="bg-surface shadow-sm border-b border-gray-200">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center h-16">
					<div class="flex items-center">
						<NuxtLink to="/" class="text-2xl font-bold text-primary-600">
							RestaurantFinder
						</NuxtLink>
					</div>
					<nav class="flex space-x-8">
						<NuxtLink
							to="/"
							class="text-text-secondary hover:text-text transition-colors"
							:class="{ 'text-primary-600': $route.path === '/' }"
						>
							Home
						</NuxtLink>
						<NuxtLink
							to="/restaurants"
							class="text-text-secondary hover:text-text transition-colors"
							:class="{ 'text-primary-600': $route.path === '/restaurants' }"
						>
							Restaurants
						</NuxtLink>
					</nav>
				</div>
			</div>
		</header>

		<main class="flex-1">
			<slot />
		</main>

		<footer class="bg-surface border-t border-gray-200">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div class="text-center text-text-secondary">
					<p>&copy; 2024 Restaurant Discovery Engine. All rights reserved.</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<style scoped>
	.router-link-active {
		@apply text-primary-600;
	}
</style>
