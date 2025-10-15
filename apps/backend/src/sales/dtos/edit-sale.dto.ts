import { IsNumber, IsOptional, IsString } from 'class-validator';

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
}
