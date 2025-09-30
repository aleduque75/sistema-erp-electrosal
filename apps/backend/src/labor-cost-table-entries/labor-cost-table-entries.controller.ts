import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LaborCostTableEntriesService } from './labor-cost-table-entries.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('labor-cost-table-entries')
export class LaborCostTableEntriesController {
  constructor(private readonly laborCostTableEntriesService: LaborCostTableEntriesService) {}

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.laborCostTableEntriesService.findAll(organizationId);
  }
}
