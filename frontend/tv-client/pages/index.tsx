import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSocket, disconnectSocket } from '../lib/socket';
import { gamesApi, questionsApi, viewersApi, Game, Question, Viewer } from '../lib/api';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { Scoreboard } from '../components/Scoreboard';
import { QuestionDisplay } from '../components/QuestionDisplay';
import { ViewerDisplay } from '../components/ViewerDisplay';
import { AnswerDisplay } from '../components/AnswerDisplay';
import { SoundPlayer } from '../components/SoundPlayer';

interface DisplayStatus {
  content?: string;
  show_question?: boolean;
  show_answer?: boolean;
  show_viewer?: boolean;
  show_score?: boolean;
  show_timer?: boolean;
  show_experts?: boolean;
  question_text?: string;
  question_type?: string;
  answer_text?: string;
  media?: string;
  viewer_name?: string;
  viewer_city?: string;
  viewer_photo?: string;
  timer_seconds?: number;
  timer_start_time?: number; // Добавляем timestamp для принудительного перезапуска
}

export default function TVClientPage() {
  const router = useRouter();
  const { gameId } = router.query;

  const [connected, setConnected] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentViewer, setCurrentViewer] = useState<Viewer | null>(null);
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>({});
  const [expertsScore, setExpertsScore] = useState(0);
  const [viewersScore, setViewersScore] = useState(0);
  const [showScore, setShowScore] = useState(true);
  
  // Звук
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState(1.0);
  const soundKeyRef = useRef(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Таймер
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimerStartRef = useRef<number | null>(null); // Добавляем ref для отслеживания последнего запуска
  const timerSoundsPlayedRef = useRef<{
    start: boolean;
    preFinish: boolean;
    finish: boolean;
  }>({ start: false, preFinish: false, finish: false });

  useEffect(() => {
    // Всегда пытаемся загрузить активную игру, даже если gameId указан в URL
    loadActiveGame();

    // Разблокировка аудио при первом взаимодействии
    // Используем глобальный обработчик, который будет работать с любым audio элементом на странице
    const unlockAudio = async () => {
      // Находим все audio элементы на странице и пытаемся их разблокировать
      const audioElements = document.querySelectorAll('audio');
      for (let i = 0; i < audioElements.length; i++) {
        const audio = audioElements[i] as HTMLAudioElement;
        try {
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          console.log('✓ Audio context unlocked via page interaction');
          setAudioUnlocked(true);
          break; // Достаточно разблокировать один элемент
        } catch (error) {
          // Продолжаем попытки с другими элементами
        }
      }
    };

    // Слушаем первое взаимодействие для разблокировки (на всю страницу)
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    let unlocked = false;
    const handler = () => {
      if (!unlocked) {
        unlocked = true;
        unlockAudio();
        // Удаляем все обработчики после разблокировки
        events.forEach(e => document.removeEventListener(e, handler));
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handler, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handler);
      });
    };
  }, []);

  useEffect(() => {
    // Обработка таймера
    if (displayStatus?.show_timer && displayStatus?.timer_seconds !== undefined) {
      // Проверяем, был ли таймер перезапущен (новый timer_start_time)
      const isNewTimer = displayStatus.timer_start_time !== lastTimerStartRef.current;
      
      if (isNewTimer) {
        // Сбрасываем флаги звуков при новом запуске таймера
        timerSoundsPlayedRef.current = { start: false, preFinish: false, finish: false };
        lastTimerStartRef.current = displayStatus.timer_start_time || null;
      }
      
      // Всегда останавливаем предыдущий таймер перед запуском нового
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Устанавливаем новое значение таймера
      const initialSeconds = displayStatus.timer_seconds;
      setTimerSeconds(initialSeconds);
      
      // Воспроизводим звук старта при запуске нового таймера
      if (isNewTimer && !timerSoundsPlayedRef.current.start) {
        console.log('🎵 Playing start sound');
        playSound('question_time_start.mp3', 1.0);
        timerSoundsPlayedRef.current.start = true;
      }
      
      // Запускаем новый таймер
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === null || prev <= 0) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            return 0;
          }
          
          const newValue = prev - 1;
          
          // Воспроизводим звук предупреждения за 10 секунд до конца
          if (newValue === 10 && !timerSoundsPlayedRef.current.preFinish) {
            console.log('🎵 Timer at 10 seconds - playing pre-finish sound');
            timerSoundsPlayedRef.current.preFinish = true;
            // Вызываем playSound вне функции обновления состояния
            setTimeout(() => {
              playSound('question_time_pre_finish.mp3', 1.0);
            }, 0);
          }
          
          // Воспроизводим звук окончания на последней секунде
          if (newValue === 0 && !timerSoundsPlayedRef.current.finish) {
            console.log('🎵 Timer at 0 second - playing finish sound');
            timerSoundsPlayedRef.current.finish = true;
            // Вызываем playSound вне функции обновления состояния
            setTimeout(() => {
              playSound('question_time_finish.mp3', 1.0);
            }, 0);
          }
          
          return newValue;
        });
      }, 1000);
    } else {
      // Если таймер выключен, останавливаем отсчет
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerSeconds(null);
      // Сбрасываем флаги звуков при остановке таймера
      timerSoundsPlayedRef.current = { start: false, preFinish: false, finish: false };
    }

    // Очистка при размонтировании
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [displayStatus?.show_timer, displayStatus?.timer_seconds, displayStatus?.timer_start_time]); // Добавляем timer_start_time в зависимости

  const loadActiveGame = async () => {
    try {
      // Проверяем gameId из URL
      const urlGameId = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search).get('gameId')
        : null;
      
      if (urlGameId) {
        console.log('Using gameId from URL:', urlGameId);
        initializeGame(urlGameId);
        return;
      }

      // Иначе загружаем активную игру
      const response = await gamesApi.getActive();
      if (response.data && response.data.id) {
        console.log('Loaded active game:', response.data.id);
        initializeGame(response.data.id);
      } else {
        console.warn('No active game found');
      }
    } catch (error) {
      console.error('Error loading active game:', error);
      // Пробуем использовать gameId из URL даже при ошибке
      const urlGameId = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search).get('gameId')
        : null;
      if (urlGameId) {
        console.log('Trying to use gameId from URL after error:', urlGameId);
        initializeGame(urlGameId);
      }
    }
  };

  const initializeGame = async (id: string) => {
    try {
      // Загружаем игру
      const gameResponse = await gamesApi.getById(id);
      setGame(gameResponse.data);
      setExpertsScore(gameResponse.data.experts_score);
      setViewersScore(gameResponse.data.viewers_score);

      // Подключаемся к Socket.io
      const socket = getSocket();

      // Настраиваем обработчики событий ДО подключения
      // Обновление счета
      const handleScoreUpdate = (data: { gameId: string; expertsScore: number; viewersScore: number }) => {
        console.log('score:update received:', data);
        if (data.gameId === id) {
          setExpertsScore(data.expertsScore);
          setViewersScore(data.viewersScore);
        }
      };
      socket.on('score:update', handleScoreUpdate);

      // Обновление display_status (оптимизировано для мгновенного обновления, как score:update)
      const handleDisplayChange = (data: { roundId: string; displayStatus: any }) => {
        console.log('=== DISPLAY:CHANGE EVENT RECEIVED ===');
        console.log('Full data:', JSON.stringify(data, null, 2));
        console.log('displayStatus:', data.displayStatus);
        console.log('content:', data.displayStatus?.content);
        console.log('show_question:', data.displayStatus?.show_question);
        console.log('question_text:', data.displayStatus?.question_text);
        // Мгновенное обновление без задержек (точно как в score:update)
        if (data && data.displayStatus) {
          console.log('Updating displayStatus state...');
          // Принудительно обновляем состояние - создаем новый объект
          const newStatus = { ...data.displayStatus };
          console.log('Setting new displayStatus:', JSON.stringify(newStatus, null, 2));
          setDisplayStatus(newStatus);
          // Обновляем видимость счета немедленно
          if (newStatus.show_score !== undefined) {
            setShowScore(newStatus.show_score);
          }
          console.log('✓ displayStatus state updated successfully');
        } else {
          console.error('❌ Invalid display:change data:', data);
        }
      };
      
      // Регистрируем обработчик события
      socket.on('display:change', handleDisplayChange);
      console.log('✓ Registered display:change event handler');
      
      // Также слушаем все события для отладки
      socket.onAny((event, ...args) => {
        console.log(`🔍 Socket.io event received: ${event}`, args);
        if (event === 'display:change') {
          console.log('🔍 display:change event detected via onAny!');
          console.log('🔍 Args:', JSON.stringify(args, null, 2));
        }
      });

      // Команда проигрывания звука (оптимизировано для мгновенного воспроизведения)
      socket.on('play_sound', (data: { file: string; volume?: number; timestamp: number }) => {
        console.log('Play sound command received:', data);
        // Мгновенное воспроизведение без задержек
        playSound(data.file, data.volume || 1.0);
      });

      // Обновление игры
      socket.on('game:update', (data: Game) => {
        if (data.id === id) {
          setGame(data);
          setExpertsScore(data.experts_score);
          setViewersScore(data.viewers_score);
        }
      });

      socket.on('connect', () => {
        console.log('TV Client connected to Socket.io, gameId:', id);
        setConnected(true);
        // Присоединяемся к комнате игры
        socket.emit('game:join', { gameId: id }, (response: any) => {
          console.log('game:join response:', response);
          if (response && response.success) {
            console.log('✓ Successfully joined game room:', id);
          } else {
            console.error('✗ Failed to join game room:', response);
          }
        });
      });

      socket.on('disconnect', () => {
        console.log('TV Client disconnected');
        setConnected(false);
      });

      // Если уже подключен, сразу присоединяемся к комнате
      if (socket.connected) {
        console.log('Socket already connected, joining room immediately');
        socket.emit('game:join', { gameId: id }, (response: any) => {
          console.log('game:join response (already connected):', response);
        });
      }

      return () => {
        socket.off('score:update', handleScoreUpdate);
        socket.off('display:change', handleDisplayChange);
        socket.off('play_sound');
        socket.off('game:update');
        socket.off('connect');
        socket.off('disconnect');
      };
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  };


  const playSound = (filename: string, volume: number) => {
    console.log('🔊 playSound called:', filename, 'volume:', volume);
    setCurrentSound(filename);
    setSoundVolume(volume);
    soundKeyRef.current += 1; // Принудительное обновление компонента звука
  };

  const handleSoundEnded = () => {
    setCurrentSound(null);
  };

  // Определяем, что отображать в основной области
  const renderMainContent = () => {
    const status = displayStatus;
    console.log('=== renderMainContent CALLED ===');
    console.log('displayStatus:', JSON.stringify(status, null, 2));
    console.log('status.content:', status.content);
    console.log('status.show_question:', status.show_question);
    console.log('status.question_text:', status.question_text);

    // Показать логотип
    if (status.content === 'logo') {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const logoUrl = status.media 
        ? (status.media.startsWith('http') 
            ? status.media 
            : `${API_URL}${status.media}`)
        : `${API_URL}/uploads/game_logo.jpg`;
      
      return (
        <div className="flex items-center justify-center h-full w-full">
          <img 
            src={logoUrl} 
            alt="Game Logo" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    // Показать вопрос (приоритет - проверяем первым)
    // Проверяем оба условия: content === 'question' ИЛИ show_question === true
    const hasContent = status && Object.keys(status).length > 0;
    const isQuestion = status?.content === 'question' || status?.show_question === true;
    const shouldShowQuestion = hasContent && isQuestion;
    
    console.log('shouldShowQuestion check:');
    console.log('  - hasContent:', hasContent);
    console.log('  - status.content:', status?.content);
    console.log('  - status.show_question:', status?.show_question);
    console.log('  - isQuestion:', isQuestion);
    console.log('  - shouldShowQuestion:', shouldShowQuestion);
    
    if (shouldShowQuestion) {
      console.log('✓ RENDERING QUESTION');
      console.log('Question text:', status.question_text);
      const questionText = status.question_text || currentQuestion?.text || 'Ожидание вопроса...';
      console.log('Final question text:', questionText);
      return (
        <QuestionDisplay
          text={questionText}
          type={status.question_type || currentQuestion?.type || 'text'}
          mediaUrl={status.media || currentQuestion?.media_url || null}
          showTimer={status.show_timer}
          timerSeconds={timerSeconds !== null ? timerSeconds : (status.timer_seconds || 0)}
        />
      );
    }

    // Показать ответ
    if (status.content === 'answer' || status.show_answer === true) {
      return (
        <AnswerDisplay answer={status.answer_text || currentQuestion?.answer || ''} />
      );
    }

    // Показать телезрителя
    if (status.content === 'viewer' || status.show_viewer === true) {
      return (
        <ViewerDisplay
          name={status.viewer_name || currentViewer?.name || 'Телезритель'}
          city={status.viewer_city || currentViewer?.city || null}
          photoUrl={status.viewer_photo || currentViewer?.photo_url || null}
        />
      );
    }

    // Показать счет
    if (status.content === 'score' || status.show_score === true) {
      return (
        <Scoreboard 
          expertsScore={expertsScore}
          viewersScore={viewersScore}
        />
      );
    }

    // Черный экран (только если явно указано)
    if (status.content === 'black') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-tv-2xl text-gray-800">Черный экран</div>
        </div>
      );
    }

    // По умолчанию - черный экран
    console.log('⚠ Rendering default "Waiting for command" screen');
    console.log('Status object:', status);
    console.log('Status keys:', status ? Object.keys(status) : 'status is null/undefined');
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-tv-xl text-gray-600">Ожидание команды...</div>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen bg-black text-white overflow-hidden">
      {/* Индикатор подключения (маленький в углу) */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-4 py-2 rounded-lg text-sm font-bold ${
          connected ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {connected ? '✓ Подключено' : '✗ Отключено'}
        </div>
      </div>

      {/* Счет (постоянно видимый вверху) - скрывается при показе полного табло */}
      {!(displayStatus?.content === 'score' || displayStatus?.show_score === true) && (
        <ScoreDisplay
          expertsScore={expertsScore}
          viewersScore={viewersScore}
          show={showScore}
        />
      )}

      {/* Основная область контента */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          paddingTop: showScore && !(displayStatus?.content === 'score' || displayStatus?.show_score === true) ? '120px' : '0' 
        }}
      >
        {renderMainContent()}
      </div>
      
      {/* Debug info (только для разработки) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs z-50">
          <div>content: {displayStatus?.content || 'undefined'}</div>
          <div>show_question: {String(displayStatus?.show_question)}</div>
          <div>question_text: {displayStatus?.question_text?.substring(0, 30) || 'none'}</div>
          <button
            onClick={() => {
              console.log('TEST: Manually setting displayStatus');
              setDisplayStatus({
                content: 'question',
                show_question: true,
                question_text: 'ТЕСТОВЫЙ ВОПРОС',
                question_type: 'text',
              });
            }}
            className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Тест: Установить вопрос
          </button>
        </div>
      )}

      {/* Подсказка для разблокировки аудио */}
      {!audioUnlocked && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setAudioUnlocked(true)}
        >
          <div className="text-center text-white p-8 bg-gray-900 rounded-lg border-2 border-yellow-500">
            <div className="text-4xl mb-4">🔊</div>
            <div className="text-2xl font-bold mb-2">Разблокировка звука</div>
            <div className="text-lg">Кликните в любом месте для разблокировки звука</div>
          </div>
        </div>
      )}

      {/* Компонент проигрывания звуков */}
      <SoundPlayer
        key={soundKeyRef.current}
        soundFile={currentSound}
        volume={soundVolume}
        onEnded={() => {
          handleSoundEnded();
          setAudioUnlocked(true); // Разблокируем после первого успешного воспроизведения
        }}
      />
    </div>
  );
}

