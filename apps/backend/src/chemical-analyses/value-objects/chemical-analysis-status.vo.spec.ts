import { ChemicalAnalysisStatusVO } from './chemical-analysis-status.vo';

describe('ChemicalAnalysisStatusVO', () => {
  it('should create valid statuses and test boolean helpers', () => {
    const vo = new ChemicalAnalysisStatusVO('ANALISADO_AGUARDANDO_APROVACAO');
    expect(vo.isPendingApproval).toBe(true);
    expect(vo.canApprove()).toBe(true);
    expect(vo.canReject()).toBe(true);
    expect(vo.canRedo()).toBe(true);
    expect(vo.canPostResult()).toBe(true);
  });

  it('should allow posting results for RECEBIDO, EM_ANALISE and ANALISADO_AGUARDANDO_APROVACAO', () => {
    expect(new ChemicalAnalysisStatusVO('RECEBIDO').canPostResult()).toBe(true);
    expect(new ChemicalAnalysisStatusVO('EM_ANALISE').canPostResult()).toBe(true);
    expect(new ChemicalAnalysisStatusVO('ANALISADO_AGUARDANDO_APROVACAO').canPostResult()).toBe(true);
    expect(new ChemicalAnalysisStatusVO('APROVADO_PARA_RECUPERACAO').canPostResult()).toBe(false);
    expect(new ChemicalAnalysisStatusVO('FINALIZADO_RECUPERADO').canPostResult()).toBe(false);
  });

  it('should throw on invalid status', () => {
    expect(() => new ChemicalAnalysisStatusVO('STATUS_INVALIDO')).toThrow(
      'Status de Análise Química inválido',
    );
  });
});
