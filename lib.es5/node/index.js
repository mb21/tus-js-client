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
Object.defineProperty(exports, "FileUrlStorage", {
  enumerable: true,
  get: function () {
    return _urlStorage.FileUrlStorage;
  }
});
Object.defineProperty(exports, "StreamSource", {
  enumerable: true,
  get: function () {
    return _StreamSource.default;
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
var _StreamSource = _interopRequireDefault(require("./sources/StreamSource.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const defaultOptions = exports.defaultOptions = {
  ..._upload.default.defaultOptions,
  httpStack: new _httpStack.default(),
  fileReader: new _fileReader.default(),
  urlStorage: new _noopUrlStorage.default(),
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

// The Node.js environment does not have restrictions which may cause
// tus-js-client not to function.
exports.Upload = Upload;
const isSupported = exports.isSupported = true;

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.