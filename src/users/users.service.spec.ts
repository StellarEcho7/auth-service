import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { RoleName } from './dto/role.dto';
import { LastAdminError } from './errors/last-admin.error';
import { UserNotFoundError } from './errors/user-not-found.error';

jest.mock('argon2');

const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const getSeedUser = async () => {
    const user = await repository.findByEmail('user@example.com');
    if (!user) throw new Error('seed user missing');
    return user;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository = new UsersRepository();
    service = new UsersService(repository);
    await repository.create({
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      roles: [RoleName.USER],
    });
  });

  describe('verifyCredentials', () => {
    it('returns the user when the password matches', async () => {
      mockedArgon2.verify.mockResolvedValue(true);

      const user = await service.verifyCredentials(
        'user@example.com',
        'secret',
      );

      expect(mockedArgon2.verify).toHaveBeenCalledWith('stored-hash', 'secret');
      expect(user?.email).toBe('user@example.com');
    });

    it('normalizes the email before lookup', async () => {
      mockedArgon2.verify.mockResolvedValue(true);

      const user = await service.verifyCredentials(
        '  USER@Example.com ',
        'secret',
      );

      expect(user?.email).toBe('user@example.com');
    });

    it('returns null when the password is wrong', async () => {
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(
        service.verifyCredentials('user@example.com', 'wrong'),
      ).resolves.toBeNull();
    });

    it('returns null for an unknown email and verifies a dummy hash', async () => {
      mockedArgon2.hash.mockResolvedValue('dummy-hash');
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(
        service.verifyCredentials('ghost@example.com', 'secret'),
      ).resolves.toBeNull();
      expect(mockedArgon2.verify).toHaveBeenCalledWith('dummy-hash', 'secret');
    });

    it('returns null when stored hash verification throws', async () => {
      mockedArgon2.verify.mockRejectedValue(new Error('corrupted hash'));

      await expect(
        service.verifyCredentials('user@example.com', 'secret'),
      ).resolves.toBeNull();
    });
  });

  describe('updateUserRoles', () => {
    it('updates roles and returns the public user shape', async () => {
      const user = await getSeedUser();

      const result = await service.updateUserRoles(user.id, [
        RoleName.USER,
        RoleName.ADMIN,
      ]);

      expect(result.roles).toEqual([RoleName.USER, RoleName.ADMIN]);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws UserNotFoundError for an unknown id', async () => {
      await expect(
        service.updateUserRoles('missing', [RoleName.ADMIN]),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });

    it('prevents demoting the last admin', async () => {
      const admin = await repository.create({
        email: 'admin@example.com',
        passwordHash: 'hash',
        roles: [RoleName.ADMIN],
      });

      await expect(
        service.updateUserRoles(admin.id, [RoleName.USER]),
      ).rejects.toBeInstanceOf(LastAdminError);
    });

    it('allows demoting an admin when another admin remains', async () => {
      const admin = await repository.create({
        email: 'admin1@example.com',
        passwordHash: 'hash',
        roles: [RoleName.ADMIN],
      });
      await repository.create({
        email: 'admin2@example.com',
        passwordHash: 'hash',
        roles: [RoleName.ADMIN],
      });

      const result = await service.updateUserRoles(admin.id, [RoleName.USER]);

      expect(result.roles).toEqual([RoleName.USER]);
    });
  });

  describe('deleteUser', () => {
    it('deletes an existing non-admin user', async () => {
      const user = await getSeedUser();

      await service.deleteUser(user.id);

      await expect(repository.findById(user.id)).resolves.toBeNull();
    });

    it('is idempotent for an unknown id', async () => {
      await expect(service.deleteUser('missing')).resolves.toBeUndefined();
    });

    it('prevents deleting the last admin', async () => {
      const admin = await repository.create({
        email: 'admin@example.com',
        passwordHash: 'hash',
        roles: [RoleName.ADMIN],
      });

      await expect(service.deleteUser(admin.id)).rejects.toBeInstanceOf(
        LastAdminError,
      );
    });

    it('allows deleting an admin when another admin remains', async () => {
      const admin = await repository.create({
        email: 'admin1@example.com',
        passwordHash: 'hash',
        roles: [RoleName.ADMIN],
      });
      await repository.create({
        email: 'admin2@example.com',
        passwordHash: 'hash',
        roles: [RoleName.ADMIN],
      });

      await service.deleteUser(admin.id);

      await expect(repository.findById(admin.id)).resolves.toBeNull();
    });
  });
});
