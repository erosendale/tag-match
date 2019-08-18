export default class DetailedError {
  constructor(errorCode, errorMsg, stackTrace) {
    this.errorCode  = errorCode;
    this.errorMsg   = errorMsg;
    this.stackTrace = stackTrace;
  }

  toString() {
    return JSON.stringify(this);
  }
}