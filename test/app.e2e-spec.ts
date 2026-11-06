import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RoleName } from './../src/users/dto/role.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

interface PublicUser {
  id: string;
  email: string;
  roles: RoleName[];
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  let adminAccess: string;
  let adminRefresh: string;
  let adminId: string;
  let userAccess: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) is public', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('registers a user with the default role', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret123' })
      .expect(201);

    const body = res.body as PublicUser;
    expect(body.email).toBe('user@example.com');
    expect(body.roles).toEqual([RoleName.USER]);
    expect(body).not.toHaveProperty('passwordHash');
    userId = body.id;
  });

  it('rejects a duplicate email regardless of case', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'USER@Example.com', password: 'secret123' })
      .expect(409);
  });

  it('rejects unauthenticated access to /users/me', () => {
    return request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('logs the bootstrap admin in', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin-secret' })
      .expect(200);

    const body = res.body as TokenPair;
    expect(body.tokenType).toBe('Bearer');
    expect(body.expiresIn).toBe(900);
    expect(body.accessToken).toEqual(expect.any(String) as string);
    expect(body.refreshToken).toEqual(expect.any(String) as string);
    adminAccess = body.accessToken;
    adminRefresh = body.refreshToken;
  });

  it('logs the user in and returns their profile', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secret123' })
      .expect(200);

    userAccess = (login.body as TokenPair).accessToken;

    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${userAccess}`)
      .expect(200);

    const body = res.body as PublicUser;
    expect(body.id).toBe(userId);
    expect(body.email).toBe('user@example.com');
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('rejects non-admin access to the admin area', () => {
    return request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${userAccess}`)
      .expect(403);
  });

  it('lets an admin list users without leaking password hashes', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);

    const users = res.body as PublicUser[];
    const emails = users.map((user) => user.email);
    expect(emails).toEqual(
      expect.arrayContaining(['admin@example.com', 'user@example.com']),
    );
    users.forEach((user) => {
      expect(user).not.toHaveProperty('passwordHash');
    });

    const admin = users.find((user) => user.email === 'admin@example.com');
    if (!admin) {
      throw new Error('bootstrap admin missing');
    }
    adminId = admin.id;
  });

  it('promotes a user and applies the roles on the next request', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/users/${userId}/roles`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ roles: [RoleName.USER, RoleName.ADMIN] })
      .expect(200);

    expect((res.body as PublicUser).roles).toEqual([
      RoleName.USER,
      RoleName.ADMIN,
    ]);

    await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${userAccess}`)
      .expect(200);
  });

  it('prevents an admin from deleting their own account', () => {
    return request(app.getHttpServer())
      .delete(`/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(403);
  });

  it('deletes the promoted user and invalidates their access token', async () => {
    await request(app.getHttpServer())
      .delete(`/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${userAccess}`)
      .expect(401);

    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);

    const emails = (res.body as PublicUser[]).map((user) => user.email);
    expect(emails).not.toContain('user@example.com');
  });

  it('prevents demoting the last admin', () => {
    return request(app.getHttpServer())
      .patch(`/admin/users/${adminId}/roles`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ roles: [RoleName.USER] })
      .expect(409);
  });

  it('rotates refresh tokens, rejects reuse, and revokes on logout', async () => {
    const rotate = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: adminRefresh })
      .expect(200);

    const rotated = rotate.body as TokenPair;
    expect(rotated.refreshToken).not.toBe(adminRefresh);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: rotated.refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: rotated.refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: adminRefresh })
      .expect(401);
  });

  it('rejects a refresh request without a token', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({})
      .expect(400);
  });
});
