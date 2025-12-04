import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViewersService } from './viewers.service';
import { ViewersController } from './viewers.controller';
import { Viewer } from './entities/viewer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Viewer])],
  controllers: [ViewersController],
  providers: [ViewersService],
  exports: [ViewersService],
})
export class ViewersModule {}

