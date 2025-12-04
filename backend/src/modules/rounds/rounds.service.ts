import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from './entities/round.entity';

@Injectable()
export class RoundsService {
  constructor(
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
  ) {}

  async findAll(): Promise<Round[]> {
    return this.roundRepository.find({
      order: { round_number: 'ASC' },
    });
  }

  async findByGame(gameId: string): Promise<Round[]> {
    return this.roundRepository.find({
      where: { game_id: gameId },
      order: { round_number: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Round> {
    const round = await this.roundRepository.findOne({ where: { id } });
    if (!round) {
      throw new NotFoundException(`Round with ID ${id} not found`);
    }
    return round;
  }

  async findCurrentRound(gameId: string): Promise<Round | null> {
    return this.roundRepository.findOne({
      where: { game_id: gameId },
      order: { round_number: 'DESC' },
    });
  }

  async create(roundData: Partial<Round>): Promise<Round> {
    const round = this.roundRepository.create(roundData);
    return this.roundRepository.save(round);
  }

  async update(id: string, updateData: Partial<Round>): Promise<Round> {
    const round = await this.findOne(id);
    Object.assign(round, updateData);
    return this.roundRepository.save(round);
  }

  async updateStatus(id: string, status: string): Promise<Round> {
    return this.update(id, { status });
  }

  /**
   * Обновление display_status для ТВ-клиента
   */
  async updateDisplayStatus(id: string, displayStatus: any): Promise<Round> {
    const round = await this.findOne(id);
    round.display_status = { ...round.display_status, ...displayStatus };
    return this.roundRepository.save(round);
  }

  /**
   * Установка вопроса для раунда
   */
  async setQuestion(roundId: string, questionId: string): Promise<Round> {
    return this.update(roundId, { question_id: questionId });
  }
}

