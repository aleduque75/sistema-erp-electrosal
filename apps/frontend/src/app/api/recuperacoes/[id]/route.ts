import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.BACKEND_URL || 'http://localhost:3003';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${API_BASE}/recovery-orders/${params.id}`);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const res = await fetch(`${API_BASE}/recovery-orders/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await fetch(`${API_BASE}/recovery-orders/${params.id}`, { method: 'DELETE' });
  return NextResponse.json({ ok: true });
}
