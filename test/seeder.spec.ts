/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestService } from './test.service';
import { TestModule } from './test.module';

describe('SeederController (e2e)', () => {
  let app: INestApplication<App>;
  let logger: Logger;
  let testService: TestService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    logger = app.get(WINSTON_MODULE_PROVIDER);
    testService = app.get(TestService);
  });

  describe('POST /api/seeder/run', () => {
    beforeEach(async () => {
      await testService.deleteAll();
      await testService.createAdmin();
    });

    it('should be rejected if not admin', async () => {
      await testService.createUser();

      const response = await request(app.getHttpServer())
        .post('/api/seeder/run')
        .set('Authorization', 'test');

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should run seeder successfully as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/seeder/run')
        .set('Authorization', 'admin');

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();

      const users = await testService.getUsers();
      expect(users.length).toBeGreaterThan(1);
    });
  });

  describe('DELETE /api/seeder/clear', () => {
    beforeEach(async () => {
      await testService.deleteAll();
      await testService.createUser();
      await testService.createAdmin();

      // run seeder first
      await request(app.getHttpServer())
        .post('/api/seeder/run')
        .set('Authorization', 'admin');
    });

    it('should be rejected if not admin', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/seeder/clear')
        .set('Authorization', 'test');

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should clear all data except admin', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/seeder/clear')
        .set('Authorization', 'admin');

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();

      const users = await testService.getUsers();
      expect(users.length).toBe(1);
      expect(users[0].username).toBe('admin');
    });
  });
});
