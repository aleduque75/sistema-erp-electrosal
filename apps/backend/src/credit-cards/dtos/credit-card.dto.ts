import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateCreditCardDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do cartão é obrigatório.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'A bandeira do cartão é obrigatória.' })
  flag: string;

  @IsInt()
  @Min(1)
  @Max(31)
  closingDay: number;

  @IsInt()
  @Min(1)
  @Max(31)
  dueDate: number;

  @IsUUID()
  @IsOptional()
  contaContabilPassivoId?: string;
}

export class UpdateCreditCardDto extends PartialType(CreateCreditCardDto) {}
