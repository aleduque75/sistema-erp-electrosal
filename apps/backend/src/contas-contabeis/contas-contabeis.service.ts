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

  async onApplicationBootstrap() {
    try {
      const orgs = await this.prisma.organization.findMany({ select: { id: true } });
      for (const org of orgs) {
        await this.syncStandardAccounts(org.id);
      }
    } catch (err) {
      console.error('Erro ao sincronizar contas contábeis padrão na inicialização:', err);
    }
  }

  async syncStandardAccounts(organizationId: string) {
    const findParent = async (codigo: string) => {
      return this.prisma.contaContabil.findFirst({ where: { organizationId, codigo } });
    };

    const pAtivoCirc = await findParent('1.1');
    const pPassivoCirc = await findParent('2.1');
    const pReceitaOper = await findParent('4.1');
    const pReceitaFin = await findParent('4.1.3');
    const pDespesasOper = await findParent('5.1');
    const pSalarios = await findParent('5.1.1');
    const pTransporte = await findParent('5.1.5');
    const pCustoRecup = await findParent('5.2.1');
    const pCustoReacao = await findParent('5.2.2');

    const singleAccounts = [
      { codigo: '1.1.8', nome: 'Adiantamentos a Fornecedores', tipo: TipoContaContabilPrisma.ATIVO, aceitaLancamento: true, parentId: pAtivoCirc?.id },
      { codigo: '2.1.7', nome: 'Adiantamentos de Clientes', tipo: TipoContaContabilPrisma.PASSIVO, aceitaLancamento: true, parentId: pPassivoCirc?.id },
      { codigo: '4.1.3.1', nome: 'Rendimentos de Aplicações Financeiras', tipo: TipoContaContabilPrisma.RECEITA, aceitaLancamento: true, parentId: pReceitaFin?.id },
      { codigo: '4.1.3.2', nome: 'Juros e Descontos Obtidos', tipo: TipoContaContabilPrisma.RECEITA, aceitaLancamento: true, parentId: pReceitaFin?.id },
      { codigo: '4.1.4', nome: 'Venda de Sucata e Resíduos', tipo: TipoContaContabilPrisma.RECEITA, aceitaLancamento: true, parentId: pReceitaOper?.id },
      { codigo: '5.1.1.6', nome: 'Salario Matheus', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pSalarios?.id },
      { codigo: '5.1.1.7', nome: 'Férias e Rescisões', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pSalarios?.id },
      { codigo: '5.1.1.8', nome: 'FGTS, INSS e Encargos Trabalhistas', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pSalarios?.id },
      { codigo: '5.1.5.4', nome: 'Combustível', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pTransporte?.id },
      { codigo: '5.1.5.5', nome: 'Estacionamento e Pedágios', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pTransporte?.id },
      { codigo: '5.1.5.6', nome: 'Manutenção de Veículos', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pTransporte?.id },
      // Recuperação (5.2.1)
      { codigo: '5.2.1.4', nome: 'Fundição, Crisóis, Maçaricos e Gases', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoRecup?.id },
      { codigo: '5.2.1.5', nome: 'Insumos Químicos e Ácidos (Nítrico, etc)', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoRecup?.id },
      { codigo: '5.2.1.8', nome: 'Laudos, Análises Químicas e Titulações', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoRecup?.id },
      { codigo: '5.2.1.9', nome: 'Bombas, Filtros e Elementos Filtrantes', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoRecup?.id },
      // Reação (5.2.2)
      { codigo: '5.2.2.3', nome: 'Insumos Químicos de Reação (Cianetos, Hidróxidos, etc)', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoReacao?.id },
      { codigo: '5.2.2.4', nome: 'Embalagens e Potes para Sais', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoReacao?.id },
      { codigo: '5.2.2.5', nome: 'Manutenção de Reatores, Exaustão e Vidrarias', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoReacao?.id },
      { codigo: '5.2.2.6', nome: 'Perdas / Falhas de Processo de Reação (Sal 68, etc)', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoReacao?.id },
      { codigo: '5.2.2.7', nome: 'EPIs e Segurança para Reação Química', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoReacao?.id },
      { codigo: '5.2.2.8', nome: 'Custos Indiretos de Reação', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true, parentId: pCustoReacao?.id },
    ];

    for (const acc of singleAccounts) {
      const existing = await this.prisma.contaContabil.findFirst({
        where: { organizationId, codigo: acc.codigo },
      });
      if (!existing) {
        await this.prisma.contaContabil.create({
          data: {
            codigo: acc.codigo,
            nome: acc.nome,
            tipo: acc.tipo,
            aceitaLancamento: acc.aceitaLancamento,
            contaPaiId: acc.parentId,
            organizationId,
          },
        });
      } else if (existing.nome !== acc.nome || !existing.aceitaLancamento) {
        await this.prisma.contaContabil.update({
          where: { id: existing.id },
          data: { nome: acc.nome, aceitaLancamento: acc.aceitaLancamento },
        });
      }
    }

    const groups = [
      {
        codigo: '5.1.15',
        nome: 'Alimentação e Refeições',
        tipo: TipoContaContabilPrisma.DESPESA,
        aceitaLancamento: false,
        parentId: pDespesasOper?.id,
        subs: [
          { codigo: '5.1.15.1', nome: 'Almoço e Refeições da Equipe', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true },
          { codigo: '5.1.15.2', nome: 'Café, Água e Copa', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true },
        ],
      },
      {
        codigo: '5.1.16',
        nome: 'Manutenção Predial e Ferramentas',
        tipo: TipoContaContabilPrisma.DESPESA,
        aceitaLancamento: false,
        parentId: pDespesasOper?.id,
        subs: [
          { codigo: '5.1.16.1', nome: 'Manutenção Predial e Reformas', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true },
          { codigo: '5.1.16.2', nome: 'Ferramentas, Balanças e Utensílios de Laboratório', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true },
          { codigo: '5.1.16.3', nome: 'Manutenção de Máquinas e Equipamentos', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true },
        ],
      },
      {
        codigo: '5.1.17',
        nome: 'Licenças, Cartório e Taxas Legais',
        tipo: TipoContaContabilPrisma.DESPESA,
        aceitaLancamento: false,
        parentId: pDespesasOper?.id,
        subs: [
          { codigo: '5.1.17.1', nome: 'Licenças Ambientais, Laudos e CETESB', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true },
          { codigo: '5.1.17.2', nome: 'Cartório e Reconhecimento de Firma', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true },
          { codigo: '5.1.17.3', nome: 'Alvarás e Taxas Municipais', tipo: TipoContaContabilPrisma.DESPESA, aceitaLancamento: true },
        ],
      },
    ];

    for (const grp of groups) {
      let parent = await this.prisma.contaContabil.findFirst({
        where: { organizationId, codigo: grp.codigo },
      });
      if (!parent) {
        parent = await this.prisma.contaContabil.create({
          data: {
            codigo: grp.codigo,
            nome: grp.nome,
            tipo: grp.tipo,
            aceitaLancamento: grp.aceitaLancamento,
            contaPaiId: grp.parentId,
            organizationId,
          },
        });
      }

      for (const sub of grp.subs) {
        const existingSub = await this.prisma.contaContabil.findFirst({
          where: { organizationId, codigo: sub.codigo },
        });
        if (!existingSub) {
          await this.prisma.contaContabil.create({
            data: {
              codigo: sub.codigo,
              nome: sub.nome,
              tipo: sub.tipo,
              aceitaLancamento: sub.aceitaLancamento,
              contaPaiId: parent.id,
              organizationId,
            },
          });
        }
      }
    }

    return { success: true, message: 'Plano de contas atualizado com sucesso.' };
  }
}
