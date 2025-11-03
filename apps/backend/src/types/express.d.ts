import { Request } from 'express';

declare module 'express' {
  interface Request {
    user: {
      userId: string;
      organizationId: string;
      // Adicione outras propriedades do payload do seu token JWT aqui, se houver
    };
  }
}