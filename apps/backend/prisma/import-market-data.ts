import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const prisma = new PrismaClient();

async function fetchYahooData(symbol: string, period1: number, period2: number) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
  console.log(`Fetching ${symbol} from ${url}...`);
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('No organization found in database.');
    return;
  }
  const organizationId = org.id;
  console.log(`Importing market data for organization: ${org.name} (${organizationId})`);

  const period1 = Math.floor(new Date('2013-01-01').getTime() / 1000);
  const period2 = Math.floor(new Date().getTime() / 1000);

  const goldData = await fetchYahooData('GC=F', period1, period2);
  const silverData = await fetchYahooData('SI=F', period1, period2);
  const usdData = await fetchYahooData('USDBRL=X', period1, period2);

  console.log(`Fetched ${goldData.length} gold entries, ${silverData.length} silver entries, ${usdData.length} USD entries.`);

  // Combine data by date
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

  console.log(`Processing ${dataByDate.size} unique dates...`);

  let count = 0;
  for (const [dateKey, values] of dataByDate.entries()) {
    if (values.gold && values.silver && values.usd) {
      const date = new Date(dateKey + 'T12:00:00Z');
      
      await prisma.marketData.upsert({
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
      if (count % 100 === 0) console.log(`Processed ${count} entries...`);
    }
  }

  console.log(`Finished! Successfully imported/updated ${count} market data entries.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
