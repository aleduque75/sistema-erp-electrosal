import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

class SaleItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsUUID()
  @IsOptional()
  contaCorrenteId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  // ✅ CAMPOS ADICIONADOS
  @IsInt()
  @Min(1)
  @IsOptional()
  installmentsCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  feeAmount?: number;
}

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}
