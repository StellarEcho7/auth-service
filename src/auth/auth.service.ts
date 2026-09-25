import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  register(dto: RegisterDto) {
    // TODO: add registration logic using AuthRepository
    return { message: 'Register service (not implemented)' };
  }

  login(payload: any) {
    // TODO: login logic
    return { message: 'Login service (not implemented)' };
  }

  refresh(payload: any) {
    // TODO: refresh logic
    return { message: 'Refresh service (not implemented)' };
  }

  logout(payload: any) {
    // TODO: logout logic
    return { message: 'Logout service (not implemented)' };
  }
}
