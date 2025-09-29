import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { TipoMetal } from '@sistema-erp-electrosal/core';

export class CreateMetalAccountDto {
  @IsString()
  @IsNotEmpty()
  personId: string;

  @IsEnum(TipoMetal)
  @IsNotEmpty()
  type: TipoMetal;
}
