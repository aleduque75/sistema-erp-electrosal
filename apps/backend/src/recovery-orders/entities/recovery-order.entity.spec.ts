import { RecoveryOrderEntity } from './recovery-order.entity';
import { RecoveryOrderStatusPrisma } from '@prisma/client';

describe('RecoveryOrderEntity', () => {
  it('should create valid entity and follow full lifecycle', () => {
    const ro = RecoveryOrderEntity.create({
      organizationId: 'org-1',
      orderNumber: 'REC-001',
      totalBrutoEstimadoGramas: 100,
    });

    expect(ro.status.isPendente()).toBe(true);
    expect(ro.orderNumber.value).toBe('REC-001');

    // Start
    ro.start();
    expect(ro.status.isEmAndamento()).toBe(true);

    // Update processing result
    ro.updateProcessingResult(90, 0.9995);
    expect(ro.status.isAguardandoTeor()).toBe(true);
    expect(ro.resultadoProcessamentoGramas).toBe(90);
    expect(ro.auPuroRecuperadoGramas).toBeCloseTo(89.955);
    expect(ro.residuoGramas).toBeCloseTo(10.045);
    expect(ro.calculateYield()).toBe(90);

    // Finalize
    ro.finalize('residue-123');
    expect(ro.status.isFinalizada()).toBe(true);
    expect(ro.residueAnalysisId).toBe('residue-123');
    expect(ro.dataFim).toBeDefined();
  });

  it('should cancel pending order', () => {
    const ro = RecoveryOrderEntity.create({
      organizationId: 'org-1',
      orderNumber: 'REC-002',
      totalBrutoEstimadoGramas: 50,
    });

    ro.cancel();
    expect(ro.status.isCancelada()).toBe(true);
  });

  it('should not allow canceling already finalized order', () => {
    const ro = RecoveryOrderEntity.create({
      organizationId: 'org-1',
      orderNumber: 'REC-003',
      totalBrutoEstimadoGramas: 50,
      status: RecoveryOrderStatusPrisma.FINALIZADA,
    });

    expect(() => ro.cancel()).toThrow('Uma ordem de recuperação já FINALIZADA não pode ser cancelada.');
  });
});
