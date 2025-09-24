import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class JsonImportsService {
  private readonly logger = new Logger(JsonImportsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    this.logger.warn('Iniciando a exclusão de TODAS as vendas, itens e contas a receber...');
    try {
      // A ordem é importante para evitar erros de chave estrangeira
      await this.prisma.saleItem.deleteMany({});
      this.logger.log('Itens de venda excluídos.');

      await this.prisma.accountRec.deleteMany({});
      this.logger.log('Contas a receber (duplicatas) excluídas.');

      await this.prisma.sale.deleteMany({});
      this.logger.log('Vendas excluídas.');

      this.logger.log('Exclusão completa concluída com sucesso.');
      return { message: 'Todas as vendas, itens e contas a receber foram excluídos com sucesso.' };
    } catch (error) {
      this.logger.error('Ocorreu um erro ao excluir os dados de vendas.', error.stack);
      throw new Error('Falha ao excluir dados de vendas.');
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

        // Heurística para diferenciar conta de metal e conta corrente
        // TODO: Refinar esta lógica se necessário
        const isMetalAccount = ['METAL', 'RÓDIO', 'PRATA', 'FENIX'].includes(nome.toUpperCase());

        if (isMetalAccount) {
          // Lógica para ContaMetal (a ser implementada)
          // Por enquanto, vamos pular para focar nas contas correntes
        } else {
          await this.prisma.contaCorrente.upsert({
            where: { 
              organizationId_numeroConta: {
                organizationId: organizationId,
                numeroConta: nome, // Usando nome como número da conta
              }
            },
            update: {
              saldo: this.parseDecimal(conta.saldoInicial),
            },
            create: {
              organizationId: organizationId,
              nome: nome,
              numeroConta: nome, // Usando nome como número da conta
              agencia: 'legacy',
              saldo: this.parseDecimal(conta.saldoInicial),
              moeda: 'BRL',
            },
          });
        }
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
      let linkedFinancialRecords = 0;

      this.logger.log(`Iniciando diagnóstico de ligação financeira para ${allOrderNumbers.size} pedidos...`);

      for (const financa of financas) {
        const potentialKeys = ['pedidoDuplicata', 'duplicata', 'numeroDuplicata'];
        let foundMatch = false;
        for (const key of potentialKeys) {
          const value = financa[key];
          if (value && allOrderNumbers.has(String(value))) {
            if (!financialsByOrderNumberMap.has(String(value))) {
              financialsByOrderNumberMap.set(String(value), financa);
              linkedFinancialRecords++;
              this.logger.log(`Ligação encontrada para pedido ${value} no campo '${key}'.`);
            }
            foundMatch = true;
            break; // Sai do loop de chaves pois já encontrou a ligação
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

          const newSale = await this.prisma.sale.create({
            data: {
              organizationId: organizationId,
              pessoaId: pessoa.id,
              orderNumber: pedido.numero,
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

      this.logger.log(`Importação de vendas concluída.`);
      this.logger.log(`- ${createdCount} vendas criadas com sucesso.`);
      this.logger.log(`- ${skippedCount} vendas puladas por dados ausentes ou duplicidade.`);
      this.logger.log(`- ${errorCount} vendas com erro durante a criação.`);

      return { message: `Importação de vendas concluída: ${createdCount} criadas, ${skippedCount} puladas, ${errorCount} com erro.` };

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
