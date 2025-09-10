import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do produto é obrigatório.' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;
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