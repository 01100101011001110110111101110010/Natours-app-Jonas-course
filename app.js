const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRouts');
const userRouter = require('./routes/userRouts');
const reviewRouter = require('./routes/reviewRouts');

const app = express();

// 1)Глобальное Промежуточное ПО
// Установка защиты HTTP заголовков
app.use(helmet());
// Ведение журнала разработки
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many requests from this IP, please try againe in an hour!',
});
// Лимит запросов от 1го IP
app.use('/api', limiter);
//Парсер тела(body) запроса, чтение данных из body в req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);
// Очистка данных от вредрения вредоносных запросов
// app.use(mongoSanitize());
// Очистка данных от внедрения межсайтовых скриптов
// app.use(xss());
// Защита от HTTP параметров поллютии (HTTP Parameter Pollution)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
// Обслуживание статических файлов
app.use(express.static(`${__dirname}/public`));

// Тестовое промежуточное ПО
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

// 2)Обработчик маршрутов

// 3)Маршруты

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('{*звёздочка}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

// 4) Запуск сервера
module.exports = app;
