import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'node:crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { InvalidCredentialsError } from './errors/invalid-credentials.error';
import { InvalidRefreshTokenError } from './errors/invalid-refresh-token.error';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UsersService } from '../users/users.service';
import { UserDto } from '../users/dto/user.dto';
import {
  UserResponseDto,
  toUserResponse,
} from '../users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
    });
    return toUserResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthTokensResponseDto> {
    const user = await this.usersService.verifyCredentials(
      dto.email,
      dto.password,
    );
    if (!user) {
      throw new InvalidCredentialsError();
    }
    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensResponseDto> {
    const refreshToken = this.generateRefreshToken();
    const result = await this.refreshTokenRepository.rotate(dto.refreshToken, {
      token: refreshToken,
      expiresAt: this.refreshExpiresAt(),
    });

    if (result.status !== 'rotated') {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.usersService.getById(result.record.userId);
    if (!user) {
      await this.refreshTokenRepository.revokeFamily(result.record.familyId);
      throw new InvalidRefreshTokenError();
    }

    const accessToken = await this.signAccessToken(user);
    return this.tokensResponse(accessToken, refreshToken);
  }

  async logout(dto: RefreshTokenDto): Promise<void> {
    await this.refreshTokenRepository.revokeByToken(dto.refreshToken);
  }

  private async issueTokens(user: UserDto): Promise<AuthTokensResponseDto> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    await this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      familyId: randomUUID(),
      expiresAt: this.refreshExpiresAt(),
    });
    return this.tokensResponse(accessToken, refreshToken);
  }

  private signAccessToken(user: UserDto): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access',
    };
    return this.jwtService.signAsync(payload);
  }

  private tokensResponse(
    accessToken: string,
    refreshToken: string,
  ): AuthTokensResponseDto {
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTtlSeconds(),
    };
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private refreshExpiresAt(): Date {
    const days = Number(
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? 7,
    );
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private accessTtlSeconds(): number {
    return Number(
      this.configService.get<string>('JWT_ACCESS_TTL_SECONDS') ?? 900,
    );
  }
}
