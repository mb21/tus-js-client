"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isCordova = _interopRequireDefault(require("./isCordova.js"));
var _readAsByteArray = _interopRequireDefault(require("./readAsByteArray.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class FileSource {
  // Make this.size a method
  constructor(file) {
    this._file = file;
    this.size = file.size;
  }
  slice(start, end) {
    // In Apache Cordova applications, a File must be resolved using
    // FileReader instances, see
    // https://cordova.apache.org/docs/en/8.x/reference/cordova-plugin-file/index.html#read-a-file
    if ((0, _isCordova.default)()) {
      return (0, _readAsByteArray.default)(this._file.slice(start, end));
    }
    const value = this._file.slice(start, end);
    const done = end >= this.size;
    return Promise.resolve({
      value,
      done
    });
  }
  close() {
    // Nothing to do here since we don't need to release any resources.
  }
}
exports.default = FileSource;