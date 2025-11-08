const fs = require('fs');
const express = require('express');

const app = express();
const port = 3000;
// app.get('/', (req, res) => {
//   res.status(200).json({
//     message: 'Hello from the ser ver side!',
//     app: 'Natours',
//   });
// });
// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...');
// });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

//Обработчик маршрутов
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      results: tours.length,
      tours,
    },
  });
});

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
