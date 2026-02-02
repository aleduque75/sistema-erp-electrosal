import { IsString, IsNumber, IsDateString, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer'; // <--- Importação necessária
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class CreateQuotationDto {
  @IsString()
  metal: TipoMetal;

  @IsDateString()
  date: string;

  // Mudamos de IsDecimal para IsNumber e adicionamos o @Type
  @IsNumber()
  @Type(() => Number) 
  buyPrice: number; // Mudamos de string para number

  @IsNumber()
  @Type(() => Number)
  sellPrice: number; // Mudamos de string para number

  @IsOptional()
  @IsString()
  tipoPagamento?: string;
}