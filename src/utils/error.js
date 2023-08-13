class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.error = message;
    this.statusCode = statusCode;
  }
}

module.exports = CustomError;
