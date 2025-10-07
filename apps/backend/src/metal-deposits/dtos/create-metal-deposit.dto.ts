import { IsNotEmpty, IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateMetalDepositDto {
  @IsString()
  @IsNotEmpty()
  pessoaId: string;

  @IsNumber()
  @IsNotEmpty()
  paidAmountBRL: number;

  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  @IsString()
  @IsNotEmpty()
  metalType: string; // e.g., 'AU', 'AG'
}
