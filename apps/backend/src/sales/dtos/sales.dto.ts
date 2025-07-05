// apps/backend/src/sales/dtos/sales.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer'; // Garanta que 'Type' está importado

// --- CreateSaleItemDto (COMPLETO E CORRETO) ---
export class CreateSaleItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string; // <-- DEVE ESTAR AQUI

  @IsNumber()
  @Min(1)
  quantity: number; // <-- DEVE ESTAR AQUI

  @IsNumber()
  price: number; // <-- DEVE ESTAR AQUI
}

// --- CreateSaleDto (COMPLETO E CORRETO) ---
export class CreateSaleDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsArray() // Indica que 'items' é um array
  @ValidateNested({ each: true }) // Valida cada item do array
  @Type(() => CreateSaleItemDto) // <--- CRUCIAL: Converte cada objeto para uma instância de CreateSaleItemDto
  items: CreateSaleItemDto[];

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsNumber()
  totalAmount: number;

  @IsNumber()
  @IsOptional()
  feeAmount?: number;

  @IsNumber()
  @IsOptional()
  netAmount?: number;

  @IsString()
  @IsNotEmpty()
  contaContabilId: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  contaCorrenteId?: string | null;

  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfInstallments?: number;
}

// --- UpdateSaleDto (apenas para referência) ---
export class UpdateSaleDto {
  @IsString() @IsOptional() clientId?: string;
  @IsString() @IsOptional() paymentMethod?: string;
  @IsNumber() @IsOptional() totalAmount?: number;
  @IsNumber() @IsOptional() feeAmount?: number;
  @IsNumber() @IsOptional() netAmount?: number;
  @IsString() @IsOptional() contaContabilId?: string;
  @IsString() @IsUUID() @IsOptional() contaCorrenteId?: string | null;
  @IsNumber() @Min(1) @IsOptional() numberOfInstallments?: number;
  // Se permitir a atualização de itens de venda, você precisaria de:
  // @IsArray()
  // @IsOptional()
  // @ValidateNested({ each: true })
  // @Type(() => UpdateSaleItemDto)
  // items?: UpdateSaleItemDto[];
}
