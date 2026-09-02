import { RecoveryOrderMapper } from './recovery-order.mapper';
import { RecoveryOrderEntity } from '../entities/recovery-order.entity';
import { TipoMetal, RecoveryOrderStatusPrisma } from '@prisma/client';

describe('RecoveryOrderMapper', () => {
  it('should map domain entity to response DTO', () => {
    const entity = RecoveryOrderEntity.create({
      id: 'ro-1',
      organizationId: 'org-1',
      orderNumber: 'REC-001',
      metalType: TipoMetal.AU,
      status: RecoveryOrderStatusPrisma.EM_ANDAMENTO,
      totalBrutoEstimadoGramas: 100,
      resultadoProcessamentoGramas: 95,
      teorFinal: 0.9995,
      dataInicio: new Date('2026-09-02'),
    });

    const dto = RecoveryOrderMapper.toResponseDto(entity);
    expect(dto.id).toBe('ro-1');
    expect(dto.orderNumber).toBe('REC-001');
    expect(dto.totalBrutoEstimadoGramas).toBe(100);
    expect(dto.teorFinal).toBe(0.9995);
  });

  it('should map Prisma record to domain entity', () => {
    const rawPrisma = {
      id: 'ro-raw',
      organizationId: 'org-1',
      orderNumber: 'REC-002',
      metalType: TipoMetal.AU,
      status: RecoveryOrderStatusPrisma.PENDENTE,
      totalBrutoEstimadoGramas: 200,
      chemicalAnalysisIds: ['ca-1'],
      dataInicio: new Date(),
      rawMaterialsUsed: [],
    };

    const entity = RecoveryOrderMapper.toDomain(rawPrisma);
    expect(entity.id).toBe('ro-raw');
    expect(entity.orderNumber.value).toBe('REC-002');
    expect(entity.status.isPendente()).toBe(true);
  });
});
