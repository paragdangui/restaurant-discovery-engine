import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRestaurantDto {
  @ApiProperty({ description: 'Restaurant name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Restaurant description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Cuisine type' })
  @IsNotEmpty()
  @IsString()
  cuisine: string;

  @ApiProperty({ description: 'Restaurant address' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Rating (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}