import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { PlantDiagnosisService } from './plant-diagnosis.service';
import type {
  CreatePlantRecordRequest,
  UpdateDiagnosisRequest,
  PlantRecordDetailResponse,
  DiagnosisCompleteResponse,
  PaginatedResponse,
  PlantRecord,
  CreateCareLogRequest,
  CareLog,
} from '@shared/api.interface';

@Controller('api/plant-diagnosis')
export class PlantDiagnosisController {
  constructor(private readonly service: PlantDiagnosisService) {}

  @Post('records')
  async createRecord(
    @Req() req: Request,
    @Body() dto: CreatePlantRecordRequest,
  ): Promise<{ record: PlantRecord }> {
    const { userId } = req.userContext;
    const record = await this.service.createRecord(dto, userId);
    return { record };
  }

  @Post('records/:id/complete')
  async completeDiagnosis(
    @Param('id') id: string,
    @Body() dto: UpdateDiagnosisRequest,
  ): Promise<DiagnosisCompleteResponse> {
    return this.service.completeDiagnosis(id, dto);
  }

  @Get('records')
  async listRecords(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<PaginatedResponse<PlantRecord>> {
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(parseInt(pageSize, 10) || 10, 50);
    return this.service.listRecords(p, ps);
  }

  @Get('records/:id')
  async getRecord(
    @Param('id') id: string,
  ): Promise<PlantRecordDetailResponse> {
    return this.service.getRecordDetail(id);
  }

  @Post('logs')
  async createLog(
    @Body() dto: CreateCareLogRequest,
  ): Promise<{ log: CareLog }> {
    const log = await this.service.createLog(dto);
    return { log };
  }

  @Get('records/:id/logs')
  async getLogs(
    @Param('id') id: string,
  ): Promise<{ logs: CareLog[] }> {
    const logs = await this.service.getLogsByRecord(id);
    return { logs };
  }

  @Get('records/:id/tasks')
  async getTasks(
    @Param('id') id: string,
  ): Promise<{ tasks: Array<import('@shared/api.interface').CareTask> }> {
    const tasks = await this.service.getTasksByRecord(id);
    return { tasks };
  }
}