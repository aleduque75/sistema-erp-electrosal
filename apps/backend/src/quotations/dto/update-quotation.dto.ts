import { IsString, IsDecimal, IsDateString, IsOptional } from 'class-validator';
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class UpdateQuotationDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString() // TipoMetal is an enum, but for DTO validation, string is fine
  metal?: TipoMetal;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  buyPrice?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '1,4' })
  sellPrice?: string;

  @IsOptional()
  @IsString()
  tipoPagamento?: string;
}
