import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { GamesService } from '../modules/games/games.service';
import { RoundsService } from '../modules/rounds/rounds.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly gamesService: GamesService,
    private readonly roundsService: RoundsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Присоединение к игре
   */
  @SubscribeMessage('game:join')
  async handleJoinGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { gameId } = data;
    client.join(`game:${gameId}`);
    this.logger.log(`Client ${client.id} joined game ${gameId}`);
    return { success: true, gameId };
  }

  /**
   * Обновление счета игры
   * Пример обработчика для кнопки +1/-1
   */
  @SubscribeMessage('score:update')
  async handleScoreUpdate(
    @MessageBody() data: { gameId: string; expertsScore?: number; viewersScore?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, expertsScore, viewersScore } = data;
      
      // Обновляем счет в базе данных
      const updatedGame = await this.gamesService.updateScore(gameId, {
        expertsScore,
        viewersScore,
      });

      // Рассылаем обновление всем клиентам в комнате игры
      this.server.to(`game:${gameId}`).emit('score:update', {
        gameId,
        expertsScore: updatedGame.experts_score,
        viewersScore: updatedGame.viewers_score,
      });

      this.logger.log(`Score updated for game ${gameId}: Experts=${updatedGame.experts_score}, Viewers=${updatedGame.viewers_score}`);
      
      return { success: true, game: updatedGame };
    } catch (error) {
      this.logger.error(`Error updating score: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Обновление статуса раунда
   */
  @SubscribeMessage('round:status:update')
  async handleRoundStatusUpdate(
    @MessageBody() data: { roundId: string; status: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roundId, status } = data;
      const round = await this.roundsService.updateStatus(roundId, status);
      const gameId = round.game_id;

      this.server.to(`game:${gameId}`).emit('round:status:update', {
        roundId,
        status: round.status,
        round,
      });

      return { success: true, round };
    } catch (error) {
      this.logger.error(`Error updating round status: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Обновление display_status для ТВ-клиента
   */
  @SubscribeMessage('display:update')
  async handleDisplayUpdate(
    @MessageBody() data: { roundId: string; displayStatus: any },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roundId, displayStatus } = data;
      const round = await this.roundsService.updateDisplayStatus(roundId, displayStatus);
      const gameId = round.game_id;

      // Отправляем обновление в комнату ТВ-клиента
      const eventData = {
        roundId,
        displayStatus: round.display_status,
      };
      
      this.logger.log(`Sending display:change to room game:${gameId}`);
      this.logger.log(`Event data: ${JSON.stringify(eventData, null, 2)}`);
      
      // Отправляем событие в комнату игры
      this.server.to(`game:${gameId}`).emit('display:change', eventData);

      this.logger.log(`Display status updated for round ${roundId}, content: ${round.display_status?.content || 'none'}`);
      
      return { success: true, displayStatus: round.display_status };
    } catch (error) {
      this.logger.error(`Error updating display status: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Выбор вопроса для раунда
   */
  @SubscribeMessage('round:question:select')
  async handleQuestionSelect(
    @MessageBody() data: { roundId: string; questionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roundId, questionId } = data;
      const round = await this.roundsService.setQuestion(roundId, questionId);
      const gameId = round.game_id;

      this.server.to(`game:${gameId}`).emit('round:question:selected', {
        roundId,
        questionId,
        round,
      });

      return { success: true, round };
    } catch (error) {
      this.logger.error(`Error selecting question: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Проигрывание звука на ТВ-клиенте
   */
  @SubscribeMessage('play_sound')
  async handlePlaySound(
    @MessageBody() data: { gameId: string; file: string; volume?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, file, volume = 1.0 } = data;

      // Рассылаем команду проигрывания звука всем клиентам в комнате игры
      this.server.to(`game:${gameId}`).emit('play_sound', {
        file,
        volume,
        timestamp: Date.now(),
      });

      this.logger.log(`Sound play command sent for game ${gameId}: ${file}`);
      
      return { success: true, file, volume };
    } catch (error) {
      this.logger.error(`Error playing sound: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

