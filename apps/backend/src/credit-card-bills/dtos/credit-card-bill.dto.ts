import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsUUID,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO para CRIAR uma nova fatura a partir de transações
export class CreateCreditCardBillDto {
  @IsUUID()
  @IsNotEmpty()
  creditCardId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsArray()
  @IsUUID('4', { each: true })
  transactionIds: string[];
}

// DTO para ATUALIZAR uma fatura existente (ex: mudar data de vencimento)
export class UpdateCreditCardBillDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;
}

// DTO para a ação de PAGAR uma fatura
export class PayCreditCardBillDto {
  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string; // De qual conta corrente sairá o dinheiro

  @IsUUID()
  @IsNotEmpty()
  contaContabilId: string; // Qual conta de passivo está sendo quitada (a dívida do cartão)

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;
}

// TODO: Este DTO parece ser um duplicado do CreateCreditCardBillDto.
// Pode ser removido se não tiver um propósito diferente.
export class CreateBillFromTransactionsDto {
  @IsUUID() @IsNotEmpty() creditCardId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsDate() @Type(() => Date) startDate: Date;
  @IsDate() @Type(() => Date) endDate: Date;
  @IsDate() @Type(() => Date) dueDate: Date;
  @IsArray() @IsUUID('4', { each: true }) transactionIds: string[];
}
