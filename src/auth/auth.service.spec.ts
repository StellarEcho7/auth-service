import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { InvalidCredentialsError } from './errors/invalid-credentials.error';
import { UserDto } from '../users/dto/user.dto';
import { RoleName } from '../users/dto/role.dto';

describe('AuthService', () => {
  const usersService = {
    verifyCredentials: jest.fn(),
  };
  let service: AuthService;

  const user: UserDto = {
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'stored-hash',
    roles: [RoleName.USER],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(usersService as unknown as UsersService);
  });

  describe('login', () => {
    it('returns the public user fields for valid credentials', async () => {
      usersService.verifyCredentials.mockResolvedValue(user);

      const result = await service.login({
        email: 'user@example.com',
        password: 'secret',
      });

      expect(result).toEqual({
        id: 'user-id',
        email: 'user@example.com',
        roles: [RoleName.USER],
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws InvalidCredentialsError for invalid credentials', async () => {
      usersService.verifyCredentials.mockResolvedValue(null);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });
});
