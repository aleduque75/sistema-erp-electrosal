// apps/backend/src/accounts-rec/dtos/account-rec.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
  IsBoolean,
  IsUUID, // <--- Importe IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountRecDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date) // Importante para transformar string em Date
  dueDate: Date; // Campo obrigatório

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  receiveDate?: Date; // Opcional

  @IsBoolean()
  @IsOptional()
  received?: boolean; // Opcional

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  receivedAt?: Date; // Opcional
}

export class UpdateAccountRecDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  receiveDate?: Date;

  @IsBoolean()
  @IsOptional()
  received?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  receivedAt?: Date;
}

// --- NOVO DTO: ReceivePaymentDto ---
export class ReceivePaymentDto {
  @IsDate()
  @IsOptional() // A data de recebimento pode ser opcional; o serviço pode usar Date() por padrão
  @Type(() => Date)
  receivedAt?: Date;

  @IsString()
  @IsUUID() // Valida que o ID da conta corrente é um UUID válido
  @IsNotEmpty() // A conta corrente é obrigatória para registrar o recebimento
  contaCorrenteId: string; // ID da Conta Corrente onde o dinheiro será creditado
}
