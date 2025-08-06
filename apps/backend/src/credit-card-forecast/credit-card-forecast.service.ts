import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, format, startOfMonth, endOfMonth, setDate, getDate, isBefore, isAfter } from 'date-fns';

@Injectable()
export class CreditCardForecastService {
  constructor(private prisma: PrismaService) {}

  async getForecast(organizationId: string, months = 6) {
    const forecastMap = new Map<string, number>(); // Map para armazenar os totais por mês
    const today = new Date();

    // Inicializa o mapa de previsão com 0 para os próximos 'months' meses
    for (let i = 0; i < months; i++) {
      const monthKey = format(addMonths(today, i), 'MMM/yyyy');
      forecastMap.set(monthKey, 0);
    }

    // 1. Processar Transações de Cartão de Crédito (incluindo parcelas)
    const creditCardTransactions = await this.prisma.creditCardTransaction.findMany({
      where: {
        creditCard: { organizationId },
        OR: [
          { creditCardBillId: null }, // Transações não faturadas
          { creditCardBill: { paid: false } }, // Transações em faturas não pagas
        ],
      },
      include: {
        creditCard: { select: { closingDay: true, dueDate: true } },
        creditCardBill: { select: { dueDate: true, paid: true } },
      },
    });

    for (const transaction of creditCardTransactions) {
      let expectedDueDate: Date;

      if (transaction.creditCardBillId && transaction.creditCardBill && !transaction.creditCardBill?.paid) {
        // Se já está em uma fatura e a fatura não foi paga, usa a data de vencimento da fatura
        expectedDueDate = transaction.creditCardBill.dueDate;
      } else if (!transaction.creditCardBillId) {
        // Se não foi faturada, calcula a data de vencimento estimada
        const transactionDay = getDate(transaction.date);
        const closingDay = transaction.creditCard.closingDay;
        const cardDueDate = transaction.creditCard.dueDate;

        let billMonth = new Date(transaction.date);

        // Se a data da transação for APÓS o dia de fechamento, ela entra na próxima fatura
        if (transactionDay > closingDay) {
          billMonth = addMonths(billMonth, 1);
        }

        // A data de vencimento da fatura é no mês seguinte ao fechamento
        expectedDueDate = setDate(addMonths(billMonth, 1), cardDueDate);

      } else {
        // Transação já paga ou em fatura paga, não considerar na previsão
        continue;
      }

      const monthKey = format(expectedDueDate, 'MMM/yyyy');
      if (forecastMap.has(monthKey)) {
        forecastMap.set(monthKey, forecastMap.get(monthKey)! + transaction.amount.toNumber());
      }
    }

    // 2. Contas a Pagar (futuras e não pagas) - Mantém a lógica existente
    const accountsPay = await this.prisma.accountPay.findMany({
      where: {
        organizationId,
        dueDate: { gte: today }, // Apenas contas futuras
        paid: false,
      },
    });
    for (const ap of accountsPay) {
      const monthKey = format(ap.dueDate, 'MMM/yyyy');
      if (forecastMap.has(monthKey)) {
        forecastMap.set(monthKey, forecastMap.get(monthKey)! + ap.amount.toNumber());
      }
    }

    // Converte o mapa para o formato de array esperado
    const forecast: { month: string; total: number }[] = [];
    for (let i = 0; i < months; i++) {
      const monthKey = format(addMonths(today, i), 'MMM/yyyy');
      forecast.push({
        month: monthKey,
        total: forecastMap.get(monthKey) || 0,
      });
    }

    return forecast;
  }
}