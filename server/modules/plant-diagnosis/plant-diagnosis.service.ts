import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, count, ilike } from 'drizzle-orm';
import { plantRecord, careTask, careLog, careCard } from '@server/database/schema';
import type {
  PlantRecord,
  CareTask,
  CareLog,
  CreatePlantRecordRequest,
  UpdateDiagnosisRequest,
  PlantRecordDetailResponse,
  DiagnosisCompleteResponse,
  PaginatedResponse,
  CreateCareLogRequest,
  CareCard,
  CareTaskJSON,
} from '@shared/api.interface';

@Injectable()
export class PlantDiagnosisService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async createRecord(
    dto: CreatePlantRecordRequest,
    userId: string,
  ): Promise<PlantRecord> {
    const [record] = await this.db
      .insert(plantRecord)
      .values({
        imageUrl: dto.imageUrl,
        status: 'pending',
        createdBy: userId,
        updatedBy: userId,
      } as typeof plantRecord.$inferInsert)
      .returning();

    return this.mapRecord(record);
  }

  async completeDiagnosis(
    id: string,
    dto: UpdateDiagnosisRequest,
  ): Promise<DiagnosisCompleteResponse> {
    const [record] = await this.db
      .select()
      .from(plantRecord)
      .where(eq(plantRecord.id, id));

    if (!record) throw new NotFoundException('检测记录不存在');

    const [updated] = await this.db
      .update(plantRecord)
      .set({
        plantSpecies: dto.plantSpecies,
        diagnosisType: dto.diagnosisType,
        diagnosisDetail: dto.diagnosisDetail,
        causeAnalysis: dto.causeAnalysis,
        careSuggestion: dto.careSuggestion,
        status: 'completed',
      } as Partial<typeof plantRecord.$inferInsert>)
      .where(eq(plantRecord.id, id))
      .returning();

    if (!updated) throw new NotFoundException('检测记录不存在');

    const tasks: CareTask[] = [];
    if (dto.careTasks && dto.careTasks.length > 0) {
      const inserted = await this.db
        .insert(careTask)
        .values(
          dto.careTasks.map((ct: CareTaskJSON) => ({
            recordId: id,
            taskType: ct.taskType,
            deviceType: ct.deviceType,
            deviceAction: ct.deviceAction,
            duration: ct.duration,
            executionStatus: 'pending',
          } as typeof careTask.$inferInsert)),
        )
        .returning();
      tasks.push(...inserted.map((t) => this.mapTask(t)));
    }

    const card = await this.findOrCreateCareCard(dto.plantSpecies);

    await this.db
      .insert(careLog)
      .values({
        recordId: id,
        logType: 'detection',
        content: `AI 诊断完成：${dto.plantSpecies}（${dto.diagnosisType}），已生成 ${tasks.length} 项养护任务`,
      } as typeof careLog.$inferInsert);

    return {
      record: this.mapRecord(updated),
      tasks,
      careCard: card,
    };
  }

  private async findOrCreateCareCard(
    plantSpecies: string,
  ): Promise<CareCard | null> {
    const [existing] = await this.db
      .select()
      .from(careCard)
      .where(ilike(careCard.plantSpecies, `%${plantSpecies}%`))
      .limit(1);

    if (existing) return this.mapCard(existing);

    return null;
  }

  async listRecords(
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<PlantRecord>> {
    const offset = (page - 1) * pageSize;
    const items = await this.db
      .select()
      .from(plantRecord)
      .orderBy(desc(plantRecord.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(plantRecord);

    return {
      items: items.map((r) => this.mapRecord(r)),
      total,
    };
  }

  async getRecordDetail(id: string): Promise<PlantRecordDetailResponse> {
    const [record] = await this.db
      .select()
      .from(plantRecord)
      .where(eq(plantRecord.id, id));

    if (!record) throw new NotFoundException('检测记录不存在');

    const tasks = await this.db
      .select()
      .from(careTask)
      .where(eq(careTask.recordId, id))
      .orderBy(desc(careTask.createdAt));

    const logs = await this.db
      .select()
      .from(careLog)
      .where(eq(careLog.recordId, id))
      .orderBy(desc(careLog.createdAt));

    let card: CareCard | null = null;
    if (record.plantSpecies) {
      const [existing] = await this.db
        .select()
        .from(careCard)
        .where(ilike(careCard.plantSpecies, `%${record.plantSpecies}%`))
        .limit(1);
      if (existing) card = this.mapCard(existing);
    }

    return {
      record: this.mapRecord(record),
      tasks: tasks.map((t) => this.mapTask(t)),
      careCard: card,
      logs: logs.map((l) => this.mapLog(l)),
    };
  }

  async createLog(dto: CreateCareLogRequest): Promise<CareLog> {
    const [log] = await this.db
      .insert(careLog)
      .values({
        recordId: dto.recordId,
        taskId: dto.taskId || null,
        logType: dto.logType,
        content: dto.content,
      } as typeof careLog.$inferInsert)
      .returning();

    return this.mapLog(log);
  }

  async getLogsByRecord(recordId: string): Promise<CareLog[]> {
    const logs = await this.db
      .select()
      .from(careLog)
      .where(eq(careLog.recordId, recordId))
      .orderBy(desc(careLog.createdAt));

    return logs.map((l) => this.mapLog(l));
  }

  async getTasksByRecord(recordId: string): Promise<CareTask[]> {
    const tasks = await this.db
      .select()
      .from(careTask)
      .where(eq(careTask.recordId, recordId))
      .orderBy(desc(careTask.createdAt));

    return tasks.map((t) => this.mapTask(t));
  }

  private mapRecord(r: typeof plantRecord.$inferSelect): PlantRecord {
    return {
      id: r.id,
      imageUrl: r.imageUrl,
      plantSpecies: r.plantSpecies,
      diagnosisType: r.diagnosisType,
      diagnosisDetail: r.diagnosisDetail,
      causeAnalysis: r.causeAnalysis,
      careSuggestion: r.careSuggestion,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private mapTask(t: typeof careTask.$inferSelect): CareTask {
    return {
      id: t.id,
      recordId: t.recordId,
      taskType: t.taskType,
      deviceType: t.deviceType,
      deviceAction: t.deviceAction,
      duration: t.duration,
      executionStatus: t.executionStatus,
      createdAt: t.createdAt.toISOString(),
    };
  }

  private mapLog(l: typeof careLog.$inferSelect): CareLog {
    return {
      id: l.id,
      recordId: l.recordId,
      taskId: l.taskId,
      logType: l.logType,
      content: l.content,
      createdAt: l.createdAt.toISOString(),
    };
  }

  private mapCard(c: typeof careCard.$inferSelect): CareCard {
    return {
      id: c.id,
      plantSpecies: c.plantSpecies,
      plantIconUrl: c.plantIconUrl,
      wateringGuide: c.wateringGuide,
      lightingGuide: c.lightingGuide,
      fertilizingGuide: c.fertilizingGuide,
      temperatureGuide: c.temperatureGuide,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
    };
  }
}