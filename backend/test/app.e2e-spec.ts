import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-that-is-long-enough';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chabaqa_test';
process.env.MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
process.env.REDIS_ENABLED = 'false';
process.env.REDIS_PASSWORD = '';
process.env.SEED_TUNISIAN_USERS = 'false';

import { AppModule } from '@/app/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns the root API response from GET /api', async () => {
    const response = await request(app.getHttpServer()).get('/api').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: 'Hello World!',
    });
  });
});
