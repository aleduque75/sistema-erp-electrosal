import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class CreateContaMetalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TipoMetal)
  @IsNotEmpty()
  metalType: TipoMetal;

  @IsEnum(['CLIENTE', 'FORNECEDOR', 'INTERNA', 'EMPRESTIMO'])
  @IsNotEmpty()
  type: string;
}
