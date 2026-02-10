import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProductGroupsService } from './product-groups.service';
import { CreateProductGroupDto, UpdateProductGroupDto } from './dtos/product-group.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('product-groups')
export class ProductGroupsController {
  constructor(private readonly productGroupsService: ProductGroupsService) {}

  @Post()
  create(@CurrentUser('orgId') organizationId: string, @Body() createProductGroupDto: CreateProductGroupDto) {
    return this.productGroupsService.create(organizationId, createProductGroupDto);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.productGroupsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser('orgId') organizationId: string, @Param('id') id: string) {
    return this.productGroupsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateProductGroupDto: UpdateProductGroupDto,
  ) {
    return this.productGroupsService.update(organizationId, id, updateProductGroupDto);
  }

  @Delete(':id')
  remove(@CurrentUser('orgId') organizationId: string, @Param('id') id: string) {
    return this.productGroupsService.remove(organizationId, id);
  }
}
