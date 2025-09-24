import { IsString, IsDecimal, IsDateString, IsOptional, IsNotEmpty } from 'class-validator';
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class CreateQuotationDto {
  @IsString() // TipoMetal is an enum, but for DTO validation, string is fine
  metal: TipoMetal;

  @IsDateString()
  date: string; // Use string for DTO, convert to Date later

  @IsDecimal({ decimal_digits: '1,4' }) // Allow up to 4 decimal places
  buyPrice: string; // Use string for DTO, convert to Decimal later

  @IsDecimal({ decimal_digits: '1,4' }) // Allow up to 4 decimal places
  sellPrice: string; // Use string for DTO, convert to Decimal later

  @IsOptional()
  @IsString()
  tipoPagamento?: string; // Renamed from paymentType to match incoming request
}
