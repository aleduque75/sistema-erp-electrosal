import { PartialType } from '@nestjs/mapped-types';
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
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateSaleDto {
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  // Opcional: O valor total pode ser calculado no backend para segurança
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsString()
  @IsOptional() // ✅ TORNAR ESTE CAMPO OPCIONAL
  contaContabilId?: string;

  @IsUUID()
  @IsOptional()
  contaCorrenteId?: string | null;

  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfInstallments?: number;
}

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}
