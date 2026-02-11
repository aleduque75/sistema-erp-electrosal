import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustSaleDto {
  @IsString()
  @IsNotEmpty()
  saleId: string;

  @IsNumber()
  @IsOptional()
  freightCost?: number;

  @IsNumber()
  @IsOptional()
  newQuotation?: number;
}
