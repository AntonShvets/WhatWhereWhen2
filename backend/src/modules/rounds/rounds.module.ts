import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoundsService } from './rounds.service';
import { RoundsController } from './rounds.controller';
import { Round } from './entities/round.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Round])],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}

