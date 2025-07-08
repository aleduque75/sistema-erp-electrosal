import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { AccountsPayModule } from './accounts-pay/accounts-pay.module';
import { AccountsRecModule } from './accounts-rec/accounts-rec.module';
import { ContasContabeisModule } from './contas-contabeis/contas-contabeis.module';
import { ContasCorrentesModule } from './contas-correntes/contas-correntes.module';
import { TransacoesModule } from './transacoes/transacoes.module';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { CreditCardBillsModule } from './credit-card-bills/credit-card-bills.module';
import { CreditCardTransactionsModule } from './credit-card-transactions/credit-card-transactions.module';
import { CreditCardsModule } from './credit-cards/credit-cards.module'; // ✅ 1. Importe o novo módulo

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PrismaModule,
    ClientsModule,
    ProductsModule,
    SalesModule,
    AccountsPayModule,
    AccountsRecModule,
    ContasContabeisModule,
    ContasCorrentesModule,
    TransacoesModule,
    DashboardModule,
    SettingsModule,
    CreditCardBillsModule,
    CreditCardTransactionsModule,
    CreditCardsModule, // ✅ 2. Adicione o novo módulo aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
