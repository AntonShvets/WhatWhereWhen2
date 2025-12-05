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
  const [selectedQuestionText, setSelectedQuestionText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const socket = getSocket();

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (currentRound?.question_id) {
      setSelectedQuestionId(currentRound.question_id);
      // Загружаем полный текст вопроса, если он уже выбран
      loadQuestionText(currentRound.question_id);
    } else {
      setSelectedQuestionText('');
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

  const loadQuestionText = async (questionId: string) => {
    try {
      const response = await questionsApi.getById(questionId);
      setSelectedQuestionText(response.data.text);
    } catch (error) {
      console.error('Error loading question text:', error);
      setSelectedQuestionText('');
    }
  };

  /**
   * Функция для отображения вопроса в дроп-дауне
   */
  const getQuestionDisplayText = (question: Question): string => {
    const parts: string[] = [];
    
    // Тема вопроса
    if (question.topic) {
      parts.push(question.topic);
    }
    
    // Имя и фамилия автора
    if (question.viewer?.name) {
      // Парсим имя - берем первые два слова как имя и фамилию
      const nameParts = question.viewer.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        parts.push(`${nameParts[0]} ${nameParts[1]}`);
      } else if (nameParts.length === 1) {
        parts.push(nameParts[0]);
      }
    }
    
    return parts.length > 0 ? parts.join(' — ') : `Вопрос #${question.id.substring(0, 8)}`;
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

      // Если статус меняется на 'question_shown', также обновляем display_status только с таймером
      if (status === 'question_shown') {
        // Отправляем только таймер, без текста вопроса
        socket.emit('display:update', {
          roundId: currentRound.id,
          displayStatus: {
            content: 'question',
            show_question: true,
            show_timer: true,
            timer_seconds: 60,
            question_text: '', // Пустая строка - текст вопроса не будет отображаться на экране
            question_type: 'text',
          },
        }, (response: any) => {
          console.log('display:update response:', response);
          if (response && response.success) {
            console.log('✓ Display status updated with timer only');
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
    if (!questionId) {
      setSelectedQuestionText('');
      setSelectedQuestionId('');
      return;
    }

    setLoading(true);
    try {
      // Сначала загружаем полный текст вопроса для отображения в админке
      await loadQuestionText(questionId);

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
      // Примечание: текст вопроса НЕ отправляется на ТВ-экран здесь
      // Он отобразится на ТВ только при нажатии кнопки "Начать Обсуждение"
    } catch (error) {
      console.error('Error selecting question:', error);
      setSelectedQuestionText('');
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
            const questionId = e.target.value;
            setSelectedQuestionId(questionId);
            if (questionId) {
              handleQuestionSelect(questionId);
            } else {
              setSelectedQuestionText('');
            }
          }}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Выберите вопрос --</option>
          {questions.map((question) => (
            <option key={question.id} value={question.id}>
              {getQuestionDisplayText(question)}
            </option>
          ))}
        </select>
      </div>

      {/* Текстовое поле с полным текстом вопроса для ведущего */}
      {selectedQuestionText && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Полный текст вопроса (для ведущего):
          </label>
          <textarea
            value={selectedQuestionText}
            readOnly
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none text-gray-900 font-medium"
            placeholder="Выберите вопрос из списка выше..."
          />
        </div>
      )}

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

