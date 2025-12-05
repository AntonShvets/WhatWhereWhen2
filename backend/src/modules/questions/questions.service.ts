import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { InjectRepository as InjectViewerRepository } from '@nestjs/typeorm';
import { Viewer } from '../viewers/entities/viewer.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Viewer)
    private readonly viewerRepository: Repository<Viewer>,
  ) {}

  async findAll(): Promise<Question[]> {
    return this.questionRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findApproved(): Promise<any[]> {
    const questions = await this.questionRepository.find({
      where: { is_approved: true },
      order: { created_at: 'DESC' },
    });

    // Загружаем информацию о viewer для каждого вопроса
    const questionsWithViewers = await Promise.all(
      questions.map(async (question) => {
        let viewer = null;
        if (question.viewer_id) {
          viewer = await this.viewerRepository.findOne({
            where: { id: question.viewer_id },
          });
        }
        return {
          ...question,
          viewer: viewer ? {
            id: viewer.id,
            name: viewer.name,
            city: viewer.city,
            country: viewer.country,
          } : null,
        };
      })
    );

    return questionsWithViewers;
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async findOneWithViewer(id: string): Promise<any> {
    const question = await this.findOne(id);
    let viewer = null;
    if (question.viewer_id) {
      viewer = await this.viewerRepository.findOne({
        where: { id: question.viewer_id },
      });
    }
    return {
      ...question,
      viewer: viewer ? {
        id: viewer.id,
        name: viewer.name,
        city: viewer.city,
        country: viewer.country,
      } : null,
    };
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

