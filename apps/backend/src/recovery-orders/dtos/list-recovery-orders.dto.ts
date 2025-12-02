import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class ListRecoveryOrdersDto {
  @IsOptional()
  @IsEnum(TipoMetal)
  metalType?: TipoMetal;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  orderNumber?: string;
}
