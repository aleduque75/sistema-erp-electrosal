import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContaCorrenteType } from '@prisma/client';

import { exec } from 'child_process';

@Injectable()
export class JsonImportsService {
  private readonly logger = new Logger(JsonImportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resetAndSeed(): Promise<{ message: string }> {
    this.logger.warn('Iniciando o processo de RESET e SEED do banco de dados...');

    // 1. Limpar todas as tabelas na ordem correta para evitar erros de constraint
    await this.prisma.chemical_reactions.deleteMany({});
    await this.prisma.pure_metal_lots.deleteMany({});
    await this.prisma.metalAccountEntry.deleteMany({});
    await this.prisma.metalAccount.deleteMany({});
    await this.prisma.creditCardTransaction.deleteMany({});
    await this.prisma.saleInstallment.deleteMany({});
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

      const pedidos = JSON.parse(pedidosContent);
      const items = JSON.parse(itemsContent);
      const financas = JSON.parse(financasContent);
      const empresas = JSON.parse(empresasContent);
      const duplicatas = JSON.parse(duplicatasContent);

      const duplicatasByOrderNumberMap = new Map<string, any>();
      for (const duplicata of duplicatas) {
        const orderNumber = duplicata.pedidoDuplicata;
        if (orderNumber) {
          duplicatasByOrderNumberMap.set(orderNumber, duplicata);
        }
      }

      const customerNameToExternalIdMap = new Map<string, string>();
      for (const empresa of empresas) {
        if (empresa.nome && empresa['unique id']) {
          customerNameToExternalIdMap.set(empresa.nome.trim(), empresa['unique id']);
        }
      }

      const itemsByOrderNumberMap = new Map<string, any[]>();
      for (const item of items) {
        const orderNumber = item.pedido;
        if (!itemsByOrderNumberMap.has(orderNumber)) {
          itemsByOrderNumberMap.set(orderNumber, []);
        }
        itemsByOrderNumberMap.get(orderNumber)!.push(item);
      }

      // Diagnóstico avançado para encontrar a chave de ligação correta
      const allOrderNumbers = new Set(pedidos.map(p => p.numero));
      const financialsByOrderNumberMap = new Map<string, any>();
      const processedFinancaIds = new Set<string>();
      let linkedFinancialRecords = 0;

      this.logger.log(`Iniciando diagnóstico de ligação financeira para ${allOrderNumbers.size} pedidos...`);

      for (const financa of financas) {
        const potentialKeys = ['pedidoDuplicata', 'duplicata', 'numeroDuplicata'];
        let foundMatch = false;
        for (const key of potentialKeys) {
          let value = financa[key];
          if (value) {
            // Normaliza o valor removendo sufixos como '/a'
            value = String(value).split('/')[0];
            if (allOrderNumbers.has(value)) {
              if (!financialsByOrderNumberMap.has(value)) {
                financialsByOrderNumberMap.set(value, financa);
                linkedFinancialRecords++;
                this.logger.log(`Ligação encontrada para pedido ${value} no campo '${key}'.`);
              }
              foundMatch = true;
              break; // Sai do loop de chaves pois já encontrou a ligação
            }
          }
        }
      }

      this.logger.log(`Diagnóstico concluído: ${linkedFinancialRecords} registros financeiros foram ligados a um pedido.`);

      this.logger.log(`Mapeamento concluído:`);
      this.logger.log(`- ${customerNameToExternalIdMap.size} clientes mapeados por nome.`);
      this.logger.log(`- ${itemsByOrderNumberMap.size} pedidos mapeados com itens.`);

      // 3. Iterar sobre os pedidos e criar as entidades no banco
      let createdCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // Mapear produtos do banco de dados por nome para acesso rápido
      const products = await this.prisma.product.findMany({ where: { organizationId } });
      const productsMap = new Map(products.map(p => [p.name.trim().toLowerCase(), p]));
      this.logger.log(`- ${productsMap.size} produtos do banco de dados mapeados.`);

      // Mapear Contas Correntes do banco de dados por nome
      const contasCorrentes = await this.prisma.contaCorrente.findMany({ where: { organizationId } });
      const contasCorrentesMap = new Map(contasCorrentes.map(c => [c.nome.trim().toLowerCase(), c.id]));
      this.logger.log(`- ${contasCorrentesMap.size} contas correntes do banco de dados mapeadas.`);

      const receitaConta = await this.prisma.contaContabil.findFirst({
        where: { organizationId, codigo: '4.1.1' },
      });
      if (!receitaConta) {
        throw new Error('Conta contábil de receita padrão (4.1.1) não encontrada.');
      }

      const emprestimoPrincipalConta = await this.prisma.contaContabil.findFirst({
        where: { organizationId, codigo: '2.1.4.01' },
      });
      if (!emprestimoPrincipalConta) {
        throw new Error('Conta contábil de Empréstimo - Eladio (Principal) (2.1.4.01) não encontrada. Execute o seed novamente.');
      }

      const jurosEmprestimosConta = await this.prisma.contaContabil.findFirst({
        where: { organizationId, nome: 'Juros de Empréstimos' }, // Assumindo que o nome é 'Juros de Empréstimos'
      });
      if (!jurosEmprestimosConta) {
        // Fallback para uma conta de despesa geral se não encontrar a específica de juros
        this.logger.warn('Conta contábil de Juros de Empréstimos não encontrada. Usando Despesas Gerais.');
      }

      const defaultDespesaConta = await this.prisma.contaContabil.findFirst({
        where: { organizationId, codigo: '5.1.10' }, // Código para Despesas Gerais
      });
      if (!defaultDespesaConta) {
        throw new Error('Conta contábil de Despesas Gerais (5.1.10) não encontrada. Verifique o seed.');
      }

      const transferenciasInternasConta = await this.prisma.contaContabil.findFirst({
        where: { organizationId, codigo: '5.1.11' },
      });
      if (!transferenciasInternasConta) {
        throw new Error('Conta contábil de Transferências Internas (5.1.11) não encontrada. Execute o seed novamente.');
      }

      const categoryMapping: Record<string, string> = {
        'fretes e transportes': 'Transporte e Deslocamento (Motoboy, etc)',
        'energia eletrica': 'Contas de Consumo (Água, Luz, Internet)',
        'salarios e ordenados': 'Salários e Encargos (Administrativo)',
        'impostos e taxas diversos': 'Despesas Gerais', // Mapeando para Despesas Gerais por enquanto
        'aluguel': 'Aluguel e Condomínio',
        'telefonia / internet': 'Contas de Consumo (Água, Luz, Internet)',
        'despesas bancarias': 'Taxas de Cartão e Bancárias',
        '13 salario': 'Salários e Encargos (Administrativo)',
        'operacional fabrica': 'Despesas Gerais',
        'material recuperação': 'Despesas Gerais',
        'ajuda de custo vendedores': 'Despesas Gerais',
        'almoço / clientes outros': 'Despesas Gerais',
        'estacionamentos': 'Despesas Gerais',
        'combustivel': 'Despesas Gerais',
        'mão de obra recuperação': 'Despesas Gerais',
        'escritorio': 'Despesas Gerais',
        'informatica': 'Despesas Gerais',
        'operacional recuperação': 'Despesas Gerais',
        'juros de emprestimos': jurosEmprestimosConta?.nome || 'Despesas Gerais', // Mapeamento para juros
      };

      for (const pedido of pedidos) {
        // Encontrar o cliente (Pessoa)
        const externalId = customerNameToExternalIdMap.get(pedido.cliente.trim());
        if (!externalId) {
          this.logger.warn(`Cliente "${pedido.cliente}" do pedido ${pedido.numero} não encontrado no mapa de empresas. Pulando.`);
          skippedCount++;
          continue;
        }

        const pessoa = await this.prisma.pessoa.findUnique({ where: { externalId } });
        if (!pessoa) {
          this.logger.warn(`Pessoa com externalId ${externalId} não encontrada no banco. Pulando pedido ${pedido.numero}.`);
          skippedCount++;
          continue;
        }

        // Encontrar os itens do pedido
        const saleItems = itemsByOrderNumberMap.get(pedido.numero);
        if (!saleItems || saleItems.length === 0) {
          this.logger.warn(`Itens para o pedido ${pedido.numero} não encontrados. Pulando.`);
          skippedCount++;
          continue;
        }

        try {
          // Verificar se a venda já existe pelo externalId
          const existingSale = await this.prisma.sale.findUnique({
            where: { externalId: pedido['unique id'] },
          });

          if (existingSale) {
            this.logger.warn(`Venda com externalId ${pedido['unique id']} (Pedido ${pedido.numero}) já existe. Verificando duplicata e finanças...`);

            const duplicata = duplicatasByOrderNumberMap.get(pedido.numero);
            if (duplicata) {
              let accountRec = await this.prisma.accountRec.findFirst({
                where: { externalId: duplicata['unique id'] },
                include: { transacao: true },
              });

              if (!accountRec) {
                accountRec = await this.prisma.accountRec.create({
                  include: { transacao: true },
                  data: {
                    organizationId: organizationId,
                    saleId: existingSale.id,
                    description: duplicata.historico || `Duplicata para pedido ${pedido.numero}`,
                    amount: this.parseDecimal(duplicata.valorBruto),
                    dueDate: this.parseDate(duplicata.dataVencimento),
                    received: duplicata.aberto === 'não',
                    receivedAt: null,
                    externalId: duplicata['unique id'],
                  }
                });
                this.logger.log(`AccountRec (duplicata) criado para a venda já existente ${pedido.numero}.`);
              }

              if (!accountRec) {
                this.logger.error(`Falha ao encontrar ou criar AccountRec para duplicata com externalId ${duplicata['unique id']}. Pulando.`);
                continue;
              }

              if (duplicata.aberto === 'não') {
                const financa = financialsByOrderNumberMap.get(pedido.numero);
                if (financa) {
                  processedFinancaIds.add(financa['unique id']);
                  const paymentDate = this.parseDate(financa.dataPagamento);
                  if (accountRec.receivedAt !== paymentDate) {
                    await this.prisma.accountRec.update({
                      where: { id: accountRec.id },
                      data: { receivedAt: paymentDate },
                    });
                  }

                  if (!accountRec.transacao) {
                    const contaCorrenteName = financa.contaCorrente?.trim().toLowerCase();
                    const contaCorrenteId = contaCorrenteName ? contasCorrentesMap.get(contaCorrenteName) : undefined;

                    await this.prisma.transacao.create({
                      data: {
                        organizationId: organizationId,
                        tipo: 'CREDITO',
                        valor: this.parseDecimal(financa.valorRecebido),
                        goldAmount: this.parseDecimal(financa.valorRecebidoAu),
                        moeda: 'BRL',
                        descricao: financa.descricao || `Pagamento para pedido ${pedido.numero}`,
                        dataHora: paymentDate,
                        contaContabilId: receitaConta.id,
                        contaCorrenteId: contaCorrenteId,
                        AccountRec: {
                          connect: { id: accountRec.id },
                        },
                      },
                    });
                    this.logger.log(`Transacao criada para a venda já existente ${pedido.numero}.`);
                  }
                }
              }
            }

            skippedCount++;
            continue;
          }

          const orderNumberInt = parseInt(pedido.numero, 10);
          if (isNaN(orderNumberInt)) {
            this.logger.warn(`Número do pedido \"${pedido.numero}\" não é um número válido. Pulando.`);
            skippedCount++;
            continue;
          }

          const newSale = await this.prisma.sale.create({
            data: {
              organizationId: organizationId,
              pessoaId: pessoa.id,
              orderNumber: orderNumberInt,
              externalId: pedido['unique id'],
              totalAmount: this.parseDecimal(pedido.valorTotal),
              feeAmount: this.parseDecimal(pedido.valorFrete),
              createdAt: this.parseDate(pedido.data),
              paymentMethod: 'IMPORTADO',
              saleItems: {
                create: saleItems.map(item => {
                  const productName = item.produto.trim().toLowerCase();
                  const product = productsMap.get(productName);

                  if (!product) {
                    throw new Error(`Produto "${item.produto}" não encontrado no banco de dados.`);
                  }

                  const quantity = this.parseDecimal(item.quantidadeAu);
                  const totalValue = this.parseDecimal(item.valorTotalReal);
                  const price = quantity > 0 ? totalValue / quantity : 0;

                  const costPriceAtSale = this.parseDecimal(item.quantidadeAu) * this.parseDecimal(item.cotacao);

                  return {
                    productId: product.id,
                    quantity: Math.round(quantity),
                    price: price,
                    costPriceAtSale: costPriceAtSale,
                    externalId: item['unique id'],
                  };
                }),
              },
            },
          });

          // Agora, crie o AccountRec a partir dos dados da duplicata
          const duplicata = duplicatasByOrderNumberMap.get(pedido.numero);
          if (duplicata) {
            const newAccountRec = await this.prisma.accountRec.create({
              data: {
                organizationId: organizationId,
                saleId: newSale.id,
                description: duplicata.historico || `Duplicata para pedido ${pedido.numero}`,
                amount: this.parseDecimal(duplicata.valorBruto),
                dueDate: this.parseDate(duplicata.dataVencimento),
                received: duplicata.aberto === 'não',
                receivedAt: null, // Será atualizado abaixo se aplicável
                externalId: duplicata['unique id'],
              }
            });

            if (duplicata.aberto === 'não') {
              const financa = financialsByOrderNumberMap.get(pedido.numero);
              if (financa) {
                processedFinancaIds.add(financa['unique id']);
                const paymentDate = this.parseDate(financa.dataPagamento);
                await this.prisma.accountRec.update({
                  where: { id: newAccountRec.id },
                  data: { receivedAt: paymentDate },
                });

                const contaCorrenteName = financa.contaCorrente?.trim().toLowerCase();
                const contaCorrenteId = contaCorrenteName ? contasCorrentesMap.get(contaCorrenteName) : undefined;

                await this.prisma.transacao.create({
                  data: {
                    organizationId: organizationId,
                    tipo: 'CREDITO',
                    valor: this.parseDecimal(financa.valorRecebido),
                    goldAmount: this.parseDecimal(financa.valorRecebidoAu),
                    moeda: 'BRL',
                    descricao: financa.descricao || `Pagamento para pedido ${pedido.numero}`,
                    dataHora: paymentDate,
                    contaContabilId: receitaConta.id,
                    contaCorrenteId: contaCorrenteId,
                    AccountRec: {
                      connect: { id: newAccountRec.id },
                    },
                  },
                });
              }
            }
          }

          createdCount++;
        } catch (error) {
          this.logger.error(`Erro ao importar venda ${pedido.numero}: ${error.message}`);
          errorCount++;
        }
      }

      this.logger.log('Iniciando processamento de transferências e juros de empréstimos...');
      let transferenciasCriadas = 0;
      let jurosCriados = 0;

      // Mapear todas as financas por unique id para acesso rápido
      const financasById = new Map<string, any>(financas.map(f => [f['unique id'], f]));

      // Processar Transferências (Simplificado)
      for (const financa of financas) {
        const uniqueId = financa['unique id'];
        if (processedFinancaIds.has(uniqueId)) {
          continue; // Já processado
        }

        if (financa.transferencia === 'sim') {
          const valorPago = this.parseDecimal(financa.valorPago);
          const valorRecebido = this.parseDecimal(financa.valorRecebido);

          if (valorPago === 0 && valorRecebido === 0) {
            this.logger.warn(`Transferência '${financa.descricao}' (ID: ${uniqueId}) não tem valor de débito nem de crédito. Pulando.`);
            processedFinancaIds.add(uniqueId);
            continue;
          }

          const tipoTransacao = valorPago > 0 ? 'DEBITO' : 'CREDITO';
          const valor = valorPago > 0 ? valorPago : valorRecebido;
          const goldAmount = valorPago > 0 ? this.parseDecimal(financa.valorPagoAu) : this.parseDecimal(financa.valorRecebidoAu);

          const contaCorrenteName = financa.contaCorrente?.trim().toLowerCase();
          const contaCorrenteId = contaCorrenteName ? contasCorrentesMap.get(contaCorrenteName) : undefined;

          if (!contaCorrenteId) {
            this.logger.warn(`Conta corrente '${financa.contaCorrente}' para transferência '${financa.descricao}' (ID: ${uniqueId}) não encontrada. Criando transação sem vínculo com conta corrente.`);
          }

          await this.prisma.transacao.create({
            data: {
              organizationId,
              tipo: tipoTransacao,
              valor: valor,
              goldAmount: goldAmount,
              moeda: 'BRL',
              descricao: `Transferência Interna: ${financa.descricao}`,
              dataHora: this.parseDate(financa.dataPagamento),
              contaContabilId: transferenciasInternasConta.id, // Usar a conta de Transferências Internas
              contaCorrenteId: contaCorrenteId,
            },
          });
          this.logger.log(`Transferência simplificada '${financa.descricao}' (ID: ${uniqueId}) criada como ${tipoTransacao}.`);
          processedFinancaIds.add(uniqueId);
          transferenciasCriadas++;
        }
      }

      // Processar Juros de Empréstimos
      for (const financa of financas) {
        const uniqueId = financa['unique id'];
        if (processedFinancaIds.has(uniqueId)) {
          continue; // Já processado
        }

        if (financa.planoContaCategoria?.trim().toLowerCase() === 'juros de emprestimos' && financa.transferencia !== 'sim') {
          const contaCorrenteName = financa.contaCorrente?.trim().toLowerCase();
          const contaCorrenteId = contaCorrenteName ? contasCorrentesMap.get(contaCorrenteName) : undefined;

          if (!contaCorrenteId) {
            this.logger.warn(`Conta corrente para juros de empréstimo '${financa.descricao}' não encontrada. A transação será criada sem vínculo com conta corrente.`);
            // Não pulamos, apenas criamos a transação sem contaCorrenteId
          }

          await this.prisma.transacao.create({
            data: {
              organizationId,
              tipo: 'DEBITO',
              valor: this.parseDecimal(financa.valorPago), // Juros são pagos
              goldAmount: this.parseDecimal(financa.valorPagoAu),
              moeda: 'BRL',
              descricao: financa.descricao || 'Pagamento de Juros de Empréstimo',
              dataHora: this.parseDate(financa.dataPagamento),
              contaContabilId: jurosEmprestimosConta?.id || defaultDespesaConta.id,
              contaCorrenteId: contaCorrenteId,
            },
          });
          processedFinancaIds.add(uniqueId);
          jurosCriados++;
        }
      }

      this.logger.log('Iniciando processamento de débitos e despesas gerais...');
      const contasContabeis = await this.prisma.contaContabil.findMany({ where: { organizationId } });
      const contasContabeisMap = new Map(contasContabeis.map(c => [c.nome.trim().toLowerCase(), c.id]));
      let debitosCriados = 0;

      for (const financa of financas) {
        if (processedFinancaIds.has(financa['unique id'])) {
          continue; // Já processado como crédito de venda
        }

        try {
          const rawCategoria = financa.planoContaCategoria?.trim().toLowerCase();
          const mappedCategoriaName = rawCategoria ? categoryMapping[rawCategoria] || 'despesas gerais' : 'despesas gerais';

          const contaContabilId = contasContabeisMap.get(mappedCategoriaName.toLowerCase());
          if (!contaContabilId) {
            this.logger.warn(`Categoria de conta contábil mapeada \"${mappedCategoriaName}\" não encontrada no banco para o débito \"${financa.descricao}\". Pulando.`);
            continue;
          }

          const contaCorrenteName = financa.contaCorrente?.trim().toLowerCase();
          const contaCorrenteId = contaCorrenteName ? contasCorrentesMap.get(contaCorrenteName) : undefined;

          // Criar o AccountPay (Conta a Pagar)
          const newAccountPay = await this.prisma.accountPay.create({
            data: {
              organizationId,
              description: financa.descricao || 'Pagamento diverso',
              amount: this.parseDecimal(financa.valor),
              dueDate: this.parseDate(financa.dataVencimento),
              paid: financa.baixaPagamento === 'sim',
              paidAt: financa.baixaPagamento === 'sim' ? this.parseDate(financa.dataPagamento) : null,
              contaContabilId: contaContabilId,
            }
          });

          // Criar a Transacao de Débito/Crédito se estiver paga
          if (newAccountPay.paid && newAccountPay.paidAt) {
            const transacaoTipo = this.parseDecimal(financa.valorRecebido) > 0 ? 'CREDITO' : 'DEBITO';
            const transacaoValor = this.parseDecimal(financa.valorRecebido) > 0 ? this.parseDecimal(financa.valorRecebido) : newAccountPay.amount;
            const transacaoGoldAmount = this.parseDecimal(financa.valorRecebido) > 0 ? this.parseDecimal(financa.valorRecebidoAu) : this.parseDecimal(financa.valorPagoAu);

            await this.prisma.transacao.create({
              data: {
                organizationId,
                tipo: transacaoTipo,
                valor: transacaoValor,
                goldAmount: transacaoGoldAmount,
                moeda: 'BRL',
                descricao: newAccountPay.description,
                dataHora: newAccountPay.paidAt,
                contaContabilId: contaContabilId,
                contaCorrenteId: contaCorrenteId,
                AccountPay: {
                  connect: { id: newAccountPay.id }
                }
              }
            });
          }
          debitosCriados++;
        } catch (error) {
          this.logger.error(`Erro ao importar débito com descrição \"${financa.descricao}\": ${error.message}`);
        }
      }
      
      this.logger.log(`Importação de vendas e débitos concluída.`);
      this.logger.log(`- ${createdCount} vendas criadas com sucesso.`);
      this.logger.log(`- ${debitosCriados} débitos criados com sucesso.`);
      this.logger.log(`- ${skippedCount} vendas puladas por dados ausentes ou duplicidade.`);
      this.logger.log(`- ${errorCount} vendas com erro durante a criação.`);

      return { message: `Importação concluída: ${createdCount} vendas e ${debitosCriados} débitos processados.` };

    } catch (error) {
      this.logger.error('Falha ao ler ou mapear arquivos JSON para importação de vendas.', error.stack);
      throw new Error('Falha na preparação da importação de vendas.');
    }
  }

  async importProducts(organizationId: string) {
    this.logger.log('Iniciando importação de produtos...');
    const filePath = path.join(process.cwd(), '..', '..', 'json-imports', 'produtos.json');
    const results: { status: string; name: string; reason?: string }[] = [];

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const products: any[] = JSON.parse(fileContent);

      for (const product of products) {
        const productName = product.nome || 'Produto sem nome';
        try {
          const externalId = product['unique id'];
          if (!externalId) {
            results.push({ status: 'failed', name: productName, reason: 'ID externo ausente.' });
            continue;
          }

          let productGroupId: string | undefined = undefined;
          const groupName = product.produtoGrupo;
          if (groupName) {
            const existingGroup = await this.prisma.productGroup.findFirst({
              where: { name: groupName, organizationId },
            });

            if (existingGroup) {
              productGroupId = existingGroup.id;
            } else {
              const newGroup = await this.prisma.productGroup.create({
                data: {
                  name: groupName,
                  organizationId,
                },
              });
              productGroupId = newGroup.id;
            }
          }

          const productData = {
            organizationId: organizationId,
            externalId: externalId,
            name: product.nome,
            stock: this.parseDecimal(product.quantidade) || 0,
            price: 0, // Preço não disponível no JSON
            productGroupId: productGroupId,
          };

          await this.prisma.product.upsert({
            where: { externalId: externalId },
            update: productData,
            create: productData,
          });

          results.push({ status: 'success', name: productName });
        } catch (error) {
          this.logger.error(`Falha ao importar o produto "${productName}": ${error.message}`);
          results.push({ status: 'failed', name: productName, reason: error.message });
        }
      }

      this.logger.log(`Importação de produtos concluída.`);
      return results;

    } catch (error) {
      this.logger.error('Falha ao ler ou processar o arquivo de produtos.', error.stack);
      // Retorna um erro geral se o próprio arquivo não puder ser lido
      return [{ status: 'failed', name: 'Arquivo JSON', reason: 'Não foi possível ler ou analisar o arquivo.' }];
    }
  }
}
