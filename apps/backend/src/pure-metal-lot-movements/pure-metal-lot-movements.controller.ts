import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PureMetalLotMovementsService } from './pure-metal-lot-movements.service';
import { CreatePureMetalLotMovementDto } from './dto/create-pure-metal-lot-movement.dto';
import { UpdatePureMetalLotMovementDto } from './dto/update-pure-metal-lot-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('pure-metal-lot-movements')
export class PureMetalLotMovementsController {
  constructor(private readonly pureMetalLotMovementsService: PureMetalLotMovementsService) {}

  @Post()
  create(@Body() createPureMetalLotMovementDto: CreatePureMetalLotMovementDto, @CurrentUser() user: User) {
    return this.pureMetalLotMovementsService.create(createPureMetalLotMovementDto, user.organizationId);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query('pureMetalLotId') pureMetalLotId?: string) {
    return this.pureMetalLotMovementsService.findAll(user.organizationId, pureMetalLotId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.pureMetalLotMovementsService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePureMetalLotMovementDto: UpdatePureMetalLotMovementDto,
    @CurrentUser() user: User,
  ) {
    return this.pureMetalLotMovementsService.update(id, updatePureMetalLotMovementDto, user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.pureMetalLotMovementsService.remove(id, user.organizationId);
  }
}
