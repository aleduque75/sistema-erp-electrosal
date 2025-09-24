import * as fs from 'fs/promises';
import * as path from 'path';

interface OldSaleData {
  cliente: string;
  'unique id': string; // externalId da venda
}

interface OldEmpresaData {
  nome: string;
  'unique id': string; // externalId da pessoa
}

async function preprocessSales() {
  // Ajustar o caminho para os arquivos JSON usando __dirname
  const jsonDirectory = path.join(__dirname, '..', '..', '..', '..', 'json-imports'); // Caminho corrigido para json-imports na raiz do monorepo

  const salesFilePath = path.join(jsonDirectory, 'pedidos.json');
  const empresasFilePath = path.join(jsonDirectory, 'Empresa.json');
  const outputFilePath = path.join(jsonDirectory, 'pedidos_com_externalId_cliente.json');

  try {
    const oldSales: OldSaleData[] = JSON.parse(await fs.readFile(salesFilePath, 'utf8'));
    const oldEmpresas: OldEmpresaData[] = JSON.parse(await fs.readFile(empresasFilePath, 'utf8'));

    const empresaExternalIdMap = new Map<string, string>();
    oldEmpresas.forEach(empresa => {
      if (empresa.nome && empresa['unique id']) {
        empresaExternalIdMap.set(empresa.nome, empresa['unique id']);
      }
    });

    const processedSales = oldSales.map(sale => {
      const clienteName = sale.cliente;
      const clienteExternalId = empresaExternalIdMap.get(clienteName);

      if (!clienteExternalId) {
        console.warn(`ExternalId para o cliente "${clienteName}" não encontrado. Venda ${sale['unique id']} será importada sem externalId de cliente.`);
        // Ou você pode optar por lançar um erro ou pular a venda
      }

      return {
        ...sale,
        clienteExternalId: clienteExternalId || null, // Adiciona o externalId do cliente
      };
    });

    await fs.writeFile(outputFilePath, JSON.stringify(processedSales, null, 2), 'utf8');
    console.log(`Arquivo pré-processado salvo em: ${outputFilePath}`);
    console.log(`Total de vendas processadas: ${processedSales.length}`);
  } catch (error) {
    console.error('Erro ao pré-processar vendas:', error);
  }
}

preprocessSales();