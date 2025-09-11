import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('search_history')
export class SearchHistory {
  @ApiProperty({ description: 'Search history ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID (for future user system)' })
  @Column({ length: 255, nullable: true })
  userId?: string;

  @ApiProperty({ description: 'Search query' })
  @Column({ length: 500 })
  query: string;

  @ApiProperty({ description: 'Location searched' })
  @Column({ length: 255 })
  location: string;

  @ApiProperty({ description: 'Applied filters' })
  @Column({ type: 'json', nullable: true })
  filters?: {
    categories?: string[];
    price?: number[];
    radius?: number;
    openNow?: boolean;
    rating?: number;
    sortBy?: string;
  };

  @ApiProperty({ description: 'Number of results returned' })
  @Column({ default: 0 })
  resultsCount: number;

  @ApiProperty({ description: 'User clicked on results' })
  @Column({ type: 'json', nullable: true })
  clickedResults?: string[];

  @ApiProperty({ description: 'Search latitude' })
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @ApiProperty({ description: 'Search longitude' })
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @ApiProperty({ description: 'Session ID' })
  @Column({ length: 255, nullable: true })
  sessionId?: string;

  @ApiProperty({ description: 'Search completion time in milliseconds' })
  @Column({ nullable: true })
  responseTime?: number;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;
}