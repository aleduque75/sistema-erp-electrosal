import apiClient from '@/lib/api';
import { Reaction } from '@/app/(dashboard)/producao/reacoes-quimicas/page'; // Reusing the Reaction type from page.tsx

export type ChemicalReactionDetails = Reaction; // Alias for clarity if needed

export const getChemicalReactionById = async (
  id: string,
): Promise<ChemicalReactionDetails> => {
  const response = await apiClient.get(`/chemical-reactions/${id}`);
  return response.data;
};