import { MetalPaymentEntity } from '../entities/metal-payment.entity';

export interface MetalPaymentResponseDto {
  message: string;
  clientId: string;
  pureMetalLotId: string;
  grams: number;
  valorBRL: number;
  quotation: number;
  metalType: string;
  date: string;
}

export class MetalPaymentMapper {
  static toResponseDto(entity: MetalPaymentEntity, message = 'Pagamento em metal ao cliente registrado com sucesso.'): MetalPaymentResponseDto {
    return {
      message,
      clientId: entity.clientId,
      pureMetalLotId: entity.pureMetalLotId,
      grams: entity.grams.value,
      valorBRL: entity.calculateBRLValue().toNumber(),
      quotation: entity.quotationPrice,
      metalType: entity.metalType.value,
      date: entity.data.toISOString(),
    };
  }
}
