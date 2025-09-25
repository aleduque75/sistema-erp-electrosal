import { IsString, IsNumber, IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import { TipoTransacaoPrisma } from '@prisma/client';

export class TransacaoLoteDto {
  @IsString()
  @IsNotEmpty()
  fitId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDate()
  @IsNotEmpty()
  postedAt: Date;

  @IsEnum(TipoTransacaoPrisma)
  @IsNotEmpty()
  tipo: TipoTransacaoPrisma;

  @IsString()
  @IsNotEmpty()
  contaContabilId: string;
}
