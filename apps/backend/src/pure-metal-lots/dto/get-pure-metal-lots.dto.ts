import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetal } from '@prisma/client';

export class GetPureMetalLotsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  remainingGramsGt?: number;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsEnum(TipoMetal)
  metalType?: TipoMetal;

  @IsOptional()
  @IsString()
  status?: string;
}
