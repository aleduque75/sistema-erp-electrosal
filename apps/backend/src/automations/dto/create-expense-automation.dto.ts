import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateExpenseAutomationDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsNotEmpty()
  @IsString()
  creditorName: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // e.g., 'BANK_TRANSFER', 'CASH'

  @IsOptional()
  @IsString()
  bankAccountName?: string; // Used to identify the bank account if paymentMethod implies one
}
