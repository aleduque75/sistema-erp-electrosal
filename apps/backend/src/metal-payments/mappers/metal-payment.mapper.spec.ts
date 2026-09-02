import { MetalPaymentMapper } from './metal-payment.mapper';
import { MetalPaymentEntity } from '../entities/metal-payment.entity';
import { TipoMetal } from '@prisma/client';

describe('MetalPaymentMapper', () => {
  it('should map domain entity to response DTO', () => {
    const payment = MetalPaymentEntity.create({
      organizationId: 'org-1',
      userId: 'user-1',
      clientId: 'cli-1',
      pureMetalLotId: 'lot-1',
      grams: 5,
      metalType: TipoMetal.AU,
      quotationPrice: 300,
      data: new Date('2026-09-02T10:00:00.000Z'),
    });

    const dto = MetalPaymentMapper.toResponseDto(payment);
    expect(dto.clientId).toBe('cli-1');
    expect(dto.grams).toBe(5);
    expect(dto.valorBRL).toBe(1500);
    expect(dto.quotation).toBe(300);
    expect(dto.metalType).toBe('AU');
    expect(dto.message).toContain('sucesso');
  });
});
