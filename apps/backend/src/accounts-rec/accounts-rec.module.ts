import { Module } from '@nestjs/common';
import { AccountsRecController } from './accounts-rec.controller';
import { AccountsRecService } from './accounts-rec.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [AccountsRecController],
  providers: [AccountsRecService],
  exports: [AccountsRecService],
})
export class AccountsRecModule {}
