import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, Req } from '@nestjs/common';
import { WhatsappRoutinesService } from './whatsapp-routines.service';
import { CreateWhatsappRoutineDto } from './dto/create-whatsapp-routine.dto';
import { UpdateWhatsappRoutineDto } from './dto/update-whatsapp-routine.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assumindo este caminho
import { OrganizationId } from '../common/decorators/organization-id.decorator'; // O decorator que acabamos de criar
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('whatsapp-routines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('whatsapp-routines')
export class WhatsappRoutinesController {
  constructor(private readonly whatsappRoutinesService: WhatsappRoutinesService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Cria uma nova rotina de WhatsApp' })
  @ApiResponse({ status: 201, description: 'A rotina foi criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(
    @Body() createWhatsappRoutineDto: CreateWhatsappRoutineDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.whatsappRoutinesService.create(createWhatsappRoutineDto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as rotinas de WhatsApp da organização' })
  @ApiResponse({ status: 200, description: 'Lista de rotinas.' })
  async findAll(@OrganizationId() organizationId: string) {
    return this.whatsappRoutinesService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém uma rotina de WhatsApp pelo ID' })
  @ApiResponse({ status: 200, description: 'Detalhes da rotina.' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada.' })
  async findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.whatsappRoutinesService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma rotina de WhatsApp existente' })
  @ApiResponse({ status: 200, description: 'A rotina foi atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada.' })
  async update(
    @Param('id') id: string,
    @Body() updateWhatsappRoutineDto: UpdateWhatsappRoutineDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.whatsappRoutinesService.update(id, updateWhatsappRoutineDto, organizationId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove uma rotina de WhatsApp' })
  @ApiResponse({ status: 204, description: 'A rotina foi removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada.' })
  async remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.whatsappRoutinesService.remove(id, organizationId);
  }
}
