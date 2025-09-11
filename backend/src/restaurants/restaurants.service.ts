import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { SearchRestaurantDto, NearbyRestaurantDto } from './dto/search-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { YelpService, YelpBusiness, YelpSearchParams } from '../yelp/yelp.service';
import { AIService, UserPreferences } from '../ai/ai.service';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private readonly yelpService: YelpService,
    private readonly aiService: AIService,
  ) {}

  // Yelp Integration Methods
  async searchFromYelp(searchDto: SearchRestaurantDto): Promise<any> {
    const searchParams: YelpSearchParams = {
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

    const yelpResponse = await this.yelpService.searchRestaurants(searchParams);
    
    // Convert Yelp businesses to our format and save new ones
    const restaurants = await Promise.all(
      yelpResponse.businesses.map(async (business) => {
        return await this.convertYelpBusinessToRestaurant(business);
      })
    );

    return {
      restaurants,
      total: yelpResponse.total,
      region: yelpResponse.region,
    };
  }

  async findNearby(nearbyDto: NearbyRestaurantDto): Promise<Restaurant[]> {
    // First try to find from our database
    const localRestaurants = await this.restaurantRepository
      .createQueryBuilder('restaurant')
      .where('restaurant.latitude IS NOT NULL AND restaurant.longitude IS NOT NULL')
      .getMany();

    // Calculate distances and filter
    const nearbyLocal = localRestaurants
      .map(restaurant => ({
        ...restaurant,
        distance: this.yelpService.calculateDistance(
          nearbyDto.latitude,
          nearbyDto.longitude,
          restaurant.latitude!,
          restaurant.longitude!,
        ) * 1000, // Convert to meters
      }))
      .filter(restaurant => !nearbyDto.radius || restaurant.distance <= nearbyDto.radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, nearbyDto.limit || 10);

    // If we don't have enough local results, search Yelp
    if (nearbyLocal.length < (nearbyDto.limit || 10)) {
      try {
        const yelpResults = await this.yelpService.searchRestaurants({
          latitude: nearbyDto.latitude,
          longitude: nearbyDto.longitude,
          radius: nearbyDto.radius || 5000,
          limit: nearbyDto.limit || 10,
          sort_by: 'distance',
        });

        const yelpRestaurants = await Promise.all(
          yelpResults.businesses.map(business => 
            this.convertYelpBusinessToRestaurant(business)
          )
        );

        // Merge results, avoiding duplicates
        const allRestaurants = [...nearbyLocal];
        yelpRestaurants.forEach(yelpRestaurant => {
          if (!allRestaurants.find(r => r.yelpId === yelpRestaurant.yelpId)) {
            allRestaurants.push(yelpRestaurant);
          }
        });

        return allRestaurants.slice(0, nearbyDto.limit || 10);
      } catch (error) {
        this.logger.warn('Failed to fetch from Yelp, returning local results only', error);
      }
    }

    return nearbyLocal.map(({ distance, ...restaurant }) => restaurant);
  }

  async getTrendingRestaurants(limit: number = 10): Promise<Restaurant[]> {
    return await this.restaurantRepository.find({
      where: { reviewCount: 50 }, // MoreThan would need import
      order: { 
        rating: 'DESC',
        reviewCount: 'DESC', 
        createdAt: 'DESC' 
      },
      take: limit,
    });
  }

  async getRecommendations(userId?: string, preferences: UserPreferences = {}): Promise<any> {
    const restaurants = await this.restaurantRepository.find({
      order: { rating: 'DESC' },
      take: 50, // Get top restaurants for analysis
    });

    const searchHistory = []; // TODO: Implement search history retrieval

    const recommendations = await this.aiService.generateRecommendations(
      restaurants,
      preferences,
      searchHistory
    );

    return recommendations;
  }

  async syncRestaurantFromYelp(yelpId: string): Promise<Restaurant> {
    const yelpDetails = await this.yelpService.getRestaurantDetails(yelpId);
    
    let restaurant = await this.restaurantRepository.findOne({
      where: { yelpId }
    });

    if (restaurant) {
      // Update existing restaurant
      Object.assign(restaurant, this.mapYelpToRestaurant(yelpDetails));
      restaurant.lastSyncedAt = new Date();
    } else {
      // Create new restaurant
      restaurant = this.restaurantRepository.create({
        ...this.mapYelpToRestaurant(yelpDetails),
        lastSyncedAt: new Date(),
      });
    }

    return await this.restaurantRepository.save(restaurant);
  }

  async getYelpDetails(yelpId: string): Promise<any> {
    return await this.yelpService.getRestaurantDetails(yelpId);
  }

  async getYelpReviews(yelpId: string): Promise<any> {
    const reviews = await this.yelpService.getRestaurantReviews(yelpId);
    
    // Analyze sentiment for each review
    const sentimentAnalysis = await this.aiService.analyzeReviewSentiment(reviews.reviews);
    
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

  async getReviewSummary(yelpId: string): Promise<any> {
    const reviews = await this.yelpService.getRestaurantReviews(yelpId);
    return await this.aiService.summarizeReviews(reviews.reviews);
  }

  async analyzeDietaryCompatibility(yelpId: string, dietaryRestrictions: string[]): Promise<any> {
    // For now, return a basic analysis since we don't have menu data
    // In a real implementation, you'd fetch menu data from Yelp or other sources
    const mockMenuItems = [
      { name: 'Grilled Salmon', description: 'Fresh salmon with vegetables', price: 24.99 },
      { name: 'Caesar Salad', description: 'Romaine lettuce with parmesan', price: 12.99 },
      { name: 'Pasta Primavera', description: 'Pasta with fresh vegetables', price: 18.99 },
    ];

    return await this.aiService.analyzeDietaryCompatibility(mockMenuItems, dietaryRestrictions);
  }

  // Helper Methods
  private async convertYelpBusinessToRestaurant(business: YelpBusiness): Promise<Restaurant> {
    // Check if restaurant already exists
    let restaurant = await this.restaurantRepository.findOne({
      where: { yelpId: business.id }
    });

    if (!restaurant) {
      // Create new restaurant from Yelp data
      restaurant = await this.restaurantRepository.save(
        this.restaurantRepository.create({
          ...this.mapYelpToRestaurant(business),
          lastSyncedAt: new Date(),
        })
      );
    }

    return restaurant;
  }

  private mapYelpToRestaurant(yelpBusiness: YelpBusiness | any): Partial<Restaurant> {
    return {
      yelpId: yelpBusiness.id,
      name: yelpBusiness.name,
      description: yelpBusiness.description || null,
      cuisine: this.yelpService.formatYelpCategories(yelpBusiness.categories || []),
      address: yelpBusiness.location?.display_address?.join(', ') || '',
      phone: yelpBusiness.display_phone || yelpBusiness.phone || null,
      rating: yelpBusiness.rating || null,
      reviewCount: yelpBusiness.review_count || 0,
      latitude: yelpBusiness.coordinates?.latitude || null,
      longitude: yelpBusiness.coordinates?.longitude || null,
      photos: yelpBusiness.photos || [yelpBusiness.image_url].filter(Boolean),
      priceLevel: this.yelpService.getPriceLevelFromYelp(yelpBusiness.price),
      categories: yelpBusiness.categories || [],
      hours: yelpBusiness.hours || [],
      url: yelpBusiness.url || null,
      isClosed: yelpBusiness.is_closed || false,
      transactions: yelpBusiness.transactions || [],
      attributes: yelpBusiness.attributes || {},
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

  async update(id: number, updateRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
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