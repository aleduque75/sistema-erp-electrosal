import {
  IsNumber,
  IsNotEmpty,
  IsString,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class LancarResultadoAnaliseDto {
  @IsNumber() @IsNotEmpty() resultadoAnaliseValor!: number;
  @IsString() @IsNotEmpty() unidadeResultado!: string;
  @IsNumber() @Min(0) @Max(1) percentualQuebra!: number;
  @IsNumber() @Min(0) @Max(1) taxaServicoPercentual!: number;
  @IsOptional() @IsString() observacoes?: string;
}
