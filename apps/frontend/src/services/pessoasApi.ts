import apiClient from '@/lib/api';
import { Pessoa } from '@/@types/pessoa';

export const getPessoas = async (role?: 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO'): Promise<Pessoa[]> => {
  const response = await apiClient.get('/pessoas', {
    params: { role },
  });
  return response.data;
};
