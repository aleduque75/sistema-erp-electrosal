import { Controller, Get, Body, UseGuards, Patch, Req } from '@nestjs/common';
import { LandingPageService } from './landing-page.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Landing Page')
@Controller('landing-page')
export class LandingPageController {
  constructor(private readonly landingPageService: LandingPageService) {}

  @Public()
  @Get('public')
  async findPublic() {
    return this.landingPageService.findPublic();
  }

  @Get('editor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findForEditor(@Req() req) {
    const organizationId = req.user?.organizationId || req.user?.orgId;
    return this.landingPageService.findOneByOrg(organizationId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Req() req, @Body() updateDto: UpdateLandingPageDto) {
    const organizationId = req.user?.organizationId || req.user?.orgId;
    return this.landingPageService.update(organizationId, updateDto);
  }

  @Get('admin')
  async findOne(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.landingPageService.findOneByOrg(organizationId); // Agora o método existe
  }
}
