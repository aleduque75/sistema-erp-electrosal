import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, startOfMonth, endOfMonth, format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TipoMetal, ContaCorrenteType } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(organizationId: string) {
    const now = new Date();
    const [products, accountsPay, accountsRec, salesSummary, inventoryLots, todayQuotation] = await Promise.all([
      this.prisma.product.findMany({
        where: { organizationId },
        select: { id: true, price: true },
      }),
      this.prisma.accountPay.aggregate({
        where: { organizationId, paid: false },
        _sum: { amount: true },
      }),
      this.prisma.accountRec.aggregate({
        where: { organizationId, received: false },
        _sum: { amount: true },
      }),
      this.prisma.sale.aggregate({
        where: { organizationId, status: { not: 'CANCELADO' } },
        _sum: { totalAmount: true, goldValue: true },
      }),
      this.prisma.inventoryLot.findMany({
        where: { organizationId, remainingQuantity: { gt: 0 } },
        select: { productId: true, remainingQuantity: true, costPrice: true },
      }),
      this.prisma.quotation.findFirst({
        where: {
          organizationId,
          metal: TipoMetal.AU,
          date: {
            gte: startOfDay(now),
            lte: endOfDay(now),
          },
        },
      }),
    ]);

    const totalStockValue = inventoryLots.reduce((sum, lot) => {
      return sum + lot.remainingQuantity * lot.costPrice.toNumber();
    }, 0);

    return {
      totalProducts: products.length,
      totalAccountsPay: accountsPay._sum.amount?.toNumber() || 0,
      totalAccountsRec: accountsRec._sum.amount?.toNumber() || 0,
      totalStockValue: totalStockValue,
      totalSalesBRL: salesSummary._sum.totalAmount?.toNumber() || 0,
      totalSalesAu: salesSummary._sum.goldValue?.toNumber() || 0,
      todayQuotationRegistered: !!todayQuotation,
    };
  }

  async getAccountsPayStatus(organizationId: string) {
    const statusCounts = await this.prisma.accountPay.groupBy({
      by: ['paid'],
      where: { organizationId }, // Usa organizationId
      _count: { paid: true },
    });

    const paid = statusCounts.find((c) => c.paid === true)?._count.paid || 0;
    const pending =
      statusCounts.find((c) => c.paid === false)?._count.paid || 0;

    return [
      { name: 'Pagas', value: paid },
      { name: 'Pendentes', value: pending },
    ];
  }

  async getCashFlowSummary(organizationId: string) {
    const now = new Date();
    const monthsData: { month: string; incomes: number; expenses: number }[] =
      [];

    for (let i = 5; i >= 0; i--) {
      const date = addMonths(now, -i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const totalIncomes = await this.prisma.accountRec.aggregate({
        where: {
          organizationId,
          received: true,
          receivedAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      const totalExpenses = await this.prisma.transacao.aggregate({
        where: {
          organizationId,
          tipo: 'DEBITO',
          dataHora: { gte: start, lte: end },
        },
        _sum: { valor: true },
      });

      monthsData.push({
        month: format(date, 'MMM/yyyy'),
        incomes: totalIncomes._sum.amount?.toNumber() || 0,
        expenses: totalExpenses._sum.valor?.toNumber() || 0,
      });
    }
    return monthsData;
  }

  async getCreditCardExpensesByMonth(organizationId: string) {
    // Implementação placeholder
    return [];
  }

  async getThirdPartyLoansSummary(organizationId: string) {
    const thirdPartyLoansAccount = await this.prisma.contaContabil.findFirst({
      where: {
        organizationId,
        codigo: '1.1.4', // Código para Empréstimos e Adiantamentos a Terceiros
      },
    });

    if (!thirdPartyLoansAccount) {
      return { totalAmount: 0 };
    }

    const totalDebits = await this.prisma.transacao.aggregate({
      where: {
        organizationId,
        contaContabilId: thirdPartyLoansAccount.id,
        tipo: 'DEBITO',
      },
      _sum: { valor: true },
    });

    const totalCredits = await this.prisma.transacao.aggregate({
      where: {
        organizationId,
        contaContabilId: thirdPartyLoansAccount.id,
        tipo: 'CREDITO',
      },
      _sum: { valor: true },
    });

    const netBalance = (totalDebits._sum.valor?.toNumber() || 0) - (totalCredits._sum.valor?.toNumber() || 0);

    return { totalAmount: netBalance };
  }

  async getFinancialSummaryByPeriod(organizationId: string) {
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: { not: 'CANCELADO' },
        goldValue: { gt: 0 },
      },
      select: {
        createdAt: true,
        goldValue: true,
        adjustment: {
          select: {
            netDiscrepancyGrams: true,
          },
        },
      },
    });

    const expenses = await this.prisma.transacao.findMany({
      where: {
        organizationId,
        tipo: 'DEBITO',
        goldAmount: { gt: 0 },
        contaContabil: {
          tipo: 'DESPESA',
        },
      },
      select: {
        dataHora: true,
        goldAmount: true,
      },
    });

    const getMonth = (date: Date) => format(date, 'yyyy-MM');
    const getQuarter = (date: Date) => `T${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    const getSemester = (date: Date) => `S${Math.floor(date.getMonth() / 6) + 1} ${date.getFullYear()}`;

    const aggregate = (
      data: any[],
      dateSelector: (d: any) => Date,
      valueSelectors: { [key: string]: (d: any) => number },
      periodFn: (d: Date) => string
    ) => {
      return data.reduce((acc, item) => {
        const period = periodFn(dateSelector(item));
        if (!acc[period]) {
          acc[period] = {};
        }
        for (const key in valueSelectors) {
          const value = valueSelectors[key](item);
          acc[period][key] = (acc[period][key] || 0) + value;
        }
        return acc;
      }, {} as Record<string, { [key: string]: number }>);
    };

    const processPeriod = (periodFn: (d: Date) => string) => {
      const salesData = aggregate(
        sales,
        s => s.createdAt,
        {
          sales: s => s.goldValue?.toNumber() || 0,
          profit: s => s.adjustment?.netDiscrepancyGrams?.toNumber() || 0,
        },
        periodFn
      );
      const expenseData = aggregate(
        expenses,
        e => e.dataHora,
        { expenses: e => e.goldAmount?.toNumber() || 0 },
        periodFn
      );

      const allPeriods = [...Object.keys(salesData), ...Object.keys(expenseData)];
      const uniquePeriods = [...new Set(allPeriods)];

      return uniquePeriods
        .map(period => {
          const totalSalesGold = salesData[period]?.sales || 0;
          const totalProfitGold = salesData[period]?.profit || 0;
          const totalExpensesGold = expenseData[period]?.expenses || 0;
          
          return {
            period,
            totalSalesGold,
            totalExpensesGold,
            totalProfitGold: totalProfitGold,
          }
        })
        .sort((a, b) => a.period.localeCompare(b.period));
    };

    return {
      monthly: processPeriod(getMonth).map(p => ({ ...p, period: format(new Date(p.period.replace(/-/g, '/')), 'MMM/yy', { locale: ptBR }) })),
      quarterly: processPeriod(getQuarter),
      semiannual: processPeriod(getSemester),
    };
  }

  async getGoldBalanceSheet(organizationId: string) {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    // 1. Cotação do Dia (para conversões eventuais, se necessário)
    const marketData = await this.prisma.marketData.findUnique({
      where: {
        organizationId_date: {
          organizationId,
          date: startOfDay(now),
        },
      },
    });
    const usdPrice = Number(marketData?.usdPrice) || 0;
    // Preço grama Ouro em BRL
    const goldPriceBrl = marketData?.goldTroyPrice ? (Number(marketData.goldTroyPrice) / 31.1035) * usdPrice : 0;

    // 2. Vendas do Mês em Au (Por Produto) - Lógica Híbrida (Real vs Estimado)
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: { not: 'CANCELADO' },
        createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      include: {
        saleItems: {
            select: {
                productId: true,
                quantity: true,
                price: true,
                costPriceAtSale: true,
                laborPercentage: true, // Se disponível
            }
        },
        adjustment: true,
      }
    });

    const salesGrouped = {} as Record<string, { quantity: number; totalBrl: number; totalProfitAu: number }>;

    for (const sale of sales) {
        let saleProfitAu = 0;
        const totalSaleBrl = sale.saleItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

        // Decisão: Lucro Real vs Estimado
        // Se a venda está FINALIZADA, assumimos que o ajuste financeiro está consolidado (Lucro Real).
        // Se não (PENDENTE, CONFIRMADO, A_SEPARAR), é uma venda em aberto. Mostramos o Lucro Potencial (Estimado).
        
        const adjustment = sale.adjustment;
        const realProfit = adjustment?.netDiscrepancyGrams?.toNumber();
        const isFinalized = sale.status === 'FINALIZADO';

        if (isFinalized && realProfit !== undefined) { 
             saleProfitAu = realProfit;
        } else {
            // Venda em Aberto -> Calcular Lucro Estimado (Potencial) baseado em BRL convertido
            let totalCostBrl = 0;
            for (const item of sale.saleItems) {
                 const cost = Number(item.costPriceAtSale || 0);
                 const price = Number(item.price);
                 
                 // Lógica defensiva: Se custo > preço, muito provável que seja erro de unidade (Custo 100% vs Preço Teor%).
                 // Aplicamos fator 0.68 (comum para sais) ou 0.99 (padrão) se não soubermos.
                 // Para ser seguro: se custo > preço, usamos o preço * 0.9 (margem 10%) como custo "teto" para não mostrar prejuízo absurdo em projeção,
                 // OU mantemos a lógica do 0.68 se for gritante.
                 
                 let adjustedCost = cost;
                 if (cost > price) {
                    adjustedCost = cost * 0.68; // Tentativa de correção de teor
                    // Se ainda assim for maior, clamp no preço (lucro zero) para não poluir o dash com negativo falso
                    if (adjustedCost > price) adjustedCost = price; 
                 }
                 
                 totalCostBrl += adjustedCost * item.quantity;
            }
            
            saleProfitAu = goldPriceBrl > 0 ? (totalSaleBrl - totalCostBrl) / goldPriceBrl : 0;
        }

        // Rateio do Lucro por Item (ponderado pelo valor total em BRL)
        for (const item of sale.saleItems) {
            const itemTotalBrl = Number(item.price) * item.quantity;
            const ratio = totalSaleBrl > 0 ? itemTotalBrl / totalSaleBrl : 0;
            const itemProfitAu = saleProfitAu * ratio;

            if (!salesGrouped[item.productId]) {
                salesGrouped[item.productId] = { quantity: 0, totalBrl: 0, totalProfitAu: 0 };
            }
            
            salesGrouped[item.productId].quantity += item.quantity;
            salesGrouped[item.productId].totalBrl += itemTotalBrl;
            salesGrouped[item.productId].totalProfitAu += itemProfitAu;
        }
    }

    const productIds = Object.keys(salesGrouped);
    const productsDetails = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const salesByProduct = productIds.map(productId => {
      const product = productsDetails.find(p => p.id === productId);
      const data = salesGrouped[productId];
      // Conversão: Valor Total BRL / Cotação Ouro Hoje
      const totalAu = goldPriceBrl > 0 ? data.totalBrl / goldPriceBrl : 0;
      
      return {
        productName: product?.name || 'Desconhecido',
        quantity: data.quantity,
        totalAu,
        profitAu: data.totalProfitAu, // Já calculado e acumulado
      };
    });

    // ... (saldos contas - mantido igual) ...
    // Helper para calcular saldo de contas por tipo
    const getBalanceByType = async (types: ContaCorrenteType[]) => {
      // @ts-ignore
      const accounts = await this.prisma.contaCorrente.findMany({
        where: { organizationId, type: { in: types }, isActive: true }, 
        select: { id: true, nome: true, initialBalanceBRL: true, initialBalanceGold: true },
      });

      let totalBalance = 0;
      const accountDetails: { name: string; balanceAu: number; originalBalance: string }[] = [];

      for (const acc of accounts) {
        // Créditos somam, Débitos subtraem
        const credits = await this.prisma.transacao.aggregate({
            where: { contaCorrenteId: acc.id, tipo: 'CREDITO' },
            _sum: { goldAmount: true, valor: true }
        });
        const debits = await this.prisma.transacao.aggregate({
            where: { contaCorrenteId: acc.id, tipo: 'DEBITO' },
            _sum: { goldAmount: true, valor: true }
        });

        // Saldo em Au (Nativo + Transações Au)
        const saldoAu = Number(acc.initialBalanceGold) + (Number(credits._sum.goldAmount) || 0) - (Number(debits._sum.goldAmount) || 0);
        
        // Saldo em BRL (Nativo + Transações BRL)
        const saldoBrl = Number(acc.initialBalanceBRL) + (Number(credits._sum.valor) || 0) - (Number(debits._sum.valor) || 0);

        // Lógica de Unificação: Evitar dupla contagem
        // Se a conta tem saldo em Ouro registrado, assumimos que ele é a "verdade" em metal.
        // Se não tem (é puramente fiat), convertemos o BRL.
        let totalAccountAu = 0;
        if (Math.abs(saldoAu) > 0.001) {
            totalAccountAu = saldoAu;
        } else {
            totalAccountAu = goldPriceBrl > 0 ? saldoBrl / goldPriceBrl : 0;
        }
        
        totalBalance += totalAccountAu;

        accountDetails.push({
            name: acc.nome,
            balanceAu: totalAccountAu,
            originalBalance: `Au: ${saldoAu.toFixed(4)} | R$: ${saldoBrl.toFixed(2)}`
        });
      }
      return { total: totalBalance, details: accountDetails };
    };

    const caixaBancos = await getBalanceByType([ContaCorrenteType.BANCO]); 
    const fornecedoresMetal = await getBalanceByType([ContaCorrenteType.FORNECEDOR_METAL]);
    const emprestimos = await getBalanceByType([ContaCorrenteType.EMPRESTIMO]);

    // 4. Clientes a Receber em Au - Detalhado (AccountRec + Contas Correntes de Clientes)
    const accountsRec = await this.prisma.accountRec.findMany({
        where: { organizationId, received: false },
        select: {
            goldAmount: true,
            sale: {
                select: {
                    pessoa: { select: { name: true } }
                }
            }
        }
    });

    let clientesAReceberAuTotal = 0;
    const clientesAReceberDetails: { name: string; balanceAu: number }[] = [];

    // 4.1. Agrupar AccountRec por Cliente (para não poluir a lista com cada boleto)
    const titulosPorCliente = new Map<string, number>();
    for (const acc of accountsRec) {
        const amount = Number(acc.goldAmount) || 0;
        const clientName = acc.sale?.pessoa?.name || 'Cliente Desconhecido';
        titulosPorCliente.set(clientName, (titulosPorCliente.get(clientName) || 0) + amount);
        clientesAReceberAuTotal += amount;
    }

    for (const [name, amount] of titulosPorCliente.entries()) {
        if (amount > 0.001) {
            clientesAReceberDetails.push({ name: `${name} (Títulos)`, balanceAu: amount });
        }
    }

    // 4.2. Adicionar Contas Correntes de Clientes Separadamente
    const contasClientes = await getBalanceByType([ContaCorrenteType.CLIENTE]);
    
    for (const acc of contasClientes.details) {
        // Inverte sinal: Saldo Negativo na conta = Valor Positivo a Receber
        const valorAReceber = -acc.balanceAu; 
        clientesAReceberAuTotal += valorAReceber;

        // Mostra tanto devedores (valor > 0) quanto credores (valor < 0, adiantamentos)
        // O usuário pediu para "desagrupar", então mostrar tudo é mais transparente.
        // Mas para "Clientes a Receber", geralmente mostramos quem deve.
        // Se o valor for negativo (nós devemos), mostramos mesmo assim? 
        // Sim, para bater com o total líquido.
        if (Math.abs(valorAReceber) > 0.001) {
             clientesAReceberDetails.push({ name: `${acc.name} (Conta)`, balanceAu: valorAReceber });
        }
    }
    
    clientesAReceberDetails.sort((a, b) => b.balanceAu - a.balanceAu);

    // 5. Estoque de Produtos em Au - Convertendo Custo BRL para Au
    const inventory = await this.prisma.inventoryLot.findMany({
        where: { organizationId, remainingQuantity: { gt: 0 } },
        include: { product: true }
    });
    
    let estoqueProdutosAu = 0;
    const estoqueProdutosDetalhado = inventory.map(lot => {
        const totalBrl = lot.remainingQuantity * Number(lot.costPrice);
        const totalAu = goldPriceBrl > 0 ? totalBrl / goldPriceBrl : 0;
        
        estoqueProdutosAu += totalAu;
        return {
            productName: lot.product.name,
            quantity: lot.remainingQuantity,
            unitGoldValue: goldPriceBrl > 0 ? Number(lot.costPrice) / goldPriceBrl : 0, // Valor unitário em Au estimado
            totalAu: totalAu
        };
    });

    // 6. Metais em Estoque (Puro, Cesto, Destilado)
    // Refatorado para separar AU e AG e converter AG -> AU
    const pureMetalLots = await this.prisma.pure_metal_lots.findMany({
        where: { organizationId, status: { not: 'USED' } },
        select: { metalType: true, remainingGrams: true, description: true, sourceType: true, notes: true }
    });

    let stockAuPuro = 0;
    let stockAgPuro = 0;

    const breakdown = {
      reacao: { cesto: 0, destilado: 0, geral: 0 },
      cliente: 0,
      recuperacao: 0,
      fornecedor: 0,
      outros: 0
    };

    for (const lot of pureMetalLots) {
        if (lot.metalType === TipoMetal.AU) {
            stockAuPuro += lot.remainingGrams;

            // Categorização da Origem
            const type = lot.sourceType;
            const desc = (lot.description?.toLowerCase() || '') + ' ' + (lot.notes?.toLowerCase() || '');

            if (type === 'REACTION_LEFTOVER' || type === 'CHEMICAL_REACTION') {
                if (desc.includes('cesto')) {
                    breakdown.reacao.cesto += lot.remainingGrams;
                } else if (desc.includes('destilado')) {
                    breakdown.reacao.destilado += lot.remainingGrams;
                } else {
                    breakdown.reacao.geral += lot.remainingGrams;
                }
            } else if (['SALE', 'METAL_RECEIVABLE', 'PAYMENT', 'CLIENT_DEPOSIT', 'TROCA', 'PAGAMENTO_PEDIDO_CLIENTE'].includes(type)) {
                breakdown.cliente += lot.remainingGrams;
            } else if (type === 'RECOVERY_ORDER') {
                breakdown.recuperacao += lot.remainingGrams;
            } else if (['PURCHASE_ORDER', 'SUPPLIER_DEPOSIT', 'SUPPLIER_ACCOUNT_TRANSFER'].includes(type)) {
                breakdown.fornecedor += lot.remainingGrams;
            } else {
                breakdown.outros += lot.remainingGrams;
            }

        } else if (lot.metalType === TipoMetal.AG) {
            stockAgPuro += lot.remainingGrams;
        }
    }

    // Preços em BRL por grama (aproximados) - já calculados no início
    // const usdPrice = Number(marketData?.usdPrice) || 0;
    // const goldPriceBrl = marketData?.goldTroyPrice ? (Number(marketData.goldTroyPrice) / 31.1035) * usdPrice : 0;
    const silverPriceBrl = marketData?.silverTroyPrice ? (Number(marketData.silverTroyPrice) / 31.1035) * usdPrice : 0;

    let stockAgConvertedToAu = 0;
    if (stockAgPuro > 0 && goldPriceBrl > 0 && silverPriceBrl > 0) {
        const totalAgValueBrl = stockAgPuro * silverPriceBrl;
        stockAgConvertedToAu = totalAgValueBrl / goldPriceBrl;
    }

    // Cestos e Destilados (Raw Materials)
    const rawMaterials = await this.prisma.rawMaterial.findMany({
        where: { 
            organizationId, 
            stock: { gt: 0 },
            OR: [{ name: { contains: 'Cesto', mode: 'insensitive' } }, { name: { contains: 'Destilado', mode: 'insensitive' } }]
        }
    });
    
    const metaisEmEstoque = {
        puro: stockAuPuro,
        puroBreakdown: breakdown, // Adicionado breakdown
        prataOriginal: stockAgPuro,
        prataConvertidaAu: stockAgConvertedToAu,
        outros: rawMaterials.map(rm => ({ name: rm.name, quantity: rm.stock || 0 }))
    };
    
    // Total considera Au Puro + Prata convertida
    const metaisEmEstoqueAuTotal = stockAuPuro + stockAgConvertedToAu; 

    // 7. Fechamento Geral
    // Fórmula: Caixa/Bancos + Clientes + Estoque Produtos + Estoque Metais + Fornecedores + Empréstimos
    // Nota: Fornecedores e Empréstimos já devem vir com sinal negativo do cálculo de saldo se forem passivos.
    // Se o saldo calculado acima (getBalanceByType) for positivo para um fornecedor, significa que ELES nos devem. Se negativo, NÓS devemos.
    // A soma algébrica direta deve funcionar.

    const totalPatrimonioAu = 
        caixaBancos.total + 
        clientesAReceberAuTotal + // Atualizado
        estoqueProdutosAu + 
        metaisEmEstoqueAuTotal + 
        fornecedoresMetal.total + 
        emprestimos.total;

    return {
        salesThisMonth: salesByProduct,
        balances: {
            caixaBancos: caixaBancos.total,
            caixaBancosDetails: caixaBancos.details,
            fornecedores: fornecedoresMetal.total,
            fornecedoresDetails: fornecedoresMetal.details,
            emprestimos: emprestimos.total,
            emprestimosDetails: emprestimos.details,
            clientesAReceber: clientesAReceberAuTotal, // Atualizado
            clientesAReceberDetails: clientesAReceberDetails,
        },
        stock: {
            products: estoqueProdutosAu,
            productsDetails: estoqueProdutosDetalhado,
            metals: metaisEmEstoqueAuTotal,
            metalsDetails: metaisEmEstoque
        },
        totalPatrimonioAu
    };
  }

  async getTransactionsByPeriod(organizationId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [salesResults, expenses] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          organizationId,
          status: { not: 'CANCELADO' },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          orderNumber: true,
          createdAt: true,
          goldValue: true,
          adjustment: {
            select: {
              netDiscrepancyGrams: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.transacao.findMany({
        where: {
          organizationId,
          tipo: 'DEBITO',
          dataHora: {
            gte: start,
            lte: end,
          },
          contaContabil: {
            tipo: 'DESPESA',
          },
        },
        select: {
          descricao: true,
          dataHora: true,
          goldAmount: true,
        },
        orderBy: {
          dataHora: 'desc',
        },
      }),
    ]);

    const sales = salesResults.map(sale => {
      const profitGold = sale.adjustment?.netDiscrepancyGrams?.toNumber() || 0;
      return { ...sale, profitGold };
    });

    return { sales, expenses };
  }
}
