import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPureMetalLotsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  remainingGramsGt?: number;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsString()
  metalType?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
