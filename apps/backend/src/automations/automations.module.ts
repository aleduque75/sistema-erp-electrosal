import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { AccountsPayModule } from '../accounts-pay/accounts-pay.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, AccountsPayModule, PrismaModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
