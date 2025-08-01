import { Module } from '@nestjs/common';
import { BankStatementImportsService } from './bank-statement-imports.service';
import { BankStatementImportsController } from './bank-statement-imports.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <-- 1. IMPORTE O PRISMA MODULE

@Module({
  imports: [PrismaModule], // <-- 2. ADICIONE-O AOS IMPORTS
  controllers: [BankStatementImportsController],
  providers: [BankStatementImportsService],
})
export class BankStatementImportsModule {}
