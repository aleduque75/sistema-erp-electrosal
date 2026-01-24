import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { CreateExpenseAutomationDto } from './dto/create-expense-automation.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('automations')
@UseGuards(ApiKeyGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Post('expenses')
  async createExpense(@Body() createExpenseDto: CreateExpenseAutomationDto) {
    return this.automationsService.createExpense(createExpenseDto);
  }
}
