import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCreditCardTransactionDto {
  @IsUUID() @IsNotEmpty() creditCardId: string;
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsDate() @Type(() => Date) date: Date;
  @IsUUID() @IsOptional() contaContabilId?: string;

  // Campos para parcelamento
  @IsBoolean() @IsOptional() isInstallment?: boolean;
  @IsInt() @Min(1) @IsOptional() installments?: number;
}

// O Update DTO pode ser mais simples, herdando do Create
export class UpdateCreditCardTransactionDto extends PartialType(
  // Omitimos o creditCardId do DTO base para a atualização
  CreateCreditCardTransactionDto,
) {}
