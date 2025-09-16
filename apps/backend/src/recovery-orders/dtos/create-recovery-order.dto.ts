import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRecoveryOrderDto {
  @IsArray()
  @IsNotEmpty({ each: true }) // Garante que o array não está vazio e cada item não é vazio
  @IsUUID('4', { each: true }) // Garante que cada item é um UUID válido
  chemicalAnalysisIds: string[];

  @IsOptional()
  @IsString()
  descricaoProcesso?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
