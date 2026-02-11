import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IMetalAccountRepository,
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
    @Inject('IMetalAccountRepository')
    private readonly metalAccountRepository: IMetalAccountRepository,
    @Inject('IMetalAccountEntryRepository')
    private readonly entryRepository: IMetalAccountEntryRepository,
  ) {}

  async execute(command: CreateMetalAccountEntryCommand): Promise<MetalAccountEntry> {
    const { organizationId, dto } = command;
    const { metalAccountId, type, grams, date, sourceId, description } = dto;

    const metalAccount = await this.metalAccountRepository.findById(metalAccountId, organizationId);
    if (!metalAccount) {
      throw new NotFoundException(`Conta de metal com ID '${metalAccountId}' não encontrada.`);
    }

    const entry = MetalAccountEntry.create({
      metalAccountId: metalAccount.id.toString(),
      type,
      grams,
      date: date ? new Date(date) : new Date(),
      sourceId,
      description,
    });

    await this.entryRepository.create(entry);

    return entry;
  }
}
