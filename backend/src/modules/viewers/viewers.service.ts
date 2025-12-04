import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Viewer } from './entities/viewer.entity';

@Injectable()
export class ViewersService {
  constructor(
    @InjectRepository(Viewer)
    private readonly viewerRepository: Repository<Viewer>,
  ) {}

  async findAll(): Promise<Viewer[]> {
    return this.viewerRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Viewer> {
    const viewer = await this.viewerRepository.findOne({ where: { id } });
    if (!viewer) {
      throw new NotFoundException(`Viewer with ID ${id} not found`);
    }
    return viewer;
  }

  async create(viewerData: Partial<Viewer>): Promise<Viewer> {
    const viewer = this.viewerRepository.create(viewerData);
    return this.viewerRepository.save(viewer);
  }

  async update(id: string, updateData: Partial<Viewer>): Promise<Viewer> {
    const viewer = await this.findOne(id);
    Object.assign(viewer, updateData);
    return this.viewerRepository.save(viewer);
  }

  async delete(id: string): Promise<void> {
    const viewer = await this.findOne(id);
    await this.viewerRepository.remove(viewer);
  }
}

