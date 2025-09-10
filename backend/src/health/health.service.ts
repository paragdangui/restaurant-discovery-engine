import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async ready() {
    const services = {
      database: 'disconnected',
      cache: 'connected',
    };

    try {
      await this.dataSource.query('SELECT 1');
      services.database = 'connected';
    } catch (error) {
      services.database = 'disconnected';
    }

    return {
      status: services.database === 'connected' ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      services,
    };
  }
}