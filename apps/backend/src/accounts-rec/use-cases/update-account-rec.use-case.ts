import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsRecRepository } from '../repositories/account-rec.repository';
import { UpdateAccountRecDto } from '../dtos/account-rec.dto';
import { AccountRecMapper } from '../mappers/account-rec.mapper';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UpdateAccountRecUseCase {
  constructor(
    private readonly accountsRecRepository: AccountsRecRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(organizationId: string, id: string, dto: UpdateAccountRecDto, tx?: any) {
    const account = await this.accountsRecRepository.findById(id, organizationId, tx);
    if (!account) {
      throw new NotFoundException(`Conta a receber com ID ${id} não encontrada.`);
    }

    if (account.received) {
      throw new BadRequestException('Não é possível atualizar uma conta a receber já liquidada.');
    }

    account.updateDetails({
      description: dto.description,
      amount: dto.amount,
      dueDate: dto.dueDate,
    });

    const updated = await this.accountsRecRepository.update(account, tx);

    if (dto.dueDate) {
      const client = tx || this.prisma;
      const newDueDate = typeof dto.dueDate === 'string'
        ? new Date(`${dto.dueDate}T12:00:00`)
        : dto.dueDate;

      await client.transacao.updateMany({
        where: { accountRecId: id },
        data: { dataHora: newDueDate },
      });
    }

    return AccountRecMapper.toResponseDto(updated);
  }
}
