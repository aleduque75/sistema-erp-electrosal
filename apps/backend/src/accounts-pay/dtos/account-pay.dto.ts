import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUUID,
  IsDate,
  IsBoolean, // Adicione este import
  IsInt, // Adicione este import
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountPayDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  @IsOptional()
  contaContabilId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  // ADICIONE ESTES DOIS CAMPOS:
  @IsBoolean()
  @IsOptional()
  isInstallment?: boolean;

  @IsInt()
  @Min(2)
  @IsOptional()
  totalInstallments?: number;
}

export class UpdateAccountPayDto extends PartialType(CreateAccountPayDto) {}

export class PayAccountDto {
  @IsUUID() @IsNotEmpty() contaCorrenteId: string;
  @IsUUID() @IsNotEmpty() contaContabilId: string;
  @IsDate() @IsOptional() @Type(() => Date) paidAt?: Date;
}
