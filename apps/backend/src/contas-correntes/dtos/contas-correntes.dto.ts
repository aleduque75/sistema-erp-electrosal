import { OmitType, PartialType } from '@nestjs/mapped-types'; // ✅ 1. Importar OmitType
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// O DTO de criação permanece o mesmo
export class CreateContaCorrenteDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da conta é obrigatório.' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'O número da conta é obrigatório.' })
  numeroConta: string;

  @IsString()
  @IsOptional()
  agencia?: string;

  @IsString()
  @IsNotEmpty({ message: 'A moeda é obrigatória.' })
  moeda: string;

  @IsNumber()
  @Min(0)
  saldoInicial: number;
}

// ✅ 2. CORREÇÃO: Usando OmitType para remover 'saldoInicial' ANTES de aplicar PartialType
export class UpdateContaCorrenteDto extends PartialType(
  OmitType(CreateContaCorrenteDto, ['saldoInicial'] as const),
) {}
