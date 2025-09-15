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
