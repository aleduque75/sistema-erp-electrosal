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
import { Prisma, TipoContaContabilPrisma } from '@prisma/client'; // Adicionado Prisma

@Injectable()
export class ContasContabeisService {
  constructor(private prisma: PrismaService) {}

  // Recebe organizationId
  async create(organizationId: string, data: CreateContaContabilDto) {
    const { contaPaiId, codigo, ...restOfData } = data; // Extrai o campo opcional

    let finalCodigo: string;

    if (codigo && codigo.length > 0) { // Se o código foi fornecido e não é vazio
      // Se o código foi fornecido, verifica se já existe
      const existingConta = await this.prisma.contaContabil.findUnique({
        where: { organizationId_codigo: { organizationId, codigo } },
      });
      if (existingConta) {
        throw new ConflictException(`Já existe uma conta contábil com o código '${codigo}' nesta organização.`);
      }
      finalCodigo = codigo;
    } else {
      // Se o código não foi fornecido, gera o próximo
      const proximoCodigo = await this.getNextCodigo(organizationId, contaPaiId);
      finalCodigo = proximoCodigo.proximoCodigo;
    }

    const createData: Prisma.ContaContabilCreateInput = {
      codigo: finalCodigo,
      nome: restOfData.nome,
      tipo: restOfData.tipo,
      aceitaLancamento: restOfData.aceitaLancamento,
      organization: { connect: { id: organizationId } },
    };

    if (contaPaiId) {
      createData.contaPai = { connect: { id: contaPaiId } };
    }

    return this.prisma.contaContabil.create({ data: createData });
  }

  // Recebe organizationId e o filtro 'tipo'
  async findAll(organizationId: string, tipo?: 'RECEITA' | 'DESPESA') {
    const where: Prisma.ContaContabilWhereInput = {
      organizationId,
    };

    if (tipo === 'RECEITA') {
      // Para Receitas, a contrapartida é geralmente uma conta de Receita.
      where.tipo = { in: ['RECEITA'] };
    } else if (tipo === 'DESPESA') {
      // 👇 CORREÇÃO AQUI 👇
      // Para Despesas, a contrapartida pode ser uma Despesa ou um Passivo.
      where.tipo = { in: ['DESPESA', 'PASSIVO'] };
    }

    return this.prisma.contaContabil.findMany({
      where,
      orderBy: { codigo: 'asc' },
    });
  }

  // Recebe organizationId
  async findOne(organizationId: string, id: string) {
    const conta = await this.prisma.contaContabil.findFirst({
      where: { id, organizationId },
    });
    if (!conta) {
      throw new NotFoundException(
        `Conta contábil com ID ${id} não encontrada.`,
      );
    }
    return conta;
  }

  async findByCodigo(organizationId: string, codigo: string) {
    const conta = await this.prisma.contaContabil.findFirst({
      where: { organizationId, codigo },
    });
    if (!conta) {
      throw new NotFoundException(
        `Conta contábil com código ${codigo} não encontrada.`,
      );
    }
    return conta;
  }

  // Recebe organizationId
  async update(
    organizationId: string,
    id: string,
    data: UpdateContaContabilDto,
  ) {
    await this.findOne(organizationId, id); // Garante que a conta pertence à organização
    return this.prisma.contaContabil.update({ where: { id }, data });
  }

  // Recebe organizationId
  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id); // Garante a posse antes de deletar

    // As verificações de integridade continuam as mesmas
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

  // Recebe organizationId
  async getNextCodigo(
    organizationId: string,
    contaPaiId?: string,
  ): Promise<{ proximoCodigo: string }> {
    let proximoCodigo: string;

    if (contaPaiId) {
      // Lógica para subcontas
      const contaPai = await this.findOne(organizationId, contaPaiId); // Já checa a posse

      const irmaos = await this.prisma.contaContabil.findMany({
        where: { organizationId, contaPaiId },
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
        where: { organizationId, contaPaiId: null },
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

    return { proximoCodigo };
  }
}
