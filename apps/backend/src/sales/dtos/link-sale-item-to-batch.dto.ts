import { IsNotEmpty, IsString } from 'class-validator';

export class LinkSaleItemToBatchDto {
  @IsString()
  @IsNotEmpty()
  saleItemId: string;

  @IsString()
  @IsNotEmpty()
  batchNumber: string;
}
