import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class GetStockStatementDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
