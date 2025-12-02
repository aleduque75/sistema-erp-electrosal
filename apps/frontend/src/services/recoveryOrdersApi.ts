import apiClient from '@/lib/api';
import type { CreateRecoveryOrderDto, UpdateRecoveryOrderPurityDto, FinalizeRecoveryOrderDto } from "@/types/recovery-order.dtos";
import { RecoveryOrder } from '@/types/recovery-order';

export const getRecoveryOrders = async (filters?: { dataInicio?: string, dataFim?: string }): Promise<RecoveryOrder[]> => {
  const params = new URLSearchParams();
  if (filters?.dataInicio) {
    params.append('dataInicio', filters.dataInicio);
  }
  if (filters?.dataFim) {
    params.append('dataFim', filters.dataFim);
  }
  const response = await apiClient.get(`/recovery-orders?${params.toString()}`);
  return response.data;
};

export const createRecoveryOrder = async (
  data: CreateRecoveryOrderDto,
): Promise<RecoveryOrder> => {
  const response = await apiClient.post('/recovery-orders', data);
  return response.data;
};

export const startRecoveryOrder = async (id: string): Promise<void> => {
  await apiClient.patch(`/recovery-orders/${id}/start`);
};

export const updateRecoveryOrderPurity = async (
  id: string,
  data: UpdateRecoveryOrderPurityDto,
): Promise<void> => {
  await apiClient.patch(`/recovery-orders/${id}/update-purity`, data);
};

export const finalizeRecoveryOrder = async (
  id: string,
  data: FinalizeRecoveryOrderDto,
): Promise<void> => {
  await apiClient.patch(`/recovery-orders/${id}/finalize`, data);
};

export const cancelRecoveryOrder = async (id: string): Promise<void> => {
  await apiClient.patch(`/recovery-orders/${id}/cancel`);
};

export const getRecoveryOrderById = async (id: string): Promise<RecoveryOrder> => {
  const response = await apiClient.get(`/recovery-orders/${id}`);
  return response.data;
};
