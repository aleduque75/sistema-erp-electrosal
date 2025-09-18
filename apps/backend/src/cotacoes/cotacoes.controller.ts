import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CotacoesService } from './cotacoes.service';
import { CreateCotacaoDto } from './dtos/create-cotacao.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TipoMetal } from '@prisma/client';

@ApiTags('Cotações')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('cotacoes')
export class CotacoesController {
  constructor(private readonly cotacoesService: CotacoesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova cotação' })
  create(
    @Body() createCotacaoDto: CreateCotacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.cotacoesService.create(createCotacaoDto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as cotações da organização' })
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.cotacoesService.findAll(organizationId);
}

  @Get('latest')
  @ApiOperation({ summary: 'Busca a cotação mais recente para um tipo de metal' })
  @ApiQuery({ name: 'metal', enum: TipoMetal, required: true })
  findLatest(
    @Query('metal') metal: TipoMetal,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.cotacoesService.findLatest(metal, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma cotação pelo ID' })
  findOne(@Param('id') id: string, @CurrentUser('orgId') organizationId: string) {
    return this.cotacoesService.findOne(id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma cotação' })
  remove(@Param('id') id: string, @CurrentUser('orgId') organizationId: string) {
    return this.cotacoesService.remove(id, organizationId);
  }
}
