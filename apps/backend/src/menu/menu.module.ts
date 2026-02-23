import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LandingPageModule } from '../landing-page/landing-page.module';

@Module({
  imports: [PrismaModule, LandingPageModule],
  controllers: [MenuController],
  providers: [MenuService]
})
export class MenuModule { }
