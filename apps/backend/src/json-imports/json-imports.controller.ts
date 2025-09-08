import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JsonImportsService } from './json-imports.service';

@UseGuards(AuthGuard('jwt'))
@Controller('json-imports')
export class JsonImportsController {
  constructor(private readonly jsonImportsService: JsonImportsService) {}

  @Post('empresas')
  importEmpresas(@CurrentUser('organizationId') organizationId: string) {
    // Dispara a importação. A operação é "fire-and-forget" do ponto de vista do usuário.
    // O serviço usará o Logger para registrar o progresso e o resultado.
    this.jsonImportsService.importEmpresas(organizationId);
    return {
      message: 'Importação iniciada em segundo plano. Verifique os logs do servidor para o progresso.',
    };
  }
}
