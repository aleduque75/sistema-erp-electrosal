import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BackupsService } from './backups.service';

@UseGuards(AuthGuard('jwt'))
@Controller('backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Post('create')
  createBackup(@CurrentUser('orgId') organizationId: string) {
    // Adicionar lógica de permissão aqui (ex: apenas admins podem criar backups)
    return this.backupsService.createDatabaseBackup(organizationId);
  }
}