// Caminho: apps/backend/src/accounts-rec/dtos/accounts-rec.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsArray, // Added
  ValidateNested, // Added
  IsDateString, // Added
  IsDate, // Added
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountRecDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsUUID()
  @IsOptional()
  saleId?: string;
}

export class UpdateAccountRecDto extends PartialType(CreateAccountRecDto) {}

export class PaymentEntryDto {
  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  goldAmount?: number; // Optional for payments in gold
}

export class ReceivePaymentDto {
  @IsDateString()
  @IsOptional()
  receivedAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentEntryDto)
  payments: PaymentEntryDto[];
}
