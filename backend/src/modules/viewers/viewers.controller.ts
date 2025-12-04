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
import { ViewersService } from './viewers.service';
import { Viewer } from './entities/viewer.entity';

@Controller('api/viewers')
export class ViewersController {
  constructor(private readonly viewersService: ViewersService) {}

  @Get()
  async findAll(): Promise<Viewer[]> {
    return this.viewersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Viewer> {
    return this.viewersService.findOne(id);
  }

  @Post()
  async create(@Body() viewerData: Partial<Viewer>): Promise<Viewer> {
    return this.viewersService.create(viewerData);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<Viewer>,
  ): Promise<Viewer> {
    return this.viewersService.update(id, updateData);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.viewersService.delete(id);
    return { success: true };
  }
}

