import { PartialType } from '@nestjs/mapped-types';
import { CreatePureMetalLotMovementDto } from './create-pure-metal-lot-movement.dto';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { PureMetalLotMovementType } from '@prisma/client';

export class UpdatePureMetalLotMovementDto extends PartialType(CreatePureMetalLotMovementDto) {
  @IsOptional()
  @IsString()
  pureMetalLotId?: string;

  @IsOptional()
  @IsEnum(PureMetalLotMovementType)
  type?: PureMetalLotMovementType;

  @IsOptional()
  @IsNumber()
  grams?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
