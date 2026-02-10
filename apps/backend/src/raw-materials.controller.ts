import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RawMaterialsService } from './raw-materials.service';
import { CreateRawMaterialDto } from './raw-materials/dtos/create-raw-material.dto';
import { UpdateRawMaterialDto } from './raw-materials/dtos/update-raw-material.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('raw-materials')
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Post()
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createRawMaterialDto: CreateRawMaterialDto,
  ) {
    return this.rawMaterialsService.create(
      organizationId,
      createRawMaterialDto,
    );
  }

  @Get()
  findAll(@CurrentUser('organizationId') organizationId: string) {
    return this.rawMaterialsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.rawMaterialsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() updateRawMaterialDto: UpdateRawMaterialDto,
  ) {
    return this.rawMaterialsService.update(
      organizationId,
      id,
      updateRawMaterialDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id:string) {
    return this.rawMaterialsService.remove(organizationId, id);
  }
}
