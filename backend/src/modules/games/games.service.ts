import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async findAll(): Promise<Game[]> {
    return this.gameRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Game> {
    const game = await this.gameRepository.findOne({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return game;
  }

  async findActive(): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { status: 'active' },
      order: { created_at: 'DESC' },
    });
  }

  async create(gameData: Partial<Game>): Promise<Game> {
    const game = this.gameRepository.create(gameData);
    return this.gameRepository.save(game);
  }

  async update(id: string, updateData: Partial<Game>): Promise<Game> {
    const game = await this.findOne(id);
    Object.assign(game, updateData);
    return this.gameRepository.save(game);
  }

  /**
   * Обновление счета игры
   * Используется при обработке событий score:update
   */
  async updateScore(
    id: string,
    scoreData: { expertsScore?: number; viewersScore?: number },
  ): Promise<Game> {
    const game = await this.findOne(id);
    
    if (scoreData.expertsScore !== undefined) {
      game.experts_score = scoreData.expertsScore;
    }
    
    if (scoreData.viewersScore !== undefined) {
      game.viewers_score = scoreData.viewersScore;
    }

    return this.gameRepository.save(game);
  }

  async updateStatus(id: string, status: string): Promise<Game> {
    return this.update(id, { status });
  }
}

