import { Module } from '@nestjs/common';
// import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PrismaService],
  controllers: [PermissionsController],
  // exports: [PermissionsService],
})
export class PermissionsModule {}
