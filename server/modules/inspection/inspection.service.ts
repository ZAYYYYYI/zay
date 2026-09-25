import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, count, and, gte, lte, ilike, or } from 'drizzle-orm';
import {
  dailyInspection,
  fertilizationRecord,
} from '@server/database/schema';
import type {
  DailyInspection,
  FertilizationRecord,
  CreateInspectionRequest,
  InspectionDetailResponse,
  InspectionListParams,
  ImportResult,
} from '@shared/api.interface';

type InferSelect<T> = T extends { $inferSelect: infer S } ? S : never;

const FERTILIZER_CYCLES: Record<string, number> = {
  organic: 30,
  chemical: 15,
  slow_release: 90,
  liquid: 7,
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InspectionService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async listInspections(
    params: InspectionListParams,
  ): Promise<import('@shared/api.interface').PaginatedResponse<DailyInspection>> {
    const { page, pageSize, plantSpecies, startDate, endDate, keyword } =
      params;
    const conditions: ReturnType<typeof eq>[] = [];

    if (plantSpecies) conditions.push(eq(dailyInspection.plantSpecies, plantSpecies));
    if (startDate) conditions.push(gte(dailyInspection.inspectionDate, startDate));
    if (endDate) conditions.push(lte(dailyInspection.inspectionDate, endDate));
    if (keyword) {
      conditions.push(
        or(
          ilike(dailyInspection.plantCondition, `%${keyword}%`),
          ilike(dailyInspection.appearance, `%${keyword}%`),
        ),
      );
    }

    const offset = (page - 1) * pageSize;
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db
      .select()
      .from(dailyInspection)
      .where(where)
      .orderBy(desc(dailyInspection.inspectionDate), desc(dailyInspection.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(dailyInspection)
      .where(where);

    return {
      items: items.map((i) => this.mapInspection(i as InferSelect<typeof dailyInspection>)),
      total,
    };
  }

  async getDetail(id: string): Promise<InspectionDetailResponse> {
    const [inspection] = await this.db
      .select()
      .from(dailyInspection)
      .where(eq(dailyInspection.id, id));

    if (!inspection) throw new NotFoundException('检查记录不存在');

    const [fert] = await this.db
      .select()
      .from(fertilizationRecord)
      .where(eq(fertilizationRecord.inspectionId, id))
      .limit(1);

    return {
      inspection: this.mapInspection(inspection as InferSelect<typeof dailyInspection>),
      fertilization: fert
        ? this.mapFertilization(fert as InferSelect<typeof fertilizationRecord>)
        : null,
    };
  }

  async createInspection(
    dto: CreateInspectionRequest,
  ): Promise<InspectionDetailResponse> {
    const [inspection] = await this.db
      .insert(dailyInspection)
      .values({
        recordId: dto.recordId || null,
        plantSpecies: dto.plantSpecies,
        inspectionDate: dto.inspectionDate,
        plantCondition: dto.plantCondition,
        appearance: dto.appearance || null,
        leafCondition: dto.leafCondition || null,
        soilCondition: dto.soilCondition || null,
        pestStatus: dto.pestStatus || null,
        notes: dto.notes || null,
      } as typeof dailyInspection.$inferInsert)
      .returning();

    let fert: InferSelect<typeof fertilizationRecord> | null = null;

    if (dto.fertilizerName) {
      const appDate = dto.applicationDate
        ? new Date(dto.applicationDate)
        : new Date();
      const cycle =
        FERTILIZER_CYCLES[dto.fertilizerType || ''] || FERTILIZER_CYCLES.chemical;
      const nextDate = addDays(appDate, cycle);

      const [inserted] = await this.db
        .insert(fertilizationRecord)
        .values({
          inspectionId: (inspection as InferSelect<typeof dailyInspection>).id,
          recordId: dto.recordId || null,
          fertilizerName: dto.fertilizerName,
          fertilizerType: dto.fertilizerType || 'chemical',
          dosage: dto.dosage || null,
          applicationMethod: dto.applicationMethod || null,
          applicationDate: appDate.toISOString().slice(0, 10),
          nextApplicationDate: nextDate.toISOString().slice(0, 10),
          notes: null,
        } as typeof fertilizationRecord.$inferInsert)
        .returning();

      fert = inserted as InferSelect<typeof fertilizationRecord>;
    }

    return {
      inspection: this.mapInspection(inspection as InferSelect<typeof dailyInspection>),
      fertilization: fert ? this.mapFertilization(fert) : null,
    };
  }

  async getDistinctSpecies(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ species: dailyInspection.plantSpecies })
      .from(dailyInspection)
      .orderBy(dailyInspection.plantSpecies);

    return rows.map((r) => r.species);
  }

  async exportToExcel(
    filters: Partial<InspectionListParams>,
  ): Promise<Buffer> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (filters.plantSpecies)
      conditions.push(eq(dailyInspection.plantSpecies, filters.plantSpecies));
    if (filters.startDate)
      conditions.push(gte(dailyInspection.inspectionDate, filters.startDate));
    if (filters.endDate)
      conditions.push(lte(dailyInspection.inspectionDate, filters.endDate));
    if (filters.keyword)
      conditions.push(
        or(
          ilike(dailyInspection.plantCondition, `%${filters.keyword}%`),
          ilike(dailyInspection.appearance, `%${filters.keyword}%`),
        ),
      );

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await this.db
      .select()
      .from(dailyInspection)
      .where(where)
      .orderBy(desc(dailyInspection.inspectionDate));

    const XLSXModule = await import('xlsx');
    const XLSX = XLSXModule.default || XLSXModule;

    const data = rows.map((r) => {
      const row = r as InferSelect<typeof dailyInspection>;
      return {
        '检查日期': row.inspectionDate,
        '植物品种': row.plantSpecies,
        '植物状态': row.plantCondition,
        '外观描述': row.appearance || '',
        '叶片状态': row.leafCondition || '',
        '土壤状态': row.soilCondition || '',
        '虫害情况': row.pestStatus || '',
        '备注': row.notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '巡检记录');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(buf);
  }

  async importFromExcel(
    rows: Array<Record<string, string>>,
  ): Promise<ImportResult> {
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const species =
          row['植物品种'] || row['plantSpecies'] || '';
        const date =
          row['检查日期'] || row['inspectionDate'] || '';
        const condition =
          row['植物状态'] || row['plantCondition'] || '';

        if (!species || !date || !condition) {
          result.failed++;
          result.errors.push(
            `第${i + 2}行：缺少必填字段（植物品种/检查日期/植物状态）`,
          );
          continue;
        }

        const appDate = row['施肥日期'] || row['applicationDate'] || '';
        const fertName =
          row['肥料名称'] || row['fertilizerName'] || '';
        const fertType =
          row['肥料类型'] || row['fertilizerType'] || '';

        const [inspection] = await this.db
          .insert(dailyInspection)
          .values({
            recordId: null,
            plantSpecies: species,
            inspectionDate: date,
            plantCondition: condition,
            appearance:
              row['外观描述'] || row['appearance'] || null,
            leafCondition:
              row['叶片状态'] || row['leafCondition'] || null,
            soilCondition:
              row['土壤状态'] || row['soilCondition'] || null,
            pestStatus:
              row['虫害情况'] || row['pestStatus'] || null,
            notes: row['备注'] || row['notes'] || null,
          } as typeof dailyInspection.$inferInsert)
          .returning();

        if (fertName && fertType && appDate) {
          const cycle = FERTILIZER_CYCLES[fertType] || 15;
          const nextDate = addDays(new Date(appDate), cycle)
            .toISOString()
            .slice(0, 10);

          await this.db.insert(fertilizationRecord).values({
            inspectionId: (inspection as InferSelect<typeof dailyInspection>).id,
            recordId: null,
            fertilizerName: fertName,
            fertilizerType: fertType,
            dosage: row['用量'] || row['dosage'] || null,
            applicationMethod:
              row['施肥方式'] || row['applicationMethod'] || null,
            applicationDate: appDate,
            nextApplicationDate: nextDate,
          } as typeof fertilizationRecord.$inferInsert);
        }

        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push(
          `第${i + 2}行：${err instanceof Error ? err.message : '导入失败'}`,
        );
      }
    }

    return result;
  }

  async generateTemplate(): Promise<Buffer> {
    const XLSXModule = await import('xlsx');
    const XLSX = XLSXModule.default || XLSXModule;

    const data = [
      {
        '植物品种': '月季',
        '检查日期': '2026-09-25',
        '植物状态': '健康',
        '外观描述': '叶片翠绿，无黄斑',
        '叶片状态': '正常',
        '土壤状态': '湿润',
        '虫害情况': '无',
        '肥料名称': '有机营养液',
        '肥料类型': 'organic',
        '施肥日期': '2026-09-25',
        '用量': '200ml',
        '施肥方式': 'soil_surface',
        '备注': '生长良好',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '巡检记录');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(buf);
  }

  private mapInspection(
    i: InferSelect<typeof dailyInspection>,
  ): DailyInspection {
    return {
      id: i.id,
      recordId: i.recordId,
      plantSpecies: i.plantSpecies,
      inspectionDate: i.inspectionDate,
      plantCondition: i.plantCondition,
      appearance: i.appearance,
      leafCondition: i.leafCondition,
      soilCondition: i.soilCondition,
      pestStatus: i.pestStatus,
      images: i.images,
      notes: i.notes,
      createdAt: i.createdAt.toISOString(),
    };
  }

  private mapFertilization(
    f: InferSelect<typeof fertilizationRecord>,
  ): FertilizationRecord {
    return {
      id: f.id,
      inspectionId: f.inspectionId,
      recordId: f.recordId,
      fertilizerName: f.fertilizerName,
      fertilizerType: f.fertilizerType,
      dosage: f.dosage,
      applicationMethod: f.applicationMethod,
      applicationDate: f.applicationDate,
      nextApplicationDate: f.nextApplicationDate,
      notes: f.notes,
      createdAt: f.createdAt
        ? f.createdAt instanceof Date
          ? f.createdAt.toISOString()
          : String(f.createdAt)
        : '',
    };
  }
}