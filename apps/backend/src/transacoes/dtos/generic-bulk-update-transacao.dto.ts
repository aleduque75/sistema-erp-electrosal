import { IsArray, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GenericBulkUpdateTransacaoDto {
  @IsArray()
  @IsUUID('4', { each: true })
  transactionIds: string[];

  @IsOptional()
  @IsUUID()
  contaContabilId?: string;

  @IsOptional()
  @IsUUID()
  fornecedorId?: string;

  @IsOptional()
  @IsUUID()
  contaCorrenteId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  goldPrice?: number;
}

