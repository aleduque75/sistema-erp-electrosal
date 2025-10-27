import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { StockUnit } from '@prisma/client';

export class CreateRawMaterialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(StockUnit)
  @IsOptional()
  unit?: StockUnit;

  @IsNumber()
  @IsNotEmpty()
  cost: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isForResale?: boolean;
}
