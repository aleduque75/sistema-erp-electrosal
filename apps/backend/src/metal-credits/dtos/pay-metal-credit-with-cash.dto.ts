import { IsString, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class PayMetalCreditWithCashDto {
  @IsString()
  @IsNotEmpty()
  metalCreditId: string;

  @IsNumber()
  @IsPositive()
  amountBRL: number;

  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @IsDateString()
  paymentDate: string;

  @IsBoolean()
  @IsOptional()
  isFullPayment?: boolean;

  @IsNumber()
  @IsOptional()
  quotation?: number;
}
