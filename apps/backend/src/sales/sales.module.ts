import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { AccountsRecModule } from '../accounts-rec/accounts-rec.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { ContasCorrentesModule } from '../contas-correntes/contas-correntes.module';
import { ContasContabeisModule } from '../contas-contabeis/contas-contabeis.module';

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    AccountsRecModule,
    TransacoesModule,
    ContasCorrentesModule,
    ContasContabeisModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
