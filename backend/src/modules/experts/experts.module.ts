import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpertsService } from './experts.service';
import { ExpertsController } from './experts.controller';
import { Expert } from './entities/expert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expert])],
  controllers: [ExpertsController],
  providers: [ExpertsService],
  exports: [ExpertsService],
})
export class ExpertsModule {}

