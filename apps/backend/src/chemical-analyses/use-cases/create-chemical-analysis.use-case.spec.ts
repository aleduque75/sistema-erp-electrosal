import { CreateChemicalAnalysisUseCase } from './create-chemical-analysis.use-case';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';
import { ChemicalAnalysisEntity } from '../entities/chemical-analysis.entity';

describe('CreateChemicalAnalysisUseCase', () => {
  let useCase: CreateChemicalAnalysisUseCase;
  let mockRepo: jest.Mocked<ChemicalAnalysesRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockImplementation(async (entity: ChemicalAnalysisEntity) => {
        return ChemicalAnalysisEntity.create({
          id: 'an-created-id',
          organizationId: entity.organizationId,
          numeroAnalise: entity.numeroAnalise,
          descricaoMaterial: entity.descricaoMaterial,
          volumeOuPesoEntrada: entity.volumeOuPesoEntrada,
          unidadeEntrada: entity.unidadeEntrada,
        });
      }),
      save: jest.fn(),
      findById: jest.fn(),
      findByIdWithDetails: jest.fn(),
      findByNumeroAnalise: jest.fn().mockResolvedValue(null),
      findAll: jest.fn(),
      findAnalisesAprovadasSemOrdem: jest.fn(),
      delete: jest.fn(),
      getNextCrrNumber: jest.fn().mockResolvedValue('CRR-3115'),
      executeInTransaction: jest.fn(),
    };

    useCase = new CreateChemicalAnalysisUseCase(mockRepo);
  });

  it('should create chemical analysis successfully with provided number', async () => {
    const result = await useCase.execute('org-1', {
      numeroAnalise: 'AN-2026-001',
      descricaoMaterial: 'Solução Ouro',
      volumeOuPesoEntrada: 15,
      unidadeEntrada: 'L',
    });

    expect(result.id).toBe('an-created-id');
    expect(result.numeroAnalise).toBe('AN-2026-001');
  });

  it('should auto-generate analysis number when not provided', async () => {
    const result = await useCase.execute('org-1', {
      descricaoMaterial: 'Banho de Ouro',
      volumeOuPesoEntrada: 50,
      unidadeEntrada: 'Lt',
    });

    expect(mockRepo.getNextCrrNumber).toHaveBeenCalledWith('org-1', undefined);
    expect(result.id).toBe('an-created-id');
    expect(result.numeroAnalise).toBe('CRR-3115');
  });

  it('should throw ConflictException if analysis number already exists', async () => {
    mockRepo.findByNumeroAnalise.mockResolvedValueOnce(
      ChemicalAnalysisEntity.create({
        organizationId: 'org-1',
        numeroAnalise: 'AN-2026-001',
        descricaoMaterial: 'Existente',
        volumeOuPesoEntrada: 10,
        unidadeEntrada: 'L',
      }),
    );

    await expect(
      useCase.execute('org-1', {
        numeroAnalise: 'AN-2026-001',
        descricaoMaterial: 'Solução Ouro',
        volumeOuPesoEntrada: 15,
        unidadeEntrada: 'L',
      }),
    ).rejects.toThrow('Já existe uma análise com o número "AN-2026-001"');
  });
});
