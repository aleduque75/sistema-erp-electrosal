import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetal } from '@prisma/client';

export class TransferFromSupplierAccountDto {
  @IsUUID()
  @IsNotEmpty()
  supplierMetalAccountId: string; // ID da ContaCorrente do tipo FORNECEDOR_METAL

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  grams: number; // Quantidade a ser transferida (em Au se metalType=AU, ou quantidade principal)

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

  @IsOptional()
  @IsEnum(TipoMetal)
  metalType?: TipoMetal; // AU ou AG (padrão AU)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  metalGrams?: number; // Quantidade física em gramas do metal transferido (ex: Ag)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  metalQuoteValue?: number; // Cotação manual do metal transferido (ex: Ag)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalValueBRL?: number; // Valor monetário total em R$

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  goldEquivalentGrams?: number; // Quantidade de gramas em ouro a ser debitada da conta do fornecedor
}