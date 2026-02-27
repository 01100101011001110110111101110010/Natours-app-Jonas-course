const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRouts');
const userRouter = require('./routes/userRouts');

const app = express();

// 1)Промежуточное ПО
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2)Обработчик маршрутов

// 3)Маршруты

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('{*звёздочка}', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server`,
  });
  next();
});

// 4) Запуск сервера
module.exports = app;
