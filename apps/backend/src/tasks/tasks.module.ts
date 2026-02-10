import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule

@Module({
  imports: [PrismaModule], // Add PrismaModule to imports
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
