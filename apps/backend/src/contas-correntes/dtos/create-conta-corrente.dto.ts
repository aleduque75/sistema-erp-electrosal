import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsEnum, // Adicionado
} from 'class-validator';
import { ContaCorrenteType } from '@prisma/client'; // Adicionado

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
  @IsNotEmpty({ message: 'A moeda é obrigatório.' })
  moeda: string;

  @IsNumber()
  @IsOptional()
  initialBalanceBRL?: number;

  @IsNumber()
  @IsOptional()
  initialBalanceGold?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  limite?: number;

  @IsEnum(ContaCorrenteType) // Adicionado
  @IsNotEmpty({ message: 'O tipo da conta é obrigatório.' })
  type: ContaCorrenteType; // Adicionado
}
