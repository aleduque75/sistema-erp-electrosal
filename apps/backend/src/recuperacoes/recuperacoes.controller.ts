import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PrismaRecuperacaoRepository } from './repositories/prisma-recuperacao.repository';
import { Recuperacao } from '@sistema-erp-electrosal/core';

@Controller('recuperacoes')
export class RecuperacoesController {
  constructor(private readonly repository: PrismaRecuperacaoRepository) {}

  @Get()
  async findAll(@Query() filtros: any): Promise<Recuperacao[]> {
    return this.repository.findAll(filtros);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Query('organizationId') organizationId: string): Promise<Recuperacao | null> {
    return this.repository.findById(id, organizationId);
  }

  @Post()
  async create(@Body() body: any): Promise<Recuperacao> {
    return this.repository.create(body, body.organizationId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any): Promise<Recuperacao> {
    return this.repository.save({ ...body, id }, body.organizationId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
