import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountPayDto {
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsDate() @Type(() => Date) dueDate: Date;
}

export class UpdateAccountPayDto extends PartialType(CreateAccountPayDto) {}

export class PayAccountDto {
  @IsUUID() @IsNotEmpty() contaCorrenteId: string;
  @IsUUID() @IsNotEmpty() contaContabilId: string;
  @IsDate() @IsOptional() @Type(() => Date) paidAt?: Date;
}
