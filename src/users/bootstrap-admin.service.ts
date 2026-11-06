import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

@Injectable()
export class BootstrapAdminService implements OnApplicationBootstrap {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.configService.get<string>('BOOTSTRAP_ADMIN_EMAIL');
    const password = this.configService.get<string>('BOOTSTRAP_ADMIN_PASSWORD');
    if (!email || !password) {
      return;
    }
    await this.usersService.ensureBootstrapAdmin(email, password);
  }
}
