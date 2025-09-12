import { Injectable } from '@nestjs/common';
import { IPessoaRepository, Pessoa, EmailVO, DocumentoFiscalVO } from '@sistema-erp-electrosal/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaPessoaRepository implements IPessoaRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string, organizationId: string): Promise<Pessoa | null> {
    throw new Error('Method not implemented.');
  }
  async findByEmail(email: EmailVO, organizationId: string): Promise<Pessoa | null> {
    throw new Error('Method not implemented.');
  }
  async findByDocumento(documento: DocumentoFiscalVO, organizationId: string): Promise<Pessoa | null> {
    throw new Error('Method not implemented.');
  }
  async findByGoogleId(googleId: string, organizationId: string): Promise<Pessoa | null> {
    throw new Error('Method not implemented.');
  }
  async findAll(organizationId: string): Promise<Pessoa[]> {
    throw new Error('Method not implemented.');
  }
  async findManyByIds(ids: string[], organizationId: string): Promise<Pessoa[]> {
    throw new Error('Method not implemented.');
  }
  async create(pessoa: Pessoa, organizationId: string): Promise<Pessoa> {
    throw new Error('Method not implemented.');
  }
  async save(pessoa: Pessoa, organizationId: string): Promise<Pessoa> {
    throw new Error('Method not implemented.');
  }
  async delete(id: string, organizationId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
