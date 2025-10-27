import apiClient from '@/lib/api';
import type { CreateRecoveryOrderDto, UpdateRecoveryOrderPurityDto, FinalizeRecoveryOrderDto } from "@/types/recovery-order.dtos";
import { RecoveryOrder } from '@/types/recovery-order';

export const getRecoveryOrders = async (filters?: { startDate?: string, endDate?: string }): Promise<RecoveryOrder[]> => {
  const params = new URLSearchParams();
  if (filters?.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    params.append('endDate', filters.endDate);
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
