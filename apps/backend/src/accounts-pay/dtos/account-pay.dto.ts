import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateAccountPayDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  dueDate: Date;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @IsOptional()
  @IsDateString()
  paidAt?: Date;
}

export class UpdateAccountPayDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @IsOptional()
  @IsDateString()
  paidAt?: Date;
}

export class PayAccountDto {
  @IsUUID()
  @IsNotEmpty()
  contaCorrenteId: string; // De qual conta o dinheiro saiu?

  @IsUUID()
  @IsNotEmpty()
  contaContabilId: string; // Qual a classificação contábil dessa despesa?

  @IsDateString()
  @IsOptional()
  paidAt?: Date; // Data do pagamento
}
