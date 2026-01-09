import { IsDateString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateMarketDataDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsNotEmpty()
  usdPrice: number;

  @IsNumber()
  @IsNotEmpty()
  goldTroyPrice: number;

  @IsNumber()
  @IsNotEmpty()
  silverTroyPrice: number;
}
