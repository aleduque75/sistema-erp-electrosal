import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProductGroupDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() @Min(0) commissionPercentage?: number;
  @IsBoolean() @IsOptional() isReactionProductGroup?: boolean;
}

export class UpdateProductGroupDto extends PartialType(CreateProductGroupDto) {}
