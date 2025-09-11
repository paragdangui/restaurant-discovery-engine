import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface YelpSearchParams {
  term?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  categories?: string;
  price?: string;
  open_now?: boolean;
  sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
  limit?: number;
  offset?: number;
}

export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  image_url: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: { alias: string; title: string }[];
  rating: number;
  coordinates: { latitude: number; longitude: number };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance?: number;
}

export interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: { latitude: number; longitude: number };
  };
}

export interface YelpBusinessDetails extends YelpBusiness {
  photos: string[];
  hours?: {
    open: {
      is_overnight: boolean;
      start: string;
      end: string;
      day: number;
    }[];
    hours_type: string;
    is_open_now: boolean;
  }[];
  special_hours?: any[];
  attributes?: { [key: string]: any };
}

export interface YelpReview {
  id: string;
  rating: number;
  user: {
    id: string;
    profile_url: string;
    image_url?: string;
    name: string;
  };
  text: string;
  time_created: string;
  url: string;
}

export interface YelpReviewsResponse {
  reviews: YelpReview[];
  total: number;
  possible_languages: string[];
}

@Injectable()
export class YelpService {
  private readonly logger = new Logger(YelpService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.yelp.com/v3';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('YELP_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('YELP_API_KEY not provided. Yelp integration will be disabled.');
    }
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async searchRestaurants(params: YelpSearchParams): Promise<YelpSearchResponse> {
    if (!this.apiKey) {
      throw new HttpException(
        'Yelp API key not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const queryParams = new URLSearchParams();
      
      // Build query parameters
      if (params.term) queryParams.append('term', params.term);
      if (params.location) queryParams.append('location', params.location);
      if (params.latitude !== undefined) queryParams.append('latitude', params.latitude.toString());
      if (params.longitude !== undefined) queryParams.append('longitude', params.longitude.toString());
      if (params.radius) queryParams.append('radius', Math.min(params.radius, 40000).toString()); // Max 40km
      if (params.categories) queryParams.append('categories', params.categories);
      if (params.price) queryParams.append('price', params.price);
      if (params.open_now !== undefined) queryParams.append('open_now', params.open_now.toString());
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.limit) queryParams.append('limit', Math.min(params.limit, 50).toString()); // Max 50
      if (params.offset) queryParams.append('offset', params.offset.toString());

      // Always search for restaurants/food
      queryParams.append('categories', 'restaurants,food');

      const url = `${this.baseUrl}/businesses/search?${queryParams.toString()}`;
      
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getHeaders() }).pipe(
          map(response => response.data),
          catchError((error) => {
            this.logger.error(`Yelp API search error: ${error.message}`, error.stack);
            throw new HttpException(
              'Failed to search restaurants from Yelp',
              HttpStatus.BAD_GATEWAY,
            );
          }),
        ),
      );

      this.logger.log(`Yelp search returned ${response.businesses?.length || 0} results`);
      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Yelp search service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getRestaurantDetails(yelpId: string): Promise<YelpBusinessDetails> {
    if (!this.apiKey) {
      throw new HttpException(
        'Yelp API key not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const url = `${this.baseUrl}/businesses/${yelpId}`;
      
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getHeaders() }).pipe(
          map(response => response.data),
          catchError((error) => {
            if (error.response?.status === 404) {
              throw new HttpException(
                'Restaurant not found on Yelp',
                HttpStatus.NOT_FOUND,
              );
            }
            this.logger.error(`Yelp API details error: ${error.message}`, error.stack);
            throw new HttpException(
              'Failed to get restaurant details from Yelp',
              HttpStatus.BAD_GATEWAY,
            );
          }),
        ),
      );

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Yelp details service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getRestaurantReviews(yelpId: string, locale: string = 'en_US'): Promise<YelpReviewsResponse> {
    if (!this.apiKey) {
      throw new HttpException(
        'Yelp API key not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const url = `${this.baseUrl}/businesses/${yelpId}/reviews?locale=${locale}&sort_by=newest`;
      
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getHeaders() }).pipe(
          map(response => response.data),
          catchError((error) => {
            if (error.response?.status === 404) {
              throw new HttpException(
                'Restaurant reviews not found on Yelp',
                HttpStatus.NOT_FOUND,
              );
            }
            this.logger.error(`Yelp API reviews error: ${error.message}`, error.stack);
            throw new HttpException(
              'Failed to get restaurant reviews from Yelp',
              HttpStatus.BAD_GATEWAY,
            );
          }),
        ),
      );

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Yelp reviews service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Simple test search to validate API key
      await this.searchRestaurants({
        term: 'restaurant',
        location: 'San Francisco',
        limit: 1
      });
      return true;
    } catch (error) {
      this.logger.error('Yelp API connection validation failed', error);
      return false;
    }
  }

  getPriceLevelFromYelp(yelpPrice?: string): number | null {
    if (!yelpPrice) return null;
    return yelpPrice.length; // Yelp uses $ to $$$$, so length gives us 1-4
  }

  formatYelpCategories(categories: { alias: string; title: string }[]): string {
    return categories.map(cat => cat.title).join(', ');
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }
}