// Em: apps/backend/src/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // --- INÍCIO DO DEBUG ---
    console.log("=========================================");
    console.log("--- DECORATOR @CurrentUser ATIVADO ---");
    console.log("Propriedade solicitada ('data'):", data); // Deve imprimir 'id'
    console.log("Objeto req.user COMPLETO:", request.user); // Vamos ver o que o JwtStrategy retornou
    console.log("=========================================");
    // --- FIM DO DEBUG ---

    if (!request.user) {
      return null;
    }

    if (data) {
      // Se pedimos uma propriedade específica (como 'id'), retornamos ela
      return request.user[data];
    }

    // Se não pedimos nada, retornamos o objeto de usuário completo
    return request.user;
  },
);