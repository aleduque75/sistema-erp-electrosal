import { IsArray, ArrayMinSize, ValidateNested, IsNumber, Min, IsDateString, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SplitInstallmentItemDto {
  @IsNumber()
  @Min(0.01, { message: 'O valor da parcela deve ser no mínimo R$ 0,01' })
  @Type(() => Number)
  amount: number;

  @IsDateString({}, { message: 'Data de vencimento inválida' })
  dueDate: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class SplitAccountRecDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'A divisão deve conter no mínimo 2 parcelas.' })
  @ValidateNested({ each: true })
  @Type(() => SplitInstallmentItemDto)
  installments: SplitInstallmentItemDto[];
}
