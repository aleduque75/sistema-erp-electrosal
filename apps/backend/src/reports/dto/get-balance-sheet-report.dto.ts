import { IsOptional, IsString } from 'class-validator';

export class GetBalanceSheetReportDto {
  @IsOptional()
  @IsString()
  asOfDate?: string;
}
