import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InvalidCredentialsError } from './errors/invalid-credentials.error';
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

  async login(dto: LoginDto): Promise<UserResponseDto> {
    const user = await this.usersService.verifyCredentials(
      dto.email,
      dto.password,
    );
    if (!user) {
      throw new InvalidCredentialsError();
    }
    return toUserResponse(user);
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
