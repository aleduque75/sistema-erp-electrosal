import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsISO8601,
} from 'class-validator';

export class CreateContaCorrenteDto {
  @IsString()
  @IsNotEmpty()
  numeroConta: string;

  @IsNumber() // Alterado para IsNumber
  @IsNotEmpty()
  saldo: number; // Alterado para number

  @IsString()
  @IsNotEmpty()
  moeda: string;

  @IsISO8601()
  @IsNotEmpty()
  dataAbertura: string;
}

export class UpdateContaCorrenteDto {
  @IsString()
  @IsOptional()
  numeroConta?: string;

  @IsNumber() // Alterado para IsNumber
  @IsOptional()
  saldo?: number; // Alterado para number

  @IsString()
  @IsOptional()
  moeda?: string;

  @IsISO8601()
  @IsOptional()
  dataAbertura?: string;
}
