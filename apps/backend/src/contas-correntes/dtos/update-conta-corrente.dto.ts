import { IsString, IsOptional, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';
import { ContaCorrenteType } from '@prisma/client';

export class UpdateContaCorrenteDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  numeroConta?: string;

  @IsString()
  @IsOptional()
  agencia?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  limite?: number;

  @IsNumber()
  @IsOptional()
  initialBalanceBRL?: number;

  @IsNumber()
  @IsOptional()
  initialBalanceGold?: number;

  @IsEnum(ContaCorrenteType)
  @IsOptional()
  type?: ContaCorrenteType;

  @IsString()
  @IsOptional()
  contaContabilId?: string;

  @IsBoolean() // Adicionado
  @IsOptional()
  isActive?: boolean;
}