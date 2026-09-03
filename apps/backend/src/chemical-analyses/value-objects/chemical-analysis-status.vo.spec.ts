import { ChemicalAnalysisStatusVO } from './chemical-analysis-status.vo';

describe('ChemicalAnalysisStatusVO', () => {
  it('should create valid statuses and test boolean helpers', () => {
    const vo = new ChemicalAnalysisStatusVO('ANALISADO_AGUARDANDO_APROVACAO');
    expect(vo.isPendingApproval).toBe(true);
    expect(vo.canApprove()).toBe(true);
    expect(vo.canReject()).toBe(true);
    expect(vo.canRedo()).toBe(true);
  });

  it('should throw on invalid status', () => {
    expect(() => new ChemicalAnalysisStatusVO('STATUS_INVALIDO')).toThrow(
      'Status de Análise Química inválido',
    );
  });
});
