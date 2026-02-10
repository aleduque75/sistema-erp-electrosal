import { PartialType } from '@nestjs/mapped-types';
import { CreatePureMetalLotDto } from './create-pure-metal-lot.dto';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { PureMetalLotStatus, TipoMetal } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdatePureMetalLotDto extends PartialType(CreatePureMetalLotDto) {
  @IsEnum(PureMetalLotStatus)
  @IsOptional()
  status?: PureMetalLotStatus;

  @IsDateString()
  @IsOptional()
  entryDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  remainingGrams?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  purity?: number;

  @IsEnum(TipoMetal)
  @IsOptional()
  metalType?: TipoMetal;

  @IsString()
  @IsOptional()
  sourceType?: string;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  saleId?: string;
}