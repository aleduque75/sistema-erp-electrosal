import { IsUUID, IsNotEmpty, IsNumber, Min, IsOptional, ValidateIf } from 'class-validator';

export class PayAccountsRecWithMetalCreditDto {
  @IsUUID()
  @IsNotEmpty()
  metalCreditId: string;

  @IsNumber()
  @Min(0.000001)
  @IsNotEmpty()
  amountInGrams: number;

  @IsOptional()
  @IsUUID()
  @ValidateIf(o => !o.customBuyPrice)
  quotationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ValidateIf(o => !o.quotationId)
  customBuyPrice?: number;
}
