import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { YelpModule } from '../yelp/yelp.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant]),
    YelpModule,
    AIModule,
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}