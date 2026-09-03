import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsEnum, Min, IsDateString } from 'class-validator';
import { TipoMetal } from '@prisma/client';

export class CreateChemicalAnalysisDto {
  @IsUUID()
  @IsOptional()
  clienteId?: string;

  @IsString()
  @IsOptional()
  numeroAnalise?: string;

  @IsDateString()
  @IsOptional()
  dataEntrada?: string;

  @IsString()
  @IsNotEmpty()
  descricaoMaterial: string;

  @IsNumber()
  @Min(0)
  volumeOuPesoEntrada: number;

  @IsString()
  @IsNotEmpty()
  unidadeEntrada: string;

  @IsEnum(TipoMetal)
  @IsOptional()
  metalType?: TipoMetal;

  @IsString()
  @IsOptional()
  observacoes?: string;
}

export class UpdateChemicalAnalysisDto {
  @IsUUID()
  @IsOptional()
  clienteId?: string;

  @IsString()
  @IsOptional()
  numeroAnalise?: string;

  @IsDateString()
  @IsOptional()
  dataEntrada?: string;

  @IsDateString()
  @IsOptional()
  dataAnaliseConcluida?: string;

  @IsDateString()
  @IsOptional()
  dataAprovacaoCliente?: string;

  @IsDateString()
  @IsOptional()
  dataFinalizacaoRecuperacao?: string;

  @IsString()
  @IsOptional()
  descricaoMaterial?: string;

  @IsNumber()
  @IsOptional()
  volumeOuPesoEntrada?: number;

  @IsString()
  @IsOptional()
  unidadeEntrada?: string;

  @IsNumber()
  @IsOptional()
  resultadoAnaliseValor?: number;

  @IsString()
  @IsOptional()
  unidadeResultado?: string;

  @IsNumber()
  @IsOptional()
  percentualQuebra?: number;

  @IsNumber()
  @IsOptional()
  taxaServicoPercentual?: number;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsEnum(TipoMetal)
  @IsOptional()
  metalType?: TipoMetal;
}

export class PostChemicalAnalysisResultDto {
  @IsNumber()
  @IsNotEmpty()
  resultadoAnaliseValor: number;

  @IsString()
  @IsOptional()
  unidadeResultado?: string;

  @IsNumber()
  @IsOptional()
  percentualQuebra?: number;

  @IsNumber()
  @IsOptional()
  taxaServicoPercentual?: number;

  @IsString()
  @IsOptional()
  observacoes?: string;
}

export class ListChemicalAnalysesQueryDto {
  @IsOptional()
  status?: string | string[];

  @IsUUID()
  @IsOptional()
  clienteId?: string;

  @IsOptional()
  metalType?: string;

  @IsString()
  @IsOptional()
  numeroAnalise?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;
}
