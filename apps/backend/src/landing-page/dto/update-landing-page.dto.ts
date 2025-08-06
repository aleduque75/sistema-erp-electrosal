import { IsArray, IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SectionContentDto {
  @ApiProperty({ description: 'Título da seção', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Descrição da seção', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID da imagem principal', required: false })
  @IsOptional()
  @IsString()
  mainImage?: string;

  @ApiProperty({ type: [String], description: 'IDs das imagens laterais', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sideImages?: string[];

  @ApiProperty({ description: 'Texto do botão CTA', required: false })
  @IsOptional()
  @IsString()
  ctaButtonText?: string;

  @ApiProperty({ description: 'Link do botão CTA', required: false })
  @IsOptional()
  @IsString()
  ctaButtonLink?: string;

  @ApiProperty({ description: 'Texto do botão secundário', required: false })
  @IsOptional()
  @IsString()
  secondaryButtonText?: string;

  @ApiProperty({ description: 'Link do botão secundário', required: false })
  @IsOptional()
  @IsString()
  secondaryButtonLink?: string;

  @ApiProperty({ description: 'Ícone do item (para seções de features)', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ type: [SectionContentDto], description: 'Itens da seção (para seções de features)', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionContentDto)
  items?: SectionContentDto[];
}

class SectionDto {
  @ApiProperty({ description: 'ID da seção (opcional para novas seções)', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Ordem da seção na página', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: 'Tipo da seção (ex: hero, features)', example: 'hero' })
  @IsString()
  type: string;

  @ApiProperty({ type: SectionContentDto, description: 'Conteúdo JSON da seção' })
  @ValidateNested()
  @Type(() => SectionContentDto)
  content: SectionContentDto;
}

export class UpdateLandingPageDto {
  @ApiProperty({ description: 'Texto do logotipo', required: false })
  @IsOptional()
  @IsString()
  logoText?: string;

  @ApiProperty({ description: 'ID da imagem do logotipo', required: false })
  @IsOptional()
  @IsString()
  logoImageId?: string;

  @ApiProperty({ description: 'Tema personalizado da landing page (nome)', required: false })
  @IsOptional()
  @IsString()
  customThemeName?: string;

  @ApiProperty({ type: [SectionDto], description: 'Array de seções da landing page' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}
