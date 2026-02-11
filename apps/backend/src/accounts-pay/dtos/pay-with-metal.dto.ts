import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class PayWithMetalDto {
  @IsString()
  @IsNotEmpty()
  pureMetalLotId: string;

  @IsNumber()
  @Min(0.0001)
  gramsToPay: number;

  @IsNumber()
  @Min(0.01)
  quotation: number;

  @IsBoolean()
  @IsOptional()
  generateNewBillForRemaining?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;

  @IsUUID()
  @IsOptional()
  contaContabilId?: string;
}
