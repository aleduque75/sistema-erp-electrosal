'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name?: string | null;
  roles: { id: string; name: string }[];
  pessoa?: { id: string; name: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { hasPermission, isLoading } = useAuth();
  const router = useRouter();

  // Proteção da Rota
  useEffect(() => {
    if (!isLoading && !hasPermission('user:read')) {
      toast.error('Você não tem permissão para acessar esta página.');
      router.push('/dashboard');
    }
  }, [isLoading, hasPermission, router]);

  async function fetchData() {
    if (!hasPermission('user:read')) return;

    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
  }, [isLoading]);

  const handleEdit = (userId: string) => {
    // Implementar a lógica de edição, talvez abrindo um modal ou navegando para /admin/users/[id]
    toast.info(`Editar usuário ${userId} (funcionalidade a ser implementada)`);
  };

  const handleDelete = async (userId: string) => {
    if (!hasPermission('user:delete')) {
      toast.error('Você não tem permissão para excluir usuários.');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }
    const toastId = toast.loading('Excluindo usuário...');
    try {
      await api.delete(`/users/${userId}`);
      toast.success('Usuário excluído com sucesso!', { id: toastId });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Ocorreu um erro ao excluir.',
        { id: toastId },
      );
    }
  };

  if (isLoading || !hasPermission('user:read')) {
    return <p>Carregando ou redirecionando...</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Gerencie os usuários do sistema e suas funções.
            </CardDescription>
          </div>
          {hasPermission('user:create') && (
            <Button onClick={() => toast.info('Adicionar usuário (implementar modal)')}>
              Adicionar Novo Usuário
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && <p>Carregando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Pessoa Associada</TableHead>
                  <TableHead>Funções</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.pessoa?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {user.roles.map((role) => role.name).join(', ')}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasPermission('user:update') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user.id)}
                          >
                            Editar
                          </Button>
                        )}
                        {hasPermission('user:delete') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleDelete(user.id)}
                          >
                            Excluir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
