import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ContaMetal,
  IContaMetalRepository,
  TipoMetal,
  ContaMetalType,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';
import { ContaMetal as PrismaContaMetal, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaContaMetalRepository implements IContaMetalRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaContaMetal): ContaMetal {
    const { id, ...props } = dbData;
    return ContaMetal.reconstitute(
      {
        organizationId: props.organizationId,
        name: props.name,
        metalType: props.metalType as TipoMetal,
        type: props.type as ContaMetalType,
        dataCriacao: props.dataCriacao,
        dataAtualizacao: props.dataAtualizacao,
        entries: [], // Entries are loaded on demand
      },
      UniqueEntityID.create(id),
    );
  }

  async findById(id: string, organizationId: string): Promise<ContaMetal | null> {
    const dbContaMetal = await this.prisma.contaMetal.findFirst({
      where: {
        id,
        organizationId,
      },
    });
    return dbContaMetal ? this.mapToDomain(dbContaMetal) : null;
  }

  async findUnique(
    name: string,
    metalType: TipoMetal,
    type: ContaMetalType,
    organizationId: string,
  ): Promise<ContaMetal | null> {
    const dbContaMetal = await this.prisma.contaMetal.findFirst({
      where: {
        name,
        metalType: metalType as any,
        type: type as any,
        organizationId,
      },
    });
    return dbContaMetal ? this.mapToDomain(dbContaMetal) : null;
  }

  async create(contaMetal: ContaMetal, tx?: PrismaClient): Promise<ContaMetal> {
    const client = tx || this.prisma;
    const data = {
      id: contaMetal.id.toString(),
      organizationId: contaMetal.organizationId,
      name: contaMetal.name,
      metalType: contaMetal.metalType as any,
      type: contaMetal.type as any,
      dataCriacao: contaMetal.dataCriacao,
      dataAtualizacao: contaMetal.dataAtualizacao,
    };
    const dbContaMetal = await client.contaMetal.create({ data });
    return this.mapToDomain(dbContaMetal);
  }

  async save(contaMetal: ContaMetal, tx?: PrismaClient): Promise<ContaMetal> {
    // O saldo é agora calculado a partir das entries, então o save pode não precisar fazer nada
    // ou pode ser usado para atualizar outros campos como 'name'.
    // Por enquanto, apenas retorna a entidade sem alterações no banco.
    return Promise.resolve(contaMetal);
  }

  async findAll(organizationId: string): Promise<ContaMetal[]> {
    const dbContasMetais = await this.prisma.contaMetal.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
    return dbContasMetais.map(this.mapToDomain);
  }
}
