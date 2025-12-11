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

class FinancialPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

class MetalCreditPaymentDto {
  @IsString()
  @IsNotEmpty()
  metalCreditId: string;

  @IsNumber()
  @Min(0.000001)
  amountInGrams: number;
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
}
