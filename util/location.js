const axios = require('axios');
const HttpError = require('../models/http-error');
const API_KEY = 'AIzaSyAyyKws_tnyfW1mrKHUB20g5PiEKUxgR-U';

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );
  const data = response.data;

  if (!data || data.status === 'ZERO_RESULTS') {
    const error = new HttpError('장소를 찾을 수 없습니다.', 422);
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = getCoordsForAddress;
