/**
 * Utilitários centralizados de data e fuso horário para o Backend do ERP Electrosal.
 * Fuso horário padrão do sistema: America/Sao_Paulo (Horário de Brasília - UTC-3).
 */

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formata uma data para o padrão brasileiro (DD/MM/AAAA ou DD/MM/AA).
 * 
 * Protege contra o deslocamento de 1 dia para trás ("bug do dia anterior"):
 * Quando a data foi salva com meia-noite UTC (00:00:00Z) ou vem como string "YYYY-MM-DD",
 * preserva o dia pretendido sem subtrair as 3 horas do fuso.
 * Quando possui horário real, converte e formata no fuso oficial de São Paulo.
 */
export function formatDate(
  date: string | Date | null | undefined,
  pattern: 'dd/MM/yyyy' | 'dd/MM/yy' = 'dd/MM/yyyy',
): string {
  if (!date) return '-';

  try {
    const isShortYear = pattern === 'dd/MM/yy';

    if (typeof date === 'string') {
      const trimmed = date.trim();
      // Se for formato "YYYY-MM-DD" puro
      const matchOnlyDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (matchOnlyDate) {
        const [, year, month, day] = matchOnlyDate;
        return `${day}/${month}/${isShortYear ? year.slice(-2) : year}`;
      }

      // Se for ISO com T00:00:00 ou T12:00:00
      const matchIsoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(00:00:00|12:00:00)/);
      if (matchIsoDate) {
        const [, year, month, day] = matchIsoDate;
        return `${day}/${month}/${isShortYear ? year.slice(-2) : year}`;
      }
    }

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    // Se for meia-noite UTC exata (00:00:00.000Z), representa data de calendário salva sem hora
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = String(d.getUTCFullYear());
      return `${day}/${month}/${isShortYear ? year.slice(-2) : year}`;
    }

    // Se possui hora relevante ou foi gerada com new Date(), formata no fuso de São Paulo
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: isShortYear ? '2-digit' : 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

/**
 * Formata data e hora no horário oficial de Brasília (DD/MM/AAAA HH:mm ou DD/MM/AA HH:mm).
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  pattern: 'dd/MM/yyyy HH:mm' | 'dd/MM/yy HH:mm' = 'dd/MM/yy HH:mm',
): string {
  if (!date) return '-';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    const isShortYear = pattern.includes('yy HH:mm');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: isShortYear ? '2-digit' : 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);

    return formattedDate.replace(',', '');
  } catch {
    return '-';
  }
}

/**
 * Converte uma entrada de data (ex: "2026-11-10") para um objeto Date seguro no fuso de São Paulo.
 * Define o horário para o meio-dia (12:00:00-03:00) para garantir que a data nunca volte
 * ou avance um dia devido a conversões de timezone entre banco e servidor.
 */
export function parseDateOnlyToSaoPaulo(dateInput?: string | Date | null): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T12:00:00-03:00`);
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Converte filtros de período (startDate / endDate) no formato YYYY-MM-DD
 * para instâncias de Date cobrindo todo o intervalo no horário de São Paulo,
 * sendo retrocompatível com registros antigos gravados em 00:00:00Z.
 */
export function parseDateRangeFilter(
  startDateString?: string,
  endDateString?: string,
): { startDate: Date; endDate: Date } {
  let startDate: Date;
  let endDate: Date;

  if (startDateString && startDateString.trim().length > 0) {
    startDate = startDateString.includes('T')
      ? new Date(startDateString)
      : new Date(`${startDateString.trim()}T00:00:00.000Z`);
  } else {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  if (endDateString && endDateString.trim().length > 0) {
    endDate = endDateString.includes('T')
      ? new Date(endDateString)
      : new Date(`${endDateString.trim()}T23:59:59.999-03:00`);
  } else {
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}
