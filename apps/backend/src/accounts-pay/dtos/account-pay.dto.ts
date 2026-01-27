// 👇 IMPORTE O PartialType AQUI 👇
import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
  IsUUID,
  Min,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountPayDto {
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
  contaContabilId?: string;

  @IsUUID()
  @IsOptional()
  fornecedorId?: string;

  @IsBoolean()
  @IsOptional()
  isInstallment?: boolean;

  @IsInt()
  @IsOptional()
  totalInstallments?: number;
}

// Agora o PartialType será reconhecido
export class UpdateAccountPayDto extends PartialType(CreateAccountPayDto) {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  createdAt?: Date;
}

export class PayAccountDto {
  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string;

  @IsUUID()
  @IsOptional()
  contaContabilId?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  paidAmount?: number;

  @IsBoolean()
  @IsOptional()
  generateNewBillForRemaining?: boolean;

  @IsNumber()
  @IsOptional()
  quotation?: number;
}

export class SplitAccountPayDto {
  @IsInt()
  @Min(2)
  @IsNotEmpty()
  numberOfInstallments: number;
}

export * from './pay-with-metal.dto';
