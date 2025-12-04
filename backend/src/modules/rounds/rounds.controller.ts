import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { Round } from './entities/round.entity';

@Controller('api/rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get()
  async findAll(): Promise<Round[]> {
    return this.roundsService.findAll();
  }

  @Get('game/:gameId')
  async findByGame(@Param('gameId', ParseUUIDPipe) gameId: string): Promise<Round[]> {
    return this.roundsService.findByGame(gameId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Round> {
    return this.roundsService.findOne(id);
  }

  @Post()
  async create(@Body() roundData: Partial<Round>): Promise<Round> {
    return this.roundsService.create(roundData);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<Round>,
  ): Promise<Round> {
    return this.roundsService.update(id, updateData);
  }

  @Patch(':id/display-status')
  async updateDisplayStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() displayStatus: any,
  ): Promise<Round> {
    return this.roundsService.updateDisplayStatus(id, displayStatus);
  }
}

