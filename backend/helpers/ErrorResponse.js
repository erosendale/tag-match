'use strict'

class ErrorResponse {
  constructor(statusCode, errorCode, errorMsg, raw) {
    this.statusCode = statusCode;
    this.errorCode  = errorCode;
    this.errorMsg   = errorMsg;
    this.raw        = raw;
  }
}

ErrorResponse.errorCodes = {
  BadParameters: 101, // first hundred are util errors
  UserRegisterEmailAlreadyExists: 201,
  UserRegisterBcryptError: 202,
  ProfileNotFound: 301, // start at 100s so it's easy to see the pattern (profile will have the 100s)
};

module.exports = ErrorResponse;