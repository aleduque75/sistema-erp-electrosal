'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContaCorrente {
  id: string;
  numeroConta: string;
  saldo: number;
  moeda: string;
  dataAbertura: string;
}

export default function EditContaCorrentePage() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    numeroConta: '',
    saldo: '',
    moeda: '',
    dataAbertura: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && id) {
      fetchContaCorrente();
    }
  }, [user, loading, id]);

  const fetchContaCorrente = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await api.get(`/contas-correntes/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setFormData({
        numeroConta: response.data.numeroConta || '',
        saldo: response.data.saldo !== undefined ? response.data.saldo.toString() : '',
        moeda: response.data.moeda || '',
        dataAbertura: response.data.dataAbertura ? new Date(response.data.dataAbertura).toISOString().split('T')[0] : '',
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('User not authenticated.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setError('Access token not found.');
      return;
    }

    try {
      await api.patch(`/contas-correntes/${id}`, {
        ...formData,
        saldo: parseFloat(formData.saldo),
        dataAbertura: formData.dataAbertura ? new Date(formData.dataAbertura).toISOString() : null,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      router.push(`/contas-correntes/${id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>Please log in to edit current accounts.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Conta Corrente</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="numeroConta">Número da Conta</Label>
            <Input type="text" id="numeroConta" name="numeroConta" value={formData.numeroConta} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="saldo">Saldo</Label>
            <Input type="number" id="saldo" name="saldo" value={formData.saldo} onChange={handleChange} step="0.01" required />
          </div>
          <div>
            <Label htmlFor="moeda">Moeda</Label>
            <Input type="text" id="moeda" name="moeda" value={formData.moeda} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="dataAbertura">Data de Abertura</Label>
            <Input type="date" id="dataAbertura" name="dataAbertura" value={formData.dataAbertura} onChange={handleChange} required />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="submit">Salvar Alterações</Button>
            <Link href={`/contas-correntes/${id}`}>
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
