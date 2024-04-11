"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isReactNative = _interopRequireDefault(require("./isReactNative.js"));
var _uriToBlob = _interopRequireDefault(require("./uriToBlob.js"));
var _FileSource = _interopRequireDefault(require("./sources/FileSource.js"));
var _StreamSource = _interopRequireDefault(require("./sources/StreamSource.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class FileReader {
  async openFile(input, chunkSize) {
    // In React Native, when user selects a file, instead of a File or Blob,
    // you usually get a file object {} with a uri property that contains
    // a local path to the file. We use XMLHttpRequest to fetch
    // the file blob, before uploading with tus.
    if ((0, _isReactNative.default)() && input && typeof input.uri !== 'undefined') {
      try {
        const blob = await (0, _uriToBlob.default)(input.uri);
        return new _FileSource.default(blob);
      } catch (err) {
        throw new Error(`tus: cannot fetch \`file.uri\` as Blob, make sure the uri is correct and accessible. ${err}`);
      }
    }

    // Since we emulate the Blob type in our tests (not all target browsers
    // support it), we cannot use `instanceof` for testing whether the input value
    // can be handled. Instead, we simply check is the slice() function and the
    // size property are available.
    if (typeof input.slice === 'function' && typeof input.size !== 'undefined') {
      return Promise.resolve(new _FileSource.default(input));
    }
    if (typeof input.read === 'function') {
      chunkSize = Number(chunkSize);
      if (!Number.isFinite(chunkSize)) {
        return Promise.reject(new Error('cannot create source for stream without a finite value for the `chunkSize` option'));
      }
      return Promise.resolve(new _StreamSource.default(input, chunkSize));
    }
    return Promise.reject(new Error('source object may only be an instance of File, Blob, or Reader in this environment'));
  }
}
exports.default = FileReader;