import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Add HttpModule
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaModule } from '../prisma/prisma.module'; // Add PrismaModule (dependency of WhatsappService)
import { AccountsPayModule } from '../accounts-pay/accounts-pay.module'; // Import AccountsPayModule
import { WhatsappRoutinesModule } from '../whatsapp-routines/whatsapp-routines.module'; // Adicionar esta linha

@Module({
  imports: [HttpModule, PrismaModule, AccountsPayModule, WhatsappRoutinesModule], // Adicionar aqui
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}