import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Add HttpModule
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaModule } from '../prisma/prisma.module'; // Add PrismaModule (dependency of WhatsappService)

@Module({
  imports: [HttpModule, PrismaModule], // Add HttpModule and PrismaModule here
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}