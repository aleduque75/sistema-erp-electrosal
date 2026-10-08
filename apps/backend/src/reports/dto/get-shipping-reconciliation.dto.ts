import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GetShippingReconciliationDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
