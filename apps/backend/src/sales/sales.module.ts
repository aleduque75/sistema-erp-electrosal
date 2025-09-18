import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PessoaModule } from '../pessoa/pessoa.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { CotacoesModule } from '../cotacoes/cotacoes.module';

@Module({
  imports: [
    PrismaModule,
    PessoaModule,
    ProductsModule,
    SettingsModule,
    CotacoesModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, CreateSaleUseCase],
})
export class SalesModule {}
