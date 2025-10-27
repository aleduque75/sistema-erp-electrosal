import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { RawMaterialsService } from './raw-materials.service';
import { CreateRawMaterialDto } from './raw-materials/dtos/create-raw-material.dto';
import { UpdateRawMaterialDto } from './raw-materials/dtos/update-raw-material.dto';

@Controller('raw-materials')
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Post()
  create(@Request() req, @Body() createRawMaterialDto: CreateRawMaterialDto) {
    return this.rawMaterialsService.create(
      req.user.organizationId,
      createRawMaterialDto,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.rawMaterialsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.rawMaterialsService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateRawMaterialDto: UpdateRawMaterialDto,
  ) {
    return this.rawMaterialsService.update(
      req.user.organizationId,
      id,
      updateRawMaterialDto,
    );
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.rawMaterialsService.remove(req.user.organizationId, id);
  }
}
