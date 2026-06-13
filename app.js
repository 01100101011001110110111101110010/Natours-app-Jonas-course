const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRouts');
const userRouter = require('./routes/userRouts');
const reviewRouter = require('./routes/reviewRouts');
const bookingRouter = require('./routes/bookingRouts');
const viewRouter = require('./routes/viewRouts');
const bookingController = require('./controllers/bookingController');

const app = express();
app.set('trust proxy', 1);
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1)Глобальное Промежуточное ПО
app.use(cors());

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'public')));
// Установка защиты HTTP заголовков
app.use(
  helmet({
    contentSecurityPolicy: false,
    strictTransportSecurity: false,
  }),
);
// Ведение журнала разработки
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many requests from this IP, please try againe in an hour!',
});
// Лимит запросов от 1го IP
app.use('/api', limiter);

// Stripe webhook — raw body нужен ДО express.json() для проверки подписи
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);

//Парсер тела(body) запроса, чтение данных из body в req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

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
app.use(compression());
// Тестовое промежуточное ПО
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2)Обработчик маршрутов

// 3)Маршруты

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.all('{*звёздочка}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

// 4) Запуск сервера
module.exports = app;
