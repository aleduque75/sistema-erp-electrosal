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

  async validate(payload: { sub: string; email: string; orgId: string }) {
    const user = await this.usersService.findByIdAndOrganization(
      payload.sub,
      payload.orgId,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    // AQUI ESTÁ A CORREÇÃO:
    // Retornamos um objeto que inclui tanto os dados do usuário do banco
    // quanto o orgId que veio no payload do token.
    // Isso garante que o decorador @CurrentUser('orgId') funcione.
    return { ...user, orgId: payload.orgId };
  }
}
