import { RecoveryOrder } from "../entities/recovery-order.entity";
import { FiltrosRecoveryOrder } from '../dtos/filtros-recovery-order.dto';

export interface IRecoveryOrderRepository {
  create(recoveryOrder: RecoveryOrder): Promise<RecoveryOrder>;
  findByOrderNumber(orderNumber: string, organizationId: string): Promise<RecoveryOrder | null>;
  findById(id: string, organizationId: string): Promise<RecoveryOrder | null>;
  save(recoveryOrder: RecoveryOrder): Promise<RecoveryOrder>;
  findAll(organizationId: string, filters?: FiltrosRecoveryOrder): Promise<RecoveryOrder[]>;
}