import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoTransacaoPrisma } from '@prisma/client';

export class CreateTransacaoDto {
  @IsEnum(TipoTransacaoPrisma) tipo: TipoTransacaoPrisma;
  @IsNumber() @Min(0.01) valor: number;
  @IsString() @IsNotEmpty() descricao: string;
  @IsUUID() @IsNotEmpty() contaContabilId: string;
  @IsOptional() @IsUUID() contaCorrenteId?: string;
  @IsDate() @Type(() => Date) dataHora: Date; // Adicionado
}

export class UpdateTransacaoDto extends PartialType(CreateTransacaoDto) {}

export class TransacaoLoteDto {
  @IsString() @IsOptional() fitId?: string;
  @IsEnum(TipoTransacaoPrisma) tipo: TipoTransacaoPrisma;
  @IsNumber() @Min(0.01) amount: number;
  @IsString() @IsOptional() description?: string;
  @IsDate() @Type(() => Date) postedAt: Date;
  @IsUUID() @IsNotEmpty() contaContabilId: string;
}

export class CreateBulkTransacoesDto {
  @IsUUID() @IsNotEmpty() contaCorrenteId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransacaoLoteDto)
  transactions: TransacaoLoteDto[];
}
