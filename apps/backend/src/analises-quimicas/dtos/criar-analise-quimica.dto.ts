import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDate,
  IsNumber,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CriarAnaliseQuimicaDto {
  @IsUUID('4', { message: 'ID do cliente deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'ID do cliente é obrigatório.' })
  clienteId!: string;

  @IsString({ message: 'Número da análise deve ser uma string.' })
  @IsNotEmpty({ message: 'Número da análise é obrigatório.' })
  @MaxLength(50, {
    message: 'Número da análise pode ter no máximo 50 caracteres.',
  })
  numeroAnalise!: string;

  @IsDate({ message: 'Data de entrada deve ser uma data válida.' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'Data de entrada é obrigatória.' })
  dataEntrada!: Date;

  @IsString({ message: 'Descrição do material deve ser uma string.' })
  @IsNotEmpty({ message: 'Descrição do material é obrigatória.' })
  @MaxLength(255, {
    message: 'Descrição do material pode ter no máximo 255 caracteres.',
  })
  descricaoMaterial!: string;

  @IsNumber({}, { message: 'Volume/Peso de entrada deve ser um número.' })
  @Min(0.001, { message: 'Volume/Peso de entrada deve ser maior que zero.' })
  @IsNotEmpty({ message: 'Volume/Peso de entrada é obrigatório.' })
  volumeOuPesoEntrada!: number;

  @IsString({ message: 'Unidade de entrada deve ser uma string.' })
  @IsNotEmpty({ message: 'Unidade de entrada é obrigatória.' })
  @MaxLength(10, {
    message: 'Unidade de entrada pode ter no máximo 10 caracteres.',
  })
  unidadeEntrada!: string;

  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string.' })
  @MaxLength(1000, {
    message: 'Observações podem ter no máximo 1000 caracteres.',
  })
  observacoes?: string;
}
