import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { Game } from './entities/game.entity';

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  async findAll(): Promise<Game[]> {
    return this.gamesService.findAll();
  }

  @Get('active')
  async findActive(): Promise<Game | null> {
    return this.gamesService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Game> {
    return this.gamesService.findOne(id);
  }

  @Post()
  async create(@Body() gameData: Partial<Game>): Promise<Game> {
    return this.gamesService.create(gameData);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<Game>,
  ): Promise<Game> {
    return this.gamesService.update(id, updateData);
  }

  @Post(':id/start')
  async startGame(@Param('id', ParseUUIDPipe) id: string): Promise<Game> {
    const game = await this.gamesService.findOne(id);
    return this.gamesService.update(id, {
      status: 'active',
      start_time: new Date(),
    });
  }
}

