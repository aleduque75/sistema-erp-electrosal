import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { TipoMetal } from '@prisma/client';

export class MetalPaymentDto {
  @IsNotEmpty()
  @IsEnum(TipoMetal)
  metalType: TipoMetal;

  @IsNotEmpty()
  @IsNumber()
  amountInGrams: number;

  @IsNotEmpty()
  @IsNumber()
  purity: number;
}

export class PayAccountsRecWithMetalMultipleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetalPaymentDto)
  payments: MetalPaymentDto[];

  @IsNotEmpty()
  @IsNumber()
  quotation: number;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
