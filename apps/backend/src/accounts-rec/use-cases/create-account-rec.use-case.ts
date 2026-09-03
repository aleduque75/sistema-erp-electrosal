import { Injectable } from '@nestjs/common';
import { AccountsRecRepository } from '../repositories/account-rec.repository';
import { CreateAccountRecDto } from '../dtos/account-rec.dto';
import { AccountRecEntity } from '../entities/account-rec.entity';
import { AccountRecMapper } from '../mappers/account-rec.mapper';

@Injectable()
export class CreateAccountRecUseCase {
  constructor(private readonly accountsRecRepository: AccountsRecRepository) {}

  async execute(organizationId: string, dto: CreateAccountRecDto, tx?: any) {
    const entity = AccountRecEntity.create({
      organizationId,
      description: dto.description,
      amount: dto.amount,
      dueDate: dto.dueDate,
      saleId: dto.saleId,
      contaCorrenteId: dto.contaCorrenteId,
    });

    const created = await this.accountsRecRepository.create(entity, tx);
    return AccountRecMapper.toResponseDto(created);
  }
}
