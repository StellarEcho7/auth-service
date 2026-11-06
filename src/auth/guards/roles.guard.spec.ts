import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RoleName } from '../../users/dto/role.dto';

const createContext = (user?: {
  id: string;
  email: string;
  roles: RoleName[];
}): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows routes without role requirements', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows a user with one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([RoleName.ADMIN]);

    expect(
      guard.canActivate(
        createContext({
          id: 'id',
          email: 'admin@example.com',
          roles: [RoleName.ADMIN],
        }),
      ),
    ).toBe(true);
  });

  it('rejects a user without the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([RoleName.ADMIN]);

    expect(() =>
      guard.canActivate(
        createContext({
          id: 'id',
          email: 'user@example.com',
          roles: [RoleName.USER],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects a request with no authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue([RoleName.ADMIN]);

    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });
});
