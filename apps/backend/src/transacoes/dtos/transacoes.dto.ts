import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsISO8601,
} from 'class-validator';
import { TipoTransacaoPrisma } from '@prisma/client';

export class CreateTransacaoDto {
  @IsEnum(TipoTransacaoPrisma)
  @IsNotEmpty()
  tipo: TipoTransacaoPrisma;

  @IsNumber()
  @IsNotEmpty()
  valor: number;

  @IsString()
  @IsNotEmpty()
  moeda: string;

  @IsISO8601()
  @IsNotEmpty()
  dataHora: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsNotEmpty()
  contaContabilId: string;

  @IsString()
  @IsOptional()
  contaCorrenteId?: string;

  @IsString()
  @IsOptional()
  userEnvolvidoId?: string;
}

export class UpdateTransacaoDto {
  @IsEnum(TipoTransacaoPrisma)
  @IsOptional()
  tipo?: TipoTransacaoPrisma;

  @IsNumber()
  @IsOptional()
  valor?: number;

  @IsString()
  @IsOptional()
  moeda?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  contaContabilId?: string;

  @IsString()
  @IsOptional()
  contaCorrenteId?: string;

  @IsString()
  @IsOptional()
  userEnvolvidoId?: string;
}
