import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransferDto {
  @IsNotEmpty()
  @IsUUID()
  sourceAccountId: string;

  @IsNotEmpty()
  @IsUUID()
  destinationAccountId: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  goldAmount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  contaContabilId: string; // Conta contábil para a transferência

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataHora?: Date;
}
