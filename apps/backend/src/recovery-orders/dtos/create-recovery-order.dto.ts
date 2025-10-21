import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class CreateRecoveryOrderDto {
  @IsEnum(TipoMetal)
  metalType: TipoMetal;

  @IsArray()
  @IsNotEmpty({ each: true }) // Garante que o array não está vazio e cada item não é vazio
  @IsUUID('4', { each: true }) // Garante que cada item é um UUID válido
  chemicalAnalysisIds: string[];

  @IsOptional()
  @IsString()
  descricaoProcesso?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
