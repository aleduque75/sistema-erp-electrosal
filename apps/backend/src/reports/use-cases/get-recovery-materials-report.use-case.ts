import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface GetRecoveryMaterialsReportDto {
  startDate?: string;
  endDate?: string;
  metalType?: string;
}

export interface MaterialBalanceItem {
  materialName: string;
  saldoAnteriorGrams: number;
  entradasMesGrams: number;
  saidasMesGrams: number;
  saldoProximoMesGrams: number;
  analisesCount: number;
  items: Array<{
    id: string;
    numeroAnalise: string;
    clienteName: string;
    dataEntrada: Date;
    grams: number;
    status: string;
    ordemDeRecuperacaoId?: string | null;
    orderNumber?: string | null;
    recoveryDate?: Date | null;
    category: 'saldo_anterior' | 'entrada_mes' | 'saida_mes' | 'processado_anterior';
  }>;
}

@Injectable()
export class GetRecoveryMaterialsReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, dto?: GetRecoveryMaterialsReportDto) {
    const now = new Date();
    const start = dto?.startDate
      ? new Date(dto.startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    let end = dto?.endDate ? new Date(dto.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    const metalWhere: any = { organizationId };
    if (dto?.metalType && dto.metalType !== 'ALL') {
      metalWhere.metalType = dto.metalType;
    }

    // 1. Fetch all chemical analyses
    const analyses = await this.prisma.analiseQuimica.findMany({
      where: metalWhere,
      include: {
        cliente: { select: { name: true } },
      },
      orderBy: { dataEntrada: 'asc' },
    });

    // 2. Fetch all recovery orders for mapping dates
    const recoveryOrders = await this.prisma.recoveryOrder.findMany({
      where: { organizationId },
      select: { id: true, orderNumber: true, dataCriacao: true },
    });

    const recoveryMap = new Map<string, { orderNumber: string; dataCriacao: Date }>();
    recoveryOrders.forEach((ro) => {
      recoveryMap.set(ro.id, { orderNumber: ro.orderNumber, dataCriacao: ro.dataCriacao });
    });

    // 3. Group by material
    const materialGroupMap = new Map<string, MaterialBalanceItem>();

    for (const a of analyses) {
      const matName = (a.descricaoMaterial || 'Outros / Sem Material').trim();

      if (!materialGroupMap.has(matName)) {
        materialGroupMap.set(matName, {
          materialName: matName,
          saldoAnteriorGrams: 0,
          entradasMesGrams: 0,
          saidasMesGrams: 0,
          saldoProximoMesGrams: 0,
          analisesCount: 0,
          items: [],
        });
      }

      const group = materialGroupMap.get(matName)!;

      const grams =
        a.auLiquidoParaClienteGramas ||
        a.auEstimadoRecuperavelGramas ||
        a.auEstimadoBrutoGramas ||
        0;

      const entryDate = a.dataEntrada ? new Date(a.dataEntrada) : new Date(a.dataCriacao);
      const roInfo = a.ordemDeRecuperacaoId ? recoveryMap.get(a.ordemDeRecuperacaoId) : undefined;
      const recoveryDate = roInfo ? new Date(roInfo.dataCriacao) : null;

      let category: 'saldo_anterior' | 'entrada_mes' | 'saida_mes' | 'processado_anterior' = 'entrada_mes';

      // Check dates
      const enteredBeforePeriod = entryDate < start;
      const enteredInPeriod = entryDate >= start && entryDate <= end;
      const processedBeforePeriod = recoveryDate && recoveryDate < start;
      const processedInPeriod = recoveryDate && recoveryDate >= start && recoveryDate <= end;

      if (enteredBeforePeriod) {
        if (!processedBeforePeriod) {
          // Entered before period and wasn't processed before period => Saldo Anterior!
          category = 'saldo_anterior';
          group.saldoAnteriorGrams += grams;
        } else {
          // Processed before period => historical, ignore for current balance
          category = 'processado_anterior';
        }
      }

      if (enteredInPeriod) {
        category = 'entrada_mes';
        group.entradasMesGrams += grams;
      }

      if (processedInPeriod) {
        group.saidasMesGrams += grams;
        if (!enteredInPeriod && category !== 'saldo_anterior') {
          category = 'saida_mes';
        }
      }

      group.analisesCount += 1;
      group.items.push({
        id: a.id,
        numeroAnalise: a.numeroAnalise,
        clienteName: a.cliente?.name || 'Cliente Indefinido',
        dataEntrada: entryDate,
        grams,
        status: a.status,
        ordemDeRecuperacaoId: a.ordemDeRecuperacaoId,
        orderNumber: roInfo?.orderNumber || null,
        recoveryDate,
        category,
      });
    }

    // 4. Calculate Saldo Próximo Mês for each material
    const materials = Array.from(materialGroupMap.values()).map((mat) => {
      mat.saldoProximoMesGrams = mat.saldoAnteriorGrams + mat.entradasMesGrams - mat.saidasMesGrams;
      return mat;
    });

    const summary = {
      periodStart: start,
      periodEnd: end,
      totalMaterials: materials.length,
      totalSaldoAnteriorGrams: materials.reduce((acc, m) => acc + m.saldoAnteriorGrams, 0),
      totalEntradasMesGrams: materials.reduce((acc, m) => acc + m.entradasMesGrams, 0),
      totalSaidasMesGrams: materials.reduce((acc, m) => acc + m.saidasMesGrams, 0),
      totalSaldoProximoMesGrams: materials.reduce((acc, m) => acc + m.saldoProximoMesGrams, 0),
    };

    return {
      summary,
      materials,
    };
  }
}
