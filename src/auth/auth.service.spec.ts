import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenRepository } from './refresh-token.repository';
import { InvalidCredentialsError } from './errors/invalid-credentials.error';
import { InvalidRefreshTokenError } from './errors/invalid-refresh-token.error';
import { UserDto } from '../users/dto/user.dto';
import { RoleName } from '../users/dto/role.dto';

describe('AuthService', () => {
  const usersService = {
    verifyCredentials: jest.fn(),
    getById: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };
  const refreshTokenRepository = {
    create: jest.fn(),
    rotate: jest.fn(),
    revokeByToken: jest.fn(),
    revokeFamily: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_TTL_SECONDS') return '900';
      if (key === 'REFRESH_TOKEN_TTL_DAYS') return '7';
      return undefined;
    }),
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
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      refreshTokenRepository as unknown as RefreshTokenRepository,
      configService as unknown as ConfigService,
    );
  });

  describe('login', () => {
    it('returns the public user fields for valid credentials', async () => {
      usersService.verifyCredentials.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('access-token');

      const result = await service.login({
        email: 'user@example.com',
        password: 'secret',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: expect.any(String) as string,
        tokenType: 'Bearer',
        expiresIn: 900,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'user@example.com',
        roles: [RoleName.USER],
        type: 'access',
      });
      expect(refreshTokenRepository.create).toHaveBeenCalledWith({
        userId: 'user-id',
        token: result.refreshToken,
        familyId: expect.any(String) as string,
        expiresAt: expect.any(Date) as Date,
      });
    });

    it('throws InvalidCredentialsError for invalid credentials', async () => {
      usersService.verifyCredentials.mockResolvedValue(null);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates the token and returns a new token pair', async () => {
      jwtService.signAsync.mockResolvedValue('new-access-token');
      refreshTokenRepository.rotate.mockResolvedValue({
        status: 'rotated',
        record: { userId: 'user-id', familyId: 'family-id' },
      });
      usersService.getById.mockResolvedValue(user);

      const result = await service.refresh({
        refreshToken: 'old-refresh-token',
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: expect.any(String) as string,
        tokenType: 'Bearer',
        expiresIn: 900,
      });
      expect(refreshTokenRepository.rotate).toHaveBeenCalledWith(
        'old-refresh-token',
        {
          token: result.refreshToken,
          expiresAt: expect.any(Date) as Date,
        },
      );
    });

    it.each(['invalid', 'expired', 'reused'] as const)(
      'throws InvalidRefreshTokenError when rotation returns %s',
      async (status) => {
        refreshTokenRepository.rotate.mockResolvedValue({ status });

        await expect(
          service.refresh({ refreshToken: 'bad-token' }),
        ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
      },
    );

    it('revokes the family when the user no longer exists', async () => {
      refreshTokenRepository.rotate.mockResolvedValue({
        status: 'rotated',
        record: { userId: 'deleted-user', familyId: 'family-id' },
      });
      usersService.getById.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'old-refresh-token' }),
      ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
      expect(refreshTokenRepository.revokeFamily).toHaveBeenCalledWith(
        'family-id',
      );
    });
  });

  describe('logout', () => {
    it('revokes the present refresh token', async () => {
      await service.logout({ refreshToken: 'refresh-token' });

      expect(refreshTokenRepository.revokeByToken).toHaveBeenCalledWith(
        'refresh-token',
      );
    });
  });
});
