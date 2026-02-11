import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetal, PureMetalLotStatus } from '@prisma/client';

export class CreatePureMetalLotDto {
  @IsString()
  @IsNotEmpty()
  sourceType: string;

  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @IsEnum(TipoMetal)
  @IsNotEmpty()
  metalType: TipoMetal;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  initialGrams: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  remainingGrams?: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  purity: number;

  @IsEnum(PureMetalLotStatus)
  @IsOptional()
  status?: PureMetalLotStatus;

  @IsDateString()
  @IsOptional()
  entryDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  saleId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}