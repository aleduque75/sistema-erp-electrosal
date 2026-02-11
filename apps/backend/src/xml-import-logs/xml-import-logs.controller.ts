import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { XmlImportLogsService } from './xml-import-logs.service';
import { CreateXmlImportLogDto } from './dto/create-xml-import-log.dto';
import { UpdateXmlImportLogDto } from './dto/update-xml-import-log.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('xml-import-logs')
export class XmlImportLogsController {
  constructor(private readonly xmlImportLogsService: XmlImportLogsService) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createXmlImportLogDto: CreateXmlImportLogDto
  ) {
    return this.xmlImportLogsService.create(organizationId, createXmlImportLogDto);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.xmlImportLogsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string
  ) {
    return this.xmlImportLogsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string, 
    @Body() updateXmlImportLogDto: UpdateXmlImportLogDto
  ) {
    return this.xmlImportLogsService.update(organizationId, id, updateXmlImportLogDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string
  ) {
    return this.xmlImportLogsService.remove(organizationId, id);
  }
}
