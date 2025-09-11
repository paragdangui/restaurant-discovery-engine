import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { SearchRestaurantDto, NearbyRestaurantDto } from './dto/search-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@ApiTags('restaurants')
@Controller('restaurants')
@UseGuards(ThrottlerGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search restaurants using Yelp API' })
  @ApiResponse({ status: 200, description: 'Returns search results from Yelp' })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  async searchRestaurants(@Query() searchDto: SearchRestaurantDto) {
    if (!searchDto.location && (!searchDto.latitude || !searchDto.longitude)) {
      throw new HttpException(
        'Either location or coordinates (latitude/longitude) must be provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.restaurantsService.searchFromYelp(searchDto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby restaurants' })
  @ApiResponse({ status: 200, description: 'Returns nearby restaurants' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async findNearby(@Query() nearbyDto: NearbyRestaurantDto) {
    return await this.restaurantsService.findNearby(nearbyDto);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending restaurants' })
  @ApiResponse({ status: 200, description: 'Returns trending restaurants', type: [Restaurant] })
  async getTrending(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return await this.restaurantsService.getTrendingRestaurants(limitNumber);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get AI-powered restaurant recommendations' })
  @ApiResponse({ status: 200, description: 'Returns personalized recommendations' })
  async getRecommendations(
    @Query('userId') userId?: string,
    @Query('preferences') preferences?: string,
  ) {
    const parsedPreferences = preferences ? JSON.parse(preferences) : {};
    return await this.restaurantsService.getRecommendations(userId, parsedPreferences);
  }

  @Post(':yelpId/sync')
  @ApiOperation({ summary: 'Sync restaurant data from Yelp' })
  @ApiParam({ name: 'yelpId', description: 'Yelp business ID' })
  @ApiResponse({ status: 200, description: 'Restaurant synced successfully', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found on Yelp' })
  async syncFromYelp(@Param('yelpId') yelpId: string) {
    return await this.restaurantsService.syncRestaurantFromYelp(yelpId);
  }

  @Get(':yelpId/details')
  @ApiOperation({ summary: 'Get restaurant details from Yelp' })
  @ApiParam({ name: 'yelpId', description: 'Yelp business ID' })
  @ApiResponse({ status: 200, description: 'Returns restaurant details from Yelp' })
  @ApiResponse({ status: 404, description: 'Restaurant not found on Yelp' })
  async getYelpDetails(@Param('yelpId') yelpId: string) {
    return await this.restaurantsService.getYelpDetails(yelpId);
  }

  @Get(':yelpId/reviews')
  @ApiOperation({ summary: 'Get restaurant reviews from Yelp' })
  @ApiParam({ name: 'yelpId', description: 'Yelp business ID' })
  @ApiResponse({ status: 200, description: 'Returns restaurant reviews from Yelp' })
  @ApiResponse({ status: 404, description: 'Restaurant not found on Yelp' })
  async getYelpReviews(@Param('yelpId') yelpId: string) {
    return await this.restaurantsService.getYelpReviews(yelpId);
  }

  @Get(':yelpId/reviews/summary')
  @ApiOperation({ summary: 'Get AI-powered review summary' })
  @ApiParam({ name: 'yelpId', description: 'Yelp business ID' })
  @ApiResponse({ status: 200, description: 'Returns AI-generated review summary' })
  async getReviewSummary(@Param('yelpId') yelpId: string) {
    return await this.restaurantsService.getReviewSummary(yelpId);
  }

  @Post(':yelpId/analyze-menu')
  @ApiOperation({ summary: 'Analyze menu for dietary restrictions' })
  @ApiParam({ name: 'yelpId', description: 'Yelp business ID' })
  @ApiResponse({ status: 200, description: 'Returns dietary compatibility analysis' })
  async analyzeMenu(
    @Param('yelpId') yelpId: string,
    @Body('dietaryRestrictions') dietaryRestrictions: string[],
  ) {
    return await this.restaurantsService.analyzeDietaryCompatibility(yelpId, dietaryRestrictions);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new restaurant' })
  @ApiResponse({ status: 201, description: 'Restaurant created successfully', type: Restaurant })
  async create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return await this.restaurantsService.create(createRestaurantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all restaurants' })
  @ApiResponse({ status: 200, description: 'Returns all restaurants', type: [Restaurant] })
  async findAll() {
    return await this.restaurantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a restaurant by ID' })
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns a restaurant', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a restaurant' })
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully', type: Restaurant })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRestaurantDto: CreateRestaurantDto) {
    return await this.restaurantsService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a restaurant' })
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Restaurant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.restaurantsService.remove(id);
  }
}