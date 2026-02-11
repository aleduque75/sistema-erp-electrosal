import { IsString, IsNumber, IsNotEmpty, IsEnum } from 'class-validator';
import { PureMetalLotMovementType } from '@prisma/client';

export class CreatePureMetalLotMovementDto {
  @IsString()
  @IsNotEmpty()
  pureMetalLotId: string;

  @IsEnum(PureMetalLotMovementType)
  @IsNotEmpty()
  type: PureMetalLotMovementType;

  @IsNumber()
  @IsNotEmpty()
  grams: number;

  @IsString()
  notes?: string;
}
