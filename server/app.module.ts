import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { PlantDiagnosisModule } from './modules/plant-diagnosis/plant-diagnosis.module';
import { CareCardsModule } from './modules/care-cards/care-cards.module';
import { InspectionModule } from './modules/inspection/inspection.module';
import { DownloadModule } from './modules/download/download.module';
import { GithubModule } from './modules/github/github.module';
import { MiaodaConnectionsModule } from '@lark-apaas/miaoda-connections-sdk';

@Module({
  imports: [
    // 平台 Module，提供平台能力
    PlatformModule.forRoot(),
    // 三方集成凭证模块
    MiaodaConnectionsModule.forRoot(),
    // ====== @route-section: business-modules START ======
    // Place all business modules here.Do NOT add fallback modules here.
    PlantDiagnosisModule,
    InspectionModule,
    CareCardsModule,
    DownloadModule,
    GithubModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
