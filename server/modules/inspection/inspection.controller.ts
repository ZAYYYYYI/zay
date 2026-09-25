import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  CreateInspectionRequest,
  DailyInspection,
  InspectionDetailResponse,
  ImportResult,
} from '@shared/api.interface';
import { InspectionService } from './inspection.service';

@Controller('api/inspection')
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InspectionController {
  constructor(private readonly service: InspectionService) {}

  @Get()
  async list(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('plantSpecies') plantSpecies: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('keyword') keyword: string,
  ): Promise<import('@shared/api.interface').PaginatedResponse<DailyInspection>> {
    return this.service.listInspections({
      page: parseInt(page, 10) || 1,
      pageSize: Math.min(parseInt(pageSize, 10) || 10, 50),
      plantSpecies: plantSpecies || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      keyword: keyword || undefined,
    });
  }

  @Get('species')
  async getAllSpecies(): Promise<{ species: string[] }> {
    const species = await this.service.getDistinctSpecies();
    return { species };
  }

  @Get('export')
  async exportExcel(
    @Query('plantSpecies') plantSpecies: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('keyword') keyword: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.service.exportToExcel({
      plantSpecies: plantSpecies || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      keyword: keyword || undefined,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=plant-inspections-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    res.send(buffer);
  }

  @Post('import')
  async importExcel(
    @Req() req: Request,
    @Body() body: { data: Array<Record<string, string>> },
  ): Promise<ImportResult> {
    return this.service.importFromExcel(body.data);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateInspectionRequest,
  ): Promise<InspectionDetailResponse> {
    return this.service.createInspection(dto);
  }

  @Get('template')
  async downloadTemplate(@Res() res: Response): Promise<void> {
    const buffer = await this.service.generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=inspection-template.xlsx',
    );
    res.send(buffer);
  }

  @Get(':id')
  async getDetail(
    @Param('id') id: string,
  ): Promise<InspectionDetailResponse> {
    return this.service.getDetail(id);
  }
}