import { Controller, Get, UseGuards } from '@nestjs/common';
import { CreditCardForecastService } from './credit-card-forecast.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('credit-card-forecast')
export class CreditCardForecastController {
  constructor(private readonly forecastService: CreditCardForecastService) {}

  @Get()
  async getForecast(@CurrentUser('orgId') orgId: string) {
    return this.forecastService.getForecast(orgId);
  }
}
