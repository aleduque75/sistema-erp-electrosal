import { NextRequest, NextResponse } from 'next/server';

// Ajuste a URL base para o backend conforme necessário
const API_BASE = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  const res = await fetch(`${API_BASE}/recuperacoes`);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${API_BASE}/recuperacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
