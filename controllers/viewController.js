const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1)Получить все данные о турах из нашей коллекции
  const tours = await Tour.find();
  //   2)Создать шаблон

  //   Отобразить этот шаблон используя туры из первого шага
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = (req, res) => {
  res.status(200).render('tour', {
    tour: 'The Forest Haiker',
  });
};
