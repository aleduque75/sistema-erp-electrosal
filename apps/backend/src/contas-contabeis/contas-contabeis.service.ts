import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContaContabilDto,
  UpdateContaContabilDto,
} from './dtos/contas-contabeis.dto';

@Injectable()
export class ContasContabeisService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateContaContabilDto) {
    const proximoCodigo = await this.getNextCodigo(userId, data.contaPaiId);
    const finalData = {
      ...data,
      userId,
      codigo: proximoCodigo.proximoCodigo,
    };

    return this.prisma.contaContabil.create({ data: finalData });
  }

  async findAll(userId: string, tipo?: 'RECEITA' | 'DESPESA') {
    const where: any = { userId };

    // Se um tipo for especificado (vindo do form de transação), filtramos
    // apenas as contas que podem receber lançamentos daquele tipo.
    if (tipo) {
      where.aceitaLancamento = true;
      if (tipo === 'RECEITA') {
        where.tipo = { in: ['RECEITA', 'PASSIVO', 'PATRIMONIO_LIQUIDO'] };
      } else if (tipo === 'DESPESA') {
        where.tipo = { in: ['DESPESA', 'ATIVO'] };
      }
    } // Se nenhum tipo for passado (vindo da tela do plano de contas), não adiciona filtros extras.

    return this.prisma.contaContabil.findMany({
      where,
      orderBy: { codigo: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const conta = await this.prisma.contaContabil.findFirst({
      where: { id, userId },
    });
    if (!conta) {
      throw new NotFoundException(
        `Conta contábil com ID ${id} não encontrada.`,
      );
    }
    return conta;
  }

  async update(userId: string, id: string, data: UpdateContaContabilDto) {
    await this.findOne(userId, id);
    return this.prisma.contaContabil.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    const subContasCount = await this.prisma.contaContabil.count({
      where: { contaPaiId: id },
    });
    if (subContasCount > 0) {
      throw new ConflictException(
        'Esta conta não pode ser removida pois possui sub-contas.',
      );
    }
    const transacoesCount = await this.prisma.transacao.count({
      where: { contaContabilId: id },
    });
    if (transacoesCount > 0) {
      throw new ConflictException(
        'Esta conta não pode ser removida pois possui transações associadas.',
      );
    }
    return this.prisma.contaContabil.delete({ where: { id } });
  }
  async getNextCodigo(
    userId: string,
    contaPaiId?: string,
  ): Promise<{ proximoCodigo: string }> {
    let proximoCodigo: string;

    if (contaPaiId) {
      // Lógica para subcontas
      const contaPai = await this.prisma.contaContabil.findUnique({
        where: { id: contaPaiId },
      });
      if (!contaPai) throw new NotFoundException('Conta pai não encontrada.');

      const irmaos = await this.prisma.contaContabil.findMany({
        where: { userId, contaPaiId },
        select: { codigo: true },
      });

      if (irmaos.length === 0) {
        proximoCodigo = `${contaPai.codigo}.1`;
      } else {
        const ultimosSegmentos = irmaos.map((c) =>
          parseInt(c.codigo.split('.').pop() || '0', 10),
        );
        const maiorSegmento = Math.max(...ultimosSegmentos);
        proximoCodigo = `${contaPai.codigo}.${maiorSegmento + 1}`;
      }
    } else {
      // Lógica para contas raiz
      const contasRaiz = await this.prisma.contaContabil.findMany({
        where: { userId, contaPaiId: null },
        select: { codigo: true },
      });
      if (contasRaiz.length === 0) {
        proximoCodigo = '1';
      } else {
        const codigosRaiz = contasRaiz.map((c) =>
          parseInt(c.codigo.split('.')[0], 10),
        );
        const maiorCodigo = Math.max(...codigosRaiz);
        proximoCodigo = (maiorCodigo + 1).toString();
      }
    }

    return { proximoCodigo }; // Retorna um objeto para consistência
  }
}
