// apps/backend/src/organization/dto/update-appearance-settings.dto.ts
import { IsObject } from 'class-validator';

export class UpdateAppearanceSettingsDto {
  @IsObject()
  customTheme: any;
}
