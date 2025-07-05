// apps/backend/src/sales/sales.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Sale,
  Prisma, // Necessário para Prisma.TransactionClient e tipos de input
  ContaCorrente,
} from '@prisma/client';
// Importa AMBOS os DTOs de vendas
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { nanoid } from 'nanoid'; // Importe nanoid para gerar IDs curtos e amigáveis

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  // MÉTODO: create (cria uma nova venda)
  async create(userId: string, createSaleDto: CreateSaleDto): Promise<Sale> {
    const {
      clientId,
      items,
      paymentMethod,
      totalAmount, // Valor bruto da venda (enviado pelo frontend)
      contaContabilId,
      contaCorrenteId,
      numberOfInstallments,
      feeAmount, // Valor da taxa (enviado pelo frontend)
      netAmount, // Valor líquido (enviado pelo frontend)
    } = createSaleDto;

    // 1. Verificar Cliente
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id: clientId, userId },
    });

    // 2. Verificar Conta Contábil (Receita)
    const contaContabil = await this.prisma.contaContabil.findUnique({
      where: { id: contaContabilId, userId },
    });
    if (!contaContabil) {
      throw new NotFoundException(
        `Conta Contábil com ID ${contaContabilId} não encontrada.`,
      );
    }

    let selectedContaCorrente: ContaCorrente | null = null;
    const isInstallmentPayment =
      ['Credit Card', 'Bank Transfer'].includes(paymentMethod) &&
      numberOfInstallments &&
      numberOfInstallments > 1;

    // Carrega a Conta Corrente SOMENTE se não for pagamento parcelado
    if (!isInstallmentPayment) {
      if (!contaCorrenteId) {
        // Validação defensiva caso o frontend não envie para à vista
        throw new BadRequestException(
          'Conta Corrente é obrigatória para pagamentos à vista.',
        );
      }
      selectedContaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: contaCorrenteId, userId },
      });
      if (!selectedContaCorrente) {
        throw new NotFoundException(
          `Conta Corrente com ID ${contaCorrenteId} não encontrada.`,
        );
      }
    }

    // Validação de número de parcelas (para garantir consistência)
    if (
      isInstallmentPayment &&
      (!numberOfInstallments || numberOfInstallments <= 0)
    ) {
      throw new BadRequestException(
        'Número de parcelas é obrigatório para pagamentos parcelados.',
      );
    }
    if (
      !isInstallmentPayment &&
      numberOfInstallments &&
      numberOfInstallments > 1
    ) {
      throw new BadRequestException(
        'Número de parcelas deve ser 1 para pagamentos à vista (Dinheiro, Pix, Débito).',
      );
    }

    // 1. Obter todos os IDs de produtos e buscar as informações de uma só vez ANTES da transação
    // Isso evita múltiplas queries dentro do loop transacional e garante que os produtos existem
    const productIds = items.map((item) => item.productId);
    const productsInDb = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(productsInDb.map((p) => [p.id, p]));

    // 2. Validar estoque ANTES de iniciar a transação (melhor prática para falhas rápidas)
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(
          `Produto com ID ${item.productId} não encontrado.`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto: ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}.`,
        );
      }
    }

    // Inicia uma transação para garantir atomicidade de todas as operações no banco de dados
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Gerar um orderNumber curto e único para a venda
      // Usar nanoid, não uuidv4 (já que orderNumber é para ser curto e amigável)
      const generatedOrderNumber = nanoid(8);

      const createdSale = await tx.sale.create({
        data: {
          userId,
          clientId,
          orderNumber: generatedOrderNumber, // <-- Usando nanoid
          totalAmount, // Valor total bruto da venda
          feeAmount:
            feeAmount !== undefined && feeAmount !== null
              ? new Prisma.Decimal(feeAmount)
              : undefined, // Salvando taxa
          netAmount:
            netAmount !== undefined && netAmount !== null
              ? new Prisma.Decimal(netAmount)
              : undefined, // Salvando líquido
          // saleDate: new Date(), // REMOVIDO: Prisma preenche automaticamente com @default(now())
          paymentMethod,
          // Não criar saleItems aqui para evitar duplicação
        },
      });

      // Processar itens da venda: reduzir estoque e criar SaleItems
      const saleItemsData: Prisma.SaleItemCreateManyInput[] = [];
      for (const item of items) {
        // O produto já foi validado e carregado em productMap antes da transação
        const product = productMap.get(item.productId)!; // ! para garantir que existe

        // Reduzir estoque
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });

        // Registrar movimento de estoque
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: 'OUT',
            quantity: item.quantity,
          },
        });

        saleItemsData.push({
          saleId: createdSale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price, // Preço unitário no momento da venda (do payload)
        });
      }

      await tx.saleItem.createMany({
        data: saleItemsData,
      });

      // Lógica de Lançamento Financeiro: À vista vs. Parcelado
      if (!isInstallmentPayment) {
        // Pagamento à vista (Dinheiro, Pix, Débito)
        // 1. Lançamento na Conta Corrente e Transação de Entrada de Caixa/Banco
        await tx.transacao.create({
          data: {
            userEnvolvido: { connect: { id: userId } },
            tipo: 'CREDITO',
            valor: new Prisma.Decimal(netAmount || totalAmount), // Valor que realmente entra
            moeda: selectedContaCorrente!.moeda,
            descricao: `Venda #${createdSale.orderNumber} - Cliente: ${client.name} (À Vista)`,
            contaContabil: { connect: { id: contaContabilId } }, // Conta Contábil de Receita
            contaCorrente: { connect: { id: selectedContaCorrente!.id } }, // Conta Corrente onde o dinheiro entrou
          },
        });

        // 2. Atualizar saldo da conta corrente
        await tx.contaCorrente.update({
          where: { id: selectedContaCorrente!.id },
          data: {
            saldo: {
              increment: new Prisma.Decimal(netAmount || totalAmount),
            },
          },
        });
      } else {
        // Pagamento Parcelado (Cartão de Crédito, Transferência Bancária com parcelas)
        // 1. Gerar registros no Contas a Receber (AccountRec)
        // As parcelas são baseadas no VALOR LÍQUIDO, pois é o que a empresa receberá
        const installmentAmount =
          (netAmount || totalAmount) / (numberOfInstallments || 1);
        const today = new Date();
        const accountsRecToCreate: Prisma.AccountRecCreateManyInput[] = [];

        for (let i = 0; i < (numberOfInstallments || 1); i++) {
          const dueDate = new Date(
            today.getFullYear(),
            today.getMonth() + i + 1, // Vence no mês seguinte
            today.getDate(),
          );

          accountsRecToCreate.push({
            userId,
            description: `Venda #${createdSale.orderNumber} - Cliente: ${client.name} - Parcela ${i + 1}/${numberOfInstallments}`,
            amount: new Prisma.Decimal(installmentAmount),
            dueDate,
            received: false,
          });
        }
        await tx.accountRec.createMany({
          data: accountsRecToCreate,
        });

        // 2. Lançamento na Conta Contábil de Receita (apenas para pagamentos parcelados)
        // Representa o reconhecimento da receita pelo VALOR BRUTO da venda no momento da venda.
        await tx.transacao.create({
          data: {
            userEnvolvido: { connect: { id: userId } },
            tipo: 'CREDITO',
            valor: new Prisma.Decimal(totalAmount), // Reconhecimento da receita é o valor bruto
            moeda: 'BRL', // Moeda padrão para reconhecimento de receita quando não há CC imediata
            descricao: `Venda #${createdSale.orderNumber} - Reconhecimento de Receita`,
            contaContabil: { connect: { id: contaContabilId } },
            // Conta corrente é omitida.
          },
        });
      }

      return createdSale; // Retorna a venda recém-criada
    });
  }

  // MÉTODO: findAll (lista todas as vendas do usuário, com filtro de pesquisa opcional)
  async findAll(userId: string, search?: string): Promise<Sale[]> {
    const whereClause: any = { userId };

    if (search) {
      whereClause.client = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    return this.prisma.sale.findMany({
      where: whereClause,
      include: { client: true },
    });
  }

  // MÉTODO: findOne (encontra uma venda específica por ID para o usuário)
  async findOne(userId: string, id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id, userId },
      include: { client: true, saleItems: { include: { product: true } } },
    });
    if (!sale) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }
    return sale;
  }

  // MÉTODO: update (atualiza uma venda existente)
  async update(
    userId: string,
    id: string,
    updateSaleDto: UpdateSaleDto,
  ): Promise<Sale> {
    const existingSale = await this.prisma.sale.findUnique({
      where: { id, userId },
    });
    if (!existingSale) {
      throw new NotFoundException(
        `Venda com ID ${id} não encontrada para o usuário.`,
      );
    }

    return this.prisma.sale.update({
      where: { id },
      data: {
        paymentMethod: updateSaleDto.paymentMethod,
        totalAmount: updateSaleDto.totalAmount,
      },
    });
  }

  // MÉTODO: remove (exclui uma venda)
  async remove(userId: string, id: string): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id, userId },
    });
    if (!sale) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }

    await this.prisma.saleItem.deleteMany({
      where: { saleId: id },
    });

    return this.prisma.sale.delete({
      where: { id },
    });
  }
}
