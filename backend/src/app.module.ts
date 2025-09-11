import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { Review } from './reviews/entities/review.entity';
import { Favorite } from './favorites/entities/favorite.entity';
import { SearchHistory } from './search/entities/search-history.entity';
import { MenuItem } from './menu/entities/menu-item.entity';
import { DietaryRestriction } from './dietary/entities/dietary-restriction.entity';
import { DatabaseSeederService } from './database/database-seeder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'restaurant_user'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'restaurant_discovery'),
        entities: [Restaurant, Review, Favorite, SearchHistory, MenuItem, DietaryRestriction],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
    }),
    HealthModule,
    RestaurantsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseSeederService],
})
export class AppModule {}