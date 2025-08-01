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
    return this.landingPageService.findOne();
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  update(@Body() updateLandingPageDto: UpdateLandingPageDto) {
    const { sections, logoText, logoImageId } = updateLandingPageDto; // Extrai os novos campos

    const sectionsToUpdate = sections.map(section => ({
      ...section,
      content: JSON.parse(JSON.stringify(section.content)),
    }));
    return this.landingPageService.update(sectionsToUpdate, logoText, logoImageId); // Passa os novos campos
  }
}
