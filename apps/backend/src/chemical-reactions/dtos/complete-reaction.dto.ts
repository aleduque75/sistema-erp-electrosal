import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CompleteReactionDto {
  @IsNumber()
  @IsNotEmpty()
  outputProductGrams: number;

  @IsNumber()
  @IsOptional()
  outputBasketLeftoverGrams?: number;

  @IsNumber()
  @IsOptional()
  outputDistillateLeftoverGrams?: number;

  @IsString()
  @IsOptional()
  batchNumber?: string;
}
