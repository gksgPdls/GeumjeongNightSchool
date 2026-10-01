import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserRole } from '../src/entities/user.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new student user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'teststudent',
          password: 'password123',
          email: 'student@test.com',
          role: UserRole.STUDENT,
          student_id: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('username', 'teststudent');
          expect(res.body).toHaveProperty('role', UserRole.STUDENT);
        });
    });

    it('should register a new teacher user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testteacher',
          password: 'password123',
          email: 'teacher@test.com',
          role: UserRole.TEACHER,
          teacher_id: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('username', 'testteacher');
          expect(res.body).toHaveProperty('role', UserRole.TEACHER);
        });
    });

    it('should not register user with invalid data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: '',
          password: '123',
          role: 'invalid_role',
        })
        .expect(400);
    });

    it('should not register duplicate username', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'teststudent', // Already registered
          password: 'password123',
          email: 'duplicate@test.com',
          role: UserRole.STUDENT,
        })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'teststudent',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('userInfo');
          expect(res.body.userInfo).toHaveProperty('username', 'teststudent');
          authToken = res.body.access_token;
        });
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'teststudent',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should not login with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/auth/verify (GET)', () => {
    it('should verify valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('authenticated', true);
        });
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/auth/verify')
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Log out.');
        });
    });

    it('should handle logout without token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Log out.');
        });
    });
  });
});
