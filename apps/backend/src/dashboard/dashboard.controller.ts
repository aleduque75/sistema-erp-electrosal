// apps/backend/src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(AuthGuard('jwt')) // Protege todas as rotas neste controller com autenticação JWT
@Controller('dashboard') // Define o prefixo '/dashboard' para todas as rotas deste controller
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary') // Este endpoint será acessível via GET para '/dashboard/summary'
  async getSummary(@Request() req: AuthRequest) {
    // O decorador @Request é crucial aqui
    // O objeto 'req.user' é automaticamente injetado pelo AuthGuard
    // e contém as informações do usuário autenticado (como o ID)
    const userId = req.user.id;
    // Chama o método no DashboardService para obter os dados do resumo
    return this.dashboardService.getDashboardSummary(userId);
  }

  // Todos os métodos CRUD (create, findAll, findOne, update, remove) foram REMOVIDOS.
  // Eles não se aplicam a um endpoint de resumo de dashboard e podem causar confusão.
}
