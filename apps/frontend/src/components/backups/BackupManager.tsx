'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Backup {
  filename: string;
  createdAt: string; // ISO string
  size: number; // bytes
}

export function BackupManager() {
  const queryClient = useQueryClient();
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

  const { data: backups, isLoading: isLoadingBackups, error: backupsError } = useQuery<Backup[]>({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await api.get('/backups', { headers: { skipAuth: true } });
      return response.data;
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      await api.post('/backups/create', {}, { headers: { skipAuth: true } });
    },
    onSuccess: () => {
      toast.success('Backup criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (error: any) => {
      toast.error(`Falha ao criar backup: ${error.response?.data?.message || error.message}`);
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      await api.post('/backups/restore', { filename }, { headers: { skipAuth: true } });
    },
    onSuccess: () => {
      toast.success('Backup restaurado com sucesso! O servidor pode precisar ser reiniciado.');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      setIsRestoreConfirmOpen(false);
      setSelectedBackup(null);
    },
    onError: (error: any) => {
      toast.error(`Falha ao restaurar backup: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleCreateBackup = () => {
    createBackupMutation.mutate();
  };

  const handleRestoreClick = (backup: Backup) => {
    setSelectedBackup(backup);
    setIsRestoreConfirmOpen(true);
  };

  const handleConfirmRestore = () => {
    if (selectedBackup) {
      restoreBackupMutation.mutate(selectedBackup.filename);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Gerenciar Backups do Banco de Dados</CardTitle>
        <Button onClick={handleCreateBackup} disabled={createBackupMutation.isPending}>
          {createBackupMutation.isPending ? 'Criando Backup...' : 'Criar Novo Backup'}
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          Crie, liste e restaure backups do seu banco de dados. A restauração é uma operação crítica e irá sobrescrever os dados atuais.
        </CardDescription>

        {isLoadingBackups ? (
          <p>Carregando backups...</p>
        ) : backupsError ? (
          <p className="text-red-500">Erro ao carregar backups: {backupsError.message}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Arquivo</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Tamanho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum backup encontrado.</TableCell>
                </TableRow>
              ) : (
                backups?.map((backup) => (
                  <TableRow key={backup.filename}>
                    <TableCell>{backup.filename}</TableCell>
                    <TableCell>{format(new Date(backup.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">{formatBytes(backup.size)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRestoreClick(backup)}
                        disabled={restoreBackupMutation.isPending}
                      >
                        Restaurar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Restauração de Backup</DialogTitle>
            <DialogDescription>
              <p className="text-red-600 font-bold mb-2">ATENÇÃO: Esta operação é CRÍTICA e IRREVERSÍVEL!</p>
              <p className="mb-2">Você tem certeza que deseja restaurar o backup <strong>{selectedBackup?.filename}</strong>?</p>
              <p className="mb-2">Isso irá sobrescrever TODOS os dados atuais do banco de dados.</p>
              <p className="text-red-600 font-bold">Após a restauração, você DEVE executar `pnpm prisma migrate deploy` no terminal do backend para garantir que o esquema do banco de dados esteja atualizado.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreConfirmOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRestore}
              disabled={restoreBackupMutation.isPending}
            >
              {restoreBackupMutation.isPending ? 'Restaurando...' : 'Confirmar Restauração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}