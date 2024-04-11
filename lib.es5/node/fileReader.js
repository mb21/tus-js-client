"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _fs = require("fs");
var _isStream = _interopRequireDefault(require("is-stream"));
var _BufferSource = _interopRequireDefault(require("./sources/BufferSource.js"));
var _FileSource = _interopRequireDefault(require("./sources/FileSource.js"));
var _StreamSource = _interopRequireDefault(require("./sources/StreamSource.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class FileReader {
  openFile(input, chunkSize) {
    if (Buffer.isBuffer(input)) {
      return Promise.resolve(new _BufferSource.default(input));
    }
    if (input instanceof _fs.ReadStream && input.path != null) {
      return (0, _FileSource.default)(input);
    }
    if (_isStream.default.readable(input)) {
      chunkSize = Number(chunkSize);
      if (!Number.isFinite(chunkSize)) {
        return Promise.reject(new Error('cannot create source for stream without a finite value for the `chunkSize` option; specify a chunkSize to control the memory consumption'));
      }
      return Promise.resolve(new _StreamSource.default(input));
    }
    return Promise.reject(new Error('source object may only be an instance of Buffer or Readable in this environment'));
  }
}
exports.default = FileReader;