import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ContaMetal,
  IContaMetalRepository,
  TipoMetal,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';
import { ContaMetal as PrismaContaMetal, PrismaClient, Prisma } from '@prisma/client'; // ADDED Prisma

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
        balance: props.balance.toNumber(), // Convert Decimal to number
        dataCriacao: props.dataCriacao,
        dataAtualizacao: props.dataAtualizacao,
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

  async findByNameAndMetalType(
    name: string,
    metalType: TipoMetal,
    organizationId: string,
  ): Promise<ContaMetal | null> {
    const dbContaMetal = await this.prisma.contaMetal.findFirst({
      where: {
        name,
        metalType: metalType as any, // Prisma enum type
        organizationId,
      },
    });
    return dbContaMetal ? this.mapToDomain(dbContaMetal) : null;
  }

  async findByPessoaIdAndMetal( // ADDED
    pessoaId: string,
    metalType: TipoMetal,
    organizationId: string,
    tx?: PrismaClient, // ADDED
  ): Promise<ContaMetal | null> {
    const client = tx || this.prisma; // ADDED
    const dbContaMetal = await client.contaMetal.findFirst({
      where: {
        // Assuming 'name' field in ContaMetal can store pessoaId for client accounts
        // This might need adjustment based on actual schema design for client metal accounts
        name: pessoaId, // This is a placeholder. Needs to be a proper way to link to client.
        metalType: metalType as any,
        organizationId,
      },
    });
    return dbContaMetal ? this.mapToDomain(dbContaMetal) : null;
  }

  async create(contaMetal: ContaMetal, tx?: PrismaClient): Promise<ContaMetal> { // MODIFIED
    const client = tx || this.prisma; // ADDED
    const data = {
      id: contaMetal.id.toString(),
      organizationId: contaMetal.organizationId,
      name: contaMetal.name,
      metalType: contaMetal.metalType as any, // Prisma enum type
      balance: contaMetal.balance,
      dataCriacao: contaMetal.dataCriacao,
      dataAtualizacao: contaMetal.dataAtualizacao,
    };
    const dbContaMetal = await client.contaMetal.create({ data }); // MODIFIED
    return this.mapToDomain(dbContaMetal);
  }

  async save(contaMetal: ContaMetal, tx?: PrismaClient): Promise<ContaMetal> { // MODIFIED
    const client = tx || this.prisma; // ADDED
    const data = {
      name: contaMetal.name,
      metalType: contaMetal.metalType as any, // Prisma enum type
      balance: new Prisma.Decimal(contaMetal.balance), // MODIFIED: Convert to Prisma.Decimal
      dataAtualizacao: contaMetal.dataAtualizacao,
    };
    const dbContaMetal = await client.contaMetal.update({
      where: { id: contaMetal.id.toString() },
      data,
    });
    return this.mapToDomain(dbContaMetal);
  }

  async findAll(organizationId: string): Promise<ContaMetal[]> {
    const dbContasMetais = await this.prisma.contaMetal.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
    return dbContasMetais.map(this.mapToDomain);
  }
}
