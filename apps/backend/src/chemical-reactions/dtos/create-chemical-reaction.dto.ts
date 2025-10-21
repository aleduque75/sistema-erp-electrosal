import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetal } from '@sistema-erp-electrosal/core';

class SourceLotDto {
  @IsString()
  @IsNotEmpty()
  pureMetalLotId: string;

  @IsNumber()
  gramsToUse: number;
}

export class CreateChemicalReactionDto {
  @IsEnum(TipoMetal)
  metalType: TipoMetal;

  @IsString()
  @IsNotEmpty()
  outputProductId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SourceLotDto)
  sourceLots: SourceLotDto[];

  @IsString()
  @IsOptional()
  batchNumber?: string; // Novo campo para batchNumber manual

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  leftoversUsedIds?: string[];

  // TODO: Adicionar outros campos do DTO conforme necessário (inputs/outputs de sobras, etc.)
}