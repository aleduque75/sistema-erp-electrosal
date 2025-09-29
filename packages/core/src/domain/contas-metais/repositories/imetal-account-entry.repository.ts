import { MetalAccountEntry } from '../metal-account-entry.entity';

export interface IMetalAccountEntryRepository {
  create(entry: MetalAccountEntry): Promise<MetalAccountEntry>;
}
