import { ChemicalAnalysisMapper } from './chemical-analysis.mapper';

describe('ChemicalAnalysisMapper', () => {
  it('should map between Prisma raw, Domain Entity and DTO', () => {
    const raw = {
      id: 'an-1',
      organizationId: 'org-1',
      clienteId: 'cli-1',
      numeroAnalise: 'AN-2026-099',
      dataEntrada: new Date(),
      descricaoMaterial: 'Pó de Ouro',
      volumeOuPesoEntrada: 100,
      unidadeEntrada: 'g',
      resultadoAnaliseValor: 85,
      unidadeResultado: '%',
      status: 'APROVADO_PARA_RECUPERACAO',
      metalType: 'AU',
      isWriteOff: false,
    };

    const entity = ChemicalAnalysisMapper.toDomain(raw);
    expect(entity.id).toBe('an-1');
    expect(entity.numeroAnalise).toBe('AN-2026-099');
    expect(entity.status.isApproved).toBe(true);

    const persistence = ChemicalAnalysisMapper.toPersistence(entity);
    expect(persistence.numeroAnalise).toBe('AN-2026-099');

    const dto = ChemicalAnalysisMapper.toResponseDto(entity, { clientName: 'Joalheria Central' });
    expect(dto.clientName).toBe('Joalheria Central');
  });
});
