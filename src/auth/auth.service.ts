import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = user; // Omit password hash from response
    return safe;
  }

  login(_payload: any) {
    void _payload;
    // TODO: login logic
    return { message: 'Login service (not implemented)' };
  }

  refresh(_payload: any) {
    void _payload;
    // TODO: refresh logic
    return { message: 'Refresh service (not implemented)' };
  }

  logout(_payload: any) {
    void _payload;
    // TODO: logout logic
    return { message: 'Logout service (not implemented)' };
  }
}
