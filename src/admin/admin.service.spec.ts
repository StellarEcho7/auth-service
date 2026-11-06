import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { RoleName } from '../users/dto/role.dto';

describe('AdminService', () => {
  const usersService = {
    getAllUsers: jest.fn(),
    deleteUser: jest.fn(),
    updateUserRoles: jest.fn(),
  };
  const service = new AdminService(usersService as unknown as UsersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates user listing', async () => {
    const users = [{ id: '1', email: 'user@example.com', roles: [] }];
    usersService.getAllUsers.mockResolvedValue(users);

    await expect(service.getAllUsers()).resolves.toBe(users);
  });

  it('delegates deletion', async () => {
    usersService.deleteUser.mockResolvedValue(undefined);

    await service.deleteUser('user-id');

    expect(usersService.deleteUser).toHaveBeenCalledWith('user-id');
  });

  it('delegates role updates and returns the updated user', async () => {
    const updated = {
      id: 'user-id',
      email: 'user@example.com',
      roles: [RoleName.ADMIN],
    };
    usersService.updateUserRoles.mockResolvedValue(updated);

    await expect(
      service.updateUserRoles('user-id', [RoleName.ADMIN]),
    ).resolves.toBe(updated);
    expect(usersService.updateUserRoles).toHaveBeenCalledWith('user-id', [
      RoleName.ADMIN,
    ]);
  });
});
