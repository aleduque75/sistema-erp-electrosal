
import { Controller, Post, HttpCode, HttpStatus, Logger, Delete, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express'; // Import Request
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { JsonImportsService } from './json-imports.service';

@Controller('json-imports')
@UseGuards(JwtAuthGuard)
export class JsonImportsController {
  private readonly logger = new Logger(JsonImportsController.name);

  constructor(private readonly jsonImportsService: JsonImportsService) {}

  @Post('contas')
  @HttpCode(HttpStatus.OK)
  async importContas(@Req() req: Request) {
    // @ts-ignore
    const organizationId = req.user.organizationId;
    this.logger.log(`Recebida requisição para importar contas para a organização ${organizationId}`);
    return this.jsonImportsService.importContas(organizationId);
  }

  @Post('sales-finance')
  @HttpCode(HttpStatus.OK)
  async importSalesAndFinance(@Req() req: Request) {
    // @ts-ignore
    const organizationId = req.user.organizationId;
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
  async importCompanies(@Req() req: Request) {
    // @ts-ignore
    const organizationId = req.user.organizationId;
    this.logger.log(`Recebida requisição para importar/atualizar empresas para a organização ${organizationId}`);
    return this.jsonImportsService.importOrUpdateCompanies(organizationId);
  }

  @Post('products')
  @HttpCode(HttpStatus.OK)
  async importProducts(@Req() req: Request) {
    // @ts-ignore
    const organizationId = req.user.organizationId;
    this.logger.log(`Recebida requisição para importar produtos para a organização ${organizationId}`);
    return this.jsonImportsService.importProducts(organizationId);
  }
}
