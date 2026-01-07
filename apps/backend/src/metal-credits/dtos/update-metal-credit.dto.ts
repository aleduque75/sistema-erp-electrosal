import { IsDateString, IsOptional } from 'class-validator';

export class UpdateMetalCreditDto {
  @IsDateString()
  @IsOptional()
  date?: string;
}
