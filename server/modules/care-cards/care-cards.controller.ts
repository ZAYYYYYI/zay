import { Controller, Get, Param, Query } from '@nestjs/common';
import { CareCardsService } from './care-cards.service';
import type {
  CareCard,
  PaginatedResponse,
} from '@shared/api.interface';

@Controller('api/care-cards')
export class CareCardsController {
  constructor(private readonly service: CareCardsService) {}

  @Get()
  async listCards(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<PaginatedResponse<CareCard>> {
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(parseInt(pageSize, 10) || 10, 50);
    return this.service.listCards(p, ps);
  }

  @Get(':id')
  async getCard(@Param('id') id: string): Promise<CareCard> {
    return this.service.getCard(id);
  }
}