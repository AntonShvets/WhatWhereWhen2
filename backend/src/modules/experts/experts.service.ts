import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expert } from './entities/expert.entity';

@Injectable()
export class ExpertsService {
  constructor(
    @InjectRepository(Expert)
    private readonly expertRepository: Repository<Expert>,
  ) {}

  async findAll(): Promise<Expert[]> {
    return this.expertRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Expert> {
    const expert = await this.expertRepository.findOne({ where: { id } });
    if (!expert) {
      throw new NotFoundException(`Expert with ID ${id} not found`);
    }
    return expert;
  }

  async create(expertData: Partial<Expert>): Promise<Expert> {
    const expert = this.expertRepository.create(expertData);
    return this.expertRepository.save(expert);
  }

  async update(id: string, updateData: Partial<Expert>): Promise<Expert> {
    const expert = await this.findOne(id);
    Object.assign(expert, updateData);
    return this.expertRepository.save(expert);
  }

  async delete(id: string): Promise<void> {
    const expert = await this.findOne(id);
    await this.expertRepository.remove(expert);
  }
}

