"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class DetailedError extends Error {
  constructor(message) {
    let causingErr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    let req = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    let res = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    super(message);
    this.originalRequest = req;
    this.originalResponse = res;
    this.causingError = causingErr;
    if (causingErr != null) {
      message += `, caused by ${causingErr.toString()}`;
    }
    if (req != null) {
      const requestId = req.getHeader('X-Request-ID') || 'n/a';
      const method = req.getMethod();
      const url = req.getURL();
      const status = res ? res.getStatus() : 'n/a';
      const body = res ? res.getBody() || '' : 'n/a';
      message += `, originated from request (method: ${method}, url: ${url}, response code: ${status}, response text: ${body}, request id: ${requestId})`;
    }
    this.message = message;
  }
}
var _default = exports.default = DetailedError;