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

// --- DTO para criar uma ÚNICA transação ---
export class CreateCreditCardTransactionDto {
  @IsUUID() @IsNotEmpty() creditCardId: string;
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() amount: number;
  @IsDate() @Type(() => Date) date: Date;
  @IsUUID() @IsOptional() categoryId?: string;
  @IsInt() @Min(1) @IsOptional() installments?: number;
}

// --- DTO para ATUALIZAR uma transação ---
export class UpdateCreditCardTransactionDto {
  @IsUUID()
  @IsOptional()
  creditCardId?: string; // ✅ CAMPO ADICIONADO

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  creditCardBillId?: string;
}

// ✅ DTO PARA CRIAR PARCELAS (ESTAVA FALTANDO)
export class CreateInstallmentTransactionsDto {
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0.01) totalAmount: number;
  @IsInt() @Min(2) installments: number;
  @IsDate() @Type(() => Date) firstInstallmentDate: Date;
  @IsUUID() @IsNotEmpty() creditCardId: string;
  @IsUUID() @IsOptional() categoryId?: string;
}
