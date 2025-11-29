const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRouts');
const userRouter = require('./routes/userRouts');

const app = express();

// 1)Промежуточное ПО

app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
  console.log('Hellow from the middleware 📟');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2)Обработчик маршрутов

// 3)Маршруты

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// 4) Запуск сервера
module.exports = app;
