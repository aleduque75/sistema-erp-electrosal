import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { TipoContaContabilPrisma } from '@prisma/client';

export class CreateContaContabilDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEnum(TipoContaContabilPrisma)
  @IsNotEmpty()
  tipo: TipoContaContabilPrisma;

  @IsBoolean()
  @IsOptional()
  aceitaLancamento?: boolean;

  @IsString()
  @IsOptional()
  contaPaiId?: string;
}

export class UpdateContaContabilDto {
  @IsString()
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsEnum(TipoContaContabilPrisma)
  @IsOptional()
  tipo?: TipoContaContabilPrisma;

  @IsBoolean()
  @IsOptional()
  aceitaLancamento?: boolean;

  @IsString()
  @IsOptional()
  contaPaiId?: string;
}
