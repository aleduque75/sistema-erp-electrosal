import { IsString, IsNumber, IsDate, IsEnum, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { TipoTransacaoPrisma } from '@prisma/client';
import { Type } from 'class-transformer';

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
  @Type(() => Date)
  postedAt: Date;

  @IsEnum(TipoTransacaoPrisma)
  @IsNotEmpty()
  tipo: TipoTransacaoPrisma;

  @IsString()
  @IsOptional()
  contaContabilId?: string;

  @IsBoolean()
  @IsOptional()
  isTransfer?: boolean;

  @IsString()
  @IsOptional()
  destinationContaCorrenteId?: string;

  @IsNumber()
  @IsOptional()
  goldPrice?: number;

  @IsNumber()
  @IsOptional()
  goldAmount?: number;
}
