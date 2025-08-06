import { IsInt, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class CreateCreditCardFeeDto {
  @IsInt({ message: 'O número de parcelas deve ser um inteiro.' })
  @Min(1, { message: 'O número mínimo de parcelas é 1.' })
  @Max(24, { message: 'O número máximo de parcelas é 24.' })
  @IsNotEmpty({ message: 'O número de parcelas é obrigatório.' })
  installments: number;

  @IsNumber({}, { message: 'A taxa deve ser um número.' })
  @Min(0, { message: 'A taxa não pode ser negativa.' })
  @IsNotEmpty({ message: 'A porcentagem da taxa é obrigatória.' })
  feePercentage: number;
}
