import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { MenuService, FullMenuResponse } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  create(@Request() req, @Body() createMenuDto: CreateMenuDto) {
    const organizationId = req.user.organizationId;
    return this.menuService.create(organizationId, createMenuDto);
  }

  @Get()
  findAll(@Request() req): Promise<FullMenuResponse> {
    const organizationId = req.user.organizationId;
    return this.menuService.findAll(organizationId);
  }

  @Patch('reorder')
  reorder(@Request() req, @Body() reorderMenuDto: ReorderMenuDto) {
    const organizationId = req.user.organizationId;
    return this.menuService.reorder(organizationId, reorderMenuDto.items);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.menuService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    const organizationId = req.user.organizationId;
    return this.menuService.update(organizationId, id, updateMenuDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.menuService.remove(organizationId, id);
  }
}