import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { LandingPageService } from './landing-page.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../auth/decorators/public.decorator';

@Controller('landing-page')
export class LandingPageController {
  constructor(private readonly landingPageService: LandingPageService) {}

  @Public()
  @Get()
  findOne() {
    return this.landingPageService.findOne(true); // Sempre hidratado para o público
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('editor')
  findOneForEditor() {
    return this.landingPageService.findOne(false); // Não hidratado para o editor
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  update(@Body() updateLandingPageDto: UpdateLandingPageDto) {
    const { sections, logoText, logoImageId, customThemeName } = updateLandingPageDto; // Extrai os novos campos

    const sectionsToUpdate = sections.map(section => ({
      ...section,
      content: JSON.parse(JSON.stringify(section.content)),
    }));
    return this.landingPageService.update(sectionsToUpdate, logoText, logoImageId, customThemeName); // Passa os novos campos
  }
}
