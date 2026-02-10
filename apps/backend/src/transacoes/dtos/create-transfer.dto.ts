import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransferDto {
  @IsNotEmpty()
  @IsUUID()
  sourceAccountId: string;

  @IsNotEmpty()
  @IsUUID()
  destinationAccountId: string;

  @IsOptional() // Tornar opcional
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  goldAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quotation?: number; // Adicionar quotation

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mediaIds?: string[];
}
