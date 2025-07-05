import { Module } from '@nestjs/common';
import { AccountsRecController } from './accounts-rec.controller';
import { AccountsRecService } from './accounts-rec.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccountsRecController],
  providers: [AccountsRecService],
  exports: [AccountsRecService],
})
export class AccountsRecModule {}
