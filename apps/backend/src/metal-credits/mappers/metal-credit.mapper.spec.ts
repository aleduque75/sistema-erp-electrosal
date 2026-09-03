import { MetalCreditMapper } from './metal-credit.mapper';
import { TipoMetal, MetalCreditStatus } from '@prisma/client';

describe('MetalCreditMapper', () => {
  it('should map between Prisma, Domain and DTO', () => {
    const raw = {
      id: 'mc-1',
      organizationId: 'org-1',
      clientId: 'client-1',
      chemicalAnalysisId: null,
      metalType: TipoMetal.AU,
      grams: 80,
      settledGrams: 20,
      status: MetalCreditStatus.PARTIALLY_PAID,
      date: new Date('2026-03-01'),
      pureMetalLotId: 'lot-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const entity = MetalCreditMapper.toDomain(raw);
    expect(entity.id).toBe('mc-1');
    expect(entity.gramsNumber).toBe(80);
    expect(entity.settledGramsNumber).toBe(20);

    const persistence = MetalCreditMapper.toPersistence(entity);
    expect(persistence.grams).toBe(80);
    expect(persistence.settledGrams).toBe(20);
    expect(persistence.status).toBe('PARTIALLY_PAID');

    const dto = MetalCreditMapper.toResponseDto(entity, { clientName: 'Empresa X' });
    expect(dto.clientName).toBe('Empresa X');
  });
});
