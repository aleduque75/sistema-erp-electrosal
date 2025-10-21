import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { StockUnit } from '@prisma/client';

export class CreateProductDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @IsOptional() stock?: number;
  @IsEnum(StockUnit) @IsOptional() stockUnit?: StockUnit;
  @IsNumber() @IsOptional() costPrice?: number; // Adicionado
  @IsNumber() @IsOptional() goldValue?: number; // Adicionado
  @IsUUID() @IsOptional() productGroupId?: string; // NOVO CAMPO
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

// Mantendo os DTOs de importação de XML que você já tinha
export class ImportXmlDto {
  @IsNotEmpty()
  @IsString()
  xmlContent: string;
}
export class ManualMatchesDto {
  [xmlName: string]: string;
}