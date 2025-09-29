import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IContaMetalRepository,
  IMetalAccountEntryRepository,
  MetalAccountEntry,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';
import { CreateMetalAccountEntryDto } from '../dtos/create-metal-account-entry.dto';

export interface CreateMetalAccountEntryCommand {
  organizationId: string;
  dto: CreateMetalAccountEntryDto;
}

@Injectable()
export class CreateMetalAccountEntryUseCase {
  constructor(
    @Inject('IContaMetalRepository')
    private readonly contaMetalRepository: IContaMetalRepository,
    @Inject('IMetalAccountEntryRepository')
    private readonly entryRepository: IMetalAccountEntryRepository,
  ) {}

  async execute(command: CreateMetalAccountEntryCommand): Promise<MetalAccountEntry> {
    const { organizationId, dto } = command;
    const { contaMetalId, tipo, valor, data, relatedTransactionId, description } = dto;

    const contaMetal = await this.contaMetalRepository.findById(contaMetalId, organizationId);
    if (!contaMetal) {
      throw new NotFoundException(`Conta de metal com ID '${contaMetalId}' não encontrada.`);
    }

    const entry = MetalAccountEntry.create({
      contaMetalId: contaMetal.id,
      tipo,
      valor,
      data: data ? new Date(data) : new Date(),
      relatedTransactionId,
      description,
    });

    return this.entryRepository.create(entry);
  }
}
