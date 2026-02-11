import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsEnum,
  IsDateString,
  IsPositive,
} from 'class-validator';
import { TipoMetal } from '@prisma/client';

class SaleItemLotDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryLotId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;
}

class SaleItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  laborPercentage?: number;

  @IsString()
  @IsOptional()
  entryUnit?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  entryQuantity?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemLotDto)
  lots: SaleItemLotDto[];
}

export class CreateSaleDto {
  @IsUUID()
  @IsNotEmpty()
  pessoaId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsString()
  @IsNotEmpty()
  paymentMethod:
    | 'A_VISTA'
    | 'A_PRAZO'
    | 'CREDIT_CARD'
    | 'IMPORTADO'
    | 'METAL'
    | 'A_COMBINAR';

  @IsUUID()
  @IsOptional()
  clientMetalAccountId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfInstallments?: number;

  @IsUUID()
  @IsOptional()
  paymentTermId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  feeAmount?: number;

  @IsUUID()
  @IsOptional()
  contaCorrenteId?: string;

  // CORREÇÃO: Adicionado @Type para garantir a conversão da cotação
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  goldQuoteValue?: number;

  @IsString()
  @IsOptional()
  externalId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  freightAmount?: number;

  @IsEnum(TipoMetal)
  @IsOptional()
  paymentMetalType?: TipoMetal;

  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  orderNumber?: number;

  @IsString()
  @IsOptional()
  observation?: string;
}

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}

export class UpdateObservationDto {
  @IsString()
  @IsOptional()
  observation?: string;
}

export class ConfirmSaleDto {
  @IsEnum(TipoMetal)
  @IsOptional()
  paymentMetalType?: TipoMetal;

  @IsString()
  @IsNotEmpty()
  paymentMethod: 'A_VISTA' | 'A_PRAZO' | 'CREDIT_CARD' | 'METAL' | 'A_COMBINAR';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfInstallments?: number;

  @IsUUID()
  @IsOptional()
  contaCorrenteId?: string;

  @IsUUID()
  @IsOptional()
  clientMetalAccountId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  updatedNetAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  updatedGoldPrice?: number;

  @IsOptional()
  keepSaleStatusPending?: boolean;
}

export class BulkConfirmSalesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty({ each: true })
  saleIds: string[];
}

export class ReceiveInstallmentPaymentDto {
  @IsEnum(TipoMetal)
  @IsOptional()
  paymentMetalType?: TipoMetal;

  @IsString()
  @IsNotEmpty()
  paymentMethod: 'FINANCIAL' | 'METAL_CREDIT' | 'METAL';

  @IsUUID()
  @IsOptional()
  contaCorrenteId?: string;

  @IsUUID()
  @IsOptional()
  metalCreditId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amountReceived?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amountInGrams?: number;

  @IsString()
  @IsOptional()
  receivedAt?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  quotationBuyPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  purity?: number;
}
