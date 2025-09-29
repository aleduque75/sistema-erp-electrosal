import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class SaleItemDto {
  @IsUUID() @IsNotEmpty() productId: string;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() @Min(0) price: number; // Adicionado
}

export class CreateSaleDto {
  @IsUUID() @IsNotEmpty() pessoaId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
  @IsString() @IsNotEmpty() paymentMethod: 'A_VISTA' | 'A_PRAZO' | 'CREDIT_CARD' | 'IMPORTADO' | 'METAL';

  @IsUUID() @IsOptional() clientMetalAccountId?: string; // Opcional: ID da conta de metal do cliente, se houver mais de uma

  @IsInt() @Min(1) @IsOptional() numberOfInstallments?: number; // Para Cartão de Crédito
  @IsUUID() @IsOptional() paymentTermId?: string; // Para Venda a Prazo

  @IsNumber() @IsOptional() @Min(0) feeAmount?: number;
  @IsUUID() @IsOptional() contaCorrenteId?: string;
  @IsNumber() @IsOptional() @Min(0) goldQuoteValue?: number; // Adicionado para importação
  @IsString() @IsOptional() externalId?: string; // Adicionado para importação
}

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}
