import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  DailyInspection,
  InspectionDetailResponse,
  InspectionListParams,
  PaginatedResponse,
  ImportResult,
  CreateInspectionRequest,
} from '@shared/api.interface';

export const listInspections = async (
  params: InspectionListParams,
): Promise<PaginatedResponse<DailyInspection>> => {
  const res = await axiosForBackend.get<PaginatedResponse<DailyInspection>>(
    '/api/inspection',
    { params },
  );
  return res.data;
};

export const getInspectionDetail = async (
  id: string,
): Promise<InspectionDetailResponse> => {
  const res = await axiosForBackend.get<InspectionDetailResponse>(
    `/api/inspection/${id}`,
  );
  return res.data;
};

export const createInspection = async (
  dto: CreateInspectionRequest,
): Promise<InspectionDetailResponse> => {
  const res = await axiosForBackend.post<InspectionDetailResponse>(
    '/api/inspection',
    dto,
  );
  return res.data;
};

export const getAllSpecies = async (): Promise<string[]> => {
  const res = await axiosForBackend.get<{ species: string[] }>(
    '/api/inspection/species',
  );
  return res.data.species;
};

export const importExcel = async (
  data: Array<Record<string, string>>,
): Promise<ImportResult> => {
  const res = await axiosForBackend.post<ImportResult>(
    '/api/inspection/import',
    { data },
  );
  return res.data;
};

export const downloadExport = async (params: InspectionListParams): Promise<void> => {
  const res = await axiosForBackend.get('/api/inspection/export', {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  const d = new Date();
  const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  a.download = `plant-inspections-${localDate}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadTemplate = async (): Promise<void> => {
  const res = await axiosForBackend.get('/api/inspection/template', {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inspection-template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};