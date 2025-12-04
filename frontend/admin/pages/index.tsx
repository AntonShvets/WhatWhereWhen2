import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSocket, disconnectSocket } from '../lib/socket';
import { gamesApi, roundsApi, Game, Round } from '../lib/api';
import { ScoreControl } from '../components/ScoreControl';
import { RoundControl } from '../components/RoundControl';
import { TVDisplayControl } from '../components/TVDisplayControl';
import { SoundEffects } from '../components/SoundEffects';

export default function GameControlDashboard() {
  const [game, setGame] = useState<Game | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGame();
    const socket = getSocket();

    // Присоединяемся к игре при загрузке
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    // Подписка на обновления игры
    socket.on('game:update', (data: Game) => {
      setGame(data);
    });

    socket.on('round:update', (data: Round) => {
      setCurrentRound(data);
    });

    return () => {
      socket.off('game:update');
      socket.off('round:update');
    };
  }, []);

  const loadGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await gamesApi.getActive();
      const activeGame = response.data;

      if (activeGame && activeGame.id) {
        setGame(activeGame);
        const socket = getSocket();
        socket.emit('game:join', { gameId: activeGame.id });

        // Загружаем текущий раунд
        try {
          const roundsResponse = await roundsApi.getByGame(activeGame.id);
          const rounds = roundsResponse.data;
          if (rounds && rounds.length > 0) {
            const latestRound = rounds[rounds.length - 1];
            setCurrentRound(latestRound);
          }
        } catch (roundError) {
          console.warn('No rounds found for game:', roundError);
          // Это нормально, если раундов еще нет
        }
      } else {
        setError('Нет активной игры. Создайте новую игру через API или напрямую в БД.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка загрузки игры';
      setError(errorMessage);
      console.error('Error loading game:', err);
      console.error('Error details:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreUpdate = (updatedGame: Game) => {
    setGame(updatedGame);
  };

  const handleRoundUpdate = (updatedRound: Round) => {
    setCurrentRound(updatedRound);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-bold">Ошибка</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Нет активной игры</p>
          <button
            onClick={loadGame}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🎮 Главный Экран Управления Игрой
              </h1>
              <p className="text-gray-600">
                Игра #{game.id.substring(0, 8)} | Статус: <span className="font-semibold">{game.status}</span>
              </p>
            </div>
            <div className="space-x-4">
              <Link
                href="/experts"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Знатоки
              </Link>
              <Link
                href="/viewers-questions"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Телезрители и Вопросы
              </Link>
            </div>
          </div>
        </header>

        {/* Интерфейс счета */}
        <ScoreControl game={game} onScoreUpdate={handleScoreUpdate} />

        {/* Управление раундом */}
        <RoundControl
          gameId={game.id}
          currentRound={currentRound}
          onRoundUpdate={handleRoundUpdate}
        />

        {/* Управление выводом на ТВ */}
        <TVDisplayControl
          currentRound={currentRound}
          onDisplayUpdate={handleRoundUpdate}
        />

        {/* Звуковые эффекты */}
        <SoundEffects gameId={game.id} />
      </div>
    </div>
  );
}

