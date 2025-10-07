import { IsNotEmpty, IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateMetalReceivablePaymentDto {
  @IsString()
  @IsNotEmpty()
  metalReceivableId: string;

  @IsNumber()
  @IsNotEmpty()
  paidAmountBRL: number;

  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;
}
