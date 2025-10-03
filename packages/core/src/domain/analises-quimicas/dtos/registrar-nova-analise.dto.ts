import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarNovaAnaliseDto {
  @IsUUID()
  clienteId!: string;

  @IsDate()
  @Type(() => Date)
  dataEntrada!: Date;

  @IsString()
  @IsNotEmpty()
  descricaoMaterial!: string;

  @IsNumber()
  @Min(0.001)
  volumeOuPesoEntrada!: number;

  @IsString()
  @IsNotEmpty()
  unidadeEntrada!: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
