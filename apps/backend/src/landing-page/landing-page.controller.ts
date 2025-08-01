import { Controller, Get, Patch, Body, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LandingPageService } from './landing-page.service';
import { UpdateLandingPageDto } from './dtos/update-landing-page.dto'; // Vamos criar este DTO

@Controller('landing-page')
export class LandingPageController {
  constructor(private readonly landingPageService: LandingPageService) {}

  @Get()
  getLandingPage() {
    return this.landingPageService.getLandingPage();
  }

  @UseGuards(AuthGuard('jwt')) // Protege a rota de atualização
  @Patch()
  updateLandingPage(@Body(ValidationPipe) updateDto: UpdateLandingPageDto) {
    return this.landingPageService.updateLandingPage(updateDto.sections);
  }
}
