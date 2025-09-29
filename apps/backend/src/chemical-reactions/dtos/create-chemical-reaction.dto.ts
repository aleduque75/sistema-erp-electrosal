import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SourceLotDto {
  @IsString()
  @IsNotEmpty()
  pureMetalLotId: string;

  @IsNumber()
  gramsToUse: number;
}

export class CreateChemicalReactionDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SourceLotDto)
  sourceLots: SourceLotDto[];

  // TODO: Adicionar outros campos do DTO conforme necessário (inputs/outputs de sobras, etc.)
}
