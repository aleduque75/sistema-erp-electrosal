// apps/backend/src/settings/dto/create-theme-preset.dto.ts

import { IsString, IsNotEmpty, IsObject, IsBoolean, IsOptional } from 'class-validator';

export class CreateThemePresetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  presetData: any; // Objeto JSON contendo light/dark colors

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
