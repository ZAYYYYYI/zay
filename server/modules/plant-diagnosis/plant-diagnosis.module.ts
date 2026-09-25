import { Module } from '@nestjs/common';
import { PlantDiagnosisController } from './plant-diagnosis.controller';
import { PlantDiagnosisService } from './plant-diagnosis.service';

@Module({
  controllers: [PlantDiagnosisController],
  providers: [PlantDiagnosisService],
})
export class PlantDiagnosisModule {}