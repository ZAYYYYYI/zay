export interface DiagnosisJSON {
  plantSpecies: string;
  diagnosisType: string;
  diagnosisDetail: string;
  causeAnalysis: string;
  careSuggestion: string;
  careTasks: CareTaskJSON[];
}

export interface CareTaskJSON {
  taskType: string;
  deviceType: string;
  deviceAction: string;
  duration: number;
}

export interface PlantRecord {
  id: string;
  imageUrl: string | null;
  plantSpecies: string | null;
  diagnosisType: string | null;
  diagnosisDetail: string | null;
  causeAnalysis: string | null;
  careSuggestion: string | null;
  status: string;
  createdAt: string;
}

export interface CareTask {
  id: string;
  recordId: string | null;
  taskType: string;
  deviceType: string;
  deviceAction: string;
  duration: number | null;
  executionStatus: string;
  createdAt: string;
}

export interface CareLog {
  id: string;
  recordId: string | null;
  taskId: string | null;
  logType: string;
  content: string;
  createdAt: string;
}

export interface CareCard {
  id: string;
  plantSpecies: string;
  plantIconUrl: string | null;
  wateringGuide: string | null;
  lightingGuide: string | null;
  fertilizingGuide: string | null;
  temperatureGuide: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreatePlantRecordRequest {
  imageUrl: string;
}

export interface UpdateDiagnosisRequest {
  plantSpecies: string;
  diagnosisType: string;
  diagnosisDetail: string;
  causeAnalysis: string;
  careSuggestion: string;
  careTasks: CareTaskJSON[];
}

export interface PlantRecordDetailResponse {
  record: PlantRecord;
  tasks: CareTask[];
  careCard: CareCard | null;
  logs: CareLog[];
}

export interface DiagnosisCompleteResponse {
  record: PlantRecord;
  tasks: CareTask[];
  careCard: CareCard | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface DailyInspection {
  id: string;
  recordId: string | null;
  plantSpecies: string;
  inspectionDate: string;
  plantCondition: string;
  appearance: string | null;
  leafCondition: string | null;
  soilCondition: string | null;
  pestStatus: string | null;
  images: string | null;
  notes: string | null;
  createdAt: string;
}

export interface FertilizationRecord {
  id: string;
  inspectionId: string | null;
  recordId: string | null;
  fertilizerName: string;
  fertilizerType: string;
  dosage: string | null;
  applicationMethod: string | null;
  applicationDate: string;
  nextApplicationDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateInspectionRequest {
  recordId: string | null;
  plantSpecies: string;
  inspectionDate: string;
  plantCondition: string;
  appearance?: string;
  leafCondition?: string;
  soilCondition?: string;
  pestStatus?: string;
  notes?: string;
  fertilizerName?: string;
  fertilizerType?: string;
  dosage?: string;
  applicationMethod?: string;
  applicationDate?: string;
}

export interface InspectionDetailResponse {
  inspection: DailyInspection;
  fertilization: FertilizationRecord | null;
}

export interface InspectionListParams {
  page?: number;
  pageSize?: number;
  plantSpecies?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface CreateCareLogRequest {
  recordId: string;
  taskId?: string;
  logType: string;
  content: string;
}