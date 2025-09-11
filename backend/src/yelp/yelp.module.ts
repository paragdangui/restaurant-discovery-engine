import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { YelpService } from './yelp.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 second timeout
      maxRedirects: 3,
    }),
    ConfigModule,
  ],
  providers: [YelpService],
  exports: [YelpService],
})
export class YelpModule {}