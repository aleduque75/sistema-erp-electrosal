import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
  IsBoolean,
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
  @IsDate()
  @Type(() => Date)
  receivedAt: Date;

  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string;
}
