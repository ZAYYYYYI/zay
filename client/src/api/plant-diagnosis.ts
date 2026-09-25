import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  PlantRecord,
  CareTask,
  CareLog,
  PlantRecordDetailResponse,
  DiagnosisCompleteResponse,
  PaginatedResponse,
  CreateCareLogRequest,
  UpdateDiagnosisRequest,
} from '@shared/api.interface';

export const createRecord = async (imageUrl: string): Promise<PlantRecord> => {
  const res = await axiosForBackend.post<{ record: PlantRecord }>(
    '/api/plant-diagnosis/records',
    { imageUrl },
  );
  return res.data.record;
};

export const completeDiagnosis = async (
  id: string,
  data: UpdateDiagnosisRequest,
): Promise<DiagnosisCompleteResponse> => {
  const res = await axiosForBackend.post<DiagnosisCompleteResponse>(
    `/api/plant-diagnosis/records/${id}/complete`,
    data,
  );
  return res.data;
};

export const listRecords = async (
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<PlantRecord>> => {
  const res = await axiosForBackend.get<PaginatedResponse<PlantRecord>>(
    '/api/plant-diagnosis/records',
    { params: { page, pageSize } },
  );
  return res.data;
};

export const getRecordDetail = async (
  id: string,
): Promise<PlantRecordDetailResponse> => {
  const res = await axiosForBackend.get<PlantRecordDetailResponse>(
    `/api/plant-diagnosis/records/${id}`,
  );
  return res.data;
};

export const createLog = async (
  dto: CreateCareLogRequest,
): Promise<CareLog> => {
  const res = await axiosForBackend.post<{ log: CareLog }>(
    '/api/plant-diagnosis/logs',
    dto,
  );
  return res.data.log;
};

export const getLogsByRecord = async (recordId: string): Promise<CareLog[]> => {
  const res = await axiosForBackend.get<{ logs: CareLog[] }>(
    `/api/plant-diagnosis/records/${recordId}/logs`,
  );
  return res.data.logs;
};

export const getTasksByRecord = async (recordId: string): Promise<CareTask[]> => {
  const res = await axiosForBackend.get<{ tasks: CareTask[] }>(
    `/api/plant-diagnosis/records/${recordId}/tasks`,
  );
  return res.data.tasks;
};