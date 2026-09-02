import { RecoveryOrderEntity } from '../entities/recovery-order.entity';
import { ListRecoveryOrdersDto } from '../dtos/list-recovery-orders.dto';

export abstract class RecoveryOrderRepository {
  abstract findById(
    id: string,
    organizationId: string,
    tx?: any,
  ): Promise<RecoveryOrderEntity | null>;

  abstract findByOrderNumber(
    orderNumber: string,
    organizationId: string,
    tx?: any,
  ): Promise<RecoveryOrderEntity | null>;

  abstract findAll(
    organizationId: string,
    filters?: ListRecoveryOrdersDto,
  ): Promise<RecoveryOrderEntity[]>;

  abstract create(
    recoveryOrder: RecoveryOrderEntity,
    tx?: any,
  ): Promise<RecoveryOrderEntity>;

  abstract save(
    recoveryOrder: RecoveryOrderEntity,
    tx?: any,
  ): Promise<RecoveryOrderEntity>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
