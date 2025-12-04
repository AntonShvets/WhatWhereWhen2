import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async findAll(): Promise<Question[]> {
    return this.questionRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findApproved(): Promise<Question[]> {
    return this.questionRepository.find({
      where: { is_approved: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async create(questionData: Partial<Question>): Promise<Question> {
    const question = this.questionRepository.create(questionData);
    return this.questionRepository.save(question);
  }

  async update(id: string, updateData: Partial<Question>): Promise<Question> {
    const question = await this.findOne(id);
    Object.assign(question, updateData);
    return this.questionRepository.save(question);
  }

  async approve(id: string): Promise<Question> {
    return this.update(id, {
      is_approved: true,
      approved_at: new Date(),
    });
  }
}

