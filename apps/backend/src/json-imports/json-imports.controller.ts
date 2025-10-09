
import { Controller, Post, HttpCode, HttpStatus, Logger, Delete, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JsonImportsService } from './json-imports.service';

@Controller('json-imports')
@UseGuards(JwtAuthGuard)
export class JsonImportsController {
  private readonly logger = new Logger(JsonImportsController.name);

  constructor(private readonly jsonImportsService: JsonImportsService) {}

  @Post('contas')
  @HttpCode(HttpStatus.OK)
  async importContas(@CurrentUser('organizationId') organizationId: string) {
    this.logger.log(`Recebida requisição para importar contas para a organização ${organizationId}`);
    return this.jsonImportsService.importContas(organizationId);
  }

  @Post('sales-finance')
  @HttpCode(HttpStatus.OK)
  async importSalesAndFinance(@CurrentUser('organizationId') organizationId: string) {
    this.logger.log(`Recebida requisição para importação completa de vendas para a organização ${organizationId}`);
    return this.jsonImportsService.importSalesAndFinance(organizationId);
  }

  @Delete('delete-all-sales')
  @HttpCode(HttpStatus.OK)
  async deleteAllSales() {
    this.logger.warn('Recebida requisição para DELETAR TODAS as vendas.');
    return this.jsonImportsService.deleteAllSales();
  }

  @Post('companies')
  @HttpCode(HttpStatus.OK)
  async importCompanies(@CurrentUser('organizationId') organizationId: string) {
    this.logger.log(`Recebida requisição para importar/atualizar empresas para a organização ${organizationId}`);
    return this.jsonImportsService.importOrUpdateCompanies(organizationId);
  }

  @Post('reset-and-seed')
  @HttpCode(HttpStatus.OK)
  async resetAndSeed() {
    this.logger.warn('Recebida requisição para RESETAR E POPULAR O BANCO DE DADOS.');
    return this.jsonImportsService.resetAndSeed();
  }

  @Post('products')
  @HttpCode(HttpStatus.OK)
  async importProducts(@CurrentUser('organizationId') organizationId: string) {
    this.logger.log(`Recebida requisição para importar produtos para a organização ${organizationId}`);
    return this.jsonImportsService.importProducts(organizationId);
  }

  @Post('link-sales-receivables')
  @HttpCode(HttpStatus.OK)
  async linkSalesAndReceivables(@CurrentUser('organizationId') organizationId: string) {
    this.logger.log(`Recebida requisição para vincular vendas e recebimentos para a organização ${organizationId}`);
    return this.jsonImportsService.linkSalesAndReceivables(organizationId);
  }

  @Post('full-legacy-import')
  @HttpCode(HttpStatus.OK)
  async runFullLegacyImport(@CurrentUser('organizationId') organizationId: string) {
    this.logger.warn(`Recebida requisição para IMPORTAÇÃO COMPLETA DO LEGADO para a organização ${organizationId}`);
    return this.jsonImportsService.runFullLegacyImport(organizationId);
  }

  @Get('audit-import-files')
  @HttpCode(HttpStatus.OK)
  async auditImportFiles() {
    this.logger.log('Recebida requisição para auditar arquivos de importação.');
    return this.jsonImportsService.auditImportFiles();
  }
}
