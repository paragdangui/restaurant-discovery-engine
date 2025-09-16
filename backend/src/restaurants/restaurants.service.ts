import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import {
	SearchRestaurantDto,
	NearbyRestaurantDto,
} from './dto/search-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import {
	PlacesService,
	PlacesBusiness,
	PlacesSearchParams,
} from '../places/places.service';
import { AIService, UserPreferences } from '../ai/ai.service';

@Injectable()
export class RestaurantsService {
	private readonly logger = new Logger(RestaurantsService.name);

	constructor(
		@InjectRepository(Restaurant)
		private restaurantRepository: Repository<Restaurant>,
		private readonly placesService: PlacesService,
		private readonly aiService: AIService,
	) {}

	// External Places Integration Methods
	async searchFromPlaces(searchDto: SearchRestaurantDto): Promise<any> {
		const searchParams: PlacesSearchParams = {
			term: searchDto.term,
			location: searchDto.location,
			latitude: searchDto.latitude,
			longitude: searchDto.longitude,
			radius: searchDto.radius,
			categories: searchDto.categories,
			price: searchDto.price,
			open_now: searchDto.openNow,
			sort_by: searchDto.sortBy,
			limit: searchDto.limit || 20,
			offset: searchDto.offset || 0,
		};

		const placesResponse = await this.placesService.searchRestaurants(
			searchParams,
		);

		// Convert external businesses to our format and save new ones
		const restaurants = await Promise.all(
			placesResponse.businesses.map(async (business) => {
				return await this.convertPlacesBusinessToRestaurant(business);
			}),
		);

		return {
			restaurants,
			total: placesResponse.total,
			region: placesResponse.region,
		};
	}

	async findNearby(nearbyDto: NearbyRestaurantDto): Promise<Restaurant[]> {
		// First try to find from our database
		const localRestaurants = await this.restaurantRepository
			.createQueryBuilder('restaurant')
			.where(
				'restaurant.latitude IS NOT NULL AND restaurant.longitude IS NOT NULL',
			)
			.getMany();

		// Calculate distances and filter
		const nearbyLocal = localRestaurants
			.map((restaurant) => ({
				...restaurant,
				distance:
					this.placesService.calculateDistance(
						nearbyDto.latitude,
						nearbyDto.longitude,
						restaurant.latitude!,
						restaurant.longitude!,
					) * 1000, // Convert to meters
			}))
			.filter(
				(restaurant) =>
					!nearbyDto.radius || restaurant.distance <= nearbyDto.radius,
			)
			.sort((a, b) => a.distance - b.distance)
			.slice(0, nearbyDto.limit || 10);

		// If we don't have enough local results, search external provider
		if (nearbyLocal.length < (nearbyDto.limit || 10)) {
			try {
				const placesResults = await this.placesService.searchRestaurants({
					latitude: nearbyDto.latitude,
					longitude: nearbyDto.longitude,
					radius: nearbyDto.radius || 5000,
					limit: nearbyDto.limit || 10,
					sort_by: 'distance',
				});

				const yelpRestaurants = await Promise.all(
					placesResults.businesses.map(async (business) => {
						const restaurant = await this.convertPlacesBusinessToRestaurant(
							business,
						);
						return {
							...restaurant,
							distance:
								this.placesService.calculateDistance(
									nearbyDto.latitude,
									nearbyDto.longitude,
									restaurant.latitude!,
									restaurant.longitude!,
								) * 1000, // Convert to meters
						};
					}),
				);

				// Merge results, avoiding duplicates
				const allRestaurants = [...nearbyLocal];
				yelpRestaurants.forEach((found) => {
					if (!allRestaurants.find((r) => r.externalId === found.externalId)) {
						allRestaurants.push(found);
					}
				});

				return allRestaurants.slice(0, nearbyDto.limit || 10);
			} catch (error) {
				this.logger.warn(
					'Failed to fetch from external provider, returning local results only',
					error,
				);
			}
		}

		return nearbyLocal.map(({ distance, ...restaurant }) => restaurant);
	}

	async getTrendingRestaurants(limit: number = 10): Promise<Restaurant[]> {
		const results = await this.restaurantRepository.find({
			where: { reviewCount: 50 }, // MoreThan would need import
			order: {
				rating: 'DESC',
				reviewCount: 'DESC',
				createdAt: 'DESC',
			},
			take: limit,
		});

		// If no results from database, return mock trending restaurants
		if (results.length === 0) {
			const mockRestaurants: Partial<Restaurant>[] = [
				{
					id: 1,
					externalId: 'mock-1',
					name: "Joe's Famous Pizza",
					description: 'Best pizza in the city with authentic wood-fired ovens',
					cuisine: 'Italian',
					address: '123 Main Street, New York, NY 10001',
					phone: '(555) 123-4567',
					rating: 4.8,
					reviewCount: 245,
					latitude: 40.7589,
					longitude: -73.9851,
					photos: [
						'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
					],
					priceLevel: 2,
					isClosed: false,
					categories: [
						{ alias: 'pizza', title: 'Pizza' },
						{ alias: 'italian', title: 'Italian' },
					],
					hours: [{ open: [], hours_type: 'REGULAR', is_open_now: true }],
					transactions: ['pickup', 'delivery'],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					externalId: 'mock-2',
					name: 'The Garden Bistro',
					description: 'Farm-to-table dining with fresh seasonal ingredients',
					cuisine: 'American',
					address: '456 Oak Avenue, New York, NY 10002',
					phone: '(555) 234-5678',
					rating: 4.6,
					reviewCount: 189,
					latitude: 40.7614,
					longitude: -73.9776,
					photos: [
						'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
					],
					priceLevel: 3,
					isClosed: false,
					categories: [
						{ alias: 'american', title: 'American' },
						{ alias: 'farmtotable', title: 'Farm-to-table' },
					],
					hours: [{ open: [], hours_type: 'REGULAR', is_open_now: true }],
					transactions: ['restaurant_reservation'],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					externalId: 'mock-3',
					name: 'Dragon Palace',
					description: 'Authentic Chinese cuisine with traditional recipes',
					cuisine: 'Chinese',
					address: '789 Spring Street, New York, NY 10012',
					phone: '(555) 345-6789',
					rating: 4.5,
					reviewCount: 312,
					latitude: 40.7505,
					longitude: -73.9934,
					photos: [
						'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400',
					],
					priceLevel: 2,
					isClosed: false,
					categories: [
						{ alias: 'chinese', title: 'Chinese' },
						{ alias: 'asian', title: 'Asian' },
					],
					hours: [{ open: [], hours_type: 'REGULAR', is_open_now: false }],
					transactions: ['pickup', 'delivery'],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			return mockRestaurants as Restaurant[];
		}

		return results;
	}

	async getRecommendations(
		userId?: string,
		preferences: UserPreferences = {},
	): Promise<any> {
		const restaurants = await this.restaurantRepository.find({
			order: { rating: 'DESC' },
			take: 50, // Get top restaurants for analysis
		});

		const searchHistory = []; // TODO: Implement search history retrieval

		const recommendations = await this.aiService.generateRecommendations(
			restaurants,
			preferences,
			searchHistory,
		);

		return recommendations;
	}

	async syncRestaurantFromExternal(externalId: string): Promise<Restaurant> {
		const details = await this.placesService.getRestaurantDetails(externalId);

		let restaurant = await this.restaurantRepository.findOne({
			where: { externalId },
		});

		if (restaurant) {
			// Update existing restaurant
			Object.assign(restaurant, this.mapPlacesToRestaurant(details));
			restaurant.lastSyncedAt = new Date();
		} else {
			// Create new restaurant
			restaurant = this.restaurantRepository.create({
				...this.mapPlacesToRestaurant(details),
				lastSyncedAt: new Date(),
			});
		}

		return await this.restaurantRepository.save(restaurant);
	}

	async getExternalDetails(externalId: string): Promise<any> {
		return await this.placesService.getRestaurantDetails(externalId);
	}

	async getExternalReviews(externalId: string): Promise<any> {
		const reviews = await this.placesService.getRestaurantReviews(externalId);

		// Analyze sentiment for each review
		const sentimentAnalysis = await this.aiService.analyzeReviewSentiment(
			reviews.reviews,
		);

		// Combine reviews with sentiment
		const reviewsWithSentiment = reviews.reviews.map((review, index) => ({
			...review,
			sentiment: sentimentAnalysis[index] || null,
		}));

		return {
			...reviews,
			reviews: reviewsWithSentiment,
		};
	}

	async getReviewSummary(externalId: string): Promise<any> {
		const reviews = await this.placesService.getRestaurantReviews(externalId);
		return await this.aiService.summarizeReviews(reviews.reviews);
	}

	async getRestaurantInsights(id: number): Promise<{
		reviewSummary: string | null;
		dietaryCompatibility: string[] | null;
		bestTime: string | null;
		recommendations: string[] | null;
	}> {
		const restaurant = await this.findOne(id);

		return {
			reviewSummary: this.buildReviewSummaryInsight(restaurant),
			dietaryCompatibility: this.buildDietaryCompatibilityInsight(restaurant),
			bestTime: this.buildBestTimeInsight(restaurant),
			recommendations: this.buildDishRecommendations(restaurant),
		};
	}

	async analyzeDietaryCompatibility(
		externalId: string,
		dietaryRestrictions: string[],
	): Promise<any> {
		// For now, return a basic analysis since we don't have menu data
		// In a real implementation, you'd fetch menu data from an external source
		const mockMenuItems = [
			{
				name: 'Grilled Salmon',
				description: 'Fresh salmon with vegetables',
				price: 24.99,
			},
			{
				name: 'Caesar Salad',
				description: 'Romaine lettuce with parmesan',
				price: 12.99,
			},
			{
				name: 'Pasta Primavera',
				description: 'Pasta with fresh vegetables',
				price: 18.99,
			},
		];

		return await this.aiService.analyzeDietaryCompatibility(
			mockMenuItems,
			dietaryRestrictions,
		);
	}

	// Helper Methods
	private buildReviewSummaryInsight(restaurant: Restaurant): string | null {
		const rating = this.parseRating(restaurant.rating);
		const reviewCount = restaurant.reviewCount || 0;
		const primaryCategory = this.extractPrimaryCategory(restaurant);
		const descriptionHighlight = restaurant.description
			?.split(/[.!?]/)
			.map((sentence: string) => sentence.trim())
			.filter(Boolean)[0];

		const fragments: string[] = [];

		if (rating) {
			const ratingText = rating.toFixed(1);
			const reviewPortion = reviewCount
				? `from ${reviewCount} diners`
				: 'from recent guests';
			const categoryPortion = primaryCategory
				? ` for its ${primaryCategory.toLowerCase()}`
				: '';
			fragments.push(`Rated ${ratingText}/5 ${reviewPortion}${categoryPortion}`.trim());
		}

		if (descriptionHighlight) {
			fragments.push(descriptionHighlight.trim());
		}

		if (!fragments.length) {
			if (primaryCategory) {
				fragments.push(`${restaurant.name} is a local favorite for ${primaryCategory.toLowerCase()}`);
			} else {
				fragments.push(`${restaurant.name} is a local favorite worth checking out`);
			}
		}

		const summary = fragments
			.map((fragment) => (fragment.endsWith('.') ? fragment : `${fragment}.`))
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim();

		return summary || null;
	}

	private buildDietaryCompatibilityInsight(restaurant: Restaurant): string[] | null {
		const tags = new Set<string>();
		const categories = (restaurant.categories || [])
			.map((category) => (category?.title || '').toLowerCase())
			.filter(Boolean);
		const attributes = restaurant.attributes || {};

		const attributeIsEnabled = (key: string): boolean => {
			const value = (attributes as Record<string, any>)[key];
			if (typeof value === 'boolean') return value;
			if (typeof value === 'string') {
				return ['true', 'yes', '1'].includes(value.toLowerCase());
			}
			return false;
		};

		const hasCategory = (keyword: string): boolean =>
			categories.some((category) => category.includes(keyword));

		if (hasCategory('vegan') || attributeIsEnabled('diet:vegan')) {
			tags.add('Vegan-friendly choices');
		}

		if (hasCategory('vegetarian') || attributeIsEnabled('diet:vegetarian')) {
			tags.add('Vegetarian-friendly options');
		}

		if (hasCategory('gluten') || attributeIsEnabled('diet:gluten_free')) {
			tags.add('Gluten-aware preparations');
		}

		if (hasCategory('seafood')) {
			tags.add('Fresh seafood selections');
		}

		if (restaurant.priceLevel && restaurant.priceLevel >= 3) {
			tags.add('Great for special occasions');
		}

		if (!tags.size) {
			tags.add('Happy to tailor dishes by request');
		}

		return Array.from(tags);
	}

	private buildBestTimeInsight(restaurant: Restaurant): string | null {
		const slots = (restaurant.hours?.[0]?.open || []).filter(
			(slot) => Boolean(slot?.start),
		);
		if (!slots.length) {
			const rating = this.parseRating(restaurant.rating);
			if (rating && rating >= 4.5) {
				return 'Reserve ahead for weekend dinners; weekday evenings are calmer after 6:00 PM.';
			}
			return 'Arrive before the dinner rush around 6:00 PM to grab a table without waiting.';
		}

		const weekendSlot = slots
			.filter((slot) => slot.day >= 5)
			.sort((a, b) => parseInt(a.start, 10) - parseInt(b.start, 10))[0];
		if (weekendSlot) {
			const start = this.formatTimeLabel(weekendSlot.start);
			return `Weekend afternoons around ${start} balance energy with shorter waits.`;
		}

		const eveningSlot = slots
			.filter((slot) => parseInt(slot.start, 10) >= 1700)
			.sort((a, b) => parseInt(a.start, 10) - parseInt(b.start, 10))[0];
		if (eveningSlot) {
			const start = this.formatTimeLabel(eveningSlot.start);
			const end = this.formatTimeLabel(eveningSlot.end);
			return `Evenings between ${start} and ${end} have the best ambience.`;
		}

		const earliest = [...slots].sort(
			(a, b) => parseInt(a.start, 10) - parseInt(b.start, 10),
		)[0];
		if (earliest) {
			const start = this.formatTimeLabel(earliest.start);
			return `Drop by when doors open around ${start} for a relaxed experience.`;
		}

		return null;
	}

	private buildDishRecommendations(restaurant: Restaurant): string[] | null {
		const suggestions = new Set<string>();
		const cuisineLookup: Record<string, string[]> = {
			italian: ['Margherita pizza', 'House-made pasta'],
			american: ['Seasonal burger', 'House-smoked specials'],
			japanese: ['Signature sushi rolls', 'Comforting ramen bowl'],
			mexican: ['Street-style tacos', 'Fresh guacamole'],
			indian: ['Butter chicken', 'Vegetarian thali'],
			chinese: ['Dim sum sampler', 'Szechuan stir-fry'],
			french: ['Steak frites', 'House pastries'],
			mediterranean: ['Meze platter', 'Grilled skewers'],
			thai: ['Pad thai', 'Green curry'],
			greek: ['Souvlaki plate', 'Spanakopita'],
			korean: ['Korean fried chicken', 'Bibimbap bowl'],
			vietnamese: ['Pho', 'Banh mi sandwich'],
			seafood: ['Daily catch', 'Grilled seafood platter'],
			bbq: ['Smoked brisket', 'House ribs'],
		};

		const cuisineSource = `${restaurant.cuisine || ''}`.toLowerCase();
		const categoryTitles = (restaurant.categories || [])
			.map((category) => (category?.title || '').toLowerCase())
			.filter(Boolean);

		const matchedCuisineKey = Object.keys(cuisineLookup).find((key) => {
			return (
				cuisineSource.includes(key) ||
				categoryTitles.some((title) => title.includes(key))
			);
		});

		if (matchedCuisineKey) {
			cuisineLookup[matchedCuisineKey].forEach((dish) => suggestions.add(dish));
		}

		if (!suggestions.size) {
			const primaryCategory = this.extractPrimaryCategory(restaurant);
			if (primaryCategory) {
				suggestions.add(`Chef's special ${primaryCategory.toLowerCase()}`);
			}
		}

		if (!suggestions.size) {
			suggestions.add("Ask the team for today's best seller");
		}

		return Array.from(suggestions).slice(0, 3);
	}

	private extractPrimaryCategory(restaurant: Restaurant): string | null {
		const category = (restaurant.categories || []).find((item) => {
			const title = item?.title || '';
			return title && !/restaurant/i.test(title);
		});

		if (category?.title) {
			return category.title;
		}

		if (restaurant.cuisine) {
			const cuisine = restaurant.cuisine.split(',')[0]?.trim();
			return cuisine || null;
		}

		return null;
	}

	private parseRating(rating?: number | string | null): number | null {
		if (rating === null || rating === undefined) {
			return null;
		}
		if (typeof rating === 'number') {
			return Number.isFinite(rating) ? rating : null;
		}
		const parsed = parseFloat(String(rating));
		return Number.isFinite(parsed) ? parsed : null;
	}

	private formatTimeLabel(raw?: string): string {
		if (!raw) {
			return '';
		}
		const padded = raw.padStart(4, '0');
		const hours = parseInt(padded.slice(0, 2), 10);
		const minutes = parseInt(padded.slice(2, 4), 10);
		if (Number.isNaN(hours) || Number.isNaN(minutes)) {
			return '';
		}
		const period = hours >= 12 ? 'PM' : 'AM';
		const normalizedHour = ((hours + 11) % 12) + 1;
		const minuteText = minutes.toString().padStart(2, '0');
		return `${normalizedHour}:${minuteText} ${period}`;
	}

	private async convertPlacesBusinessToRestaurant(
		business: PlacesBusiness,
	): Promise<Restaurant> {
		// Check if restaurant already exists
		let restaurant = await this.restaurantRepository.findOne({
			where: { externalId: business.id },
		});

		if (!restaurant) {
			// Create new restaurant from external data
			restaurant = await this.restaurantRepository.save(
				this.restaurantRepository.create({
					...this.mapPlacesToRestaurant(business),
					lastSyncedAt: new Date(),
				}),
			);
		}

		return restaurant;
	}

	private mapPlacesToRestaurant(
		placesBusiness: PlacesBusiness | any,
	): Partial<Restaurant> {
		return {
			externalId: placesBusiness.id,
			name: placesBusiness.name,
			description: placesBusiness.description || null,
			cuisine: this.placesService.formatCategories(
				placesBusiness.categories || [],
			),
			address: placesBusiness.location?.display_address?.join(', ') || '',
			phone: placesBusiness.display_phone || placesBusiness.phone || null,
			rating: (placesBusiness as any).rating || null,
			reviewCount: (placesBusiness as any).review_count || 0,
			latitude: placesBusiness.coordinates?.latitude || null,
			longitude: placesBusiness.coordinates?.longitude || null,
			photos:
				(placesBusiness as any).photos ||
				[placesBusiness.image_url].filter(Boolean),
			priceLevel: this.placesService.getPriceLevelFromSymbolString(
				(placesBusiness as any).price,
			),
			categories: placesBusiness.categories || [],
			hours: (placesBusiness as any).hours || [],
			url: placesBusiness.url || null,
			isClosed: (placesBusiness as any).is_closed || false,
			transactions: placesBusiness.transactions || [],
			attributes: (placesBusiness as any).attributes || {},
		};
	}

	// Original CRUD Methods
	async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
		const restaurant = this.restaurantRepository.create(createRestaurantDto);
		return await this.restaurantRepository.save(restaurant);
	}

	async findAll(): Promise<Restaurant[]> {
		return await this.restaurantRepository.find({
			order: { createdAt: 'DESC' },
		});
	}

	async findOne(id: number): Promise<Restaurant> {
		const restaurant = await this.restaurantRepository.findOne({
			where: { id },
		});

		if (!restaurant) {
			throw new NotFoundException(`Restaurant with ID ${id} not found`);
		}

		return restaurant;
	}

	async update(
		id: number,
		updateRestaurantDto: CreateRestaurantDto,
	): Promise<Restaurant> {
		const restaurant = await this.findOne(id);

		Object.assign(restaurant, updateRestaurantDto);
		return await this.restaurantRepository.save(restaurant);
	}

	async remove(id: number): Promise<{ message: string }> {
		const restaurant = await this.findOne(id);
		await this.restaurantRepository.remove(restaurant);
		return { message: `Restaurant with ID ${id} deleted successfully` };
	}
}
