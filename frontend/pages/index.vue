<template>
	<!-- Hero Section -->
	<section
		class="material-hero-section py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
	>
		<div
			class="absolute inset-0 bg-gradient-to-br from-primary-500/95 to-primary-700/95"
		></div>
		<div class="relative max-w-4xl mx-auto text-center z-10">
			<div class="mb-8">
				<h1
					class="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight"
				>
					Discover Amazing
					<span class="block text-primary-100">Restaurants</span>
				</h1>
				<p
					class="text-xl mb-8 text-primary-50 max-w-2xl mx-auto leading-relaxed"
				>
					Find the perfect dining experience near you. Explore cuisines, read
					reviews, and discover hidden gems in your area.
				</p>
			</div>
			<div
				class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
			>
				<NuxtLink
					to="/discover"
					class="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transform hover:scale-105 transition-all shadow-material-4 hover:shadow-material-6"
				>
					🚀 Explore Restaurants
				</NuxtLink>
				<a
					href="#learn-more"
					class="text-primary-100 hover:text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-all"
				>
					Learn More →
				</a>
			</div>

			<!-- Quick Stats -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
				<div class="text-center">
					<div class="text-3xl font-bold text-white mb-1">10,000+</div>
					<div class="text-primary-100 text-sm uppercase tracking-wide">
						Restaurants
					</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-white mb-1">50,000+</div>
					<div class="text-primary-100 text-sm uppercase tracking-wide">
						Reviews
					</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-white mb-1">25</div>
					<div class="text-primary-100 text-sm uppercase tracking-wide">
						Cities
					</div>
				</div>
			</div>
		</div>

		<!-- Decorative elements -->
		<div class="absolute top-10 left-10 text-6xl opacity-20">🍽️</div>
		<div class="absolute bottom-10 right-10 text-6xl opacity-20">🌟</div>
		<div class="absolute top-1/2 left-1/4 text-4xl opacity-10">🍕</div>
		<div class="absolute top-1/3 right-1/4 text-4xl opacity-10">🍜</div>
	</section>

	<!-- Features Section -->
	<section id="learn-more" class="py-20 px-4 sm:px-6 lg:px-8 bg-white">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-4xl font-bold text-surface-900 mb-4">
					Why Choose RestaurantFinder?
				</h2>
				<p class="text-lg text-surface-600 max-w-2xl mx-auto leading-relaxed">
					Discover what makes us the best choice for finding great restaurants
					and creating memorable dining experiences.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
				<!-- Curated Selection -->
				<div
					class="material-card text-center group hover:scale-105 transform transition-all"
				>
					<div
						class="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors"
					>
						<div class="text-3xl">🎯</div>
					</div>
					<h3 class="text-xl font-semibold mb-4 text-surface-900">
						Curated Selection
					</h3>
					<p class="text-surface-600 leading-relaxed mb-4">
						Hand-picked restaurants with verified reviews and ratings from
						trusted food critics and diners.
					</p>
					<div
						class="flex items-center justify-center text-primary-500 font-medium"
					>
						<span class="text-sm">Verified Quality</span>
						<svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							></path>
						</svg>
					</div>
				</div>

				<!-- Location Based -->
				<div
					class="material-card text-center group hover:scale-105 transform transition-all"
				>
					<div
						class="w-16 h-16 mx-auto mb-6 bg-info-100 rounded-full flex items-center justify-center group-hover:bg-info-200 transition-colors"
					>
						<div class="text-3xl">📍</div>
					</div>
					<h3 class="text-xl font-semibold mb-4 text-surface-900">
						Location Based
					</h3>
					<p class="text-surface-600 leading-relaxed mb-4">
						Find restaurants near you with accurate location data and real-time
						availability information.
					</p>
					<div
						class="flex items-center justify-center text-info-500 font-medium"
					>
						<span class="text-sm">GPS Accuracy</span>
						<svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
								clip-rule="evenodd"
							></path>
						</svg>
					</div>
				</div>

				<!-- Trusted Reviews -->
				<div
					class="material-card text-center group hover:scale-105 transform transition-all"
				>
					<div
						class="w-16 h-16 mx-auto mb-6 bg-warning-100 rounded-full flex items-center justify-center group-hover:bg-warning-200 transition-colors"
					>
						<div class="text-3xl">⭐</div>
					</div>
					<h3 class="text-xl font-semibold mb-4 text-surface-900">
						Trusted Reviews
					</h3>
					<p class="text-surface-600 leading-relaxed mb-4">
						Read authentic reviews from real customers and get insights from
						experienced food enthusiasts.
					</p>
					<div
						class="flex items-center justify-center text-warning-600 font-medium"
					>
						<span class="text-sm">Real Reviews</span>
						<svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
							></path>
						</svg>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-16 px-4 sm:px-6 lg:px-8 bg-surface-50">
		<div class="max-w-4xl mx-auto text-center">
			<h2 class="text-3xl font-bold text-surface-900 mb-4">
				Ready to Start Your Culinary Journey?
			</h2>
			<p class="text-lg text-surface-600 mb-8 max-w-2xl mx-auto">
				Join thousands of food lovers who trust RestaurantFinder to discover
				their next favorite dining spot.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
				<NuxtLink
					to="/discover"
					class="material-button-primary px-8 py-3 text-base"
				>
					Get Started Now
				</NuxtLink>
				<button class="material-button-outlined px-8 py-3 text-base">
					Watch Demo
				</button>
			</div>
		</div>
	</section>
</template>

<script setup>
	// Page meta
	definePageMeta({
		title: 'RestaurantFinder - Discover Amazing Restaurants',
		description:
			'Find the perfect dining experience near you. Explore cuisines, read reviews, and discover hidden gems.',
	});
</script>
