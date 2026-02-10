import apiClient from '@/lib/api';
import { ChemicalReactionDetails as Reaction } from '@/types/chemical-reaction';

export type ChemicalReactionDetails = Reaction; // Alias for clarity if needed

export const getChemicalReactionById = async (
  id: string,
): Promise<ChemicalReactionDetails> => {
  const response = await apiClient.get(`/chemical-reactions/${id}`);
  return response.data;
};