import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsDate,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { TipoTransacaoPrisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTransacaoDto {
  @IsEnum(TipoTransacaoPrisma)
  tipo: TipoTransacaoPrisma;

  @IsNumber()
  valor: number;

  @IsString()
  moeda: string;

  @IsDate()
  @Type(() => Date)
  dataHora: Date;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsUUID()
  contaContabilId: string;

  @IsUUID()
  @IsOptional()
  contaCorrenteId?: string;
}

export class UpdateTransacaoDto extends PartialType(CreateTransacaoDto) {}
