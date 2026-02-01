// apps/backend/src/settings/dto/update-theme-preset.dto.ts

import { IsString, IsObject, IsBoolean, IsOptional } from 'class-validator';

export class UpdateThemePresetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  presetData?: any; // Objeto JSON contendo light/dark colors

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
