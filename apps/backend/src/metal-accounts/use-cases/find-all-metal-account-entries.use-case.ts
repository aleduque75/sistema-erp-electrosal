import { Injectable, Inject } from '@nestjs/common';
import { MetalAccountEntry, IMetalAccountEntryRepository } from '@sistema-erp-electrosal/core';

@Injectable()
export class FindAllMetalAccountEntriesUseCase {
  constructor(
    @Inject('IMetalAccountEntryRepository')
    private readonly metalAccountEntryRepository: IMetalAccountEntryRepository,
  ) {}

  async execute(metalAccountId: string): Promise<MetalAccountEntry[]> {
    return this.metalAccountEntryRepository.findAllByMetalAccountId(metalAccountId);
  }
}
