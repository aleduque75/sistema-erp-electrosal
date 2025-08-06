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
