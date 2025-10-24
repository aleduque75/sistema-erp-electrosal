import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';
import { TipoMetal } from '@prisma/client';

export class PayAccountsRecWithMetalDto {
  @IsNotEmpty()
  @IsEnum(TipoMetal)
  metalType: TipoMetal;

  @IsNotEmpty()
  @IsNumber()
  amountInGrams: number;

  @IsNotEmpty()
  @IsNumber()
  quotation: number;

  @IsNotEmpty()
  @IsNumber()
  purity: number;
}
