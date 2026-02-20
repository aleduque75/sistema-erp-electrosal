import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Permite requisições OPTIONS (CORS Preflight)
    if (request.method === 'OPTIONS') {
      return true;
    }

    // 2. Verifica se a rota foi marcada com @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 3. Lógica para rotas públicas ou mídias
    if (
      isPublic ||
      request.url.includes('/api/media/public-media/') ||
      request.url.includes('/api/landing-page/public')
    ) {
      return true;
    }

    return super.canActivate(context);
  }

  // Sobrescrevemos o handleRequest para evitar que rotas públicas estourem erro 401
  handleRequest(err, user, info, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic && !user) {
      return null; // Se for público e o token for inválido, apenas retorna nulo sem dar 401
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Sessão inválida ou expirada.');
    }

    return user;
  }
}
