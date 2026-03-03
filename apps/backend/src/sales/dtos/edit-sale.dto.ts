import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSaleItemDto {
  @IsString()
  id: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class EditSaleDto {
  @IsNumber()
  @IsOptional()
  updatedGoldPrice?: number;

  @IsNumber()
  @IsOptional()
  shippingCost?: number;

  @IsString()
  @IsOptional()
  paymentTermId?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateSaleItemDto)
  items?: UpdateSaleItemDto[];
}
