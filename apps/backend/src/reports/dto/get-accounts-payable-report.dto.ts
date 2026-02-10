import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GetAccountsPayableReportQueryDto {
  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
