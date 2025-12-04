import React, { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { roundsApi, questionsApi, Round, Question } from '../lib/api';

interface RoundControlProps {
  gameId: string;
  currentRound: Round | null;
  onRoundUpdate?: (round: Round) => void;
}

export const RoundControl: React.FC<RoundControlProps> = ({ gameId, currentRound, onRoundUpdate }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const socket = getSocket();

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (currentRound?.question_id) {
      setSelectedQuestionId(currentRound.question_id);
    }
  }, [currentRound]);

  const loadQuestions = async () => {
    try {
      const response = await questionsApi.getApproved();
      setQuestions(response.data);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  /**
   * Обновление статуса раунда
   */
  const handleStatusChange = async (status: string) => {
    if (!currentRound) return;

    setLoading(true);
    try {
      socket.emit('round:status:update', {
        roundId: currentRound.id,
        status,
      });

      // Если статус меняется на 'question_shown', также обновляем display_status с таймером
      if (status === 'question_shown') {
        // Загружаем вопрос, если он есть
        let questionData: any = {};
        if (currentRound.question_id) {
          try {
            const questionResponse = await questionsApi.getById(currentRound.question_id);
            const question = questionResponse.data;
            questionData = {
              question_text: question.text,
              question_type: question.type,
              media: question.media_url || null,
            };
          } catch (error) {
            console.error('Error loading question:', error);
          }
        }

        socket.emit('display:update', {
          roundId: currentRound.id,
          displayStatus: {
            content: 'question',
            show_question: true,
            show_timer: true,
            timer_seconds: 60,
            timer_start_time: Date.now(), // Добавляем timestamp для принудительного перезапуска
            ...questionData,
          },
        }, (response: any) => {
          console.log('display:update response:', response);
          if (response && response.success) {
            console.log('✓ Display status updated with timer');
          } else {
            console.error('✗ Failed to update display status:', response);
          }
        });
      }

      const updated = await roundsApi.update(currentRound.id, { status });
      if (onRoundUpdate) {
        onRoundUpdate(updated.data);
      }
    } catch (error) {
      console.error('Error updating round status:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Выбор вопроса для раунда
   */
  const handleQuestionSelect = async (questionId: string) => {
    if (!questionId) return;

    setLoading(true);
    try {
      // Если раунда нет, создаем новый
      let roundId = currentRound?.id;
      
      if (!currentRound) {
        // Создаем новый раунд для игры
        const newRound = await roundsApi.create({
          game_id: gameId,
          round_number: 1,
          question_id: questionId,
          status: 'pending',
        });
        roundId = newRound.data.id;
        if (onRoundUpdate) {
          onRoundUpdate(newRound.data);
        }
      } else {
        // Обновляем существующий раунд
        roundId = currentRound.id;
        socket.emit('round:question:select', {
          roundId: currentRound.id,
          questionId,
        });

        const updated = await roundsApi.update(currentRound.id, { question_id: questionId });
        if (onRoundUpdate) {
          onRoundUpdate(updated.data);
        }
      }

      setSelectedQuestionId(questionId);
    } catch (error) {
      console.error('Error selecting question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Управление раундом</h2>

      {/* Выбор вопроса */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Выбрать вопрос:
        </label>
        <select
          value={selectedQuestionId}
          onChange={(e) => {
            if (e.target.value) {
              handleQuestionSelect(e.target.value);
            }
          }}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Выберите вопрос --</option>
          {questions.map((question) => (
            <option key={question.id} value={question.id}>
              {question.text.substring(0, 100)}... ({question.type})
            </option>
          ))}
        </select>
      </div>

      {/* Кнопки управления статусом */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => handleStatusChange('question_shown')}
          disabled={!currentRound || loading}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
        >
          Начать Обсуждение
        </button>

        <button
          onClick={() => handleStatusChange('thinking')}
          disabled={!currentRound || loading}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
        >
          Знатоки Отвечают
        </button>

        <button
          onClick={() => handleStatusChange('finished')}
          disabled={!currentRound || loading}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
        >
          Раунд Окончен
        </button>
      </div>

      {currentRound && (
        <div className="mt-4 text-sm text-gray-600">
          <p>Текущий статус: <span className="font-semibold">{currentRound.status}</span></p>
          <p>Номер раунда: <span className="font-semibold">{currentRound.round_number}</span></p>
        </div>
      )}
    </div>
  );
};

