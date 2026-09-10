import { PureMetalLot } from '@/types/pure-metal-lot';
import api from '@/lib/api';

export const getPureMetalLots = async (): Promise<PureMetalLot[]> => {
  const response = await api.get<PureMetalLot[]>('/pure-metal-lots');
  return response.data;
};

export const getPureMetalLotById = async (id: string): Promise<PureMetalLot> => {
  const response = await api.get<PureMetalLot>(`/pure-metal-lots/${id}`);
  return response.data;
};

export const updatePureMetalLot = async (id: string, data: Partial<PureMetalLot>): Promise<PureMetalLot> => {
  const response = await api.patch<PureMetalLot>(`/pure-metal-lots/${id}`, data);
  return response.data;
};

export const createPureMetalLot = async (data: Omit<PureMetalLot, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<PureMetalLot> => {
  const response = await api.post<PureMetalLot>('/pure-metal-lots', data);
  return response.data;
};

export const deletePureMetalLot = async (id: string): Promise<void> => {
  await api.delete(`/pure-metal-lots/${id}`);
};

export const liquidatePureMetalLot = async (id: string, notes?: string): Promise<PureMetalLot> => {
  const response = await api.post<PureMetalLot>(`/pure-metal-lots/${id}/liquidate`, { notes });
  return response.data;
};

export const liquidateNearZeroLots = async (
  maxGramsThreshold: number = 0.05,
  notes?: string,
): Promise<{ success: boolean; liquidatedCount: number; liquidatedLotIds: string[] }> => {
  const response = await api.post('/pure-metal-lots/liquidate-near-zero', { maxGramsThreshold, notes });
  return response.data;
};