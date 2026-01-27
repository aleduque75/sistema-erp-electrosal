import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Add HttpModule
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaModule } from '../prisma/prisma.module'; // Add PrismaModule (dependency of WhatsappService)
import { AccountsPayModule } from '../accounts-pay/accounts-pay.module'; // Import AccountsPayModule

@Module({
  imports: [HttpModule, PrismaModule, AccountsPayModule], // Add AccountsPayModule here
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}