import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../../users/users.service';
import { RoleName } from '../../users/dto/role.dto';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';

const createContext = (request: unknown): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const jwtService = { verifyAsync: jest.fn() };
  const usersService = { getById: jest.fn() };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      usersService as unknown as UsersService,
      reflector as unknown as Reflector,
    );
  });

  it('allows public routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a request without an authorization header', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a non-bearer authorization header', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Basic creds' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Bearer bad-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token that is not an access token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      roles: [RoleName.USER],
      type: 'refresh',
    });

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Bearer token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token whose user no longer exists', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'deleted-id',
      email: 'deleted@example.com',
      roles: [RoleName.USER],
      type: 'access',
    });
    usersService.getById.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Bearer token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the current user from storage and allows the request', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      roles: [RoleName.USER],
      type: 'access',
    });
    usersService.getById.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hash',
      roles: [RoleName.ADMIN],
    });
    const request = {
      headers: { authorization: 'Bearer token' },
    } as unknown as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      roles: [RoleName.ADMIN],
    });
  });
});
