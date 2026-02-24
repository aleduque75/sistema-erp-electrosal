import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateAppearanceSettingsDto {
  @IsOptional()
  @IsString()
  themeName?: string; // 👈 Adicionado

  @IsOptional()
  @IsObject()
  sidebarTheme?: any; // 👈 Adicionado

  @IsOptional()
  @IsObject()
  customTheme?: any;

  @IsOptional()
  @IsString()
  logoId?: string;

  @IsOptional()
  @IsString()
  sidebarLogoId?: string;

  @IsOptional()
  @IsString()
  faviconId?: string;
}
