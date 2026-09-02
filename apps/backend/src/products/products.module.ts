import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { XmlImportLogsModule } from '../xml-import-logs/xml-import-logs.module';
import { ProductRepository } from './repositories/product.repository';
import { PrismaProductRepository } from './repositories/prisma-product.repository';
import { ListProductsUseCase } from './use-cases/list-products.use-case';
import { GetProductUseCase } from './use-cases/get-product.use-case';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { UpdateProductUseCase } from './use-cases/update-product.use-case';
import { DeleteProductUseCase } from './use-cases/delete-product.use-case';
import { AnalyzeXmlImportUseCase } from './use-cases/analyze-xml-import.use-case';
import { ConfirmXmlImportUseCase } from './use-cases/confirm-xml-import.use-case';
import { FixReactionGroupUseCase } from './use-cases/fix-reaction-group.use-case';
import { GetAllProductGroupsUseCase } from './use-cases/get-all-product-groups.use-case';

@Module({
  imports: [PrismaModule, XmlImportLogsModule],
  controllers: [ProductsController],
  providers: [
    {
      provide: ProductRepository,
      useClass: PrismaProductRepository,
    },
    ListProductsUseCase,
    GetProductUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    AnalyzeXmlImportUseCase,
    ConfirmXmlImportUseCase,
    FixReactionGroupUseCase,
    GetAllProductGroupsUseCase,
  ],
  exports: [
    ProductRepository,
    ListProductsUseCase,
    GetProductUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    AnalyzeXmlImportUseCase,
    ConfirmXmlImportUseCase,
    FixReactionGroupUseCase,
    GetAllProductGroupsUseCase,
  ],
})
export class ProductsModule {}
