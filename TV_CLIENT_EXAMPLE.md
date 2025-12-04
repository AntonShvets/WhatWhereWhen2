# Пример ТВ-клиента для обработки звуков

## Описание

Этот документ содержит примеры реализации ТВ-клиента, который принимает команды `play_sound` через Socket.io и воспроизводит звуковые файлы.

## Основной пример (TVClientExample.tsx)

### Особенности:

1. **Socket.io подключение** - Подключается к серверу и присоединяется к комнате игры
2. **Обработчик play_sound** - Слушает события `play_sound` от админки
3. **HTML5 Audio** - Использует `<audio>` тег для воспроизведения звуков
4. **Динамическая загрузка** - Загружает звуки по требованию

### Использование:

```tsx
import { TVClientExample } from './TVClientExample';

function TVPage() {
  const gameId = 'your-game-id';
  return <TVClientExample gameId={gameId} />;
}
```

## Альтернативная реализация (TVClientWithMultipleAudio)

### Преимущества:

- **Предзагрузка звуков** - Все звуки загружаются заранее
- **Быстрое воспроизведение** - Нет задержки на загрузку
- **Меньше ошибок** - Каждый звук имеет свой audio элемент

### Когда использовать:

- Если звуки воспроизводятся часто
- Если нужна минимальная задержка
- Если набор звуков ограничен и известен заранее

## Структура URL звуков

Звуковые файлы должны быть доступны по следующему пути:

```
http://localhost:3002/uploads/{filename}
```

Например:
- `http://localhost:3002/uploads/gong.mp3`
- `http://localhost:3002/uploads/minute_start.mp3`
- `http://localhost:3002/uploads/siren.mp3`
- `http://localhost:3002/uploads/correct.mp3`
- `http://localhost:3002/uploads/incorrect.mp3`

## Поток данных

```
Админка
  ↓ socket.emit('play_sound', { gameId, file: 'gong.mp3' })
Backend Gateway
  ↓ server.to(`game:${gameId}`).emit('play_sound', { file, volume })
ТВ-Клиент
  ↓ socket.on('play_sound', ...)
  ↓ audioRef.current.src = '/uploads/gong.mp3'
  ↓ audioRef.current.play()
```

## Обработка ошибок

ТВ-клиент обрабатывает следующие ошибки:

1. **Файл не найден** - Логирует предупреждение
2. **Ошибка воспроизведения** - Логирует ошибку и сбрасывает состояние
3. **Отключение от сервера** - Автоматическое переподключение

## Настройка громкости

Громкость передается в команде `play_sound`:

```typescript
socket.emit('play_sound', {
  gameId: '...',
  file: 'gong.mp3',
  volume: 0.8, // от 0.0 до 1.0
});
```

ТВ-клиент автоматически ограничивает значение от 0 до 1.

## Рекомендации

1. **Предзагрузка** - Используйте `preload="auto"` для часто используемых звуков
2. **Кэширование** - Браузер автоматически кэширует загруженные звуки
3. **Формат файлов** - Используйте MP3 для максимальной совместимости
4. **Размер файлов** - Оптимизируйте звуки для быстрой загрузки
5. **Обработка ошибок** - Всегда обрабатывайте ошибки воспроизведения

## Полная интеграция

Для полной интеграции ТВ-клиента:

1. Создайте страницу в Next.js: `pages/tv.tsx`
2. Используйте компонент `TVClientExample`
3. Настройте маршрутизацию для доступа к ТВ-клиенту
4. Убедитесь, что звуковые файлы загружены в `/uploads` на сервере

## Пример полной страницы

```tsx
// pages/tv.tsx
import { TVClientExample } from '../components/TVClientExample';
import { useRouter } from 'next/router';

export default function TVPage() {
  const router = useRouter();
  const { gameId } = router.query;

  if (!gameId || typeof gameId !== 'string') {
    return <div>Game ID required</div>;
  }

  return <TVClientExample gameId={gameId} />;
}
```

