/* eslint-disable */
const babel = require('@babel/polyfill');
const login = require('./login');
const displayMap = require('./mapbox');

//DOM элементы
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');

// Делегирование событий
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
