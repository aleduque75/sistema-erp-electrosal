import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountsPayRepository } from '../repositories/account-pay.repository';
import { CreateAccountPayDto } from '../dtos/account-pay.dto';
import { AccountPayEntity } from '../entities/account-pay.entity';
import { AccountPayMapper } from '../mappers/account-pay.mapper';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CreateAccountPayUseCase {
  constructor(
    private readonly accountsPayRepository: AccountsPayRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(organizationId: string, dto: CreateAccountPayDto, tx?: any) {
    if (dto.fornecedorId) {
      const client = tx || this.prisma;
      const fornecedor = await client.fornecedor.findFirst({
        where: { pessoaId: dto.fornecedorId, organizationId },
      });
      if (!fornecedor) {
        throw new BadRequestException('Fornecedor não encontrado nesta organização.');
      }
    }

    if (dto.contaContabilId) {
      const client = tx || this.prisma;
      const contaContabil = await client.contaContabil.findFirst({
        where: { id: dto.contaContabilId, organizationId },
      });
      if (!contaContabil) {
        throw new BadRequestException('Conta contábil não encontrada nesta organização.');
      }
    }

    if (dto.isInstallment && dto.totalInstallments && dto.totalInstallments > 1) {
      const parent = AccountPayEntity.create({
        organizationId,
        description: dto.description,
        amount: dto.amount,
        dueDate: dto.dueDate,
        contaContabilId: dto.contaContabilId,
        fornecedorId: dto.fornecedorId,
      });

      const installments = parent.split(dto.totalInstallments);
      const created = await this.accountsPayRepository.createMany(installments, tx);
      return { count: created.length };
    }

    const entity = AccountPayEntity.create({
      organizationId,
      description: dto.description,
      amount: dto.amount,
      dueDate: dto.dueDate,
      contaContabilId: dto.contaContabilId,
      fornecedorId: dto.fornecedorId,
      isInstallment: false,
    });

    const created = await this.accountsPayRepository.create(entity, tx);
    return AccountPayMapper.toResponseDto(created);
  }
}
