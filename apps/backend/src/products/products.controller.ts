import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  CreateProductDto,
  UpdateProductDto,
  ListProductsQueryDto,
  ImportXmlDto,
  ConfirmImportXmlDto,
} from './dtos';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ListProductsUseCase } from './use-cases/list-products.use-case';
import { GetProductUseCase } from './use-cases/get-product.use-case';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { UpdateProductUseCase } from './use-cases/update-product.use-case';
import { DeleteProductUseCase } from './use-cases/delete-product.use-case';
import { AnalyzeXmlImportUseCase } from './use-cases/analyze-xml-import.use-case';
import { ConfirmXmlImportUseCase } from './use-cases/confirm-xml-import.use-case';
import { FixReactionGroupUseCase } from './use-cases/fix-reaction-group.use-case';
import { GetAllProductGroupsUseCase } from './use-cases/get-all-product-groups.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly analyzeXmlImportUseCase: AnalyzeXmlImportUseCase,
    private readonly confirmXmlImportUseCase: ConfirmXmlImportUseCase,
    private readonly fixReactionGroupUseCase: FixReactionGroupUseCase,
    private readonly getAllProductGroupsUseCase: GetAllProductGroupsUseCase,
  ) {}

  private resolveOrgId(org1?: string, org2?: string): string {
    return org1 || org2 || '';
  }

  @Post('import-xml/analyze')
  importXmlAnalyze(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
    @Body() importXmlDto: ImportXmlDto,
  ) {
    return this.analyzeXmlImportUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
      importXmlDto,
    );
  }

  @Post('import-xml')
  importXml(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
    @Body() confirmImportXmlDto: ConfirmImportXmlDto,
  ) {
    return this.confirmXmlImportUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
      confirmImportXmlDto,
    );
  }

  @Post()
  create(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.createProductUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
      createProductDto,
    );
  }

  @Get()
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.listProductsUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
      query,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
    @Param('id') id: string,
  ) {
    return this.getProductUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
      id,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.updateProductUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
      id,
      updateProductDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
    @Param('id') id: string,
  ) {
    return this.deleteProductUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
      id,
    );
  }

  @Get('product-groups/debug')
  getAllProductGroups(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
  ) {
    return this.getAllProductGroupsUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
    );
  }

  @Post('fix-reaction-group')
  fixReactionGroupFlag(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('orgId') legacyOrgId: string,
  ) {
    return this.fixReactionGroupUseCase.execute(
      this.resolveOrgId(orgId, legacyOrgId),
    );
  }
}
