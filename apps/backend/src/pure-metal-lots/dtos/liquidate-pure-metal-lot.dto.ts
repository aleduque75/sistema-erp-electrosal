import { IsOptional, IsString } from 'class-validator';

export class LiquidatePureMetalLotDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
