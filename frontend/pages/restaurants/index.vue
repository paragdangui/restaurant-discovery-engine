<template>
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="flex justify-between items-center mb-8">
			<h1 class="text-3xl font-bold text-text">Restaurants</h1>
			<button
				@click="showAddModal = true"
				class="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
			>
				Add Restaurant
			</button>
		</div>

		<!-- Loading State -->
		<div v-if="pending" class="text-center py-8">
			<div
				class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
			></div>
			<p class="mt-2 text-text-secondary">Loading restaurants...</p>
		</div>

		<!-- Error State -->
		<div v-else-if="error" class="text-center py-8">
			<p class="text-red-600">Failed to load restaurants. Please try again.</p>
		</div>

		<!-- Restaurants Grid -->
		<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<RestaurantCard
				v-for="restaurant in restaurants"
				:key="restaurant.id"
				:restaurant="restaurant"
				@edit="editRestaurant"
				@delete="deleteRestaurant"
				@view-details="viewRestaurantDetails"
			/>
		</div>

		<!-- Empty State -->
		<div
			v-if="!pending && !error && restaurants?.length === 0"
			class="text-center py-12"
		>
			<p class="text-text-secondary text-lg mb-4">No restaurants found</p>
			<button
				@click="showAddModal = true"
				class="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
			>
				Add Your First Restaurant
			</button>
		</div>

		<!-- Add/Edit Modal -->
		<RestaurantModal
			v-model="showAddModal"
			:restaurant="editingRestaurant"
			@saved="onRestaurantSaved"
		/>

		<!-- Restaurant Detail Modal -->
		<client-only>
			<RestaurantDetailModal
				v-if="showDetailModal"
				:restaurant="selectedRestaurant"
				:show="showDetailModal"
				@close="closeDetailModal"
				@edit="editRestaurant"
				@delete="deleteRestaurant"
			/>
		</client-only>
	</div>
</template>

<script setup>
	// Import ofetch's $fetch explicitly for reliability in client handlers
	import { $fetch } from 'ofetch';
	const config = useRuntimeConfig();

	const showAddModal = ref(false);
	const editingRestaurant = ref(null);
	const showDetailModal = ref(false);
	const selectedRestaurant = ref(null);

	// Fetch restaurants
	const {
		data: restaurants,
		pending,
		error,
		refresh,
	} = await useFetch(`${config.public.apiBase}/restaurants`);

	const editRestaurant = (restaurant) => {
		editingRestaurant.value = restaurant;
		showAddModal.value = true;
	};

	const deleteRestaurant = async (restaurant) => {
		if (confirm(`Are you sure you want to delete ${restaurant.name}?`)) {
			try {
				await $fetch(`${config.public.apiBase}/restaurants/${restaurant.id}`, {
					method: 'DELETE',
				});
				await refresh();
			} catch (err) {
				console.error('Failed to delete restaurant:', err);
			}
		}
	};

	const onRestaurantSaved = () => {
		showAddModal.value = false;
		editingRestaurant.value = null;
		refresh();
	};

	const viewRestaurantDetails = (restaurant) => {
		selectedRestaurant.value = restaurant;
		showDetailModal.value = true;
	};

	const closeDetailModal = () => {
		showDetailModal.value = false;
		selectedRestaurant.value = null;
	};

	useHead({
		title: 'Restaurants - Restaurant Discovery Engine',
	});
</script>
