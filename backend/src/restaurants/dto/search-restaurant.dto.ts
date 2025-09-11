import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchRestaurantDto {
  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  term?: string;

  @ApiProperty({ description: 'Location (address, city, etc.)', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Latitude', required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude?: number;

  @ApiProperty({ description: 'Search radius in meters (max 40000)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(40000)
  @Transform(({ value }) => parseInt(value))
  radius?: number;

  @ApiProperty({ description: 'Comma-separated categories', required: false })
  @IsOptional()
  @IsString()
  categories?: string;

  @ApiProperty({ description: 'Price levels (1-4)', required: false })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiProperty({ description: 'Only show open restaurants', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  openNow?: boolean;

  @ApiProperty({ 
    description: 'Sort by', 
    enum: ['best_match', 'rating', 'review_count', 'distance'],
    required: false 
  })
  @IsOptional()
  @IsIn(['best_match', 'rating', 'review_count', 'distance'])
  sortBy?: 'best_match' | 'rating' | 'review_count' | 'distance';

  @ApiProperty({ description: 'Number of results (max 50)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiProperty({ description: 'Offset for pagination', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}

export class NearbyRestaurantDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @ApiProperty({ description: 'Search radius in meters (max 40000)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(40000)
  @Transform(({ value }) => parseInt(value))
  radius?: number;

  @ApiProperty({ description: 'Number of results (max 50)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}