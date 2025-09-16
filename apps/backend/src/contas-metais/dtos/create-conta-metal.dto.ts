import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class CreateContaMetalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TipoMetal)
  @IsNotEmpty()
  metalType: TipoMetal;

  @IsNumber()
  @IsOptional()
  @Min(0)
  initialBalance?: number; // Saldo inicial opcional, default 0
}
