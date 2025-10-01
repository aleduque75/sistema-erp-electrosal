import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
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

  @IsEnum(ContaCorrenteType)
  @IsOptional()
  type?: ContaCorrenteType;
}