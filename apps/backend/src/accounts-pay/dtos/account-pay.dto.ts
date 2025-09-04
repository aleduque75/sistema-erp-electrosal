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

  @IsBoolean()
  @IsOptional()
  isInstallment?: boolean;

  @IsInt()
  @Min(2)
  @IsOptional()
  totalInstallments?: number;
}

// Agora o PartialType será reconhecido
export class UpdateAccountPayDto extends PartialType(CreateAccountPayDto) {}

export class PayAccountDto {
  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;
}

export class SplitAccountPayDto {
  @IsInt()
  @Min(2)
  @IsNotEmpty()
  numberOfInstallments: number;
}
