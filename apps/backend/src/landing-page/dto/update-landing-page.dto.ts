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
  @IsOptional() @IsString() ctaLink?: string;
}

class SectionContentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideDto)
  slides?: SlideDto[];
  @IsOptional()
  @IsArray()
  processes?: any[];
  @IsOptional()
  @IsArray()
  items?: any[];
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
  @IsOptional() @IsString() logoImageId?: string; // ✅ Sincronizado com o banco
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}
