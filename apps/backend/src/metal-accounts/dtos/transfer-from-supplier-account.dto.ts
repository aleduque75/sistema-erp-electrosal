import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferFromSupplierAccountDto {
  @IsUUID()
  @IsNotEmpty()
  supplierMetalAccountId: string; // ID da ContaCorrente do tipo FORNECEDOR_METAL

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  grams: number; // Quantidade de ouro a ser transferida

  @IsString()
  @IsNotEmpty()
  notes: string; // Observações sobre a transferência

  @IsOptional()
  @Type(() => Date)
  transferDate?: Date; // Data da transferência para buscar a cotação

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  goldQuoteValue?: number; // Cotação do ouro manual, se fornecida
}