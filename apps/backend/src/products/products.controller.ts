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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dtos/create-product.dto';
import { ImportXmlDto, ConfirmImportXmlDto } from './dtos/import-xml.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('import-xml/analyze')
  importXmlAnalyze(
    @CurrentUser('orgId') organizationId: string,
    @Body() importXmlDto: ImportXmlDto,
  ) {
    return this.productsService.importXmlAnalyze(organizationId, importXmlDto);
  }

  @Post('import-xml')
  importXml(
    @CurrentUser('orgId') organizationId: string,
    @Body() confirmImportXmlDto: ConfirmImportXmlDto,
  ) {
    return this.productsService.importXml(organizationId, confirmImportXmlDto);
  }

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(organizationId, createProductDto);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.productsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(organizationId, id, updateProductDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(organizationId, id);
  }
}
