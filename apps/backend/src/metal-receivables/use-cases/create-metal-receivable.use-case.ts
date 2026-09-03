import { Injectable, BadRequestException } from '@nestjs/common';
import { MetalReceivablesRepository } from '../repositories/metal-receivable.repository';
import { MetalReceivableEntity } from '../entities/metal-receivable.entity';
import { MetalReceivableMapper } from '../mappers/metal-receivable.mapper';
import { TipoMetal, ReceivableStatus } from '@prisma/client';

export interface CreateMetalReceivableCommand {
  organizationId: string;
  saleId: string;
  pessoaId: string;
  metalType: TipoMetal;
  grams: number;
  dueDate: Date | string;
  remainingGrams?: number;
  status?: ReceivableStatus;
}

@Injectable()
export class CreateMetalReceivableUseCase {
  constructor(private readonly metalReceivablesRepository: MetalReceivablesRepository) {}

  async execute(command: CreateMetalReceivableCommand, tx?: any) {
    if (!command.organizationId) {
      throw new BadRequestException('Organization ID é obrigatório.');
    }
    if (!command.saleId) {
      throw new BadRequestException('Sale ID é obrigatório.');
    }
    if (!command.pessoaId) {
      throw new BadRequestException('Pessoa ID é obrigatório.');
    }

    const entity = MetalReceivableEntity.create({
      organizationId: command.organizationId,
      saleId: command.saleId,
      pessoaId: command.pessoaId,
      metalType: command.metalType,
      grams: command.grams,
      remainingGrams: command.remainingGrams,
      dueDate: command.dueDate,
      status: command.status,
    });

    const created = await this.metalReceivablesRepository.create(entity, tx);
    return MetalReceivableMapper.toResponseDto(created);
  }
}
