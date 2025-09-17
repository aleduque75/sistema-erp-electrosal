import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Por favor, insira um email válido.' })
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  @IsOptional() // Mark as optional for update
  password?: string; // Explicitly define as optional
}
