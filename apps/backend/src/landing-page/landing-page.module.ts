import { Module } from '@nestjs/common';
import { LandingPageService } from './landing-page.service';
import { LandingPageController } from './landing-page.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [LandingPageService],
  controllers: [LandingPageController],
  exports: [LandingPageService], // Exportar se outros módulos precisarem
})
export class LandingPageModule {}
