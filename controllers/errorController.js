const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.errors.path}: ${err.errors.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value} Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, please log in againe!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired, please log in againe!', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Операционная ошибка, которой доверяем: отправляем сообщение пользователю
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      // isOperational: err.isOperational,
    });
    // Программная или другая неизвестная ошибка: не раскрывать детали пользователю
  } else {
    // 1) Зафиксировать ошибку
    // eslint-disable-next-line
    console.error('Error 🤬', err);
    // 2) Отправить общее сообщение
    res.status(500).json({
      status: 'Error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line
    let error = { ...err };

    if (error.name === 'CastError:') error = handleCastErrorDB(error); //здесь добавил двоиточие к CastError
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidatorError:')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
