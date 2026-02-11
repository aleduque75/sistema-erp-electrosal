import { IsArray, IsString } from 'class-validator';

export class BulkUpdateTransacaoDto {
  @IsArray()
  @IsString({ each: true })
  transactionIds: string[];

  @IsString()
  contaContabilId: string;
}
