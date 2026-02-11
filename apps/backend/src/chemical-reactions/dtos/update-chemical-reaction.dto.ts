import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateChemicalReactionDto {
  @IsDateString()
  @IsOptional()
  reactionDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
