import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET'); // Define a variável aqui
    if (!secret) {
      throw new Error('JWT_SECRET não foi definido nas variáveis de ambiente');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // Usa a variável aqui
    });
  }

  async validate(payload: { sub: string; email: string }) {
    console.log('--- JwtStrategy.validate called with payload: ', payload); // NOVO LOG
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      console.log('--- User NOT found in JwtStrategy for sub: ', payload.sub); // NOVO LOG
      throw new UnauthorizedException();
    }
    console.log('--- User FOUND in JwtStrategy: ', user.id); // NOVO LOG
    const { ...result } = user;
    return result;
  }
}
