import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PlacesSearchParams {
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

export interface PlacesBusiness {
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

export interface PlacesSearchResponse {
  businesses: PlacesBusiness[];
  total: number;
  region: {
    center: { latitude: number; longitude: number };
  };
}

export interface PlacesBusinessDetails extends PlacesBusiness {
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

export interface PlacesReview {
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

export interface PlacesReviewsResponse {
  reviews: PlacesReview[];
  total: number;
  possible_languages: string[];
}

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly overpassUrl: string;
  private readonly nominatimUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.overpassUrl = this.configService.get<string>('OVERPASS_URL') || 'https://overpass-api.de/api/interpreter';
    this.nominatimUrl = this.configService.get<string>('NOMINATIM_URL') || 'https://nominatim.openstreetmap.org';
  }

  async searchRestaurants(params: PlacesSearchParams): Promise<PlacesSearchResponse> {
    try {
      let latitude = params.latitude;
      let longitude = params.longitude;

      if ((latitude === undefined || longitude === undefined) && params.location) {
        const geoUrl = `${this.nominatimUrl}/search?format=json&q=${encodeURIComponent(params.location)}&limit=1`;
        const geoData = await firstValueFrom(
          this.httpService.get(geoUrl, { headers: { 'User-Agent': 'restaurant-discovery-engine/1.0' } }).pipe(
            map(r => r.data),
          ),
        );
        if (Array.isArray(geoData) && geoData.length > 0) {
          latitude = parseFloat(geoData[0].lat);
          longitude = parseFloat(geoData[0].lon);
        }
      }

      if (latitude === undefined || longitude === undefined) {
        throw new HttpException('Missing coordinates or resolvable location', HttpStatus.BAD_REQUEST);
      }

      const radius = Math.min(params.radius || 5000, 40000);
      const limit = Math.min(params.limit || 20, 50);

      const cuisineFilter = params.categories ? `["cuisine"~"${params.categories}",i]` : '';
      const nameFilter = params.term ? `["name"~"${params.term}",i]` : '';
      const ql = `[
        out:json][timeout:25];
        (
          node["amenity"="restaurant"]${cuisineFilter}${nameFilter}(around:${radius},${latitude},${longitude});
          way["amenity"="restaurant"]${cuisineFilter}${nameFilter}(around:${radius},${latitude},${longitude});
          relation["amenity"="restaurant"]${cuisineFilter}${nameFilter}(around:${radius},${latitude},${longitude});
        );
        out center tags ${limit};`;

      const response = await firstValueFrom(
        this.httpService
          .post(
            this.overpassUrl,
            new URLSearchParams({ data: ql }).toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'restaurant-discovery-engine/1.0',
              },
            },
          )
          .pipe(map(r => r.data)),
      );

      const elements: any[] = response.elements || [];
      const businesses: PlacesBusiness[] = elements.map((el) => this.mapOsmToPlacesBusiness(el));

      return {
        businesses,
        total: businesses.length,
        region: { center: { latitude, longitude } },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`OSM search error: ${error?.message || error}`);
      throw new HttpException('OSM search service temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getRestaurantDetails(externalId: string): Promise<PlacesBusinessDetails> {
    try {
      const parsed = this.parseOsmId(externalId);
      const ql = `[
        out:json][timeout:25];
        ${parsed.type}(${parsed.id});
        out center tags;`;

      const response = await firstValueFrom(
        this.httpService
          .post(
            this.overpassUrl,
            new URLSearchParams({ data: ql }).toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'restaurant-discovery-engine/1.0',
              },
            },
          )
          .pipe(map(r => r.data)),
      );

      const el = (response.elements || [])[0];
      if (!el) {
        throw new HttpException('Restaurant not found on OSM', HttpStatus.NOT_FOUND);
      }
      const base = this.mapOsmToPlacesBusiness(el);
      const details: PlacesBusinessDetails = {
        ...base,
        photos: [],
        hours: [],
        special_hours: [],
        attributes: {},
      };
      return details;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`OSM details error: ${error?.message || error}`);
      throw new HttpException('OSM details service temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getRestaurantReviews(externalId: string, locale: string = 'en_US'): Promise<PlacesReviewsResponse> {
    return {
      reviews: [],
      total: 0,
      possible_languages: [locale],
    };
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.searchRestaurants({ term: 'restaurant', latitude: 37.7749, longitude: -122.4194, limit: 1 });
      return true;
    } catch (error) {
      this.logger.error('OSM connection validation failed', error);
      return false;
    }
  }

  getPriceLevelFromSymbolString(price?: string): number | null {
    if (!price) return null;
    return price.length;
  }

  formatCategories(categories: { alias: string; title: string }[]): string {
    return categories.map(cat => cat.title).join(', ');
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private parseOsmId(value: string): { type: 'node' | 'way' | 'relation'; id: string } {
    const m = String(value).match(/osm-(node|way|relation)-(\d+)/i);
    if (m) return { type: m[1] as any, id: m[2] };
    return { type: 'node', id: String(value).replace(/\D/g, '') };
  }

  private mapOsmToPlacesBusiness(el: any): PlacesBusiness {
    const tags = el.tags || {};
    const center = el.center || { lat: el.lat, lon: el.lon };
    const id = `osm-${el.type}-${el.id}`;
    const cuisines = (tags['cuisine'] || '')
      .split(';')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const categories = cuisines.length > 0
      ? cuisines.map((c: string) => ({ alias: c.toLowerCase().replace(/\s+/g, '-'), title: c }))
      : [{ alias: 'restaurant', title: 'Restaurant' }];

    const addressParts = [
      tags['addr:housenumber'] && tags['addr:street'] ? `${tags['addr:housenumber']} ${tags['addr:street']}` : (tags['addr:street'] || ''),
      tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || '',
      tags['addr:state'] || '',
      tags['addr:postcode'] || '',
    ].filter(Boolean);

    return {
      id,
      alias: id,
      name: tags.name || 'Unnamed Restaurant',
      image_url: '',
      is_closed: tags['opening_hours'] ? false : false,
      url: tags.website || '',
      review_count: 0,
      categories,
      rating: null as unknown as number,
      coordinates: { latitude: center?.lat, longitude: center?.lon },
      transactions: [],
      price: undefined,
      location: {
        address1: addressParts[0] || '',
        address2: '',
        address3: '',
        city: tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || '',
        zip_code: tags['addr:postcode'] || '',
        country: tags['addr:country'] || '',
        state: tags['addr:state'] || '',
        display_address: addressParts,
      },
      phone: tags.phone || '',
      display_phone: tags.phone || '',
      distance: undefined,
    } as PlacesBusiness;
  }
}

