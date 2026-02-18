import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class SlideDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() ctaText?: string;
  // Campos para a página de detalhes
  @IsOptional() @IsString() detailTitle?: string;
  @IsOptional() @IsString() detailSubtitle?: string;
  @IsOptional() @IsString() modalContent?: string;
  @IsOptional() @IsString() detailImageUrl?: string;
}

class SectionContentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideDto)
  slides?: SlideDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideDto) // Reaproveitamos a estrutura para processos e itens
  processes?: SlideDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideDto)
  items?: SlideDto[];
}

class SectionDto {
  @IsNumber() @IsOptional() order?: number;
  @IsString() type: string;
  @IsObject()
  @ValidateNested()
  @Type(() => SectionContentDto)
  content: SectionContentDto;
}

export class UpdateLandingPageDto {
  @IsOptional() @IsString() logoText?: string;
  @IsOptional() @IsString() logoImageId?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}
