import { Module } from '@nestjs/common';
// import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaService } from '../prisma/prisma.service';
// import { PermissionsService } from '../permissions/permissions.service';

@Module({
  providers: [PrismaService],
  controllers: [RolesController],
  // exports: [RolesService],
})
export class RolesModule {}
