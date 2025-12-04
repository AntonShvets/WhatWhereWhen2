# Инструкция по установке и запуску

## Предварительные требования

- Node.js 18+
- PostgreSQL 14+
- npm или yarn

## Установка

### 1. Создание базы данных

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE whatwherewhen2;

# Выйдите из psql
\q

# Примените схему
psql -U postgres -d whatwherewhen2 -f database/schema.sql
```

### 2. Настройка Backend (NestJS)

```bash
cd backend

# Установите зависимости
npm install

# Создайте файл .env (скопируйте из .env.example)
cp .env.example .env

# Отредактируйте .env с вашими настройками БД

# Запустите сервер разработки
npm run start:dev
```

Backend будет доступен на `http://localhost:3002`

### 3. Настройка Frontend Admin (Next.js)

```bash
cd frontend/admin

# Установите зависимости
npm install

# Создайте файл .env.local (скопируйте из .env.example)
cp .env.example .env.local

# Запустите сервер разработки
npm run dev
```

Админка будет доступна на `http://localhost:3000`

## Структура проекта

```
WhatWhereWhen2/
├── backend/              # NestJS API + Socket.io
│   ├── src/
│   │   ├── gateways/    # Socket.io gateways
│   │   ├── modules/     # Модули (games, rounds, questions)
│   │   └── main.ts
│   └── package.json
├── frontend/
│   └── admin/           # Next.js админка
│       ├── components/  # React компоненты
│       ├── pages/       # Next.js страницы
│       └── lib/         # API клиенты, Socket.io
├── database/
│   └── schema.sql       # SQL схема БД
└── README.md
```

## Основные компоненты

### Backend

- **GameGateway** (`src/gateways/game.gateway.ts`) - Socket.io gateway для real-time коммуникации
- **GamesService** - Управление играми
- **RoundsService** - Управление раундами
- **QuestionsService** - Управление вопросами

### Frontend Admin

- **ScoreControl** - Управление счетом с кнопками +1/-1
- **RoundControl** - Управление статусом раунда и выбор вопроса
- **TVDisplayControl** - Управление выводом контента на ТВ-клиент

## API Endpoints

### Games
- `GET /api/games` - Список игр
- `GET /api/games/active` - Активная игра
- `GET /api/games/:id` - Детали игры
- `POST /api/games` - Создать игру
- `PATCH /api/games/:id` - Обновить игру
- `POST /api/games/:id/start` - Начать игру

### Rounds
- `GET /api/rounds` - Список раундов
- `GET /api/rounds/game/:gameId` - Раунды игры
- `GET /api/rounds/:id` - Детали раунда
- `POST /api/rounds` - Создать раунд
- `PATCH /api/rounds/:id` - Обновить раунд
- `PATCH /api/rounds/:id/display-status` - Обновить display_status

### Questions
- `GET /api/questions` - Список вопросов
- `GET /api/questions/approved` - Одобренные вопросы
- `GET /api/questions/:id` - Детали вопроса
- `POST /api/questions` - Создать вопрос
- `PATCH /api/questions/:id` - Обновить вопрос
- `PATCH /api/questions/:id/approve` - Одобрить вопрос

## Socket.io Events

### Client → Server

- `game:join` - Присоединиться к игре
  ```typescript
  socket.emit('game:join', { gameId: '...' });
  ```

- `score:update` - Обновить счет
  ```typescript
  socket.emit('score:update', { 
    gameId: '...', 
    expertsScore: 5,
    viewersScore: 3 
  });
  ```

- `round:status:update` - Обновить статус раунда
  ```typescript
  socket.emit('round:status:update', { 
    roundId: '...', 
    status: 'question_shown' 
  });
  ```

- `display:update` - Обновить display_status для ТВ
  ```typescript
  socket.emit('display:update', { 
    roundId: '...', 
    displayStatus: { content: 'question', ... } 
  });
  ```

- `round:question:select` - Выбрать вопрос для раунда
  ```typescript
  socket.emit('round:question:select', { 
    roundId: '...', 
    questionId: '...' 
  });
  ```

### Server → Client

- `score:update` - Обновление счета
- `round:status:update` - Обновление статуса раунда
- `display:change` - Изменение отображаемого контента
- `round:question:selected` - Вопрос выбран для раунда

## Тестирование

### Создание тестовой игры

```bash
# Через API
curl -X POST http://localhost:3002/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "experts_score": 0,
    "viewers_score": 0
  }'
```

### Создание тестового вопроса

```bash
curl -X POST http://localhost:3002/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Какой город является столицей Франции?",
    "type": "text",
    "answer": "Париж",
    "is_approved": true
  }'
```

## Troubleshooting

### Проблемы с подключением к БД

1. Убедитесь, что PostgreSQL запущен
2. Проверьте настройки в `.env`
3. Проверьте права доступа пользователя БД

### Проблемы с Socket.io

1. Проверьте CORS настройки в `game.gateway.ts`
2. Убедитесь, что порты не заблокированы файрволом
3. Проверьте консоль браузера на ошибки подключения

### Проблемы с фронтендом

1. Убедитесь, что backend запущен
2. Проверьте переменные окружения в `.env.local`
3. Очистите кэш Next.js: `rm -rf .next`

## Следующие шаги

1. Создайте ТВ-клиент (аналогично админке, но с другим UI)
2. Добавьте аутентификацию и авторизацию
3. Настройте production окружение
4. Добавьте тесты
5. Настройте CI/CD

