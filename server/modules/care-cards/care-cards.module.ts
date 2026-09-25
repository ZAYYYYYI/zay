import { Module } from '@nestjs/common';
import { CareCardsController } from './care-cards.controller';
import { CareCardsService } from './care-cards.service';

@Module({
  controllers: [CareCardsController],
  providers: [CareCardsService],
})
export class CareCardsModule {}