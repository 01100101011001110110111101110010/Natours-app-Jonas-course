---
name: natours-workspace
description: 'Instructions for Natours Node.js API project. Use when: working on Express API routes, MongoDB models, authentication, error handling, or any feature development.'
---

# Natours Workspace Instructions

## Project Overview

**Natours** — это REST API для приложения по бронированию туров. Это учебный проект на Node.js с архитектурой **MVC**, MongoDB базой данных и JWT авторизацией.

## Быстрый старт

```bash
# Установить зависимости
npm install

# Запустить в режиме разработки с hot-reload
npm start

# Production режим
npm run start:prod

# Debug режим (через NDB)
npm run debug
```

**Порт по умолчанию**: 3000 (или через `PORT` в `config.env`)

## Архитектура проекта

### MVC Структура

- **Models** (`models/`) — MongoDB схемы (tourModels.js, userModels.js)
- **Controllers** (`controllers/`) — бизнес-логика и обработчики запросов
- **Routes** (`routes/`) — определение API маршрутов
- **Utils** (`utils/`) — вспомогательные функции (ошибки, API фильтры)

### Ключевые компоненты

| Файл                             | Назначение                                            |
| -------------------------------- | ----------------------------------------------------- |
| `app.js`                         | Конфигурация Express приложения и middleware          |
| `server.js`                      | Запуск сервера, подключение MongoDB, обработка ошибок |
| `routes/tourRouts.js`            | API маршруты для туров                                |
| `routes/userRouts.js`            | API маршруты для пользователей                        |
| `controllers/tourController.js`  | Логика обработки запросов туров                       |
| `controllers/userController.js`  | Логика обработки запросов пользователей               |
| `controllers/authController.js`  | Аутентификация (login, signup, JWT)                   |
| `controllers/errorController.js` | Глобальная обработка ошибок                           |
| `config.env`                     | Переменные окружения                                  |

## Конвенции кодирования

### 1. Asynchronous Code

- Используй `async/await` вместо `.then()` где возможно
- Оборачивай async функции в `catchAsync()` для обработки ошибок:

```javascript
// ✅ Правильно
const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) return next(new AppError('Tour not found', 404));
  res.status(200).json({ status: 'success', data: { tour } });
});

// ❌ Неправильно
const getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json(tour);
  } catch (err) {
    next(err); // Используй catchAsync вместо try-catch в контроллерах
  }
};
```

### 2. Обработка ошибок

- Создавай ошибки через `new AppError(message, statusCode)`:

```javascript
if (!tour) {
  return next(new AppError('No tour found with that ID', 404));
}
```

- Никогда не отправляй `throw new Error()` в контроллерах — используй `next()`

### 3. Именование файлов

- **Models**: `tourModels.js` (множественное число)
- **Controllers**: `tourController.js` (единственное число)
- **Routes**: `tourRouts.js` (заметь: опечатка "Routs" вместо "Routes" — следуй существующему стилю проекта)

### 4. Код стиль

- **Prettier**: Автоматическое форматирование (2 пробела, 80 символов)
- **ESLint**: Airbnb конфиг с Node.js плагинами
- Запусти linter перед коммитом:

```bash
npx eslint . --fix
npx prettier --write .
```

## Паттерны разработки

### Создание нового роута

```javascript
// routes/tourRouts.js
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);
```

### Создание контроллера

```javascript
// controllers/tourController.js
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) return next(new AppError('Tour not found', 404));

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});
```

### Создание модели MongoDB

```javascript
// models/tourModels.js
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    trim: true,
  },
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
```

## Переменные окружения

Конфигурируй в `config.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE=mongodb+srv://username:<PASSWORD>@cluster.mongodb.net/natours?retryWrites=true&w=majority
DATABASE_PASSWORD=your_actual_password
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=90d
```

## API Design

### Response Format

Всегда используй единообразный формат для ответов:

```javascript
// Успешный запрос
{
  "status": "success",
  "data": { /* данные */ }
}

// Ошибка
{
  "status": "fail",
  "message": "Invalid data sent"
}
```

### Status Codes

- 200 — OK
- 201 — Created
- 400 — Bad Request
- 404 — Not Found
- 500 — Server Error

## Типичные задачи

### Adding a new API endpoint

1. Создай route в `routes/tourRouts.js`
2. Реализуй handler в `controllers/tourController.js` (оборни в `catchAsync`)
3. Используй `Tour` модель для DB операций
4. Верни правильный status code и формат ответа

### Debugging

```bash
npm run debug  # Запускает Node.js с встроенным отладчиком
```

## Типичные ошибки

| Ошибка                                             | Решение                                                     |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `Cannot find module './models'`                    | Проверь относительный path к файлу                          |
| `TypeError: catchAsync is not a function`          | Убедись, что импортируешь из `utils/catchAsync`             |
| `Uncaught ReferenceError: AppError is not defined` | Импортируй: `const AppError = require('../utils/appError')` |
| Асинхронные ошибки не перехватываются              | Оборни контроллер в `catchAsync()`                          |
| MongoDB connection failed                          | Проверь DATABASE и DATABASE_PASSWORD в config.env           |

## Инструменты

- **nodemon** — автоматический перезапуск при изменениях
- **Morgan** — HTTP request логирование
- **Mongoose** — MongoDB ODM
- **JWT** — авторизация
- **bcryptjs** — хеширование паролей
- **Validator** — валидация данных
- **ESLint + Prettier** — качество кода

## Полезные ссылки

- [Express Documentation](https://expressjs.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [JWT Introduction](https://jwt.io)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## Поддерживаемые версии

- Node.js: 14+
- npm: 6+
- MongoDB: 4.0+
