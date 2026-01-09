import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MarketDataService } from './market-data.service';
import { CreateMarketDataDto } from './dto/create-market-data.dto';
import { UpdateMarketDataDto } from './dto/update-market-data.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createMarketDataDto: CreateMarketDataDto
  ) {
    return this.marketDataService.create(organizationId, createMarketDataDto);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.marketDataService.findAll(organizationId, startDate, endDate);
  }

  @Get('latest')
  findLatest(@CurrentUser('orgId') organizationId: string) {
    return this.marketDataService.findLatest(organizationId);
  }

  @Post('sync')
  sync(@CurrentUser('orgId') organizationId: string) {
    return this.marketDataService.sync(organizationId);
  }

  @Get(':date')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('date') date: string
  ) {
    return this.marketDataService.findOne(organizationId, date);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateMarketDataDto: UpdateMarketDataDto
  ) {
    return this.marketDataService.update(id, organizationId, updateMarketDataDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string
  ) {
    return this.marketDataService.remove(id, organizationId);
  }
}
