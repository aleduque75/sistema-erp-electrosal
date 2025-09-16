import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRecoveryOrderPurityDto {
  @IsNotEmpty()
  @IsNumber()
  resultadoFinal: number;

  @IsNotEmpty()
  @IsString()
  unidadeResultado: string;

  @IsNotEmpty()
  @IsNumber()
  volumeProcessado: number;

  @IsNotEmpty()
  @IsString()
  unidadeProcessada: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}