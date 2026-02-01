import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsNumber, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class RawMaterialItemDto {
  @IsUUID()
  @IsNotEmpty()
  rawMaterialId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

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

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;

  @IsOptional()
  @IsUUID()
  salespersonId?: string;

  @IsOptional()
  @IsNumber()
  commissionPercentage?: number;

  @IsOptional()
  @IsNumber()
  commissionAmount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RawMaterialItemDto)
  rawMaterials?: RawMaterialItemDto[];

  @IsOptional()
  @IsBoolean()
  allowResidueAnalyses?: boolean; // Adicionado para permitir análises de resíduo
}
