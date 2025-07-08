import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { TipoContaContabilPrisma } from '@prisma/client';

export class CreateContaContabilDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEnum(TipoContaContabilPrisma)
  tipo: TipoContaContabilPrisma;

  @IsBoolean()
  aceitaLancamento: boolean;

  @IsUUID()
  @IsOptional()
  contaPaiId?: string;
}

// Usar PartialType garante que o UpdateDto tenha a propriedade 'codigo' opcional
export class UpdateContaContabilDto extends PartialType(
  CreateContaContabilDto,
) {}
