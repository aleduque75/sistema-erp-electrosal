import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoMetal } from '@prisma/client';

class FinancialPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsNumber()
  quotation?: number;
}

class MetalCreditPaymentDto {
  @IsString()
  @IsNotEmpty()
  metalCreditId: string;

  @IsNumber()
  @Min(0.000001)
  amountInGrams: number;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsNumber()
  quotation?: number;
}

class MetalPaymentDto {
  @IsString()
  @IsNotEmpty()
  metalType: 'AU' | 'AG' | 'RH';

  @IsNumber()
  @Min(0.000001)
  amountInGrams: number;

  @IsNumber()
  @Min(0.01)
  purity: number;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsNumber()
  quotation?: number;
}

export class TransferToOtherMetalCreditDto {
  @IsString()
  @IsNotEmpty()
  metalCreditId: string; // O metalCreditId do *outro* cliente

  @IsNumber()
  @Min(0.000001)
  grams: number; // A quantidade de gramas a ser transferida

  @IsNumber()
  @Min(0.01)
  quotation: number; // A cotação usada para converter os gramas para BRL na transferência
}

export class HybridReceiveDto {
  @IsDateString()
  receivedAt: string;

  @IsNumber()
  @IsOptional()
  quotation?: number;

  @IsBoolean()
  finalize: boolean;

  @IsOptional()
  @IsUUID()
  installmentId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinancialPaymentDto)
  financialPayments?: FinancialPaymentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetalCreditPaymentDto)
  metalCreditPayments?: MetalCreditPaymentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetalPaymentDto)
  metalPayments?: MetalPaymentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferToOtherMetalCreditDto)
  transferToOtherMetalCredits?: TransferToOtherMetalCreditDto[]; // NOVO CAMPO
}