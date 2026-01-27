'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Importar useRouter
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RoleForm } from '@/components/forms/role-form';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: { id: string; name: string }[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const { hasPermission, isLoading } = useAuth();
  const router = useRouter();

  // Proteção da Rota
  useEffect(() => {
    if (!isLoading && !hasPermission('role:read')) {
      toast.error('Você não tem permissão para acessar esta página.');
      router.push('/dashboard');
    }
  }, [isLoading, hasPermission, router]);

  async function fetchData() {
    // Não busca dados se o usuário não tiver permissão
    if (!hasPermission('role:read')) return;

    try {
      setLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions'),
      ]);
      setRoles(rolesResponse.data);
      setPermissions(permissionsResponse.data);
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
  }, [isLoading]);

  const handleOpenCreateModal = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    // A API do backend já será protegida pelo PermissionsGuard, mas é uma boa prática verificar no frontend também
    const requiredPermission = selectedRole ? 'role:update' : 'role:create';
    if (!hasPermission(requiredPermission)) {
      toast.error('Você não tem permissão para realizar esta ação.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      selectedRole ? 'Atualizando função...' : 'Criando nova função...',
    );

    try {
      if (selectedRole) {
        await api.put(`/roles/${selectedRole.id}`, values);
        toast.success('Função atualizada com sucesso!', { id: toastId });
      } else {
        await api.post('/roles', values);
        toast.success('Função criada com sucesso!', { id: toastId });
      }
      fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Ocorreu um erro.',
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (roleId: string) => {
    if (!hasPermission('role:delete')) {
      toast.error('Você não tem permissão para excluir funções.');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir esta função?')) {
      return;
    }
    const toastId = toast.loading('Excluindo função...');
    try {
      await api.delete(`/roles/${roleId}`);
      toast.success('Função excluída com sucesso!', { id: toastId });
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Ocorreu um erro ao excluir.',
        { id: toastId },
      );
    }
  };

  // Não renderiza nada até que a verificação de autenticação/permissão seja concluída
  if (isLoading || !hasPermission('role:read')) {
    return <p>Carregando ou redirecionando...</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Funções (Roles)</CardTitle>
            <CardDescription>
              Gerencie as funções dos usuários e suas permissões.
            </CardDescription>
          </div>
          {hasPermission('role:create') && (
            <Button onClick={handleOpenCreateModal}>Adicionar Nova Função</Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && <p>Carregando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell className="text-right">
                        {hasPermission('role:update') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(role)}
                          >
                            Editar
                          </Button>
                        )}
                        {hasPermission('role:delete') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleDelete(role.id)}
                          >
                            Excluir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Nenhuma função encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? 'Editar Função' : 'Adicionar Nova Função'}
            </DialogTitle>
            <DialogDescription>
              {selectedRole
                ? 'Altere os detalhes da função e suas permissões.'
                : 'Crie uma nova função e defina suas permissões.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RoleForm
              initialData={selectedRole}
              permissions={permissions}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}