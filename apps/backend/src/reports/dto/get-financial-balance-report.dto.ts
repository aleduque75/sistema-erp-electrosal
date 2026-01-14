import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFinancialBalanceReportDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  goldPrice?: number;

  @IsOptional()
  metalType?: string;
}
