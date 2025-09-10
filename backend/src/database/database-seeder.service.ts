import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { seedRestaurants } from './seeds/restaurant.seeds';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Only seed in development mode
    if (process.env.NODE_ENV === 'development') {
      await this.seedDatabase();
    }
  }

  async seedDatabase() {
    try {
      console.log('Starting database seeding...');
      await seedRestaurants(this.dataSource);
      console.log('Database seeding completed successfully');
    } catch (error) {
      console.error('Database seeding failed:', error);
    }
  }
}