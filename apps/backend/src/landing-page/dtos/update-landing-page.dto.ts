import { IsArray, IsInt, IsString, IsNotEmpty, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

class SectionContentDto {
  // Conteúdo genérico para a seção, validado como JSON
  // Você pode adicionar validações mais específicas aqui se quiser
  [key: string]: any;
}

class SectionDto {
  @IsOptional()
  @IsString()
  id?: string; // Opcional para novas seções

  @IsInt()
  order: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  content: Record<string, any>; // Usar Record<string, any> para JSON genérico
}

export class UpdateLandingPageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}
