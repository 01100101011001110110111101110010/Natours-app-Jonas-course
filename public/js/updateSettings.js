const axios = require('axios').default;
const { showAlert } = require('./alerts');

const updateSettings = async (data, type) => {
  // type это либо пароль, либо данные
  try {
    const route = type === 'password' ? 'updateMyPassword' : 'updateMe';
    const res = await axios({
      method: 'PATCH',
      url: `api/v1/users/${route}`,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

module.exports = updateSettings;
