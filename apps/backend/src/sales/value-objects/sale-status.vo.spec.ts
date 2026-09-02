import { SaleStatusVO } from './sale-status.vo';
import { SaleStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('SaleStatusVO', () => {
  it('should create valid status from enum and string', () => {
    const statusEnum = new SaleStatusVO(SaleStatus.PENDENTE);
    expect(statusEnum.value).toBe(SaleStatus.PENDENTE);
    expect(statusEnum.isPendente()).toBe(true);

    const statusStr = SaleStatusVO.fromString('confirmado');
    expect(statusStr.value).toBe(SaleStatus.CONFIRMADO);
    expect(statusStr.isConfirmado()).toBe(true);
  });

  it('should throw BadRequestException for invalid status', () => {
    expect(() => new SaleStatusVO('INVALID_STATUS' as any)).toThrow(BadRequestException);
  });

  it('should check editable and cancellable states correctly', () => {
    const pendente = SaleStatusVO.PENDENTE();
    expect(pendente.isEditable()).toBe(true);
    expect(pendente.isCancellable()).toBe(true);

    const finalizado = SaleStatusVO.FINALIZADO();
    expect(finalizado.isEditable()).toBe(false);
    expect(finalizado.isCancellable()).toBe(false);

    const cancelado = SaleStatusVO.CANCELADO();
    expect(cancelado.isEditable()).toBe(false);
    expect(cancelado.isCancellable()).toBe(false);
  });

  it('should validate valid status transitions', () => {
    const pendente = SaleStatusVO.PENDENTE();
    expect(pendente.canTransitionTo(SaleStatus.CONFIRMADO)).toBe(true);
    expect(pendente.canTransitionTo(SaleStatus.CANCELADO)).toBe(true);
    expect(pendente.canTransitionTo(SaleStatus.A_SEPARAR)).toBe(true);

    const confirmado = SaleStatusVO.CONFIRMADO();
    expect(confirmado.canTransitionTo(SaleStatus.PENDENTE)).toBe(true);
    expect(confirmado.canTransitionTo(SaleStatus.A_SEPARAR)).toBe(true);
    expect(confirmado.canTransitionTo(SaleStatus.CANCELADO)).toBe(true);
  });

  it('should prevent invalid status transitions', () => {
    const finalizado = SaleStatusVO.FINALIZADO();
    expect(finalizado.canTransitionTo(SaleStatus.CONFIRMADO)).toBe(false);
    expect(finalizado.canTransitionTo(SaleStatus.A_SEPARAR)).toBe(false);
    expect(finalizado.canTransitionTo(SaleStatus.SEPARADO)).toBe(false);

    const cancelado = SaleStatusVO.CANCELADO();
    expect(cancelado.canTransitionTo(SaleStatus.PENDENTE)).toBe(false);
    expect(cancelado.canTransitionTo(SaleStatus.CONFIRMADO)).toBe(false);
    expect(cancelado.canTransitionTo(SaleStatus.FINALIZADO)).toBe(false);
  });
});
