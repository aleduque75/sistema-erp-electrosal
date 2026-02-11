// Arquivo: apps/frontend/src/app/api/cotacao/route.ts

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: 'Chave de API não configurada' },
      { status: 500 },
    );
  }

  // Símbolos para Ouro e Prata contra o Dólar Americano
  const symbols = 'XAU/USD,XAG/USD';
  const url = `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da API Twelve Data');
    }
    
    const data = await response.json();

    // O Twelve Data retorna um objeto para cada símbolo
    const precoOuro = data['XAU/USD']?.price;
    const precoPrata = data['XAG/USD']?.price;

    return NextResponse.json({
      success: true,
      timestamp: Math.floor(Date.now() / 1000), // Twelve Data não retorna um timestamp unificado, então usamos o atual
      ouro_usd_oz: precoOuro ? parseFloat(precoOuro) : null,
      prata_usd_oz: precoPrata ? parseFloat(precoPrata) : null,
      rodio_usd_oz: null, // Ródio não é coberto por esta API gratuita
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor ao buscar cotações' },
      { status: 500 },
    );
  }
}