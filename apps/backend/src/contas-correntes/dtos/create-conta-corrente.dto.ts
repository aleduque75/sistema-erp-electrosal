import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsEnum,
  IsBoolean, // Adicionado
} from 'class-validator';
import { ContaCorrenteType } from '@prisma/client';

export class CreateContaCorrenteDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da conta é obrigatório.' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'O número da conta é obrigatório.' })
  numeroConta: string;

  @IsString()
  @IsOptional() // Tornado opcional, assume default BRL se não enviado
  agencia?: string;

  @IsString()
  @IsOptional() // Tornado opcional
  moeda?: string;

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

  @IsEnum(ContaCorrenteType)
  @IsNotEmpty({ message: 'O tipo da conta é obrigatório.' })
  type: ContaCorrenteType;

  @IsString() // Adicionado
  @IsOptional()
  contaContabilId?: string;

  @IsBoolean() // Adicionado
  @IsOptional()
  isActive?: boolean;
}
