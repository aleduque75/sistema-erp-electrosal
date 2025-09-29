import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateMetalAccountEntryDto {
  @IsString()
  @IsNotEmpty()
  contaMetalId: string;

  @IsEnum(['CREDITO', 'DEBITO'])
  @IsNotEmpty()
  tipo: string;

  @IsNumber()
  valor: number;

  @IsDateString()
  @IsOptional()
  data?: string;

  @IsString()
  @IsOptional()
  relatedTransactionId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
