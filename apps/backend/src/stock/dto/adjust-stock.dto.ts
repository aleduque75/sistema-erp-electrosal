import { IsString, IsNumber, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class AdjustStockDto {
  @IsNotEmpty({ message: 'O ID do produto é obrigatório.' })
  @IsString({ message: 'O ID do produto deve ser uma string.' })
  productId: string;

  @IsNotEmpty({ message: 'A quantidade é obrigatória.' })
  @IsNumber({}, { message: 'A quantidade deve ser um número.' })
  @Min(0.001, { message: 'A quantidade deve ser maior que zero.' })
  quantity: number;

  @IsNotEmpty({ message: 'O preço de custo é obrigatório.' })
  @IsNumber({}, { message: 'O preço de custo deve ser um número.' })
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  costPrice: number;

  @IsOptional()
  @IsString({ message: 'O número do lote deve ser uma string.' })
  batchNumber?: string;

  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string.' })
  notes?: string;
}
