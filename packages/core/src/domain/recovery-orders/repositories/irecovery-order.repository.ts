import { RecoveryOrder } from "../entities/recovery-order.entity";

export interface IRecoveryOrderRepository {
  create(recoveryOrder: RecoveryOrder): Promise<RecoveryOrder>;
  findById(id: string, organizationId: string): Promise<RecoveryOrder | null>;
  save(recoveryOrder: RecoveryOrder): Promise<RecoveryOrder>;
  findAll(organizationId: string): Promise<RecoveryOrder[]>;
}