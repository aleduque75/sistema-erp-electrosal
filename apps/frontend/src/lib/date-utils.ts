/**
 * Utilitários centralizados de data e fuso horário para o ERP Electrosal.
 * Fuso horário padrão do sistema: America/Sao_Paulo (Horário de Brasília - UTC-3).
 */

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formata uma data para o padrão brasileiro (DD/MM/AAAA).
 * 
 * Inteligente contra o "bug do dia anterior":
 * Para datas de calendário/vencimento (ex: "2026-09-08" ou "2026-09-08T00:00:00.000Z"),
 * preserva o dia exato sem subtrair as 3 horas do fuso.
 * Para timestamps com horário relevante (ex: createdAt), converte para o dia local de Brasília.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';

  try {
    if (typeof date === 'string') {
      const trimmed = date.trim();
      // Se for formato "YYYY-MM-DD" puro
      const matchOnlyDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (matchOnlyDate) {
        const [, year, month, day] = matchOnlyDate;
        return `${day}/${month}/${year}`;
      }

      // Se for ISO com T00:00:00 ou T12:00:00 (vencimentos do banco)
      const matchIsoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(00:00:00|12:00:00)/);
      if (matchIsoDate) {
        const [, year, month, day] = matchIsoDate;
        return `${day}/${month}/${year}`;
      }

      // Se for outro timestamp ISO completo (ex: createdAt), formata no fuso de Brasília
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return trimmed;
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BRAZIL_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    }

    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '-';
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BRAZIL_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    }

    return String(date);
  } catch (err) {
    console.error('Erro ao formatar data:', date, err);
    return '-';
  }
}

/**
 * Formata data e hora no horário oficial de Brasília (DD/MM/AAAA HH:mm).
 * Usado para registros com timestamp preciso (vendas, logs, pedidos, transações).
 */
export function formatDateTime(
  date: string | Date | null | undefined, 
  includeSeconds = false
): string {
  if (!date) return '-';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
    }).format(d);
  } catch (err) {
    console.error('Erro ao formatar data e hora:', date, err);
    return '-';
  }
}

/**
 * Formata uma data para o valor aceito por campos <input type="date" /> (AAAA-MM-DD).
 * Garante que a data selecionada não retroceda 1 dia por efeito de timezone.
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';

  if (typeof date === 'string') {
    const trimmed = date.trim();
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    // Extrai no fuso de Brasília
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: BRAZIL_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d); // Retorna formato YYYY-MM-DD
  } catch {
    return '';
  }
}
