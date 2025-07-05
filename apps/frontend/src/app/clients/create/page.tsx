'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import api from '../../../lib/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateClientPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    preferences: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Usuário não autenticado.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      toast.error('Token de acesso não encontrado.');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
      };

      await api.post('/clients', dataToSend, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      toast.success('Cliente cadastrado com sucesso!');
      router.push('/clients');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.code === 'P2002') {
        toast.error('Este e-mail já está cadastrado. Por favor, use outro e-mail.');
      } else {
        toast.error(err.message || 'Ocorreu um erro ao cadastrar o cliente.');
      }
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!user) {
    return <p>Por favor, faça login para cadastrar clientes.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="w-full max-w-lg">
          <div className="mb-4">
            <Label htmlFor="name">Nome:</Label>
            <Input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="mb-4">
            <Label htmlFor="email">Email:</Label>
            <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="mb-4">
            <Label htmlFor="phone">Telefone:</Label>
            <Input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="mb-4">
            <Label htmlFor="address">Endereço:</Label>
            <Input type="text" id="address" name="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="mb-4">
            <Label htmlFor="birthDate">Data de Nascimento:</Label>
            <Input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} />
          </div>
          <div className="mb-4">
            <Label htmlFor="gender">Gênero:</Label>
            <Input type="text" id="gender" name="gender" value={formData.gender} onChange={handleChange} />
          </div>
          <div className="mb-4">
            <Label htmlFor="preferences">Preferências:</Label>
            <textarea id="preferences" name="preferences" value={formData.preferences} onChange={handleChange} className="w-full"></textarea>
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit">Criar Cliente</Button>
            <Link href="/clients">
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}