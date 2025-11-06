/// <reference types="../types/express" />
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { TipoMetal } from '@prisma/client';
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
  findAll(@Req() req: Request, @Query('metalType') metalType?: TipoMetal, @Query('remainingGramsGt') remainingGramsGt?: string) {
    const organizationId = req.user['organizationId'];
    const remainingGramsGtFloat = remainingGramsGt ? parseFloat(remainingGramsGt) : undefined;
    return this.pureMetalLotsService.findAll(organizationId, metalType, remainingGramsGtFloat);
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