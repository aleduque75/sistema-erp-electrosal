import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditLogsService } from './audit-logs.service';

@UseGuards(AuthGuard('jwt'))
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll() {
    return this.auditLogsService.findAll();
  }
}
