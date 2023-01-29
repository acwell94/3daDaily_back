const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; // `Bearer TOKEN`
    if (!token) {
      throw new Error("인증 오류입니다.");
    }
    const decodedToken = jwt.verify(token, "testToken");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError("인증 오류입니다.", 401);
    return next(error);
  }
};
