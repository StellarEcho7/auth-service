import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { RoleName } from './dto/role.dto';

jest.mock('argon2');

const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

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
});
