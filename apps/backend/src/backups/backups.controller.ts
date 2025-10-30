import { Controller, Post, Get, Param, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BackupsService } from './backups.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator'; // Import Public decorator

@Controller('backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Public() // Mark as public
  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createBackup() {
    return this.backupsService.createBackup();
  }

  @Public() // Mark as public
  @Get()
  @HttpCode(HttpStatus.OK)
  async listBackups() {
    return this.backupsService.listBackups();
  }

  @Public() // Mark as public
  @Post('restore')
  @HttpCode(HttpStatus.OK)
  async restoreBackup(@Body('filename') filename: string) {
    return this.backupsService.restoreBackup(filename);
  }
}