import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketDataDto } from './dto/create-market-data.dto';
import { UpdateMarketDataDto } from './dto/update-market-data.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  constructor(private prisma: PrismaService) {}

  private readonly TROY_OUNCE_TO_GRAMS = 31.1034768;

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.log('Starting automatic market data synchronization...');
    try {
      const organizations = await this.prisma.organization.findMany({
        select: { id: true, name: true }
      });

      for (const org of organizations) {
        this.logger.log(`Syncing data for organization: ${org.name}`);
        const result = await this.sync(org.id);
        this.logger.log(`Sync completed for ${org.name}: ${result.count} entries processed.`);
      }
      this.logger.log('Automatic synchronization finished successfully.');
    } catch (error) {
      this.logger.error('Error during automatic synchronization:', error.message);
    }
  }

  async create(organizationId: string, createMarketDataDto: CreateMarketDataDto) {
    const { date, usdPrice, goldTroyPrice, silverTroyPrice } = createMarketDataDto;
    
    // Normalize date to avoid timezone issues
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(12, 0, 0, 0);

    return this.prisma.marketData.upsert({
      where: {
        organizationId_date: {
          organizationId,
          date: normalizedDate,
        },
      },
      update: {
        usdPrice,
        goldTroyPrice,
        silverTroyPrice,
      },
      create: {
        organizationId,
        date: normalizedDate,
        usdPrice,
        goldTroyPrice,
        silverTroyPrice,
      },
    });
  }

  async findAll(organizationId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const data = await this.prisma.marketData.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return data.map(item => this.calculateGramPrices(item));
  }

  async findOne(organizationId: string, date: string) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(12, 0, 0, 0);

    const item = await this.prisma.marketData.findUnique({
      where: {
        organizationId_date: {
          organizationId,
          date: normalizedDate,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Market data for date ${date} not found.`);
    }

    return this.calculateGramPrices(item);
  }

  async findLatest(organizationId: string) {
    const item = await this.prisma.marketData.findFirst({
      where: { organizationId },
      orderBy: { date: 'desc' },
    });

    if (!item) return null;

    return this.calculateGramPrices(item);
  }

  async update(id: string, organizationId: string, updateMarketDataDto: UpdateMarketDataDto) {
    return this.prisma.marketData.update({
      where: { id, organizationId },
      data: updateMarketDataDto,
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.marketData.delete({
      where: { id, organizationId },
    });
  }

  async sync(organizationId: string) {
    const period1 = Math.floor(new Date('2013-01-01').getTime() / 1000);
    const period2 = Math.floor(new Date().getTime() / 1000);

    const goldData = await this.fetchYahooData('GC=F', period1, period2);
    const silverData = await this.fetchYahooData('SI=F', period1, period2);
    const usdData = await this.fetchYahooData('USDBRL=X', period1, period2);

    const dataByDate: Map<string, { gold?: number, silver?: number, usd?: number }> = new Map();

    goldData.forEach(d => {
      const dateKey = d.date.toISOString().split('T')[0];
      dataByDate.set(dateKey, { ...dataByDate.get(dateKey), gold: d.price });
    });

    silverData.forEach(d => {
      const dateKey = d.date.toISOString().split('T')[0];
      dataByDate.set(dateKey, { ...dataByDate.get(dateKey), silver: d.price });
    });

    usdData.forEach(d => {
      const dateKey = d.date.toISOString().split('T')[0];
      dataByDate.set(dateKey, { ...dataByDate.get(dateKey), usd: d.price });
    });

    let count = 0;
    for (const [dateKey, values] of dataByDate.entries()) {
      if (values.gold && values.silver && values.usd) {
        const date = new Date(dateKey + 'T12:00:00Z');
        
        await this.prisma.marketData.upsert({
          where: {
            organizationId_date: {
              organizationId,
              date,
            },
          },
          update: {
            goldTroyPrice: values.gold,
            silverTroyPrice: values.silver,
            usdPrice: values.usd,
          },
          create: {
            organizationId,
            date,
            goldTroyPrice: values.gold,
            silverTroyPrice: values.silver,
            usdPrice: values.usd,
          },
        });
        count++;
      }
    }

    return { success: true, count };
  }

  private async fetchYahooData(symbol: string, period1: number, period2: number) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0].close;
      
      return timestamps.map((ts: number, i: number) => ({
        date: new Date(ts * 1000),
        price: quotes[i],
      })).filter((item: any) => item.price !== null);
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error.message);
      return [];
    }
  }

  private calculateGramPrices(item: any) {
    const usdPrice = Number(item.usdPrice);
    const goldTroyPrice = Number(item.goldTroyPrice);
    const silverTroyPrice = Number(item.silverTroyPrice);

    const goldPricePerGramUSD = goldTroyPrice / this.TROY_OUNCE_TO_GRAMS;
    const silverPricePerGramUSD = silverTroyPrice / this.TROY_OUNCE_TO_GRAMS;

    const goldPricePerGramBRL = goldPricePerGramUSD * usdPrice;
    const silverPricePerGramBRL = silverPricePerGramUSD * usdPrice;

    return {
      ...item,
      goldPricePerGramUSD,
      silverPricePerGramUSD,
      goldPricePerGramBRL,
      silverPricePerGramBRL,
    };
  }
}
