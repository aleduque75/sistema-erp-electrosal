import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { SaleAdjustmentCalcMethod } from '@prisma/client';

export class CreateProductGroupDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() commissionPercentage?: number;
  @IsBoolean() @IsOptional() isReactionProductGroup?: boolean;

  @IsEnum(SaleAdjustmentCalcMethod)
  @IsOptional()
  adjustmentCalcMethod?: SaleAdjustmentCalcMethod;
}

export class UpdateProductGroupDto extends PartialType(CreateProductGroupDto) {}
