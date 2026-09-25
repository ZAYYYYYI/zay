import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { desc, eq, count } from 'drizzle-orm';
import { careCard } from '@server/database/schema';
import type { CareCard, PaginatedResponse } from '@shared/api.interface';

@Injectable()
export class CareCardsService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async listCards(
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<CareCard>> {
    const offset = (page - 1) * pageSize;
    const items = await this.db
      .select()
      .from(careCard)
      .orderBy(desc(careCard.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(careCard);

    return {
      items: items.map((c) => this.mapCard(c)),
      total,
    };
  }

  async getCard(id: string): Promise<CareCard> {
    const [card] = await this.db
      .select()
      .from(careCard)
      .where(eq(careCard.id, id));

    if (!card) throw new NotFoundException('养护卡不存在');
    return this.mapCard(card);
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