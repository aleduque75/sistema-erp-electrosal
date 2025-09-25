import { IsString, IsNumber, IsDate, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { TipoTransacaoPrisma } from '@prisma/client';

export class CreateTransacaoDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsNumber()
  @IsOptional()
  valor?: number;

  @IsNumber()
  @IsOptional()
  goldAmount?: number;

  @IsEnum(TipoTransacaoPrisma)
  @IsNotEmpty()
  tipo: TipoTransacaoPrisma;

  @IsDate()
  @IsNotEmpty()
  dataHora: Date;

  @IsString()
  @IsNotEmpty()
  contaContabilId: string;

  @IsString()
  @IsOptional()
  contaCorrenteId?: string;
}