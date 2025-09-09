import { IsString, IsOptional, IsDate, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AtualizarAnaliseDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataEntrada?: Date;

  @IsOptional()
  @IsString()
  descricaoMaterial?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeOuPesoEntrada?: number;

  @IsOptional()
  @IsString()
  unidadeEntrada?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
