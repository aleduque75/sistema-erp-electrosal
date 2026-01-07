import { IsString, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class PayWithClientCreditDto {
  @IsString()
  @IsNotEmpty()
  metalCreditId: string;

  @IsNumber()
  @IsPositive()
  amountBRL: number;

  @IsString()
  @IsNotEmpty()
  receivableAccountId: string;

  @IsDateString()
  paymentDate: string;

  @IsBoolean()
  @IsOptional()
  isFullPayment?: boolean;

  @IsNumber()
  @IsOptional()
  quotation?: number;
}
