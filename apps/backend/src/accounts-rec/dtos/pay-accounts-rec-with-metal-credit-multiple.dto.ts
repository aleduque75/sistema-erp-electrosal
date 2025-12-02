import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  ValidateIf,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class MetalCreditPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  metalCreditId: string;

  @IsNumber()
  @Min(0.000001)
  @IsNotEmpty()
  amountInGrams: number;
}

export class PayAccountsRecWithMetalCreditMultipleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetalCreditPaymentDto)
  payments: MetalCreditPaymentDto[];

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.customBuyPrice)
  quotationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ValidateIf((o) => !o.quotationId)
  customBuyPrice?: number;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
