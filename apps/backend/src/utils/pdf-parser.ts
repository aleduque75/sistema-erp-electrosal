// Esta interface define o formato que a função deve retornar
interface ParsedTransaction {
  date: string; // Formato DD/MM/YYYY
  description: string;
  value: number;
  installment?: string;
  organizationId: string;
}

/**
 * Extrai o ano da fatura a partir de linhas como "Vencimento: 08/08/2025".
 * @param text O texto completo da fatura.
 * @returns O ano como número (ex: 2025) ou o ano atual como fallback.
 */
function getStatementYear(text: string): number {
  const match = text.match(/Vencimento:\s*\d{2}\/\d{2}\/(\d{4})/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  // Se não encontrar, assume o ano atual como um fallback seguro
  return new Date().getFullYear();
}

/**
 * Analisa o texto de uma fatura de cartão de crédito do Itaú e extrai os lançamentos.
 * Esta versão é mais robusta para lidar com diferentes layouts.
 * @param text O texto completo da fatura.
 * @param organizationId O ID da organização.
 * @returns Uma promessa que resolve para um array de transações parseadas.
 */
export async function parseItauCreditCardStatement(
  text: string,
  organizationId: string,
): Promise<ParsedTransaction[]> {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');
  const year = getStatementYear(text);

  // Regex aprimorado para capturar a data, a descrição completa e o valor no final da linha.
  const transactionRegex = /^(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d.,]+)$/;
  // Regex para encontrar parcelas dentro da descrição, ex: "NOME DA LOJA 03/10"
  const installmentRegex = /(.*)\s+(\d{2}\/\d{2})$/;

  for (const line of lines) {
    const match = line.trim().match(transactionRegex);

    if (match) {
      let date = match[1];
      let description = match[2].trim();
      const valueStr = match[3];
      let installment: string | undefined = undefined;

      // Verifica se a descrição contém uma parcela no final
      const installmentMatch = description.match(installmentRegex);
      if (installmentMatch) {
        description = installmentMatch[1].trim(); // Remove a parcela da descrição
        installment = installmentMatch[2];
      }

      // Converte o valor para o formato numérico correto
      const value = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));

      // Ignora linhas que são claramente cabeçalhos ou totais
      if (
        description.toLowerCase().includes('lançamentos') ||
        description.toLowerCase().includes('total')
      ) {
        continue;
      }

      transactions.push({
        date: `${date}/${year}`, // Adiciona o ano à data
        description,
        value: Math.abs(value), // Usamos o valor absoluto
        installment,
        organizationId,
      });
    }
  }

  return transactions;
}
