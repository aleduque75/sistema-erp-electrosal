import { Client } from '@sistema-erp-electrosal/core';
import { Client as PrismaClient } from '@prisma/client';

export class ClientMapper {
  static toDomain(raw: PrismaClient): Client {
    return Client.create(
      {
        pessoaId: raw.pessoaId,
        organizationId: raw.organizationId,
      },
      raw.pessoaId,
    );
  }

  static toPersistence(client: Client): PrismaClient {
    return {
      id: client.id.toString(),
      organizationId: client.organizationId.toString(),
      pessoaId: client.pessoaId.toString(),
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    } as PrismaClient;
  }
}
