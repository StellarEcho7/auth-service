import { createHash } from 'node:crypto';
import { RefreshTokenRepository } from './refresh-token.repository';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('RefreshTokenRepository', () => {
  let repository: RefreshTokenRepository;

  const future = () => new Date(Date.now() + 60_000);

  const createToken = (
    token: string,
    options: {
      userId?: string;
      familyId?: string;
      expiresAt?: Date;
    } = {},
  ) =>
    repository.create({
      userId: options.userId ?? 'user-1',
      token,
      familyId: options.familyId ?? 'family-1',
      expiresAt: options.expiresAt ?? future(),
    });

  beforeEach(() => {
    repository = new RefreshTokenRepository();
  });

  describe('create', () => {
    it('stores only the SHA-256 hash and generates identity fields', async () => {
      const record = await createToken('raw-token');

      expect(record.id).toBeTruthy();
      expect(record.tokenHash).toBe(sha256('raw-token'));
      expect(record.tokenHash).not.toBe('raw-token');
      expect(record.userId).toBe('user-1');
      expect(record.familyId).toBe('family-1');
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.revokedAt).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('finds a record by the raw token', async () => {
      const record = await createToken('raw-token');

      await expect(repository.findByToken('raw-token')).resolves.toBe(record);
    });

    it('returns null for an unknown token', async () => {
      await expect(repository.findByToken('missing')).resolves.toBeNull();
    });
  });

  describe('rotate', () => {
    it('revokes the current token and issues a new one in the same family', async () => {
      const current = await createToken('raw-token');

      const result = await repository.rotate('raw-token', {
        token: 'next-token',
        expiresAt: future(),
      });

      if (result.status !== 'rotated') {
        throw new Error('expected a rotated result');
      }
      expect(result.record.userId).toBe(current.userId);
      expect(result.record.familyId).toBe(current.familyId);
      expect(result.record.tokenHash).toBe(sha256('next-token'));

      const old = await repository.findByToken('raw-token');
      expect(old?.revokedAt).not.toBeNull();
    });

    it('rejects an unknown token', async () => {
      const result = await repository.rotate('missing', {
        token: 'next-token',
        expiresAt: future(),
      });

      expect(result).toEqual({ status: 'invalid' });
    });

    it('rejects and revokes an expired token', async () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      await createToken('raw-token', {
        expiresAt: new Date('2025-12-31T23:59:59.000Z'),
      });

      const result = await repository.rotate(
        'raw-token',
        { token: 'next-token', expiresAt: future() },
        now,
      );

      expect(result.status).toBe('expired');
      const old = await repository.findByToken('raw-token');
      expect(old?.revokedAt).toEqual(now);
    });

    it('detects reuse and revokes the whole family', async () => {
      await createToken('raw-token');
      const first = await repository.rotate('raw-token', {
        token: 'next-token',
        expiresAt: future(),
      });
      if (first.status !== 'rotated') {
        throw new Error('expected a rotated result');
      }

      const replay = await repository.rotate('raw-token', {
        token: 'other-token',
        expiresAt: future(),
      });

      expect(replay.status).toBe('reused');
      expect(
        (await repository.findByToken('raw-token'))?.revokedAt,
      ).not.toBeNull();
      expect(
        (await repository.findByToken('next-token'))?.revokedAt,
      ).not.toBeNull();
    });

    it('treats concurrent rotation of the same token as reuse', async () => {
      await createToken('raw-token');

      const results = await Promise.all([
        repository.rotate('raw-token', {
          token: 'next-a',
          expiresAt: future(),
        }),
        repository.rotate('raw-token', {
          token: 'next-b',
          expiresAt: future(),
        }),
      ]);

      expect(results.map((result) => result.status).sort()).toEqual([
        'reused',
        'rotated',
      ]);
    });
  });

  describe('revokeByToken', () => {
    it('marks the token as revoked', async () => {
      await createToken('raw-token');

      await repository.revokeByToken('raw-token');

      expect(
        (await repository.findByToken('raw-token'))?.revokedAt,
      ).not.toBeNull();
    });

    it('is idempotent and ignores unknown tokens', async () => {
      await createToken('raw-token');

      await repository.revokeByToken('raw-token');
      await repository.revokeByToken('raw-token');
      await repository.revokeByToken('missing');

      expect(
        (await repository.findByToken('raw-token'))?.revokedAt,
      ).not.toBeNull();
    });
  });

  describe('revokeFamily', () => {
    it('revokes every token in the family and leaves other families intact', async () => {
      await createToken('a', { familyId: 'f1' });
      await createToken('b', { familyId: 'f1' });
      await createToken('c', { familyId: 'f2' });

      await repository.revokeFamily('f1');

      expect((await repository.findByToken('a'))?.revokedAt).not.toBeNull();
      expect((await repository.findByToken('b'))?.revokedAt).not.toBeNull();
      expect((await repository.findByToken('c'))?.revokedAt).toBeNull();
    });
  });
});
