import { IsArray, IsString, IsOptional, IsUUID } from 'class-validator';

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
}
