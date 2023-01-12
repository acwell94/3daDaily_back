class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // add Message Property
    this.code = errorCode; // add Code Property
  }
}

module.exports = HttpError;
