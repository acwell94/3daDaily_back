const axios = require("axios");
const HttpError = require("../models/http-error");
require("dotenv").config();
const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address) {
  if (!address) {
    return;
  }
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );
  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError("장소를 찾을 수 없습니다.", 422);
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = getCoordsForAddress;
