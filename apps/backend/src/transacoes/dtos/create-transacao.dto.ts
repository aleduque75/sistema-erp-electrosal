import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoTransacaoPrisma } from '@prisma/client';

// DTO para uma única transação no lote
class TransacaoLoteDto {
  @IsString() @IsOptional() fitId?: string;
  @IsEnum(TipoTransacaoPrisma) tipo: TipoTransacaoPrisma;
  @IsNumber() @Min(0.01) amount: number;
  @IsString() @IsOptional() description: string;
  @IsDate() @Type(() => Date) postedAt: Date;
  @IsUUID() @IsNotEmpty() contaContabilId: string;
}

// DTO principal que recebe o array
export class CreateBulkTransacoesDto {
  @IsUUID() @IsNotEmpty() contaCorrenteId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransacaoLoteDto)
  transactions: TransacaoLoteDto[];
}
