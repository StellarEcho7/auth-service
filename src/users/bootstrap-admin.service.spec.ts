import { ConfigService } from '@nestjs/config';
import { BootstrapAdminService } from './bootstrap-admin.service';
import { UsersService } from './users.service';

describe('BootstrapAdminService', () => {
  const usersService = { ensureBootstrapAdmin: jest.fn() };
  const configService = { get: jest.fn() };
  let service: BootstrapAdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BootstrapAdminService(
      usersService as unknown as UsersService,
      configService as unknown as ConfigService,
    );
  });

  it('does nothing when bootstrap credentials are not configured', async () => {
    configService.get.mockReturnValue(undefined);

    await service.onApplicationBootstrap();

    expect(usersService.ensureBootstrapAdmin).not.toHaveBeenCalled();
  });

  it('ensures the bootstrap admin when credentials are configured', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'BOOTSTRAP_ADMIN_EMAIL' ? 'admin@example.com' : 'secret',
    );

    await service.onApplicationBootstrap();

    expect(usersService.ensureBootstrapAdmin).toHaveBeenCalledWith(
      'admin@example.com',
      'secret',
    );
  });
});
