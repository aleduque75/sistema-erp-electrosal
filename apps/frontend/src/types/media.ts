export interface Media {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
  height?: number;
  width?: number;
  recoveryOrderId?: string;
  analiseQuimicaId?: string;
}