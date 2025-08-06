import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getDashboardSummary(organizationId);
  }

  @Get('accounts-pay-status')
  getAccountsPayStatus(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getAccountsPayStatus(organizationId);
  }

  @Get('cash-flow-summary')
  getCashFlowSummary(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getCashFlowSummary(organizationId);
  }

  @Get('third-party-loans-summary')
  getThirdPartyLoansSummary(@CurrentUser('orgId') organizationId: string) {
    return this.dashboardService.getThirdPartyLoansSummary(organizationId);
  }
}
