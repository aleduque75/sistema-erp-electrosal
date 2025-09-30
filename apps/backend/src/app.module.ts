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
import { PessoaModule } from './pessoa/pessoa.module';
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
import { PdfImportModule } from './pdf-import/pdf-import.module';
import { JsonImportsModule } from './json-imports/json-imports.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { AnalisesQuimicasModule } from './analises-quimicas';
import { RecuperacoesModule } from './recuperacoes';
import { RecoveryOrdersModule } from './recovery-orders/recovery-orders.module';
import { MetalAccountsModule } from './metal-accounts/metal-accounts.module';
import { QuotationsModule } from './quotations/quotations.module';
import { QuotationImportsModule } from './quotation-imports/quotation-imports.module';
import { ProductGroupsModule } from './product-groups/product-groups.module';
import { ChemicalReactionsModule } from './chemical-reactions/chemical-reactions.module';
import { LaborCostTableEntriesModule } from './labor-cost-table-entries/labor-cost-table-entries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna as variáveis de ambiente disponíveis globalmente
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PessoaModule,
    ContasContabeisModule,
    ContasCorrentesModule,
    TransacoesModule,
    CreditCardsModule,
    CreditCardTransactionsModule,
    CreditCardBillsModule,
    DashboardModule,
    ProductsModule,
    SalesModule,
    SettingsModule,
    AccountsRecModule,
    AccountsPayModule,
    BankStatementImportsModule,
    ClientImportsModule,
    AuditLogsModule,
    LandingPageModule,
    MediaModule,
    BackupsModule,
    CreditCardFeesModule,
    CreditCardForecastModule,
    PaymentTermsModule,
    PdfImportModule,
    JsonImportsModule,
    PurchaseOrdersModule,
    AnalisesQuimicasModule,
    RecuperacoesModule,
    RecoveryOrdersModule,
    MetalAccountsModule,
    QuotationsModule,
    QuotationImportsModule,
    ProductGroupsModule,
    ChemicalReactionsModule,
    LaborCostTableEntriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuditLogService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}