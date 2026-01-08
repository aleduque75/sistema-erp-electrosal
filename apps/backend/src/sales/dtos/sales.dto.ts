import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested, IsEnum, IsDateString, IsPositive } from 'class-validator';
import { TipoMetal } from '@prisma/client';

class SaleItemLotDto {
  @IsUUID() @IsNotEmpty() inventoryLotId: string;
  @IsNumber() @Min(0.0001) quantity: number;
}

class SaleItemDto {
  @IsUUID() @IsNotEmpty() productId: string;
  @IsNumber()
  @Min(0.0001)
  quantity: number;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @IsOptional() laborPercentage?: number;
  @IsString() @IsOptional() entryUnit?: string;
  @IsNumber() @IsOptional() entryQuantity?: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemLotDto)
  lots: SaleItemLotDto[];
}

export class CreateSaleDto {
  @IsUUID() @IsNotEmpty() pessoaId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
  @IsString() @IsNotEmpty() paymentMethod: 'A_VISTA' | 'A_PRAZO' | 'CREDIT_CARD' | 'IMPORTADO' | 'METAL' | 'A_COMBINAR';

  @IsUUID() @IsOptional() clientMetalAccountId?: string; // Opcional: ID da conta de metal do cliente, se houver mais de uma

  @IsInt() @Min(1) @IsOptional() numberOfInstallments?: number; // Para Cartão de Crédito
  @IsUUID() @IsOptional() paymentTermId?: string; // Para Venda a Prazo

  @IsNumber() @IsOptional() @Min(0) feeAmount?: number;
  @IsUUID() @IsOptional() contaCorrenteId?: string;
  @IsNumber() @IsOptional() @Min(0) goldQuoteValue?: number; // Adicionado para importação
  @IsString() @IsOptional() externalId?: string; // Adicionado para importação
  @IsNumber() @IsOptional() @Min(0) freightAmount?: number; // Adicionado para custos de frete
  @IsEnum(TipoMetal) @IsOptional() paymentMetalType?: TipoMetal;
  
  @IsDateString() @IsOptional() createdAt?: string;
  @IsInt() @IsPositive() @IsOptional() orderNumber?: number;
  @IsString() @IsOptional() observation?: string;
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

  @IsNumber()
  @IsOptional()
  updatedNetAmount?: number;

  @IsNumber()
  @IsOptional()
  updatedGoldPrice?: number;

  @IsOptional() // Adicionado para permitir que a venda não seja finalizada imediatamente
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
  paymentMethod: 'FINANCIAL' | 'METAL_CREDIT' | 'METAL'; // Changed to be more explicit

  @IsUUID()
  @IsOptional()
  contaCorrenteId?: string;

  @IsUUID()
  @IsOptional()
  metalCreditId?: string;

  @IsNumber()
  @IsOptional()
  amountReceived?: number; // For FINANCIAL payment method

  @IsNumber()
  @IsOptional()
  amountInGrams?: number; // For METAL_CREDIT or METAL payment method

  @IsString()
  @IsOptional()
  receivedAt?: string; // Date of payment

  @IsNumber()
  @IsOptional()
  quotationBuyPrice?: number; // Custom quotation for metal payments

  @IsNumber()
  @IsOptional()
  purity?: number; // For METAL payment method
}