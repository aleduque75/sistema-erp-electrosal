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
} from 'class-validator';

// --- DTO para criar ou atualizar UM cliente ---
export class CreateClientDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name: string;

  @IsEmail({}, { message: 'Formato de email inválido.' })
  @IsOptional()
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
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}

// --- DTOs para importação em lote (já existentes) ---
export class ClientLoteDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() @IsOptional() email?: string | null;
  @IsString() @IsOptional() phone?: string;
}

export class CreateBulkClientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientLoteDto)
  clients: ClientLoteDto[];
}
