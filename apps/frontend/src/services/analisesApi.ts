import apiClient from "@/lib/api";
// Importa o tipo AnaliseQuimica do arquivo local de tipos (frontend)
import type { AnaliseQuimica } from "@/types/analise-quimica";
import type { CreateAnaliseQuimicaDto, UpdateAnaliseQuimicaDto, LancarResultadoDto } from "@/types/analise-quimica.dtos";


export const getAnalisesQuimicas = async (params: string = ''): Promise<AnaliseQuimica[]> => {
  const response = await apiClient.get(`/analises-quimicas?${params}`);
  return response.data;
};

export const getAnaliseQuimicaById = async (
  id: string
): Promise<AnaliseQuimica> => {
  const response = await apiClient.get(`/analises-quimicas/${id}`);
  return response.data;
};

export const createAnaliseQuimica = async (
  data: CreateAnaliseQuimicaDto
): Promise<AnaliseQuimica> => {
  const response = await apiClient.post("/analises-quimicas", data);
  return response.data;
};

export const updateAnaliseQuimica = async (
  id: string,
  data: UpdateAnaliseQuimicaDto
): Promise<AnaliseQuimica> => {
  const response = await apiClient.patch(`/analises-quimicas/${id}`, data);
  return response.data;
};

export const lancarResultadoAnaliseApi = async (
  id: string,
  data: LancarResultadoDto
): Promise<AnaliseQuimica> => {
  const response = await apiClient.patch(
    `/analises-quimicas/${id}/resultado`,
    data
  );
  return response.data;
};

export const aprovarAnaliseQuimica = async (
  id: string
): Promise<AnaliseQuimica> => {
  const response = await apiClient.patch(`/analises-quimicas/${id}/aprovar`);
  return response.data;
};

export const reprovarAnaliseQuimica = async (id: string): Promise<void> => {
  await apiClient.patch(`/analises-quimicas/${id}/reprovar`);
};

export const refazerAnaliseQuimica = async (id: string): Promise<void> => {
  await apiClient.patch(`/analises-quimicas/${id}/refazer`);
};

export const revertAnaliseQuimicaToPendingApproval = async (id: string): Promise<void> => {
  await apiClient.patch(`/analises-quimicas/${id}/revert-to-pending-approval`);
};

export const getAnaliseQuimicaPdf = async (id: string): Promise<Blob> => {
  const response = await apiClient.get(`/analises-quimicas/${id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
};
