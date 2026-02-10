import { Module } from '@nestjs/common';
import { WhatsappRoutinesService } from './whatsapp-routines.service';
import { WhatsappRoutinesController } from './whatsapp-routines.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Assuming PrismaModule is needed

@Module({
  imports: [PrismaModule], // Import PrismaModule if it will be used by the service
  controllers: [WhatsappRoutinesController],
  providers: [WhatsappRoutinesService],
  exports: [WhatsappRoutinesService], // Export the service so others can use it
})
export class WhatsappRoutinesModule {}
