'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WhatsappRoutinesApiClient, WhatsappRoutine } from '../../../../lib/api/WhatsappRoutinesApiClient';

// Definição local do DTO para uso no frontend
type CreateWhatsappRoutineDto = {
  name: string;
  trigger: string;
  description: string;
  isActive: boolean;
  steps: string;
};


const initialRoutine = { name: '', trigger: '', description: '', isActive: true, steps: '[]' };

const WhatsappRoutinesPage = () => {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(null);
      }
    }
    if (actionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenuOpen]);

  const [routines, setRoutines] = useState<WhatsappRoutine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoutine, setNewRoutine] = useState<CreateWhatsappRoutineDto>(initialRoutine);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<WhatsappRoutine | null>(null);
  const [editRoutine, setEditRoutine] = useState<CreateWhatsappRoutineDto>(initialRoutine);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const data = await WhatsappRoutinesApiClient.getAll();
      setRoutines(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setNewRoutine((prev: CreateWhatsappRoutineDto) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setEditRoutine((prev: CreateWhatsappRoutineDto) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validação básica do JSON steps
      JSON.parse(newRoutine.steps); 
    const initialRoutine: CreateWhatsappRoutineDto = { name: '', trigger: '', description: '', isActive: true, steps: '[]' };
      setNewRoutine({ name: '', trigger: '', description: '', isActive: true, steps: '[]' });
      fetchRoutines(); // Recarrega a lista
    } catch (err) {
      setError(`Erro ao criar rotina: ${(err as Error).message}. Verifique se os passos são um JSON válido.`);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta rotina?')) {
      try {
        await WhatsappRoutinesApiClient.remove(id);
        fetchRoutines();
      } catch (err) {
        setError(`Erro ao deletar rotina: ${(err as Error).message}`);
      }
    }
  };


  const openEditDialog = (routine: WhatsappRoutine) => {
    setRoutineToEdit(routine);
    setEditRoutine({
      name: routine.name,
      trigger: routine.trigger,
      description: routine.description || '',
      isActive: routine.isActive,
      steps: routine.steps || '[]',
    });
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setRoutineToEdit(null);
  };

  const handleEditRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineToEdit) return;
    try {
      JSON.parse(editRoutine.steps);
      await WhatsappRoutinesApiClient.update(routineToEdit.id, editRoutine);
      closeEditDialog();
      fetchRoutines();
    } catch (err) {
      setError(`Erro ao editar rotina: ${(err as Error).message}. Verifique se os passos são um JSON válido.`);
    }
  };

  if (loading) return <div className="p-4">Carregando rotinas...</div>;
  if (error) return <div className="p-4 text-red-600">Erro: {error}</div>;

  return (
    <div className="container mx-auto p-4 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Rotinas de WhatsApp</h1>
      {/* Dialog de Edição */}
      {editDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-lg relative">
            <button onClick={closeEditDialog} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl">×</button>
            <h2 className="text-xl font-semibold mb-4">Editar Rotina</h2>
            <form onSubmit={handleEditRoutine} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Nome da Rotina</label>
                <input type="text" id="edit-name" name="name" value={editRoutine.name} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="edit-trigger" className="block text-sm font-medium text-gray-700">Gatilho (Comando)</label>
                <input type="text" id="edit-trigger" name="trigger" value={editRoutine.trigger} onChange={handleEditInputChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea id="edit-description" name="description" value={editRoutine.description} onChange={handleEditInputChange} rows={3} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
              </div>
              <div>
                <label htmlFor="edit-steps" className="block text-sm font-medium text-gray-700">Passos (JSON)</label>
                <textarea id="edit-steps" name="steps" value={editRoutine.steps} onChange={handleEditInputChange} rows={5} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required></textarea>
              </div>
              <div className="flex items-center">
                <input id="edit-isActive" name="isActive" type="checkbox" checked={editRoutine.isActive} onChange={handleEditInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="edit-isActive" className="ml-2 block text-sm text-gray-900">Ativa</label>
              </div>
              <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Formulário de Criação */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Criar Nova Rotina</h2>
        <form onSubmit={handleCreateRoutine} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Rotina</label>
            <input type="text" id="name" name="name" value={newRoutine.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="trigger" className="block text-sm font-medium text-gray-700">Gatilho (Comando)</label>
            <input type="text" id="trigger" name="trigger" value={newRoutine.trigger} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="/exemplo" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea id="description" name="description" value={newRoutine.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
          </div>
          <div>
            <label htmlFor="steps" className="block text-sm font-medium text-gray-700">Passos (JSON)</label>
            <textarea id="steps" name="steps" value={newRoutine.steps} onChange={handleInputChange} rows={5} className="mt-1 block w-full rounded-md bg-background border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='[{"type": "text", "message": "Olá!"}]' required></textarea>
          </div>
          <div className="flex items-center">
            <input id="isActive" name="isActive" type="checkbox" checked={newRoutine.isActive} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Ativa</label>
          </div>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Criar Rotina
          </button>
        </form>
      </div>

      {/* Tabela de Rotinas Existentes */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Rotinas Existentes</h2>
        <table className="table-auto">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Gatilho</th>
              <th scope="col">Descrição</th>
              <th scope="col">Ativa</th>
              <th scope="col" className="w-12 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {routines.map(routine => (
              <tr key={routine.id}>
                <td>{routine.name}</td>
                <td>{routine.trigger}</td>
                <td style={{whiteSpace: 'pre-line'}}>{routine.description}</td>
                <td>{routine.isActive ? 'Sim' : 'Não'}</td>
                <td className="relative text-center">
                  <button
                    aria-label="Ações"
                    className="p-2 rounded-full hover:bg-muted focus:outline-none"
                    onClick={() => setActionMenuOpen(actionMenuOpen === routine.id ? null : routine.id)}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>
                  {actionMenuOpen === routine.id && (
                    <div ref={actionMenuRef} className="absolute right-0 z-10 mt-2 w-32 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <button
                          onClick={() => { openEditDialog(routine); setActionMenuOpen(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-muted hover:text-indigo-900"
                        >Editar</button>
                        <button
                          onClick={() => { handleDeleteRoutine(routine.id); setActionMenuOpen(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted hover:text-red-900"
                        >Deletar</button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WhatsappRoutinesPage;
