'use strict'

class DetailedError {
  constructor(statusCode, errorCode, errorMsg, stackTrace) {
    this.statusCode = statusCode;
    this.errorCode  = errorCode;
    this.errorMsg   = errorMsg;
    this.stackTrace = stackTrace;
  }
}

DetailedError.errorCodes = {
  ProfileNotFound: 101, // start at 100s so it's easy to see the pattern (profile will have the 100s)
};

module.exports = DetailedError;