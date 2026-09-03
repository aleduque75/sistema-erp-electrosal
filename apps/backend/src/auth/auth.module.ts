import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { LoginUserUseCase } from './use-cases/login-user.use-case';
import { ValidateUserCredentialsUseCase } from './use-cases/validate-user-credentials.use-case';
import { GetUserProfileUseCase } from './use-cases/get-user-profile.use-case';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    LocalStrategy,
    RegisterUserUseCase,
    LoginUserUseCase,
    ValidateUserCredentialsUseCase,
    GetUserProfileUseCase,
  ],
  exports: [
    RegisterUserUseCase,
    LoginUserUseCase,
    ValidateUserCredentialsUseCase,
    GetUserProfileUseCase,
  ],
})
export class AuthModule {}
