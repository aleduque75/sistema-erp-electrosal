import apiClient from '@/lib/api';
import {
  CreateRecoveryOrderDto,
  UpdateRecoveryOrderPurityDto,
  FinalizeRecoveryOrderDto,
} from '@sistema-erp-electrosal/core';
import { RecoveryOrder } from '@/types/recovery-order';

export const getRecoveryOrders = async (): Promise<RecoveryOrder[]> => {
  const response = await apiClient.get('/recovery-orders');
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
