import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import {
  CreateCreditCardDto,
  UpdateCreditCardDto,
} from './dtos/credit-card.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly service: CreditCardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateCreditCardDto,
  ) {
    return this.service.create(organizationId, createDto);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.service.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateCreditCardDto,
  ) {
    return this.service.update(organizationId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(organizationId, id);
  }
}
