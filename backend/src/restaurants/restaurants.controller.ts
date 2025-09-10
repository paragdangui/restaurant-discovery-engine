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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@ApiTags('restaurants')
@Controller('restaurants')
@UseGuards(ThrottlerGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

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