import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ValidateUserCredentialsUseCase } from '../use-cases/validate-user-credentials.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly validateUserCredentialsUseCase: ValidateUserCredentialsUseCase) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    return this.validateUserCredentialsUseCase.execute(email, password);
  }
}