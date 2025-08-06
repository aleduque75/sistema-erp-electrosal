import { PartialType } from '@nestjs/mapped-types';
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

export class CreateCreditCardTransactionDto {
  @IsUUID() @IsNotEmpty() creditCardId: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsDate() @Type(() => Date) date: Date;
  @IsUUID() @IsOptional() contaContabilId?: string;
  @IsBoolean() @IsOptional() isInstallment?: boolean;
  @IsInt() @Min(1) @IsOptional() installments?: number;
  @IsInt() @Min(1) @IsOptional() currentInstallment?: number; // Adicionado
}

export class UpdateCreditCardTransactionDto extends PartialType(
  CreateCreditCardTransactionDto,
) {}
