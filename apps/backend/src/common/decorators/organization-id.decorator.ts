import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OrganizationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    // Supondo que o organizationId é anexado ao objeto user do request
    // pelo seu JwtAuthGuard. Ajuste 'organizationId' se o nome da propriedade for diferente.
    return request.user?.organizationId;
  },
);
