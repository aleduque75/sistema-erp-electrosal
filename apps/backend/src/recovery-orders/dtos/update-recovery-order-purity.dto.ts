import { IsNotEmpty, IsNumber, IsOptional, IsString, IsPositive } from 'class-validator';

export class UpdateRecoveryOrderPurityDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  resultadoProcessamentoGramas: number;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
