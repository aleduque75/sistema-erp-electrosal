import { IsOptional, IsString, IsEnum } from 'class-validator';

export class GetDreReportDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsEnum(['CAIXA', 'COMPETENCIA'])
  regime?: 'CAIXA' | 'COMPETENCIA' = 'CAIXA';
}
