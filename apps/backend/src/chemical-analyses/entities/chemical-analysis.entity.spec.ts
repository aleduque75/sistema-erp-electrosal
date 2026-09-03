import { ChemicalAnalysisEntity } from './chemical-analysis.entity';

describe('ChemicalAnalysisEntity', () => {
  it('should create an entity with initial state and calculate yield on postResult', () => {
    const analysis = ChemicalAnalysisEntity.create({
      organizationId: 'org-1',
      numeroAnalise: 'AN-2026-001',
      descricaoMaterial: 'Solução Ácida',
      volumeOuPesoEntrada: 10,
      unidadeEntrada: 'L',
    });

    expect(analysis.numeroAnalise).toBe('AN-2026-001');
    expect(analysis.status.isInAnalysis).toBe(true);

    analysis.postResult({
      resultadoAnaliseValor: 5.5,
      unidadeResultado: 'g/L',
      percentualQuebra: 10,
      taxaServicoPercentual: 15,
    });

    expect(analysis.status.isPendingApproval).toBe(true);
    expect(analysis.auEstimadoBrutoGramas).toBe(55); // 10 * 5.5
    expect(analysis.auEstimadoRecuperavelGramas).toBe(49.5); // 55 * 0.9
  });

  it('should approve, reject and redo correctly', () => {
    const analysis = ChemicalAnalysisEntity.create({
      organizationId: 'org-1',
      numeroAnalise: 'AN-2026-002',
      descricaoMaterial: 'Lodo',
      volumeOuPesoEntrada: 5,
      unidadeEntrada: 'kg',
      status: 'ANALISADO_AGUARDANDO_APROVACAO',
    });

    analysis.approve();
    expect(analysis.status.isApproved).toBe(true);

    analysis.reject();
    expect(analysis.status.isRejected).toBe(true);

    analysis.redo();
    expect(analysis.status.isInAnalysis).toBe(true);
  });
});
