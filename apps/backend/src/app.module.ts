import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogService } from './common/audit-log.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Importe CADA módulo de funcionalidade que você criou
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ContasContabeisModule } from './contas-contabeis/contas-contabeis.module';
import { ContasCorrentesModule } from './contas-correntes/contas-correntes.module';
import { CreditCardBillsModule } from './credit-card-bills/credit-card-bills.module';
import { CreditCardTransactionsModule } from './credit-card-transactions/credit-card-transactions.module';
import { CreditCardsModule } from './credit-cards/credit-cards.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { SettingsModule } from './settings/settings.module';
import { TransacoesModule } from './transacoes/transacoes.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module'; // O Prisma também costuma ser um módulo
import { AccountsRecModule } from './accounts-rec/accounts-rec.module'; // Módulo de contas a receber
import { AccountsPayModule } from './accounts-pay/accounts-pay.module'; // Módulo de
import { BankStatementImportsModule } from './bank-statement-imports/bank-statement-imports.module';
import { ClientImportsModule } from './client-imports/client-imports.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { LandingPageModule } from './landing-page/landing-page.module';
import { MediaModule } from './media/media.module';
import { BackupsModule } from './backups/backups.module';
import { CreditCardFeesModule } from './credit-card-fees/credit-card-fees.module';
import { CreditCardForecastModule } from './credit-card-forecast/credit-card-forecast.module';
import { PaymentTermsModule } from './payment-terms/payment-terms.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/', // Rota em que os arquivos estarão disponíveis
    }),

    // Registre (ligue) CADA módulo aqui
    AuthModule,
    UsersModule, // O AuthModule geralmente depende do UsersModule, então é bom ele vir antes
    ClientsModule,
    ContasContabeisModule,
    ContasCorrentesModule,
    CreditCardBillsModule,
    CreditCardTransactionsModule,
    CreditCardsModule,
    DashboardModule,
    ProductsModule,
    SalesModule,
    SettingsModule,
    TransacoesModule,
    PrismaModule,
    AccountsRecModule, // <-- Registre o módulo aqui
    AccountsPayModule, BankStatementImportsModule, ClientImportsModule, AuditLogsModule, LandingPageModule, MediaModule, BackupsModule, CreditCardFeesModule, CreditCardForecastModule, PaymentTermsModule, // <-- Registre o módulo aqui
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    AuditLogService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}