import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('dietary_restrictions')
export class DietaryRestriction {
  @ApiProperty({ description: 'Dietary restriction ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Restriction name' })
  @Column({ length: 100, unique: true })
  name: string;

  @ApiProperty({ description: 'Restriction description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Keywords to identify this restriction' })
  @Column({ type: 'json' })
  keywords: string[];

  @ApiProperty({ description: 'Foods/ingredients to avoid' })
  @Column({ type: 'json', nullable: true })
  avoidIngredients?: string[];

  @ApiProperty({ description: 'Safe foods/ingredients' })
  @Column({ type: 'json', nullable: true })
  safeIngredients?: string[];

  @ApiProperty({ description: 'Category of restriction' })
  @Column({ 
    type: 'enum', 
    enum: ['allergy', 'dietary_preference', 'religious', 'medical', 'lifestyle'], 
    default: 'dietary_preference' 
  })
  category: 'allergy' | 'dietary_preference' | 'religious' | 'medical' | 'lifestyle';

  @ApiProperty({ description: 'Severity level (1-5)' })
  @Column({ type: 'int', default: 3 })
  severityLevel: number;

  @ApiProperty({ description: 'Common alternative suggestions' })
  @Column({ type: 'json', nullable: true })
  alternatives?: string[];

  @ApiProperty({ description: 'Is restriction active/commonly used' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updatedAt: Date;
}