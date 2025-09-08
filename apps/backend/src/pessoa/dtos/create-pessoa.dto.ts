import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { PessoaType } from '@prisma/client';

// --- DTO para criar ou atualizar UMA pessoa ---
export class CreatePessoaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name: string;

  @IsEmail({}, { message: 'Formato de email inválido.' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  email?: string;

  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  @IsOptional()
  cpf?: string | null;

  @IsString()
  @IsOptional()
  phone?: string;

  // 👇 Novos campos de endereço adicionados e opcionais 👇
  @IsString() @IsOptional() cep?: string;
  @IsString() @IsOptional() logradouro?: string;
  @IsString() @IsOptional() numero?: string;
  @IsString() @IsOptional() complemento?: string;
  @IsString() @IsOptional() bairro?: string;
  @IsString() @IsOptional() cidade?: string;
  @IsString() @IsOptional() uf?: string;

  // Additional fields from Pessoa model
  @IsString() @IsOptional() birthDate?: string;
  @IsString() @IsOptional() gender?: string;
  @IsOptional() preferences?: object;
  @IsOptional() purchaseHistory?: object;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];
}

export class UpdatePessoaDto extends PartialType(CreatePessoaDto) {}

// --- DTOs para importação em lote (já existentes) ---
export class PessoaLoteDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() @IsOptional() email?: string | null;
  @IsString() @IsOptional() phone?: string;

  // Additional fields from Pessoa model
  @IsString() @IsOptional() birthDate?: string;
  @IsString() @IsOptional() gender?: string;
  @IsOptional() preferences?: object;
  @IsOptional() purchaseHistory?: object;
  @IsString() @IsOptional() cpf?: string | null;
  @IsString() @IsOptional() cep?: string;
  @IsString() @IsOptional() logradouro?: string;
  @IsString() @IsOptional() numero?: string;
  @IsString() @IsOptional() complemento?: string;
  @IsString() @IsOptional() bairro?: string;
  @IsString() @IsOptional() cidade?: string;
  @IsString() @IsOptional() uf?: string;
  @IsString()
  @IsNotEmpty({ message: 'O papel da pessoa é obrigatório.' })
  role: string; // Add role
  @IsEnum(PessoaType)
  type: PessoaType; // Add PessoaType
}

export class CreateBulkPessoasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PessoaLoteDto)
  pessoas: PessoaLoteDto[];
}