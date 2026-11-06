// Em: apps/backend/src/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      return null;
    }

    if (data) {
      if (data === 'orgId' || data === 'organizationId') {
        return request.user.orgId || request.user.organizationId;
      }
      // Se pedimos uma propriedade específica (como 'id'), retornamos ela
      return request.user[data];
    }

    // Se não pedimos nada, retornamos o objeto de usuário completo
    return request.user;
  },
);
