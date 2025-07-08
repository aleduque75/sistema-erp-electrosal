import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsUUID,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCreditCardBillDto {
  @IsUUID() @IsNotEmpty() creditCardId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsDate() @Type(() => Date) startDate: Date;
  @IsDate() @Type(() => Date) endDate: Date;
  @IsDate() @Type(() => Date) dueDate: Date;
  @IsNumber() @Min(0) totalAmount: number;
}

// ✅ CORREÇÃO: DTO de atualização definido manualmente
export class UpdateCreditCardBillDto {
  @IsUUID() @IsOptional() creditCardId?: string;
  @IsString() @IsOptional() name?: string;
  @IsDate() @Type(() => Date) @IsOptional() startDate?: Date;
  @IsDate() @Type(() => Date) @IsOptional() endDate?: Date;
  @IsDate() @Type(() => Date) @IsOptional() dueDate?: Date;
  @IsNumber() @Min(0) @IsOptional() totalAmount?: number;
}

export class PayCreditCardBillDto {
  @IsUUID() @IsNotEmpty() contaCorrenteId: string;
  @IsUUID() @IsNotEmpty() contaContabilId: string;
  @IsDate() @IsOptional() @Type(() => Date) paidAt?: Date;
}

export class CreateCreditCardBillWithTransactionsDto {
  @IsUUID() @IsNotEmpty() creditCardId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsDate() @Type(() => Date) startDate: Date;
  @IsDate() @Type(() => Date) endDate: Date;
  @IsDate() @Type(() => Date) dueDate: Date;

  @IsArray()
  @IsUUID('4', { each: true })
  transactionIds: string[];
}
