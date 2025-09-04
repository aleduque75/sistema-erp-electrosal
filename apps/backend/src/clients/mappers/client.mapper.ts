import { Client } from '@sistema-erp-electrosal/core';
import { Client as PrismaClient } from '@prisma/client';

export class ClientMapper {
  static toDomain(raw: PrismaClient): Client {
    return Client.create(
      {
        organizationId: raw.organizationId,
        name: raw.name,
        email: raw.email ?? undefined,
        phone: raw.phone ?? undefined,
        birthDate: raw.birthDate ?? undefined,
        cep: raw.cep ?? undefined,
        logradouro: raw.logradouro ?? undefined,
        numero: raw.numero ?? undefined,
        complemento: raw.complemento ?? undefined,
        bairro: raw.bairro ?? undefined,
        cidade: raw.cidade ?? undefined,
        uf: raw.uf ?? undefined,
        gender: raw.gender ?? undefined,
        preferences: raw.preferences ? (raw.preferences as object) : undefined,
        purchaseHistory: raw.purchaseHistory ? (raw.purchaseHistory as object) : undefined,
        cpf: raw.cpf ?? undefined,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(client: Client): PrismaClient {
    return {
      id: client.id.toString(),
      organizationId: client.organizationId,
      name: client.name,
      email: client.email ?? null,
      phone: client.phone ?? null,
      birthDate: client.birthDate ?? null,
      cep: client.cep ?? null,
      logradouro: client.logradouro ?? null,
      numero: client.numero ?? null,
      complemento: client.complemento ?? null,
      bairro: client.bairro ?? null,
      cidade: client.cidade ?? null,
      uf: client.uf ?? null,
      gender: client.gender ?? null,
      preferences: client.preferences ?? null,
      purchaseHistory: client.purchaseHistory ?? null,
      cpf: client.cpf ?? null,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      // sales: [], // Relations are handled by Prisma, not directly mapped here
    } as PrismaClient; // Cast to PrismaClient to satisfy type checking
  }
}
