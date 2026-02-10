import { IsNumber, IsNotEmpty } from 'class-validator';

export class InitialStockSetupDto {
  @IsNumber()
  @IsNotEmpty()
  tecgalvanoGrams: number;
}
