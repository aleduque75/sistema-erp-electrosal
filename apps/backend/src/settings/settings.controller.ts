// apps/backend/src/settings/settings.controller.ts
import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findOne(@Request() req) {
    return this.settingsService.findOne(req.user.id);
  }

  @Patch()
  update(@Request() req, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(req.user.id, updateSettingDto);
  }
}
