import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsUUID,
  ValidateNested,
} from 'class-validator';

// Define o formato de CADA transação dentro do lote
class TransactionToImportDto {
  @IsString()
  date: string;

  @IsString()
  description: string;

  @IsNumber()
  value: number;

  @IsString()
  @IsOptional()
  installment?: string;

  @IsUUID()
  contaContabilId: string;

  @IsUUID()
  creditCardId: string;
}

// Define o formato do corpo principal da requisição
export class ImportTransactionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionToImportDto)
  transactions: TransactionToImportDto[];
}
