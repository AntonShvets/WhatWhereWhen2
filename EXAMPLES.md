# Примеры кода для WhatWhereWhen2

## (а) Фронтенд-компонент кнопки "+1" для счета Знатоков

### Полный пример компонента ScoreControl.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { gamesApi, Game } from '../lib/api';

interface ScoreControlProps {
  game: Game;
  onScoreUpdate?: (game: Game) => void;
}

export const ScoreControl: React.FC<ScoreControlProps> = ({ game, onScoreUpdate }) => {
  const [expertsScore, setExpertsScore] = useState(game.experts_score);
  const socket = getSocket();

  // Подписка на обновления счета через Socket.io
  useEffect(() => {
    socket.on('score:update', (data: { gameId: string; expertsScore: number; viewersScore: number }) => {
      if (data.gameId === game.id) {
        setExpertsScore(data.expertsScore);
      }
    });

    return () => {
      socket.off('score:update');
    };
  }, [game.id, socket]);

  /**
   * Обработчик кнопки +1 для Знатоков
   * Отправляет команду через Socket.io для мгновенного обновления
   */
  const handleExpertsIncrement = async () => {
    const newScore = expertsScore + 1;

    try {
      // 1. Отправляем обновление через Socket.io для мгновенной синхронизации
      socket.emit('score:update', {
        gameId: game.id,
        expertsScore: newScore,
      });

      // 2. Также обновляем через REST API для надежности
      await gamesApi.update(game.id, { experts_score: newScore });
      
      setExpertsScore(newScore);
    } catch (error) {
      console.error('Error updating experts score:', error);
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Знатоки</h3>
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleExpertsIncrement}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xl"
        >
          +1
        </button>
        <div className="w-24 h-16 text-4xl font-bold text-center">
          {expertsScore}
        </div>
      </div>
    </div>
  );
};
```

### Ключевые моменты:

1. **Socket.io для real-time**: Используется `socket.emit('score:update', ...)` для мгновенной отправки обновления
2. **REST API для надежности**: Дополнительно сохраняется через REST API
3. **Подписка на обновления**: Компонент слушает события `score:update` для синхронизации с другими клиентами
4. **Оптимистичное обновление UI**: Счет обновляется сразу, до подтверждения от сервера

---

## (б) Бэкенд-обработчик для Socket.io (NestJS Gateway)

### Полный пример game.gateway.ts

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { GamesService } from '../modules/games/games.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly gamesService: GamesService,
  ) {}

  /**
   * Обработчик события score:update
   * Принимает команду обновления счета и рассылает её всем клиентам
   */
  @SubscribeMessage('score:update')
  async handleScoreUpdate(
    @MessageBody() data: { gameId: string; expertsScore?: number; viewersScore?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, expertsScore, viewersScore } = data;
      
      // 1. Обновляем счет в базе данных
      const updatedGame = await this.gamesService.updateScore(gameId, {
        expertsScore,
        viewersScore,
      });

      // 2. Рассылаем обновление всем клиентам в комнате игры
      // Используем to() для отправки в конкретную комнату
      this.server.to(`game:${gameId}`).emit('score:update', {
        gameId,
        expertsScore: updatedGame.experts_score,
        viewersScore: updatedGame.viewers_score,
      });

      this.logger.log(
        `Score updated for game ${gameId}: ` +
        `Experts=${updatedGame.experts_score}, ` +
        `Viewers=${updatedGame.viewers_score}`
      );
      
      return { success: true, game: updatedGame };
    } catch (error) {
      this.logger.error(`Error updating score: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
```

### Соответствующий сервис games.service.ts

```typescript
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

  async findOne(id: string): Promise<Game> {
    const game = await this.gameRepository.findOne({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return game;
  }
}
```

### Ключевые моменты:

1. **@SubscribeMessage('score:update')**: Декоратор для обработки события от клиента
2. **Обновление БД**: Сначала обновляется база данных через сервис
3. **Рассылка клиентам**: Используется `this.server.to('game:${gameId}').emit()` для отправки всем в комнате
4. **Комнаты Socket.io**: Клиенты присоединяются к комнате `game:${gameId}` через `socket.join()`
5. **Обработка ошибок**: Логирование и возврат статуса успеха/ошибки

---

## Дополнительные примеры

### Пример обработчика display:update для ТВ-клиента

```typescript
@SubscribeMessage('display:update')
async handleDisplayUpdate(
  @MessageBody() data: { roundId: string; displayStatus: any },
  @ConnectedSocket() client: Socket,
) {
  try {
    const { roundId, displayStatus } = data;
    
    // Обновляем display_status в базе данных
    const round = await this.roundsService.updateDisplayStatus(roundId, displayStatus);
    const gameId = round.game_id;

    // Отправляем обновление в комнату ТВ-клиента
    this.server.to(`game:${gameId}`).emit('display:change', {
      roundId,
      displayStatus: round.display_status,
    });

    return { success: true, displayStatus: round.display_status };
  } catch (error) {
    this.logger.error(`Error updating display status: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

### Пример на фронтенде для отправки команды отображения

```tsx
const handleShowQuestion = () => {
  const displayStatus = {
    content: 'question',
    show_question: true,
    question_text: currentQuestion.text,
    question_type: currentQuestion.type,
    media: currentQuestion.media_url || null,
    show_timer: true,
    show_experts: true,
    show_score: false,
  };

  // Отправляем через Socket.io
  socket.emit('display:update', {
    roundId: currentRound.id,
    displayStatus,
  });
};
```

---

## Поток данных

```
Админка (Frontend)
    ↓ socket.emit('score:update', { gameId, expertsScore: 5 })
    ↓
Backend Gateway (NestJS)
    ↓ @SubscribeMessage('score:update')
    ↓
GamesService.updateScore()
    ↓ Сохранение в PostgreSQL
    ↓
server.to('game:${gameId}').emit('score:update', ...)
    ↓
    ├─→ Админка (обновление UI)
    ├─→ ТВ-Клиент (обновление счета на экране)
    └─→ Другие подключенные клиенты
```

---

## Настройка подключения Socket.io на клиенте

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(`${SOCKET_URL}/game`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};
```

---

## Присоединение к игре

```typescript
// На фронтенде
useEffect(() => {
  const socket = getSocket();
  
  socket.on('connect', () => {
    // Присоединяемся к комнате игры
    socket.emit('game:join', { gameId: game.id });
  });

  // Подписка на обновления
  socket.on('score:update', (data) => {
    setScore(data.expertsScore);
  });
}, [game.id]);
```

```typescript
// На бэкенде
@SubscribeMessage('game:join')
async handleJoinGame(
  @MessageBody() data: { gameId: string },
  @ConnectedSocket() client: Socket,
) {
  const { gameId } = data;
  client.join(`game:${gameId}`);
  return { success: true, gameId };
}
```

