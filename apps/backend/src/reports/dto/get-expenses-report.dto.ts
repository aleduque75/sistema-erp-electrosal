import { IsOptional, IsString, IsEnum } from 'class-validator';

export class GetExpensesReportDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  contaContabilId?: string;

  @IsOptional()
  @IsString()
  fornecedorId?: string;

  @IsOptional()
  @IsString()
  contaCorrenteId?: string;

  @IsOptional()
  @IsEnum(['ALL', 'PAID', 'PENDING'])
  status?: 'ALL' | 'PAID' | 'PENDING' = 'ALL';
}
