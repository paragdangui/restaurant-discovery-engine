import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity('favorites')
@Unique(['userId', 'restaurantId']) // Ensure one favorite per user per restaurant
export class Favorite {
  @ApiProperty({ description: 'Favorite ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID (for future user system)' })
  @Column({ length: 255 })
  userId: string;

  @ApiProperty({ description: 'Restaurant ID' })
  @Column()
  restaurantId: number;

  @ApiProperty({ description: 'Collection/folder name' })
  @Column({ length: 100, nullable: true })
  collection?: string;

  @ApiProperty({ description: 'Personal notes' })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Custom tags' })
  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @ApiProperty({ description: 'Priority level (1-5)' })
  @Column({ type: 'int', default: 3 })
  priority: number;

  @ApiProperty({ description: 'Is visited' })
  @Column({ default: false })
  isVisited: boolean;

  @ApiProperty({ description: 'Visit date' })
  @Column({ type: 'date', nullable: true })
  visitDate?: Date;

  @ApiProperty({ description: 'Personal rating after visit' })
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  personalRating?: number;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;
}