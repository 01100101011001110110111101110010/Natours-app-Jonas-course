/* eslint-disable */
const axios = require('axios').default;
const { showAlert } = require('./alerts');

exports.checkoutSession = async (tourId) => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    window.location.assign(session.data.session.url);
  } catch (err) {
    showAlert('error', err);
  }
};
