import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity('menu_items')
export class MenuItem {
  @ApiProperty({ description: 'Menu item ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Restaurant ID' })
  @Column()
  restaurantId: number;

  @ApiProperty({ description: 'Item name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Item description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Item price' })
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  price?: number;

  @ApiProperty({ description: 'Price currency' })
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Menu category' })
  @Column({ length: 100, nullable: true })
  category?: string;

  @ApiProperty({ description: 'Item photo URL' })
  @Column({ type: 'text', nullable: true })
  imageUrl?: string;

  @ApiProperty({ description: 'Dietary restrictions/tags' })
  @Column({ type: 'json', nullable: true })
  dietaryTags?: string[]; // ['vegetarian', 'vegan', 'gluten-free', 'keto', etc.]

  @ApiProperty({ description: 'Allergen information' })
  @Column({ type: 'json', nullable: true })
  allergens?: string[];

  @ApiProperty({ description: 'Nutritional information' })
  @Column({ type: 'json', nullable: true })
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };

  @ApiProperty({ description: 'Item popularity score' })
  @Column({ type: 'int', default: 0 })
  popularityScore: number;

  @ApiProperty({ description: 'Is item available' })
  @Column({ default: true })
  isAvailable: boolean;

  @ApiProperty({ description: 'Special notes or modifications' })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;
}