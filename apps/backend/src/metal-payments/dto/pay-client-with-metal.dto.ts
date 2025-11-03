import { IsString, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';

export class PayClientWithMetalDto {
  @IsString()
  clientId: string;

  @IsString()
  pureMetalLotId: string;

  @IsNumber()
  @Min(0.01)
  grams: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  data: string; // Usar string para receber do frontend e converter para Date no service
}
