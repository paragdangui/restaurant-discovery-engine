<template>
	<div class="min-h-screen bg-slate-900 text-white">
		<!-- Header -->
		<header class="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<h1 class="text-2xl font-bold">RestaurantFinder...</h1>
						<nav class="hidden md:flex space-x-6">
							<a href="#" class="text-white font-medium">Home</a>
							<a
								href="#"
								class="text-slate-400 hover:text-white transition-colors"
								>Restaurants</a
							>
						</nav>
					</div>
				</div>
			</div>
		</header>

		<!-- Hero Section -->
		<section class="py-16 px-4 sm:px-6 lg:px-8">
			<div class="max-w-4xl mx-auto text-center">
				<h1 class="text-5xl sm:text-6xl font-bold mb-6">
					Discover Amazing Restaurants
				</h1>
				<p class="text-xl mb-8 text-slate-300">
					Find the perfect dining experience near you. Explore cuisines, read
					reviews, and discover hidden gems.
				</p>
				<div
					class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
				>
					<NuxtLink
						to="/discover"
						class="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transform hover:scale-105 transition-all shadow-xl"
					>
						Explore Restaurants
					</NuxtLink>
					<a
						href="#learn-more"
						class="text-slate-300 hover:text-white font-medium"
						>Learn More</a
					>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section id="learn-more" class="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
			<div class="max-w-6xl mx-auto">
				<h2 class="text-3xl font-bold text-center mb-12">
					Why Choose RestaurantFinder?
				</h2>
				<p class="text-center text-slate-300 mb-16 max-w-2xl mx-auto">
					Discover what makes us the best choice for finding great restaurants
				</p>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
					<!-- Curated Selection -->
					<div class="text-center p-6">
						<div class="text-4xl mb-4">🎯</div>
						<h3 class="text-xl font-semibold mb-4">Curated Selection</h3>
						<p class="text-slate-300 leading-relaxed">
							Hand-picked restaurants with verified reviews and ratings
						</p>
						<div class="text-red-400 mt-2">📍</div>
					</div>

					<!-- Location Based -->
					<div class="text-center p-6">
						<div class="text-4xl mb-4">📍</div>
						<h3 class="text-xl font-semibold mb-4">Location Based</h3>
						<p class="text-slate-300 leading-relaxed">
							Find restaurants near you with accurate location data
						</p>
						<div class="text-yellow-400 mt-2">⭐</div>
					</div>

					<!-- Trusted Reviews -->
					<div class="text-center p-6">
						<div class="text-4xl mb-4">⭐</div>
						<h3 class="text-xl font-semibold mb-4">Trusted Reviews</h3>
						<p class="text-slate-300 leading-relaxed">
							Read authentic reviews from real customers
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer
			class="border-t border-slate-700 bg-slate-800/50 backdrop-blur mt-16"
		>
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div class="text-center text-slate-400">
					<p>&copy; 2024 Restaurant Discovery Engine. All rights reserved.</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup>
	// Page meta
	definePageMeta({
		title: 'RestaurantFinder - Discover Amazing Restaurants',
		description:
			'Find the perfect dining experience near you. Explore cuisines, read reviews, and discover hidden gems.',
	});
</script>
