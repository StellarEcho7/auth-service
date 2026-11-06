import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import {
  UserResponseDto,
  toUserResponse,
} from '../users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
    });
    return toUserResponse(user);
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
