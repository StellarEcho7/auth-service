import { Controller, Post, Body } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('refresh')
  refresh(@Body() body: any) {
    return this.authService.refresh(body);
  }

  @Post('logout')
  logout(@Body() body: any) {
    return this.authService.logout(body);
  }
}
