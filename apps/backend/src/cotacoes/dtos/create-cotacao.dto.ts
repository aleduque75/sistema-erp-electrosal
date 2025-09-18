import { IsString, IsNotEmpty, IsDate, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetal } from '@prisma/client';

export class CreateCotacaoDto {
  @IsEnum(TipoMetal)
  metal!: TipoMetal;

  @IsDate()
  @Type(() => Date)
  data!: Date;

  @IsNumber()
  @Min(0)
  valorCompra!: number;

  @IsNumber()
  @Min(0)
  valorVenda!: number;

  @IsOptional()
  @IsString()
  tipoPagamento?: string;
}
