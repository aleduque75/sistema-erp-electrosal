import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsPayRepository } from '../repositories/account-pay.repository';
import { UpdateAccountPayDto } from '../dtos/account-pay.dto';
import { AccountPayMapper } from '../mappers/account-pay.mapper';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UpdateAccountPayUseCase {
  constructor(
    private readonly accountsPayRepository: AccountsPayRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(organizationId: string, id: string, dto: UpdateAccountPayDto, tx?: any) {
    const account = await this.accountsPayRepository.findById(id, organizationId, tx);
    if (!account) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada.`);
    }

    if (account.paid) {
      throw new BadRequestException('Não é possível atualizar uma conta que já foi paga.');
    }

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

    account.updateDetails({
      description: dto.description,
      amount: dto.amount,
      dueDate: dto.dueDate,
      contaContabilId: dto.contaContabilId,
      fornecedorId: dto.fornecedorId,
    });

    const updated = await this.accountsPayRepository.update(account, tx);
    return AccountPayMapper.toResponseDto(updated);
  }
}
