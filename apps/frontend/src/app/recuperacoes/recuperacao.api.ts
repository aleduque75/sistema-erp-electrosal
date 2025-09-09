import { RecuperacaoDto } from '@/types/recuperacao';

export async function getRecuperacoes(): Promise<RecuperacaoDto[]> {
  const res = await fetch('/api/recuperacoes');
  if (!res.ok) throw new Error('Erro ao buscar recuperações');
  return res.json();
}

export async function createRecuperacao(data: Partial<RecuperacaoDto>): Promise<RecuperacaoDto> {
  const res = await fetch('/api/recuperacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao criar recuperação');
  return res.json();
}

export async function updateRecuperacao(id: string, data: Partial<RecuperacaoDto>): Promise<RecuperacaoDto> {
  const res = await fetch(`/api/recuperacoes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar recuperação');
  return res.json();
}

export async function deleteRecuperacao(id: string): Promise<void> {
  const res = await fetch(`/api/recuperacoes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar recuperação');
}
