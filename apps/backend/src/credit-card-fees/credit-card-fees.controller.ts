import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreditCardFeesService } from './credit-card-fees.service';
import { CreateCreditCardFeeDto } from './dtos/create-credit-card-fee.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-fees')
export class CreditCardFeesController {
  constructor(private readonly service: CreditCardFeesService) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateCreditCardFeeDto,
  ) {
    return this.service.create(organizationId, createDto);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.service.findAll(organizationId);
  }

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(organizationId, id);
  }
}
