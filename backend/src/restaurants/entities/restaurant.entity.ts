import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('restaurants')
export class Restaurant {
  @ApiProperty({ description: 'Restaurant ID' })
  @PrimaryGeneratedColumn()
  id: number;

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

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updatedAt: Date;
}