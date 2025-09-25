import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TransacaoLoteDto } from './transacao-lote.dto';

export class BulkCreateTransacaoDto {
  @IsString()
  contaCorrenteId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransacaoLoteDto)
  transactions: TransacaoLoteDto[];
}
