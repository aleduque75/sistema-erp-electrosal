import { MetalAccountEntry } from '../metal-account-entry.entity';

export interface IMetalAccountEntryRepository {
  create(entry: MetalAccountEntry): Promise<void>;
  findAllByMetalAccountId(metalAccountId: string): Promise<MetalAccountEntry[]>;
}
