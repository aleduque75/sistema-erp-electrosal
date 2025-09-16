import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ContaMetal,
  IContaMetalRepository,
  TipoMetal,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';
import { ContaMetal as PrismaContaMetal } from '@prisma/client';

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

  async create(contaMetal: ContaMetal): Promise<ContaMetal> {
    const data = {
      id: contaMetal.id.toString(),
      organizationId: contaMetal.organizationId,
      name: contaMetal.name,
      metalType: contaMetal.metalType as any, // Prisma enum type
      balance: contaMetal.balance,
      dataCriacao: contaMetal.dataCriacao,
      dataAtualizacao: contaMetal.dataAtualizacao,
    };
    const dbContaMetal = await this.prisma.contaMetal.create({ data });
    return this.mapToDomain(dbContaMetal);
  }

  async save(contaMetal: ContaMetal): Promise<ContaMetal> {
    const data = {
      name: contaMetal.name,
      metalType: contaMetal.metalType as any, // Prisma enum type
      balance: contaMetal.balance,
      dataAtualizacao: contaMetal.dataAtualizacao,
    };
    const dbContaMetal = await this.prisma.contaMetal.update({
      where: { id: contaMetal.id.toString() },
      data,
    });
    return this.mapToDomain(dbContaMetal);
  }
}
