// Caminho: apps/backend/src/accounts-rec/dtos/accounts-rec.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountRecDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsUUID()
  @IsOptional()
  saleId?: string;
}

export class UpdateAccountRecDto extends PartialType(CreateAccountRecDto) {}

export class ReceivePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  receivedAt?: Date;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amountReceived?: number;
}
