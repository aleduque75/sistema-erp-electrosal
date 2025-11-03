/// <reference types="../types/express" />
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PureMetalLotsService } from './pure-metal-lots.service';
import { CreatePureMetalLotDto } from './dto/create-pure-metal-lot.dto';
import { UpdatePureMetalLotDto } from './dto/update-pure-metal-lot.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('pure-metal-lots')
export class PureMetalLotsController {
  constructor(private readonly pureMetalLotsService: PureMetalLotsService) {}

  @Post()
  create(@Req() req: Request, @Body() createPureMetalLotDto: CreatePureMetalLotDto) {
    const organizationId = req.user['organizationId'];
    return this.pureMetalLotsService.create(organizationId, createPureMetalLotDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const organizationId = req.user['organizationId'];
    return this.pureMetalLotsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const organizationId = req.user['organizationId'];
    return this.pureMetalLotsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updatePureMetalLotDto: UpdatePureMetalLotDto) {
    const organizationId = req.user['organizationId'];
    return this.pureMetalLotsService.update(organizationId, id, updatePureMetalLotDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const organizationId = req.user['organizationId'];
    return this.pureMetalLotsService.remove(organizationId, id);
  }
}