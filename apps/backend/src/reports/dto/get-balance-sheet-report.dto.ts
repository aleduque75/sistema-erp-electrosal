import { IsOptional, IsString, IsEnum } from 'class-validator';

export class GetBalanceSheetReportDto {
  @IsOptional()
  @IsString()
  asOfDate?: string;

  @IsOptional()
  @IsEnum(['BRL', 'GOLD'])
  mode?: 'BRL' | 'GOLD' = 'BRL';
}
