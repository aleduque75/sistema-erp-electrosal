import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { PurchaseOrderStatus } from '@prisma/client';

export class CreatePurchaseOrderItemDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  rawMaterialId?: string;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  quantity: number;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  price: number;
}

export class UpdatePurchaseOrderItemDto extends PartialType(CreatePurchaseOrderItemDto) {}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Número do pedido é obrigatório.' })
  orderNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Fornecedor é obrigatório.' })
  fornecedorId: string;

  @IsString()
  @IsOptional()
  paymentTermId?: string | null;

  @IsEnum(PurchaseOrderStatus)
  @IsOptional()
  status?: PurchaseOrderStatus;

  @IsString()
  @IsNotEmpty({ message: 'Data do pedido é obrigatória.' })
  orderDate: string;

  @IsString()
  @IsOptional()
  expectedDeliveryDate?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {}