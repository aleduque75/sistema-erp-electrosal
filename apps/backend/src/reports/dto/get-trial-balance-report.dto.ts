import { IsDateString, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTrialBalanceReportDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  contaContabilId?: string; // Opcional: filtrar por uma conta específica

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true) // Garante que 'true' string ou booleano seja true, outros false
  includeTransactions?: boolean = false;
}
