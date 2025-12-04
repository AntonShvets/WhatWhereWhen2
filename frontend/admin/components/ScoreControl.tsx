import React, { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { gamesApi, Game } from '../lib/api';

interface ScoreControlProps {
  game: Game;
  onScoreUpdate?: (game: Game) => void;
}

/**
 * Компонент управления счетом игры
 * Пример использования кнопки +1 для счета Знатоков
 */
export const ScoreControl: React.FC<ScoreControlProps> = ({ game, onScoreUpdate }) => {
  const [expertsScore, setExpertsScore] = useState(game.experts_score);
  const [viewersScore, setViewersScore] = useState(game.viewers_score);
  const [isUpdating, setIsUpdating] = useState(false);

  const socket = getSocket();

  useEffect(() => {
    setExpertsScore(game.experts_score);
    setViewersScore(game.viewers_score);
  }, [game]);

  // Подписка на обновления счета через Socket.io
  useEffect(() => {
    socket.on('score:update', (data: { gameId: string; expertsScore: number; viewersScore: number }) => {
      if (data.gameId === game.id) {
        setExpertsScore(data.expertsScore);
        setViewersScore(data.viewersScore);
        if (onScoreUpdate) {
          onScoreUpdate({ ...game, experts_score: data.expertsScore, viewers_score: data.viewersScore });
        }
      }
    });

    return () => {
      socket.off('score:update');
    };
  }, [game.id, socket, onScoreUpdate]);

  /**
   * Обработчик кнопки +1 для Знатоков
   * Отправляет команду через Socket.io для мгновенного обновления
   */
  const handleExpertsIncrement = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    const newScore = expertsScore + 1;

    // Оптимистичное обновление UI сразу
    setExpertsScore(newScore);

    try {
      // Сначала отправляем через Socket.io для мгновенной синхронизации (приоритет)
      socket.emit('score:update', {
        gameId: game.id,
        expertsScore: newScore,
      });

      // Затем обновляем через REST API в фоне (для надежности)
      gamesApi.update(game.id, { experts_score: newScore }).catch((error) => {
        console.error('Error updating score via API:', error);
        // Откатываем при ошибке
        setExpertsScore(expertsScore);
      });
    } catch (error) {
      console.error('Error updating experts score:', error);
      // Откатываем при ошибке
      setExpertsScore(expertsScore);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Обработчик кнопки -1 для Знатоков
   */
  const handleExpertsDecrement = async () => {
    if (isUpdating || expertsScore <= 0) return;
    
    setIsUpdating(true);
    const newScore = Math.max(0, expertsScore - 1);

    try {
      socket.emit('score:update', {
        gameId: game.id,
        expertsScore: newScore,
      });

      await gamesApi.update(game.id, { experts_score: newScore });
      setExpertsScore(newScore);
    } catch (error) {
      console.error('Error updating experts score:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Обработчик кнопки +1 для Телезрителей
   */
  const handleViewersIncrement = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    const newScore = viewersScore + 1;

    try {
      socket.emit('score:update', {
        gameId: game.id,
        viewersScore: newScore,
      });

      await gamesApi.update(game.id, { viewers_score: newScore });
      setViewersScore(newScore);
    } catch (error) {
      console.error('Error updating viewers score:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Обработчик кнопки -1 для Телезрителей
   */
  const handleViewersDecrement = async () => {
    if (isUpdating || viewersScore <= 0) return;
    
    setIsUpdating(true);
    const newScore = Math.max(0, viewersScore - 1);

    try {
      socket.emit('score:update', {
        gameId: game.id,
        viewersScore: newScore,
      });

      await gamesApi.update(game.id, { viewers_score: newScore });
      setViewersScore(newScore);
    } catch (error) {
      console.error('Error updating viewers score:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Прямое редактирование счета
   */
  const handleExpertsScoreChange = async (value: number) => {
    if (isUpdating || value < 0) return;
    
    setIsUpdating(true);
    try {
      socket.emit('score:update', {
        gameId: game.id,
        expertsScore: value,
      });

      await gamesApi.update(game.id, { experts_score: value });
      setExpertsScore(value);
    } catch (error) {
      console.error('Error updating experts score:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewersScoreChange = async (value: number) => {
    if (isUpdating || value < 0) return;
    
    setIsUpdating(true);
    try {
      socket.emit('score:update', {
        gameId: game.id,
        viewersScore: value,
      });

      await gamesApi.update(game.id, { viewers_score: value });
      setViewersScore(value);
    } catch (error) {
      console.error('Error updating viewers score:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Счет игры</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Счет Знатоков */}
        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Знатоки</h3>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleExpertsDecrement}
              disabled={isUpdating || expertsScore <= 0}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xl transition-colors"
            >
              -1
            </button>
            
            <input
              type="number"
              value={expertsScore}
              onChange={(e) => handleExpertsScoreChange(parseInt(e.target.value) || 0)}
              className="w-24 h-16 text-4xl font-bold text-center text-blue-800 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            
            <button
              onClick={handleExpertsIncrement}
              disabled={isUpdating}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xl transition-colors"
            >
              +1
            </button>
          </div>
        </div>

        {/* Счет Телезрителей */}
        <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Телезрители</h3>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleViewersDecrement}
              disabled={isUpdating || viewersScore <= 0}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xl transition-colors"
            >
              -1
            </button>
            
            <input
              type="number"
              value={viewersScore}
              onChange={(e) => handleViewersScoreChange(parseInt(e.target.value) || 0)}
              className="w-24 h-16 text-4xl font-bold text-center text-purple-800 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
            />
            
            <button
              onClick={handleViewersIncrement}
              disabled={isUpdating}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xl transition-colors"
            >
              +1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

