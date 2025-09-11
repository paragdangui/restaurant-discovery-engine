import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('restaurants')
export class Restaurant {
  @ApiProperty({ description: 'Restaurant ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Yelp Business ID' })
  @Column({ length: 255, unique: true, nullable: true })
  yelpId?: string;

  @ApiProperty({ description: 'Restaurant name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Restaurant description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Cuisine type' })
  @Column({ length: 100 })
  cuisine: string;

  @ApiProperty({ description: 'Restaurant address' })
  @Column({ type: 'text' })
  address: string;

  @ApiProperty({ description: 'Phone number' })
  @Column({ length: 20, nullable: true })
  phone?: string;

  @ApiProperty({ description: 'Rating (1-5)' })
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  rating?: number;

  @ApiProperty({ description: 'Number of reviews' })
  @Column({ default: 0 })
  reviewCount: number;

  @ApiProperty({ description: 'Latitude coordinate' })
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @ApiProperty({ description: 'Restaurant photos' })
  @Column({ type: 'json', nullable: true })
  photos?: string[];

  @ApiProperty({ description: 'Price level (1-4)' })
  @Column({ type: 'int', nullable: true })
  priceLevel?: number;

  @ApiProperty({ description: 'Restaurant categories' })
  @Column({ type: 'json', nullable: true })
  categories?: { alias: string; title: string }[];

  @ApiProperty({ description: 'Operating hours' })
  @Column({ type: 'json', nullable: true })
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

  @ApiProperty({ description: 'Yelp URL' })
  @Column({ type: 'text', nullable: true })
  url?: string;

  @ApiProperty({ description: 'Is restaurant closed' })
  @Column({ default: false })
  isClosed: boolean;

  @ApiProperty({ description: 'Available transactions' })
  @Column({ type: 'json', nullable: true })
  transactions?: string[];

  @ApiProperty({ description: 'Special features' })
  @Column({ type: 'json', nullable: true })
  attributes?: { [key: string]: any };

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Last synced from Yelp' })
  @Column({ type: 'datetime', nullable: true })
  lastSyncedAt?: Date;
}