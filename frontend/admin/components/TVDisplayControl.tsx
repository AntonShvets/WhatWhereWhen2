import React, { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { roundsApi, questionsApi, viewersApi, Round, Question } from '../lib/api';

interface TVDisplayControlProps {
  currentRound: Round | null;
  onDisplayUpdate?: (round: Round) => void;
}

/**
 * Компонент управления выводом контента на ТВ-клиент
 * Самая важная часть - отправка команд через Socket.io
 */
export const TVDisplayControl: React.FC<TVDisplayControlProps> = ({ currentRound, onDisplayUpdate }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);

  const socket = getSocket();

  useEffect(() => {
    if (currentRound?.question_id) {
      loadQuestion(currentRound.question_id);
    }
  }, [currentRound?.question_id]);

  const loadQuestion = async (questionId: string) => {
    try {
      const response = await questionsApi.getById(questionId);
      setCurrentQuestion(response.data);
    } catch (error) {
      console.error('Error loading question:', error);
    }
  };

  /**
   * Обновление display_status и отправка команды на ТВ-клиент
   */
  const updateDisplayStatus = async (displayStatus: any) => {
    if (!currentRound) {
      alert('Сначала выберите раунд');
      return;
    }

    setLoading(true);
    try {
      // ПРИОРИТЕТ: Сначала отправляем через Socket.io для мгновенного обновления ТВ-клиента
      socket.emit('display:update', {
        roundId: currentRound.id,
        displayStatus,
      }, (response: any) => {
        if (response && response.success) {
          console.log('Display status updated successfully');
        }
      });

      // Затем обновляем в базе данных в фоне (для надежности)
      roundsApi.updateDisplayStatus(currentRound.id, displayStatus)
        .then((updated) => {
          if (onDisplayUpdate) {
            onDisplayUpdate(updated.data);
          }
        })
        .catch((error) => {
          console.error('Error updating display status in DB:', error);
          // Не показываем ошибку пользователю, т.к. Socket.io уже отправил команду
        });
    } catch (error) {
      console.error('Error updating display status:', error);
      alert('Ошибка обновления отображения');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Кнопка "Показать Вопрос"
   */
  const handleShowQuestion = () => {
    if (!currentQuestion) {
      alert('Сначала выберите вопрос для раунда');
      return;
    }

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

    updateDisplayStatus(displayStatus);
  };

  /**
   * Кнопка "Показать Фото Телезрителя"
   */
  const handleShowViewer = async () => {
    if (!currentQuestion?.viewer_id) {
      alert('У вопроса нет информации о телезрителе');
      return;
    }

    try {
      setLoading(true);
      // Загружаем данные телезрителя из API
      const viewerResponse = await viewersApi.getById(currentQuestion.viewer_id);
      const viewer = viewerResponse.data;

      const displayStatus = {
        content: 'viewer',
        show_viewer: true,
        viewer_name: viewer.name || 'Телезритель',
        viewer_city: viewer.city || null,
        viewer_photo: viewer.photo_url || null,
        show_question: false,
        show_score: false,
      };

      updateDisplayStatus(displayStatus);
    } catch (error) {
      console.error('Error loading viewer:', error);
      alert('Ошибка загрузки данных телезрителя');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Кнопка "Показать Ответ"
   */
  const handleShowAnswer = () => {
    if (!currentQuestion) {
      alert('Сначала выберите вопрос');
      return;
    }

    const displayStatus = {
      content: 'answer',
      show_answer: true,
      answer_text: currentQuestion.answer,
      show_question: false,
      show_timer: false,
      show_score: false,
    };

    updateDisplayStatus(displayStatus);
  };

  /**
   * Кнопка "Скрыть Контент / Черный Экран"
   */
  const handleHideContent = () => {
    const displayStatus = {
      content: 'black',
      show_question: false,
      show_answer: false,
      show_viewer: false,
      show_score: false,
      show_timer: false,
      show_experts: false,
    };

    updateDisplayStatus(displayStatus);
  };

  /**
   * Кнопка "Показать Текущий Счет"
   */
  const handleShowScore = () => {
    const displayStatus = {
      content: 'score',
      show_score: true,
      show_question: false,
      show_answer: false,
      show_viewer: false,
      show_timer: false,
    };

    updateDisplayStatus(displayStatus);
  };

  /**
   * Кнопка "Показать Лого"
   */
  const handleShowLogo = () => {
    const displayStatus = {
      content: 'logo',
      show_question: false,
      show_answer: false,
      show_viewer: false,
      show_score: false,
      show_timer: false,
      media: '/uploads/game_logo.jpg',
    };

    updateDisplayStatus(displayStatus);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-xl p-6 mb-6 border-4 border-purple-300">
      <h2 className="text-3xl font-bold mb-4 text-gray-800 flex items-center">
        <span className="mr-2">📺</span>
        Управление Выводом на ТВ-Клиент
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Команды отправляются через Socket.io для мгновенного обновления на ТВ-экране
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={handleShowQuestion}
          disabled={!currentRound || !currentQuestion || loading}
          className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          📝 Показать Вопрос
        </button>

        <button
          onClick={handleShowViewer}
          disabled={!currentRound || !currentQuestion || loading}
          className="px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          👤 Показать Фото Телезрителя
        </button>

        <button
          onClick={handleShowAnswer}
          disabled={!currentRound || !currentQuestion || loading}
          className="px-6 py-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          ✅ Показать Ответ
        </button>

        <button
          onClick={handleShowScore}
          disabled={!currentRound || loading}
          className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          📊 Показать Текущий Счет
        </button>

        <button
          onClick={handleShowLogo}
          disabled={!currentRound || loading}
          className="px-6 py-4 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          🎨 Показать Лого
        </button>

        <button
          onClick={handleHideContent}
          disabled={!currentRound || loading}
          className="px-6 py-4 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg col-span-2 md:col-span-1"
        >
          ⬛ Черный Экран
        </button>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Отправка команды...</span>
        </div>
      )}

      {currentRound && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">Текущий display_status:</h3>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
            {JSON.stringify(currentRound.display_status, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

