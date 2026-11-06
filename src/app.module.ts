import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { envValidationSchema } from './config/env.validation';
import { CannotDeleteSelfFilter } from './filters/cannot-delete-self.filter';
import { DuplicateEmailFilter } from './filters/duplicate-email.filter';
import { InvalidCredentialsFilter } from './filters/invalid-credentials.filter';
import { InvalidRefreshTokenFilter } from './filters/invalid-refresh-token.filter';
import { LastAdminFilter } from './filters/last-admin.filter';
import { UserNotFoundFilter } from './filters/user-not-found.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: Number(
            configService.get<string>('JWT_ACCESS_TTL_SECONDS') ?? 900,
          ),
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: DuplicateEmailFilter },
    { provide: APP_FILTER, useClass: InvalidCredentialsFilter },
    { provide: APP_FILTER, useClass: InvalidRefreshTokenFilter },
    { provide: APP_FILTER, useClass: UserNotFoundFilter },
    { provide: APP_FILTER, useClass: LastAdminFilter },
    { provide: APP_FILTER, useClass: CannotDeleteSelfFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
