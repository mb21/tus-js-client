"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "DefaultHttpStack", {
  enumerable: true,
  get: function () {
    return _httpStack.default;
  }
});
Object.defineProperty(exports, "DetailedError", {
  enumerable: true,
  get: function () {
    return _error.default;
  }
});
exports.Upload = void 0;
Object.defineProperty(exports, "canStoreURLs", {
  enumerable: true,
  get: function () {
    return _urlStorage.canStoreURLs;
  }
});
exports.defaultOptions = void 0;
Object.defineProperty(exports, "enableDebugLog", {
  enumerable: true,
  get: function () {
    return _logger.enableDebugLog;
  }
});
exports.isSupported = void 0;
var _upload = _interopRequireDefault(require("../upload.js"));
var _noopUrlStorage = _interopRequireDefault(require("../noopUrlStorage.js"));
var _logger = require("../logger.js");
var _error = _interopRequireDefault(require("../error.js"));
var _urlStorage = require("./urlStorage.js");
var _httpStack = _interopRequireDefault(require("./httpStack.js"));
var _fileReader = _interopRequireDefault(require("./fileReader.js"));
var _fileSignature = _interopRequireDefault(require("./fileSignature.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const defaultOptions = exports.defaultOptions = {
  ..._upload.default.defaultOptions,
  httpStack: new _httpStack.default(),
  fileReader: new _fileReader.default(),
  urlStorage: _urlStorage.canStoreURLs ? new _urlStorage.WebStorageUrlStorage() : new _noopUrlStorage.default(),
  fingerprint: _fileSignature.default
};
class Upload extends _upload.default {
  constructor() {
    let file = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    options = {
      ...defaultOptions,
      ...options
    };
    super(file, options);
  }
  static terminate(url) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    options = {
      ...defaultOptions,
      ...options
    };
    return _upload.default.terminate(url, options);
  }
}

// Note: We don't reference `window` here because these classes also exist in a Web Worker's context.
exports.Upload = Upload;
const isSupported = exports.isSupported = typeof XMLHttpRequest === 'function' && typeof Blob === 'function' && typeof Blob.prototype.slice === 'function';