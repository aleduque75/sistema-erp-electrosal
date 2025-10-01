import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PureMetalLotsService } from './pure-metal-lots.service';
import { GetPureMetalLotsDto } from './dto/get-pure-metal-lots.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('pure-metal-lots')
export class PureMetalLotsController {
  constructor(private readonly pureMetalLotsService: PureMetalLotsService) {}

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query() query: GetPureMetalLotsDto,
  ) {
    return this.pureMetalLotsService.findAll(organizationId, query);
  }
}