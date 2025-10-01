import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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
  @IsOptional()
  initialBalanceBRL?: number;

  @IsNumber()
  @IsOptional()
  initialBalanceGold?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  limite?: number;
}