import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity('reviews')
export class Review {
  @ApiProperty({ description: 'Review ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Restaurant ID' })
  @Column()
  restaurantId: number;

  @ApiProperty({ description: 'External Review ID' })
  @Column({ length: 255, unique: true, nullable: true })
  externalReviewId?: string;

  @ApiProperty({ description: 'Review text content' })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ description: 'Review rating (1-5)' })
  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @ApiProperty({ description: 'Reviewer name' })
  @Column({ length: 255 })
  userName: string;

  @ApiProperty({ description: 'Reviewer profile image URL' })
  @Column({ type: 'text', nullable: true })
  userImageUrl?: string;

  @ApiProperty({ description: 'Review creation time' })
  @Column({ type: 'datetime' })
  timeCreated: Date;

  @ApiProperty({ description: 'Sentiment score (-1 to 1)' })
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  sentimentScore?: number;

  @ApiProperty({ description: 'Sentiment label' })
  @Column({ 
    type: 'enum', 
    enum: ['positive', 'neutral', 'negative'], 
    nullable: true 
  })
  sentimentLabel?: 'positive' | 'neutral' | 'negative';

  @ApiProperty({ description: 'Review helpfulness score' })
  @Column({ default: 0 })
  helpfulVotes: number;

  @ApiProperty({ description: 'Review URL' })
  @Column({ type: 'text', nullable: true })
  url?: string;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;
}
