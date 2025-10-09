import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContaCorrenteType, TipoTransacaoPrisma } from '@prisma/client';
import { exec } from 'child_process';
import { SalesService } from '../sales/sales.service';
import { Decimal } from '@prisma/client/runtime/library';

import { ImportProductsUseCase } from './import-products.use-case';

@Injectable()
export class JsonImportsService {
  private readonly logger = new Logger(JsonImportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
    private readonly importProductsUseCase: ImportProductsUseCase,
  ) {}

  async resetAndSeed(): Promise<{ message: string }> {
    this.logger.warn('Iniciando o processo de RESET e SEED do banco de dados...');

    // 1. Limpar todas as tabelas na ordem correta para evitar erros de constraint
    await this.prisma.chemical_reactions.deleteMany({});
    await this.prisma.pure_metal_lots.deleteMany({});
    await this.prisma.metalAccountEntry.deleteMany({});
    await this.prisma.metalAccount.deleteMany({});
    await this.prisma.creditCardTransaction.deleteMany({});
    await this.prisma.metalReceivablePayment.deleteMany();
    await this.prisma.metalReceivable.deleteMany();
    await this.prisma.saleInstallment.deleteMany();
    await this.prisma.saleItem.deleteMany({});
    await this.prisma.purchaseOrderItem.deleteMany({});
    await this.prisma.stockMovement.deleteMany({});
    await this.prisma.accountPay.deleteMany({});
    await this.prisma.accountRec.deleteMany({});
    await this.prisma.transacao.deleteMany({});
    await this.prisma.inventoryLot.deleteMany({});
    await this.prisma.recuperacao.deleteMany({});
    await this.prisma.metalCredit.deleteMany({});
    await this.prisma.recoveryOrder.deleteMany({});
    await this.prisma.analiseQuimica.deleteMany({});
    await this.prisma.saleAdjustment.deleteMany({}); // Adicionado para corrigir a ordem
    await this.prisma.sale.deleteMany({});
    await this.prisma.purchaseOrder.deleteMany({});
    await this.prisma.creditCardBill.deleteMany({});
    await this.prisma.creditCard.deleteMany({});
    await this.prisma.product.deleteMany({});
    await this.prisma.productGroup.deleteMany({});
    await this.prisma.contaCorrente.deleteMany({});
    await this.prisma.contaContabil.deleteMany({});
    await this.prisma.paymentTerm.deleteMany({});
    await this.prisma.creditCardFee.deleteMany({});
    await this.prisma.xmlImportLog.deleteMany({});
    await this.prisma.quotation.deleteMany({});
    await this.prisma.section.deleteMany({});
    await this.prisma.landingPage.deleteMany({});
    await this.prisma.media.deleteMany({});
    await this.prisma.userSettings.deleteMany({});
    await this.prisma.user.deleteMany({});
    await this.prisma.pessoa.deleteMany({});
    await this.prisma.organization.deleteMany({});
    this.logger.log('Todas as tabelas foram limpas.');

    // 2. Executar o comando de seed do Prisma
    return new Promise((resolve, reject) => {
      const seedProcess = exec('pnpm prisma db seed', (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Falha ao executar o seed: ${error.message}`);
          this.logger.error(`Stderr: ${stderr}`);
          reject({ message: 'Falha ao executar o seed do banco de dados.' });
          return;
        }
        this.logger.log(`Saída do Seed: ${stdout}`);
        resolve({ message: 'Banco de dados resetado e populado com sucesso!' });
      });

      if (seedProcess.stdout) {
        seedProcess.stdout.on('data', (data) => {
          this.logger.log(`[SEED STDOUT]: ${data.toString()}`);
        });
      }

      if (seedProcess.stderr) {
        seedProcess.stderr.on('data', (data) => {
          this.logger.error(`[SEED STDERR]: ${data.toString()}`);
        });
      }
    });
  }


  private parseDecimal(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(',', '.'));
  }

  private parseDate(value: string): Date {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return new Date();
  }

  async deleteAllSales() {
    this.logger.warn('Iniciando a exclusão de TODAS as transações financeiras, vendas, e contas...');
    try {
      // A ordem é importante para evitar erros de chave estrangeira
      await this.prisma.transacao.deleteMany({});
      this.logger.log('Transações financeiras (débitos e créditos) excluídas.');

      await this.prisma.saleItem.deleteMany({});
      this.logger.log('Itens de venda excluídos.');

      await this.prisma.accountRec.deleteMany({});
      this.logger.log('Contas a receber (duplicatas de venda) excluídas.');

      await this.prisma.accountPay.deleteMany({});
      this.logger.log('Contas a pagar (despesas) excluídas.');

      await this.prisma.sale.deleteMany({});
      this.logger.log('Vendas excluídas.');

      this.logger.log('Exclusão completa concluída com sucesso.');
      return { message: 'Todas as transações, vendas, e contas associadas foram excluídas com sucesso.' };
    } catch (error) {
      this.logger.error('Ocorreu um erro ao excluir os dados financeiros.', error.stack);
      throw new Error('Falha ao excluir dados financeiros.');
    }
  }

  async importOrUpdateCompanies(organizationId: string) {
    this.logger.log('Iniciando importação e atualização de empresas...');
    const filePath = path.join(process.cwd(), '..', '..', 'json-imports', 'Empresa.json');

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const companies: any[] = JSON.parse(fileContent);
      let processedCount = 0;
      let skippedCount = 0;

      for (const company of companies) {
        const externalId = company['unique id'];
        if (!externalId) continue;

        const cnpj = company.cpfCnpj ? String(company.cpfCnpj).trim() : null;
        if (cnpj) {
          const existingByCnpj = await this.prisma.pessoa.findFirst({
            where: { cnpj: cnpj, externalId: { not: externalId } },
          });
          if (existingByCnpj) {
            this.logger.warn(
              `CNPJ duplicado encontrado: \"${cnpj}\" para externalId ${externalId}. Pulando este registro.`, 
            );
            skippedCount++;
            continue;
          }
        }

        let email = company.email ? String(company.email).trim() : null;
        if (email === '' || (email && email.startsWith('sememail'))) {
          email = null;
        }

        const pessoaData = {
          organizationId: organizationId,
          externalId: externalId,
          type: 'JURIDICA' as const,
          name: company.nomeFantasia || company.nome,
          razaoSocial: company.nome,
          cnpj: cnpj,
          email: email,
          phone: company.fone,
          cep: company.cep,
          logradouro: company.logradouro,
          numero: company.logradouroNumero,
          complemento: company.logradouroComplemento,
          bairro: company.bairro,
          cidade: company.cidade,
          uf: company.estado,
        };

        if (pessoaData.email) {
          const existingByEmail = await this.prisma.pessoa.findFirst({
            where: {
              email: pessoaData.email,
              externalId: { not: externalId },
            },
          });

          if (existingByEmail) {
            const newEmail = `conflict-${externalId}@imported.com`;
            this.logger.warn(
              `Email duplicado encontrado: \"${pessoaData.email}\`. Cliente com externalId ${externalId} terá o email alterado para ${newEmail}.`,
            );
            pessoaData.email = newEmail;
          }
        }

        const upsertedPessoa = await this.prisma.pessoa.upsert({
          where: { externalId: externalId },
          update: pessoaData,
          create: pessoaData,
        });

        const userType = company.tagUsuario || company.tipoUsuario;
        if (userType) {
          const roles = userType.split(',').map(role => role.trim());

          if (roles.includes('Cliente')) {
            await this.prisma.client.upsert({
              where: { pessoaId: upsertedPessoa.id },
              update: {},
              create: {
                pessoaId: upsertedPessoa.id,
                organizationId: organizationId,
              },
            });
          }

          if (roles.includes('Fornecedor')) {
            await this.prisma.fornecedor.upsert({
              where: { pessoaId: upsertedPessoa.id },
              update: {},
              create: {
                pessoaId: upsertedPessoa.id,
                organizationId: organizationId,
              },
            });
          }

          if (roles.includes('Funcionario')) {
            await this.prisma.funcionario.upsert({
              where: { pessoaId: upsertedPessoa.id },
              update: {
                // hireDate é obrigatório, mas não temos essa info no JSON.
                // Podemos adicionar uma data padrão se necessário no futuro.
              },
              create: {
                pessoaId: upsertedPessoa.id,
                organizationId: organizationId,
                hireDate: new Date(), // Usando a data atual como padrão
              },
            });
          }
        }

        processedCount++;
      }

      this.logger.log(
        `Processamento de empresas concluído. ${processedCount} registros processados, ${skippedCount} registros pulados por duplicidade.`, 
      );
      return {
        message: `${processedCount} registros de empresas foram processados, ${skippedCount} pulados.`, 
      };

    } catch (error) {
      this.logger.error('Falha ao processar o arquivo de empresas.', error.stack);
      throw new Error('Falha na importação de empresas.');
    }
  }

  async importContas(organizationId: string) {
    this.logger.log('Iniciando importação de contas correntes e de metal...');
    const filePath = path.join(process.cwd(), '..', '..', 'json-imports', 'conta_corrente.json');

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const contas = JSON.parse(fileContent);
      let processedCount = 0;

      for (const conta of contas) {
        const nome = conta.nome.trim();
        if (!nome) continue;

        let type: ContaCorrenteType = ContaCorrenteType.BANCO;
        const upperCaseName = nome.toUpperCase();

        if (upperCaseName.includes('FORNECEDOR')) {
          type = ContaCorrenteType.FORNECEDOR_METAL;
        } else if (upperCaseName.includes('EMPRÉSTIMO')) {
          type = ContaCorrenteType.EMPRESTIMO;
        }

        await this.prisma.contaCorrente.upsert({
          where: { 
            organizationId_numeroConta: {
              organizationId: organizationId,
              numeroConta: nome, // Usando nome como número da conta
            }
          },
          update: {
            initialBalanceBRL: this.parseDecimal(conta.saldoInicial),
            type: type,
          },
          create: {
            organizationId: organizationId,
            nome: nome,
            numeroConta: nome, // Usando nome como número da conta
            agencia: 'legacy',
            initialBalanceBRL: this.parseDecimal(conta.saldoInicial),
            moeda: 'BRL',
            type: type,
          },
        });
        
        processedCount++;
      }

      this.logger.log(`${processedCount} contas processadas do JSON.`);
      return { message: `${processedCount} contas foram processadas com sucesso.` };

    } catch (error) {
      this.logger.error('Falha ao processar o arquivo de contas.', error.stack);
      throw new Error('Falha na importação de contas.');
    }
  }

  async importSalesAndFinance(organizationId: string) {
    this.logger.log('Iniciando importação completa de vendas e financeiro...');

    try {
      const basePath = path.join(process.cwd(), '..', '..', 'json-imports');
      const [pedidosContent, itemsContent, financasContent, empresasContent, duplicatasContent] = await Promise.all([
        fs.readFile(path.join(basePath, 'pedidos.json'), 'utf-8'),
        fs.readFile(path.join(basePath, 'pedidoItens.json'), 'utf-8'),
        fs.readFile(path.join(basePath, 'financeiro.json'), 'utf-8'),
        fs.readFile(path.join(basePath, 'Empresa.json'), 'utf-8'),
        fs.readFile(path.join(basePath, 'pedido-duplicatas.json'), 'utf-8'),
      ]);

      const pedidos: any[] = JSON.parse(pedidosContent);
      const items: any[] = JSON.parse(itemsContent);
      const financas: any[] = JSON.parse(financasContent);
      const empresas: any[] = JSON.parse(empresasContent);
      const duplicatas: any[] = JSON.parse(duplicatasContent);

      // --- MAPEAMENTO DE COTAÇÕES DIÁRIAS ---
      this.logger.log('Mapeando e salvando cotações diárias...');
      const dailyQuotesMap = new Map<string, number>();
      for (const financa of financas) {
        const data = this.parseDate(financa.dataPagamento || financa.dataVencimento);
        const dateString = data.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const cotacao = this.parseDecimal(financa.cotacao);

        if (cotacao > 0 && !dailyQuotesMap.has(dateString)) {
          dailyQuotesMap.set(dateString, cotacao);

          // Salva a cotação no banco de dados para uso futuro
          await this.prisma.quotation.upsert({
            where: {
              organizationId_metal_date_tipoPagamento: {
                organizationId: organizationId,
                metal: 'AU',
                date: new Date(dateString),
                tipoPagamento: 'LEGADO'
              }
            },
            update: { buyPrice: cotacao, sellPrice: cotacao },
            create: {
              organizationId: organizationId,
              metal: 'AU',
              date: new Date(dateString),
              buyPrice: cotacao,
              sellPrice: cotacao,
              tipoPagamento: 'LEGADO'
            }
          });
        }
      }
      this.logger.log(`${dailyQuotesMap.size} cotações diárias únicas foram mapeadas e salvas.`);

      // --- MAPEAMENTO DE DADOS ---

      const customerNameToExternalIdMap = new Map<string, string>();
      for (const empresa of empresas) {
        if (empresa.nome && empresa['unique id']) {
          customerNameToExternalIdMap.set(empresa.nome.trim(), empresa['unique id']);
        }
      }

      const itemsByOrderNumberMap = new Map<string, any[]>();
      for (const item of items) {
        const orderNumber = String(item.pedido).trim();
        if (!itemsByOrderNumberMap.has(orderNumber)) {
          itemsByOrderNumberMap.set(orderNumber, []);
        }
        itemsByOrderNumberMap.get(orderNumber)!.push(item);
      }

      const financasByDuplicataMap = new Map<string, any>();
      for (const financa of financas) {
        const duplicataNumber = String(financa.duplicata).trim();
        if (duplicataNumber) {
          financasByDuplicataMap.set(duplicataNumber, financa);
        }
      }

                        this.logger.log(`Mapeamento concluído: ${financasByDuplicataMap.size} registros financeiros mapeados.`);

                  

                        // --- PROCESSAMENTO E CRIAÇÃO NO BANCO ---

                  

                        let createdCount = 0; // Vendas criadas

                        let skippedCount = 0; // Vendas puladas

                        let errorCount = 0;   // Vendas com erro

                        let despesasCriadasCount = 0; // Despesas criadas

                        let outrasTransacoesCriadasCount = 0; // Outras transações criadas

                  

                        const productsMap = new Map((await this.prisma.product.findMany({ where: { organizationId } })).map(p => [p.name.trim().toLowerCase(), p]));

                        const contasCorrentesMap = new Map((await this.prisma.contaCorrente.findMany({ where: { organizationId } })).map(c => [c.nome.trim().toLowerCase(), c.id]));

                        const receitaConta = await this.prisma.contaContabil.findFirstOrThrow({ where: { organizationId, codigo: '4.1.1' } });

                        const despesaContaDefault = await this.prisma.contaContabil.findFirstOrThrow({ where: { organizationId, codigo: '3.1.1' } }); // Assumindo que 3.1.1 é uma conta de despesa genérica

                  

                        // --- 1. PROCESSAR VENDAS E RECEBIMENTOS ---      this.logger.log('Iniciando processamento de Vendas e Recebimentos...');
      for (const pedido of pedidos) {
        const orderNumber = String(pedido.numero).trim();

        try {
          const externalId = customerNameToExternalIdMap.get(pedido.cliente.trim());
          if (!externalId) {
            this.logger.warn(`Cliente "${pedido.cliente}" do pedido ${orderNumber} não encontrado. Pulando.`);
            skippedCount++;
            continue;
          }

          const pessoa = await this.prisma.pessoa.findUnique({ where: { externalId } });
          if (!pessoa) {
            this.logger.warn(`Pessoa com externalId ${externalId} não encontrada. Pulando pedido ${orderNumber}.`);
            skippedCount++;
            continue;
          }

          const saleItemsData = itemsByOrderNumberMap.get(orderNumber);
          if (!saleItemsData || saleItemsData.length === 0) {
            this.logger.warn(`Itens para o pedido ${orderNumber} não encontrados. Pulando.`);
            skippedCount++;
            continue;
          }

          const existingSale = await this.prisma.sale.findUnique({ where: { externalId: pedido['unique id'] } });
          if (existingSale) {
            skippedCount++;
            continue;
          }

          const orderNumberInt = parseInt(orderNumber, 10);
          if (isNaN(orderNumberInt)) {
            this.logger.warn(`Número do pedido "${orderNumber}" não é um número válido. Pulando.`);
            skippedCount++;
            continue;
          }

          const totalAmountParsed = this.parseDecimal(pedido.valorTotal);
          if (!totalAmountParsed || totalAmountParsed === 0) {
            this.logger.warn(`Pedido ${orderNumber} com valorTotal ausente ou zerado no JSON.`);
          }

          const newSale = await this.prisma.sale.create({
            data: {
              organizationId: organizationId,
              pessoaId: pessoa.id,
              orderNumber: orderNumberInt,
              externalId: pedido['unique id'],
              totalAmount: totalAmountParsed,
              shippingCost: this.parseDecimal(pedido.valorFrete),
              createdAt: this.parseDate(pedido.data),
              paymentMethod: 'IMPORTADO',
              saleItems: {
                create: saleItemsData.map(item => {
                  const productName = String(item.produto).trim().toLowerCase();
                  const product = productsMap.get(productName);
                  if (!product) throw new Error(`Produto "${item.produto}" não encontrado no banco de dados.`);
                  
                  const quantity = this.parseDecimal(item.quantidade) || this.parseDecimal(item.quantidadeAu) || 0;
                  const totalValue = this.parseDecimal(item.valorTotalReal);
                  const price = quantity > 0 ? totalValue / quantity : 0;
                  const costPriceAtSale = this.parseDecimal(item.cotacao) * quantity;

                  return {
                    productId: product.id,
                    quantity: quantity,
                    price: price,
                    costPriceAtSale: costPriceAtSale,
                    externalId: item['unique id'],
                  };
                }),
              },
            },
          });

          const duplicatasDoPedido = duplicatas.filter(d => String(d.pedidoDuplicata).trim().startsWith(orderNumber));

          for (const duplicata of duplicatasDoPedido) {
            const accountRecExternalId = duplicata['unique id'];
            const newAccountRec = await this.prisma.accountRec.create({
              data: {
                organizationId: organizationId,
                saleId: newSale.id,
                description: duplicata.historico || `Duplicata para pedido ${orderNumber}`,
                amount: this.parseDecimal(duplicata.valorBruto),
                dueDate: this.parseDate(duplicata.dataVencimento),
                received: duplicata.aberto === 'não',
                receivedAt: duplicata.aberto === 'não' ? this.parseDate(duplicata.dataPagamento) : null,
                externalId: accountRecExternalId,
              }
            });

            if (newAccountRec.received) {
              const financa = financasByDuplicataMap.get(String(duplicata.pedidoDuplicata).trim());
              if (financa) {
                const contaCorrenteName = String(financa.contaCorrente || '').trim().toLowerCase();
                const contaCorrenteId = contasCorrentesMap.get(contaCorrenteName);

                await this.prisma.transacao.create({
                  data: {
                    organizationId: organizationId,
                    tipo: 'DEBITO',
                    valor: this.parseDecimal(financa.valorRecebido),
                    goldAmount: this.parseDecimal(financa.valorRecebidoAu),
                    moeda: 'BRL',
                    descricao: financa.descricao || `Pagamento para pedido ${orderNumber}`,
                    dataHora: this.parseDate(financa.dataPagamento),
                    contaContabilId: receitaConta.id,
                    contaCorrenteId: contaCorrenteId,
                    AccountRec: { connect: { id: newAccountRec.id } },
                  },
                });
              } else {
                this.logger.warn(`Nenhuma financa encontrada para a duplicata ${duplicata.pedidoDuplicata}.`);
              }
            }
          }

          const allDuplicatesPaid = duplicatasDoPedido.every(d => d.aberto === 'não');
          if (allDuplicatesPaid) {
            const updatedSale = await this.prisma.sale.update({
              where: { id: newSale.id },
              data: { status: 'FINALIZADO' },
            });
            this.logger.log(`Venda ${newSale.id} atualizada para status: ${updatedSale.status}`);
          }

          createdCount++;
        } catch (error) {
          this.logger.error(`Erro ao importar venda ${orderNumber}: ${error.message}`);
          errorCount++;
        }
      }

      // --- 2. PROCESSAR OUTRAS TRANSAÇÕES (Despesas, Recebimentos em Metal, Transferências) ---
      for (const pedido of pedidos) {
        const orderNumber = String(pedido.numero).trim();

        try {
          const externalId = customerNameToExternalIdMap.get(pedido.cliente.trim());
          if (!externalId) {
            this.logger.warn(`Cliente "${pedido.cliente}" do pedido ${orderNumber} não encontrado. Pulando.`);
            skippedCount++;
            continue;
          }

          const pessoa = await this.prisma.pessoa.findUnique({ where: { externalId } });
          if (!pessoa) {
            this.logger.warn(`Pessoa com externalId ${externalId} não encontrada. Pulando pedido ${orderNumber}.`);
            skippedCount++;
            continue;
          }

          const saleItemsData = itemsByOrderNumberMap.get(orderNumber);
          if (!saleItemsData || saleItemsData.length === 0) {
            this.logger.warn(`Itens para o pedido ${orderNumber} não encontrados. Pulando.`);
            skippedCount++;
            continue;
          }

          const existingSale = await this.prisma.sale.findUnique({ where: { externalId: pedido['unique id'] } });
          if (existingSale) {
            skippedCount++;
            continue;
          }

          const orderNumberInt = parseInt(orderNumber, 10);
          if (isNaN(orderNumberInt)) {
            this.logger.warn(`Número do pedido "${orderNumber}" não é um número válido. Pulando.`);
            skippedCount++;
            continue;
          }

          const totalAmountParsed = this.parseDecimal(pedido.valorTotal);
          if (!totalAmountParsed || totalAmountParsed === 0) {
            this.logger.warn(`Pedido ${orderNumber} com valorTotal ausente ou zerado no JSON.`);
          }

          const newSale = await this.prisma.sale.create({
            data: {
              organizationId: organizationId,
              pessoaId: pessoa.id,
              orderNumber: orderNumberInt,
              externalId: pedido['unique id'],
              totalAmount: totalAmountParsed,
              shippingCost: this.parseDecimal(pedido.valorFrete),
              createdAt: this.parseDate(pedido.data),
              paymentMethod: 'IMPORTADO',
              saleItems: {
                create: saleItemsData.map(item => {
                  const productName = String(item.produto).trim().toLowerCase();
                  const product = productsMap.get(productName);
                  if (!product) throw new Error(`Produto "${item.produto}" não encontrado no banco de dados.`);
                  
                  const quantity = this.parseDecimal(item.quantidade) || this.parseDecimal(item.quantidadeAu) || 0;
                  const totalValue = this.parseDecimal(item.valorTotalReal);
                  const price = quantity > 0 ? totalValue / quantity : 0;
                  const costPriceAtSale = this.parseDecimal(item.cotacao) * quantity;

                  return {
                    productId: product.id,
                    quantity: quantity,
                    price: price,
                    costPriceAtSale: costPriceAtSale,
                    externalId: item['unique id'],
                  };
                }),
              },
            },
          });

          const duplicatasDoPedido = duplicatas.filter(d => String(d.pedidoDuplicata).trim().startsWith(orderNumber));

          for (const duplicata of duplicatasDoPedido) {
            const accountRecExternalId = duplicata['unique id'];
            const newAccountRec = await this.prisma.accountRec.create({
              data: {
                organizationId: organizationId,
                saleId: newSale.id,
                description: duplicata.historico || `Duplicata para pedido ${orderNumber}`,
                amount: this.parseDecimal(duplicata.valorBruto),
                dueDate: this.parseDate(duplicata.dataVencimento),
                received: duplicata.aberto === 'não',
                receivedAt: duplicata.aberto === 'não' ? this.parseDate(duplicata.dataPagamento) : null,
                externalId: accountRecExternalId,
              }
            });

            if (newAccountRec.received) {
              const financa = financasByDuplicataMap.get(String(duplicata.pedidoDuplicata).trim());
              if (financa) {
                const contaCorrenteName = String(financa.contaCorrente || '').trim().toLowerCase();
                const contaCorrenteId = contasCorrentesMap.get(contaCorrenteName);

                await this.prisma.transacao.create({
                  data: {
                    organizationId: organizationId,
                    tipo: 'CREDITO',
                    valor: this.parseDecimal(financa.valorRecebido),
                    goldAmount: this.parseDecimal(financa.valorRecebidoAu),
                    moeda: 'BRL',
                    descricao: financa.descricao || `Pagamento para pedido ${orderNumber}`,
                    dataHora: this.parseDate(financa.dataPagamento),
                    contaContabilId: receitaConta.id,
                    contaCorrenteId: contaCorrenteId,
                    AccountRec: { connect: { id: newAccountRec.id } },
                  },
                });
              } else {
                this.logger.warn(`Nenhuma financa encontrada para a duplicata ${duplicata.pedidoDuplicata}.`);
              }
            }
          }

          const allDuplicatesPaid = duplicatasDoPedido.every(d => d.aberto === 'não');
          if (allDuplicatesPaid) {
            const updatedSale = await this.prisma.sale.update({
              where: { id: newSale.id },
              data: { status: 'FINALIZADO' },
            });
            this.logger.log(`Venda ${newSale.id} atualizada para status: ${updatedSale.status}`);
          }

          createdCount++;
        } catch (error) {
          this.logger.error(`Erro ao importar venda ${orderNumber}: ${error.message}`);
          errorCount++;
        }
      }

      // --- 2. PROCESSAR OUTRAS TRANSAÇÕES (Despesas, Recebimentos em Metal, Transferências) ---
      this.logger.log('Iniciando processamento de outras transações (despesas, recebimentos em metal, transferências)...');
      for (const financa of financas) {
        const financaId = financa['unique id'];
        const duplicataNumber = String(financa.duplicata || '').trim();
        const valorRecebido = this.parseDecimal(financa.valorRecebido);
        const isTransferencia = financa.transferencia === 'sim';
        const isRecebimentoEmMetal = String(financa.contaCorrente || '').trim().toLowerCase() === 'metal';
        const valorPago = this.parseDecimal(financa.valorPago) || this.parseDecimal(financa.valor);
        const dataTransacao = this.parseDate(financa.dataPagamento || financa.dataEmissao);
        const contaCorrenteName = String(financa.contaCorrente || '').trim().toLowerCase();
        const contaCorrenteId = contasCorrentesMap.get(contaCorrenteName);

        // Pula se já foi tratado como pagamento de venda
        if (financasByDuplicataMap.has(duplicataNumber)) {
          continue;
        }

        try {
          // --- Lógica para Transferências / Recebimentos em Metal ---
          if (isTransferencia || isRecebimentoEmMetal) {
            if (!contaCorrenteId) {
              this.logger.warn(`Conta corrente "${financa.contaCorrente}" não encontrada para a transação ${financaId}. Pulando.`);
              continue;
            }

            let tipoTransacao: TipoTransacaoPrisma = 'CREDITO'; // Padrão
            let valorFinal = valorRecebido > 0 ? valorRecebido : valorPago;
            if (valorFinal < 0) {
              tipoTransacao = 'DEBITO';
              valorFinal = Math.abs(valorFinal);
            }

            let cotacao = this.parseDecimal(financa.cotacao);
            let goldAmount = this.parseDecimal(financa.valorRecebidoAu) || this.parseDecimal(financa.valorAuGasto);

            if (goldAmount === 0 && valorFinal > 0 && cotacao > 0) {
              goldAmount = valorFinal / cotacao; // Calcula goldAmount se só tiver BRL
            }
            if (cotacao === 0 && goldAmount > 0 && valorFinal > 0) {
              cotacao = valorFinal / goldAmount; // Calcula cotação se só tiver goldAmount
            }
            if (cotacao === 0 && dataTransacao) {
              const dateString = dataTransacao.toISOString().split('T')[0];
              cotacao = dailyQuotesMap.get(dateString) || 0;
            }

            await this.prisma.transacao.create({
              data: {
                organizationId: organizationId,
                tipo: tipoTransacao,
                valor: new Decimal(valorFinal),
                goldAmount: new Decimal(goldAmount).toDecimalPlaces(4),
                moeda: 'BRL',
                descricao: financa.descricao || `Transação importada: ${financa.carteira}`,
                dataHora: dataTransacao,
                contaContabilId: receitaConta.id, // TODO: Mapear para conta contábil mais apropriada para transferências/recebimentos de metal
                contaCorrenteId: contaCorrenteId,
                fitId: financaId, // Usar o unique id como fitId para evitar duplicatas
              },
            });
            outrasTransacoesCriadasCount++;
          }
          // --- Lógica para Despesas ---
          else if (valorPago > 0 && valorRecebido === 0) {
            if (!contaCorrenteId) {
              this.logger.warn(`Conta corrente "${financa.contaCorrente}" não encontrada para a despesa ${financaId}. Pulando.`);
              continue;
            }

            const newAccountPay = await this.prisma.accountPay.create({
              data: {
                organizationId: organizationId,
                description: financa.descricao || 'Despesa importada',
                amount: new Decimal(valorPago),
                dueDate: this.parseDate(financa.dataVencimento),
                paid: financa.baixaPagamento === 'sim',
                paidAt: financa.baixaPagamento === 'sim' ? this.parseDate(financa.dataPagamento) : null,
                contaContabilId: despesaContaDefault.id,
              }
            });

            if (newAccountPay.paid) {
              let cotacao = this.parseDecimal(financa.cotacao);
              if (cotacao <= 0 && dataTransacao) {
                const dateString = dataTransacao.toISOString().split('T')[0];
                cotacao = dailyQuotesMap.get(dateString) || 0;
              }

              let goldAmount = new Decimal(0);
              if (cotacao > 0) {
                goldAmount = new Decimal(valorPago).dividedBy(cotacao);
              } else {
                this.logger.warn(`Cotação não encontrada para a despesa na data ${dataTransacao}. GoldAmount será 0.`);
              }

              await this.prisma.transacao.create({
                data: {
                  organizationId: organizationId,
                  tipo: 'DEBITO',
                  valor: new Decimal(valorPago),
                  goldAmount: goldAmount.toDecimalPlaces(4),
                  moeda: 'BRL',
                  descricao: financa.descricao || `Pagamento de despesa importada`,
                  dataHora: dataTransacao,
                  contaContabilId: despesaContaDefault.id,
                  contaCorrenteId: contaCorrenteId,
                  AccountPay: { connect: { id: newAccountPay.id } },
                },
              });
            }
            despesasCriadasCount++;
          }
          else {
            this.logger.warn(`Registro financeiro ${financaId} não classificado. Pulando.`);
          }
        } catch (error) {
          this.logger.error(`Erro ao importar registro financeiro ${financaId}: ${error.message}`);
          errorCount++;
        }
      }

      this.logger.log(`Importação de vendas e débitos concluída.`);
      this.logger.log(`- ${createdCount} vendas criadas com sucesso.`);
      this.logger.log(`- ${skippedCount} vendas puladas por dados ausentes ou duplicidade.`);
      this.logger.log(`- ${errorCount} vendas com erro durante a criação.`);
      this.logger.log(`- ${despesasCriadasCount} despesas criadas com sucesso.`);
      this.logger.log(`- ${outrasTransacoesCriadasCount} outras transações (recebimentos/transferências) criadas com sucesso.`);

      return { message: `Importação concluída: ${createdCount} vendas, ${despesasCriadasCount} despesas e ${outrasTransacoesCriadasCount} outras transações processadas.` };

    } catch (error) {
      this.logger.error('Falha ao ler ou mapear arquivos JSON para importação de vendas.', error.stack);
      throw new Error('Falha na preparação da importação de vendas.');
    }
  }

  async importProducts(organizationId: string): Promise<any> {
    this.logger.log('Iniciando importação de produtos...');
    const jsonDirectory = path.join(process.cwd(), '..', '..', 'json-imports');
    return this.importProductsUseCase.execute(organizationId, jsonDirectory);
  }

  async linkSalesAndReceivables(organizationId: string): Promise<{ message: string }> {
    this.logger.log(`Vinculação de vendas e recebimentos para a organização ${organizationId}. Esta etapa já é realizada durante a importação de vendas e finanças.`);
    return { message: `Vinculação de vendas e recebimentos já realizada.` };
  }

  async runFullLegacyImport(organizationId: string): Promise<{ message: string }> {
    this.logger.log(`Iniciando importação completa do legado para a organização ${organizationId}...`);
    try {
      await this.importOrUpdateCompanies(organizationId);
      await this.importContas(organizationId);
      await this.importProducts(organizationId);
      await this.importSalesAndFinance(organizationId);
      await this.linkSalesAndReceivables(organizationId);
      await this.salesService.backfillSaleAdjustments(organizationId);
      return { message: 'Importação completa do legado concluída com sucesso!' };
    } catch (error) {
      this.logger.error('Falha na importação completa do legado.', error.stack);
      throw new Error('Falha na importação completa do legado.');
    }
  }

  async auditImportFiles(): Promise<{ message: string }> {
    this.logger.warn(`Método auditImportFiles chamado. Implementação pendente.`);
    return { message: `Auditoria de arquivos de importação (pendente de implementação).` };
  }
}
