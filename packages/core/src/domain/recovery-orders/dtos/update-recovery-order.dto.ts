import { IsOptional, IsString, IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRecoveryOrderDto {
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataInicio?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataFim?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataCriacao?: Date;
}
