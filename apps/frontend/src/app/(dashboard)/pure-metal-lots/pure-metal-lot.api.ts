import { PureMetalLot, PureMetalLotMovement } from '@/types/pure-metal-lot';
import api from '@/lib/api';

// Funções para PureMetalLot
export const getPureMetalLots = async (): Promise<PureMetalLot[]> => {
  const response = await api.get('/pure-metal-lots');
  return response.data;
};

export const createPureMetalLot = async (data: Partial<PureMetalLot>): Promise<PureMetalLot> => {
  const response = await api.post('/pure-metal-lots', data);
  return response.data;
};

export const updatePureMetalLot = async (id: string, data: Partial<PureMetalLot>): Promise<PureMetalLot> => {
  const response = await api.patch(`/pure-metal-lots/${id}`, data);
  return response.data;
};

export const deletePureMetalLot = async (id: string): Promise<void> => {
  await api.delete(`/pure-metal-lots/${id}`);
};

// Funções para PureMetalLotMovement
export const getPureMetalLotMovements = async (pureMetalLotId: string): Promise<PureMetalLotMovement[]> => {
  const response = await api.get('/pure-metal-lot-movements', { params: { pureMetalLotId } });
  return response.data;
};

export const createPureMetalLotMovement = async (data: Partial<PureMetalLotMovement>): Promise<PureMetalLotMovement> => {
  const response = await api.post('/pure-metal-lot-movements', data);
  return response.data;
};

export const updatePureMetalLotMovement = async (id: string, data: Partial<PureMetalLotMovement>): Promise<PureMetalLotMovement> => {
  const response = await api.patch(`/pure-metal-lot-movements/${id}`, data);
  return response.data;
};

export const deletePureMetalLotMovement = async (id: string): Promise<void> => {
  await api.delete(`/pure-metal-lot-movements/${id}`);
};
