import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ExpertsService } from './experts.service';
import { Expert } from './entities/expert.entity';

@Controller('api/experts')
export class ExpertsController {
  constructor(private readonly expertsService: ExpertsService) {}

  @Get()
  async findAll(): Promise<Expert[]> {
    return this.expertsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Expert> {
    return this.expertsService.findOne(id);
  }

  @Post()
  async create(@Body() expertData: Partial<Expert>): Promise<Expert> {
    return this.expertsService.create(expertData);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<Expert>,
  ): Promise<Expert> {
    return this.expertsService.update(id, updateData);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.expertsService.delete(id);
    return { success: true };
  }
}

