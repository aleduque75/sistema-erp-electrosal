import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LiquidateNearZeroLotsDto {
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  maxGramsThreshold?: number = 0.05;

  @IsOptional()
  @IsString()
  notes?: string;
}
