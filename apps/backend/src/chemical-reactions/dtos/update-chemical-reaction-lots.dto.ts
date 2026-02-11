import { IsOptional, IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class LotUpdateDto {
  @IsString()
  @IsNotEmpty()
  pureMetalLotId: string;

  @IsNumber()
  @IsNotEmpty()
  gramsToUse: number;
}

export class UpdateChemicalReactionLotsDto {
  @IsDateString()
  @IsOptional()
  reactionDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LotUpdateDto)
  @IsOptional()
  lots?: LotUpdateDto[];
}
