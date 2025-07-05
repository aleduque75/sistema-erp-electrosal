import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ImportXmlDto,
} from './dtos/product.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Request() req: AuthRequest,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(req.user.id, createProductDto);
  }

  // Rota de importação ajustada
  @Post('import-xml')
  importXml(
    @Request() req: AuthRequest,
    @Body()
    body: { xmlContent: string; manualMatches: { [xmlName: string]: string } },
  ) {
    return this.productsService.importXml(
      req.user.id,
      body.xmlContent,
      body.manualMatches,
    );
  }

  // Nova rota de análise
  @Post('import-xml/analyze')
  analyzeXml(@Request() req: AuthRequest, @Body() importXmlDto: ImportXmlDto) {
    return this.productsService.analyzeXml(
      req.user.id,
      importXmlDto.xmlContent,
    );
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.productsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.productsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(req.user.id, id, updateProductDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.productsService.remove(req.user.id, id);
  }
}
