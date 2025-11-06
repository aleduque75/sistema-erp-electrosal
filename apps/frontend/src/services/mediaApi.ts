import api from '@/lib/api';
import { Media } from '@/types/media';

export const uploadMediaForAnaliseQuimica = async (file: File, analiseQuimicaId: string): Promise<Media> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<Media>(`/media/upload?analiseQuimicaId=${analiseQuimicaId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadMediaForRecoveryOrder = async (file: File, recoveryOrderId: string): Promise<Media> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<Media>(`/media/upload?recoveryOrderId=${recoveryOrderId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadMediaForTransacao = async (file: File, transacaoId: string): Promise<Media> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<Media>(`/media/upload?transacaoId=${transacaoId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadMediaForChemicalReaction = async (file: File, chemicalReactionId: string): Promise<Media> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<Media>(`/media/upload?chemicalReactionId=${chemicalReactionId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMediaForAnaliseQuimica = async (analiseQuimicaId: string): Promise<Media[]> => {
  const response = await api.get<Media[]>(`/media/analise-quimica/${analiseQuimicaId}`);
  return response.data;
};

export const getMediaForRecoveryOrder = async (recoveryOrderId: string): Promise<Media[]> => {
  const response = await api.get<Media[]>(`/media/recovery-order/${recoveryOrderId}`);
  return response.data;
};

export const deleteMedia = async (mediaId: string): Promise<void> => {
  await api.delete(`/media/${mediaId}`);
};