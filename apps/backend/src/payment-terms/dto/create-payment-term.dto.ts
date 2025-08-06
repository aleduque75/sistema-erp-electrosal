import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, IsNumber, Min } from 'class-validator';

export class CreatePaymentTermDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  installmentsDays: number[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  interestRate?: number;
}