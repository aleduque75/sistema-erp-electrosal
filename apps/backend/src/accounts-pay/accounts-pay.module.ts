import { Module } from '@nestjs/common';
import { AccountsPayController } from './accounts-pay.controller';
import { AccountsPayService } from './accounts-pay.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccountsPayController],
  providers: [AccountsPayService],
  exports: [AccountsPayService],
})
export class AccountsPayModule {}
