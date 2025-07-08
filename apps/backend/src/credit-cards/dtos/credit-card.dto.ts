import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

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
}

export class UpdateCreditCardDto extends PartialType(CreateCreditCardDto) {}
