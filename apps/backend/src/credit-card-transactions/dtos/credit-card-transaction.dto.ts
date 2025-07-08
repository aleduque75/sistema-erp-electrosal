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
  @IsUUID()
  @IsNotEmpty({ message: 'O cartão de crédito é obrigatório.' })
  creditCardId: string;

  @IsString()
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  description: string;

  @IsNumber()
  amount: number;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isInstallment?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  installments?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  currentInstallment?: number;
}

// --- DTO para ATUALIZAR uma transação ---
export class UpdateCreditCardTransactionDto {
  @IsUUID() @IsOptional() creditCardId?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() amount?: number;
  @IsDate() @Type(() => Date) @IsOptional() date?: Date;
  @IsUUID() @IsOptional() categoryId?: string;
  @IsUUID() @IsOptional() creditCardBillId?: string;
  @IsBoolean() @IsOptional() isInstallment?: boolean;
  @IsInt() @Min(1) @IsOptional() installments?: number;
  @IsInt() @Min(1) @IsOptional() currentInstallment?: number;
}
