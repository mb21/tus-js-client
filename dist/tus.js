(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tus = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./isReactNative.js":5,"./sources/FileSource.js":6,"./sources/StreamSource.js":7,"./uriToBlob.js":10}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fingerprint;
var _isReactNative = _interopRequireDefault(require("./isReactNative.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// TODO: Differenciate between input types

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @param {Object} options
 * @param {Function} callback
 */
function fingerprint(file, options) {
  if ((0, _isReactNative.default)()) {
    return Promise.resolve(reactNativeFingerprint(file, options));
  }
  return Promise.resolve(['tus-br', file.name, file.type, file.size, file.lastModified, options.endpoint].join('-'));
}
function reactNativeFingerprint(file, options) {
  const exifHash = file.exif ? hashCode(JSON.stringify(file.exif)) : 'noexif';
  return ['tus-rn', file.name || 'noname', file.size || 'nosize', exifHash, options.endpoint].join('/');
}
function hashCode(str) {
  /* eslint-disable no-bitwise */
  // from https://stackoverflow.com/a/8831937/151666
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
}

},{"./isReactNative.js":5}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/* eslint-disable max-classes-per-file */
class XHRHttpStack {
  createRequest(method, url) {
    return new Request(method, url);
  }
  getName() {
    return 'XHRHttpStack';
  }
}
exports.default = XHRHttpStack;
class Request {
  constructor(method, url) {
    this._xhr = new XMLHttpRequest();
    this._xhr.open(method, url, true);
    this._method = method;
    this._url = url;
    this._headers = {};
  }
  getMethod() {
    return this._method;
  }
  getURL() {
    return this._url;
  }
  setHeader(header, value) {
    this._xhr.setRequestHeader(header, value);
    this._headers[header] = value;
  }
  getHeader(header) {
    return this._headers[header];
  }
  setProgressHandler(progressHandler) {
    // Test support for progress events before attaching an event listener
    if (!('upload' in this._xhr)) {
      return;
    }
    this._xhr.upload.onprogress = e => {
      if (!e.lengthComputable) {
        return;
      }
      progressHandler(e.loaded);
    };
  }
  send() {
    let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    return new Promise((resolve, reject) => {
      this._xhr.onload = () => {
        resolve(new Response(this._xhr));
      };
      this._xhr.onerror = err => {
        reject(err);
      };
      this._xhr.send(body);
    });
  }
  abort() {
    this._xhr.abort();
    return Promise.resolve();
  }
  getUnderlyingObject() {
    return this._xhr;
  }
}
class Response {
  constructor(xhr) {
    this._xhr = xhr;
  }
  getStatus() {
    return this._xhr.status;
  }
  getHeader(header) {
    return this._xhr.getResponseHeader(header);
  }
  getBody() {
    return this._xhr.responseText;
  }
  getUnderlyingObject() {
    return this._xhr;
  }
}

},{}],4:[function(require,module,exports){
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

},{"../error.js":12,"../logger.js":13,"../noopUrlStorage.js":14,"../upload.js":15,"./fileReader.js":1,"./fileSignature.js":2,"./httpStack.js":3,"./urlStorage.js":11}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const isReactNative = () => typeof navigator !== 'undefined' && typeof navigator.product === 'string' && navigator.product.toLowerCase() === 'reactnative';
var _default = exports.default = isReactNative;

},{}],6:[function(require,module,exports){
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

},{"./isCordova.js":8,"./readAsByteArray.js":9}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function len(blobOrArray) {
  if (blobOrArray === undefined) return 0;
  if (blobOrArray.size !== undefined) return blobOrArray.size;
  return blobOrArray.length;
}

/*
  Typed arrays and blobs don't have a concat method.
  This function helps StreamSource accumulate data to reach chunkSize.
*/
function concat(a, b) {
  if (a.concat) {
    // Is `a` an Array?
    return a.concat(b);
  }
  if (a instanceof Blob) {
    return new Blob([a, b], {
      type: a.type
    });
  }
  if (a.set) {
    // Is `a` a typed array?
    const c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
  }
  throw new Error('Unknown data type');
}
class StreamSource {
  constructor(reader) {
    this._buffer = undefined;
    this._bufferOffset = 0;
    this._reader = reader;
    this._done = false;
  }
  slice(start, end) {
    if (start < this._bufferOffset) {
      return Promise.reject(new Error("Requested data is before the reader's current offset"));
    }
    return this._readUntilEnoughDataOrDone(start, end);
  }
  _readUntilEnoughDataOrDone(start, end) {
    const hasEnoughData = end <= this._bufferOffset + len(this._buffer);
    if (this._done || hasEnoughData) {
      const value = this._getDataFromBuffer(start, end);
      const done = value == null ? this._done : false;
      return Promise.resolve({
        value,
        done
      });
    }
    return this._reader.read().then(_ref => {
      let {
        value,
        done
      } = _ref;
      if (done) {
        this._done = true;
      } else if (this._buffer === undefined) {
        this._buffer = value;
      } else {
        this._buffer = concat(this._buffer, value);
      }
      return this._readUntilEnoughDataOrDone(start, end);
    });
  }
  _getDataFromBuffer(start, end) {
    // Remove data from buffer before `start`.
    // Data might be reread from the buffer if an upload fails, so we can only
    // safely delete data when it comes *before* what is currently being read.
    if (start > this._bufferOffset) {
      this._buffer = this._buffer.slice(start - this._bufferOffset);
      this._bufferOffset = start;
    }
    // If the buffer is empty after removing old data, all data has been read.
    const hasAllDataBeenRead = len(this._buffer) === 0;
    if (this._done && hasAllDataBeenRead) {
      return null;
    }
    // We already removed data before `start`, so we just return the first
    // chunk from the buffer.
    return this._buffer.slice(0, end - start);
  }
  close() {
    if (this._reader.cancel) {
      this._reader.cancel();
    }
  }
}
exports.default = StreamSource;

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const isCordova = () => typeof window !== 'undefined' && (typeof window.PhoneGap !== 'undefined' || typeof window.Cordova !== 'undefined' || typeof window.cordova !== 'undefined');
var _default = exports.default = isCordova;

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = readAsByteArray;
/**
 * readAsByteArray converts a File object to a Uint8Array.
 * This function is only used on the Apache Cordova platform.
 * See https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html#read-a-file
 */
function readAsByteArray(chunk) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = new Uint8Array(reader.result);
      resolve({
        value
      });
    };
    reader.onerror = err => {
      reject(err);
    };
    reader.readAsArrayBuffer(chunk);
  });
}

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = uriToBlob;
/**
 * uriToBlob resolves a URI to a Blob object. This is used for
 * React Native to retrieve a file (identified by a file://
 * URI) as a blob.
 */
function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const blob = xhr.response;
      resolve(blob);
    };
    xhr.onerror = err => {
      reject(err);
    };
    xhr.open('GET', uri);
    xhr.send();
  });
}

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canStoreURLs = exports.WebStorageUrlStorage = void 0;
let hasStorage = false;
try {
  // Note: localStorage does not exist in the Web Worker's context, so we must use window here.
  hasStorage = 'localStorage' in window;

  // Attempt to store and read entries from the local storage to detect Private
  // Mode on Safari on iOS (see #49)
  // If the key was not used before, we remove it from local storage again to
  // not cause confusion where the entry came from.
  const key = 'tusSupport';
  const originalValue = localStorage.getItem(key);
  localStorage.setItem(key, originalValue);
  if (originalValue === null) localStorage.removeItem(key);
} catch (e) {
  // If we try to access localStorage inside a sandboxed iframe, a SecurityError
  // is thrown. When in private mode on iOS Safari, a QuotaExceededError is
  // thrown (see #49)
  if (e.code === e.SECURITY_ERR || e.code === e.QUOTA_EXCEEDED_ERR) {
    hasStorage = false;
  } else {
    throw e;
  }
}
const canStoreURLs = exports.canStoreURLs = hasStorage;
class WebStorageUrlStorage {
  findAllUploads() {
    const results = this._findEntries('tus::');
    return Promise.resolve(results);
  }
  findUploadsByFingerprint(fingerprint) {
    const results = this._findEntries(`tus::${fingerprint}::`);
    return Promise.resolve(results);
  }
  removeUpload(urlStorageKey) {
    localStorage.removeItem(urlStorageKey);
    return Promise.resolve();
  }
  addUpload(fingerprint, upload) {
    const id = Math.round(Math.random() * 1e12);
    const key = `tus::${fingerprint}::${id}`;
    localStorage.setItem(key, JSON.stringify(upload));
    return Promise.resolve(key);
  }
  _findEntries(prefix) {
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.indexOf(prefix) !== 0) continue;
      try {
        const upload = JSON.parse(localStorage.getItem(key));
        upload.urlStorageKey = key;
        results.push(upload);
      } catch (e) {
        // The JSON parse error is intentionally ignored here, so a malformed
        // entry in the storage cannot prevent an upload.
      }
    }
    return results;
  }
}
exports.WebStorageUrlStorage = WebStorageUrlStorage;

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.enableDebugLog = enableDebugLog;
exports.log = log;
/* eslint no-console: "off" */

let isEnabled = false;
function enableDebugLog() {
  isEnabled = true;
}
function log(msg) {
  if (!isEnabled) return;
  console.log(msg);
}

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/* eslint no-unused-vars: "off" */

class NoopUrlStorage {
  listAllUploads() {
    return Promise.resolve([]);
  }
  findUploadsByFingerprint(fingerprint) {
    return Promise.resolve([]);
  }
  removeUpload(urlStorageKey) {
    return Promise.resolve();
  }
  addUpload(fingerprint, upload) {
    return Promise.resolve(null);
  }
}
exports.default = NoopUrlStorage;

},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _error = _interopRequireDefault(require("./error.js"));
var _logger = require("./logger.js");
var _uuid = _interopRequireDefault(require("./uuid.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const PROTOCOL_TUS_V1 = 'tus-v1';
const PROTOCOL_IETF_DRAFT_03 = 'ietf-draft-03';
const defaultOptions = {
  endpoint: null,
  uploadUrl: null,
  metadata: {},
  fingerprint: null,
  uploadSize: null,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  onUploadUrlAvailable: null,
  overridePatchMethod: false,
  headers: {},
  addRequestId: false,
  onBeforeRequest: null,
  onAfterResponse: null,
  onShouldRetry: defaultOnShouldRetry,
  chunkSize: Infinity,
  retryDelays: [0, 1000, 3000, 5000],
  parallelUploads: 1,
  parallelUploadBoundaries: null,
  storeFingerprintForResuming: true,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  uploadDataDuringCreation: false,
  urlStorage: null,
  fileReader: null,
  httpStack: null,
  protocol: PROTOCOL_TUS_V1
};
class BaseUpload {
  constructor(file, options) {
    // Warn about removed options from previous versions
    if ('resume' in options) {
      // eslint-disable-next-line no-console
      console.log('tus: The `resume` option has been removed in tus-js-client v2. Please use the URL storage API instead.');
    }

    // The default options will already be added from the wrapper classes.
    this.options = options;

    // Cast chunkSize to integer
    this.options.chunkSize = Number(this.options.chunkSize);

    // The storage module used to store URLs
    this._urlStorage = this.options.urlStorage;

    // The underlying File/Blob object
    this.file = file;

    // The URL against which the file will be uploaded
    this.url = null;

    // The underlying request object for the current PATCH request
    this._req = null;

    // The fingerpinrt for the current file (set after start())
    this._fingerprint = null;

    // The key that the URL storage returned when saving an URL with a fingerprint,
    this._urlStorageKey = null;

    // The offset used in the current PATCH request
    this._offset = null;

    // True if the current PATCH request has been aborted
    this._aborted = false;

    // The file's size in bytes
    this._size = null;

    // The Source object which will wrap around the given file and provides us
    // with a unified interface for getting its size and slice chunks from its
    // content allowing us to easily handle Files, Blobs, Buffers and Streams.
    this._source = null;

    // The current count of attempts which have been made. Zero indicates none.
    this._retryAttempt = 0;

    // The timeout's ID which is used to delay the next retry
    this._retryTimeout = null;

    // The offset of the remote upload before the latest attempt was started.
    this._offsetBeforeRetry = 0;

    // An array of BaseUpload instances which are used for uploading the different
    // parts, if the parallelUploads option is used.
    this._parallelUploads = null;

    // An array of upload URLs which are used for uploading the different
    // parts, if the parallelUploads option is used.
    this._parallelUploadUrls = null;
  }

  /**
   * Use the Termination extension to delete an upload from the server by sending a DELETE
   * request to the specified upload URL. This is only possible if the server supports the
   * Termination extension. If the `options.retryDelays` property is set, the method will
   * also retry if an error ocurrs.
   *
   * @param {String} url The upload's URL which will be terminated.
   * @param {object} options Optional options for influencing HTTP requests.
   * @return {Promise} The Promise will be resolved/rejected when the requests finish.
   */
  static terminate(url) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const req = openRequest('DELETE', url, options);
    return sendRequest(req, null, options).then(res => {
      // A 204 response indicates a successfull request
      if (res.getStatus() === 204) {
        return;
      }
      throw new _error.default('tus: unexpected response while terminating upload', null, req, res);
    }).catch(err => {
      if (!(err instanceof _error.default)) {
        err = new _error.default('tus: failed to terminate upload', err, req, null);
      }
      if (!shouldRetry(err, 0, options)) {
        throw err;
      }

      // Instead of keeping track of the retry attempts, we remove the first element from the delays
      // array. If the array is empty, all retry attempts are used up and we will bubble up the error.
      // We recursively call the terminate function will removing elements from the retryDelays array.
      const delay = options.retryDelays[0];
      const remainingDelays = options.retryDelays.slice(1);
      const newOptions = {
        ...options,
        retryDelays: remainingDelays
      };
      return new Promise(resolve => setTimeout(resolve, delay)).then(() => BaseUpload.terminate(url, newOptions));
    });
  }
  findPreviousUploads() {
    return this.options.fingerprint(this.file, this.options).then(fingerprint => this._urlStorage.findUploadsByFingerprint(fingerprint));
  }
  resumeFromPreviousUpload(previousUpload) {
    this.url = previousUpload.uploadUrl || null;
    this._parallelUploadUrls = previousUpload.parallelUploadUrls || null;
    this._urlStorageKey = previousUpload.urlStorageKey;
  }
  start() {
    const {
      file
    } = this;
    if (!file) {
      this._emitError(new Error('tus: no file or stream to upload provided'));
      return;
    }
    if (![PROTOCOL_TUS_V1, PROTOCOL_IETF_DRAFT_03].includes(this.options.protocol)) {
      this._emitError(new Error(`tus: unsupported protocol ${this.options.protocol}`));
      return;
    }
    if (!this.options.endpoint && !this.options.uploadUrl && !this.url) {
      this._emitError(new Error('tus: neither an endpoint or an upload URL is provided'));
      return;
    }
    const {
      retryDelays
    } = this.options;
    if (retryDelays != null && Object.prototype.toString.call(retryDelays) !== '[object Array]') {
      this._emitError(new Error('tus: the `retryDelays` option must either be an array or null'));
      return;
    }
    if (this.options.parallelUploads > 1) {
      // Test which options are incompatible with parallel uploads.
      for (const optionName of ['uploadUrl', 'uploadSize', 'uploadLengthDeferred']) {
        if (this.options[optionName]) {
          this._emitError(new Error(`tus: cannot use the ${optionName} option when parallelUploads is enabled`));
          return;
        }
      }
    }
    if (this.options.parallelUploadBoundaries) {
      if (this.options.parallelUploads <= 1) {
        this._emitError(new Error('tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled'));
        return;
      }
      if (this.options.parallelUploads !== this.options.parallelUploadBoundaries.length) {
        this._emitError(new Error('tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`'));
        return;
      }
    }
    this.options.fingerprint(file, this.options).then(fingerprint => {
      if (fingerprint == null) {
        (0, _logger.log)('No fingerprint was calculated meaning that the upload cannot be stored in the URL storage.');
      } else {
        (0, _logger.log)(`Calculated fingerprint: ${fingerprint}`);
      }
      this._fingerprint = fingerprint;
      if (this._source) {
        return this._source;
      }
      return this.options.fileReader.openFile(file, this.options.chunkSize);
    }).then(source => {
      this._source = source;

      // First, we look at the uploadLengthDeferred option.
      // Next, we check if the caller has supplied a manual upload size.
      // Finally, we try to use the calculated size from the source object.
      if (this.options.uploadLengthDeferred) {
        this._size = null;
      } else if (this.options.uploadSize != null) {
        this._size = Number(this.options.uploadSize);
        if (Number.isNaN(this._size)) {
          this._emitError(new Error('tus: cannot convert `uploadSize` option into a number'));
          return;
        }
      } else {
        this._size = this._source.size;
        if (this._size == null) {
          this._emitError(new Error("tus: cannot automatically derive upload's size from input. Specify it manually using the `uploadSize` option or use the `uploadLengthDeferred` option"));
          return;
        }
      }

      // If the upload was configured to use multiple requests or if we resume from
      // an upload which used multiple requests, we start a parallel upload.
      if (this.options.parallelUploads > 1 || this._parallelUploadUrls != null) {
        this._startParallelUpload();
      } else {
        this._startSingleUpload();
      }
    }).catch(err => {
      this._emitError(err);
    });
  }

  /**
   * Initiate the uploading procedure for a parallelized upload, where one file is split into
   * multiple request which are run in parallel.
   *
   * @api private
   */
  _startParallelUpload() {
    const totalSize = this._size;
    let totalProgress = 0;
    this._parallelUploads = [];
    const partCount = this._parallelUploadUrls != null ? this._parallelUploadUrls.length : this.options.parallelUploads;

    // The input file will be split into multiple slices which are uploaded in separate
    // requests. Here we get the start and end position for the slices.
    const parts = this.options.parallelUploadBoundaries ?? splitSizeIntoParts(this._source.size, partCount);

    // Attach URLs from previous uploads, if available.
    if (this._parallelUploadUrls) {
      parts.forEach((part, index) => {
        part.uploadUrl = this._parallelUploadUrls[index] || null;
      });
    }

    // Create an empty list for storing the upload URLs
    this._parallelUploadUrls = new Array(parts.length);

    // Generate a promise for each slice that will be resolve if the respective
    // upload is completed.
    const uploads = parts.map((part, index) => {
      let lastPartProgress = 0;
      return this._source.slice(part.start, part.end).then(_ref => {
        let {
          value
        } = _ref;
        return new Promise((resolve, reject) => {
          // Merge with the user supplied options but overwrite some values.
          const options = {
            ...this.options,
            // If available, the partial upload should be resumed from a previous URL.
            uploadUrl: part.uploadUrl || null,
            // We take manually care of resuming for partial uploads, so they should
            // not be stored in the URL storage.
            storeFingerprintForResuming: false,
            removeFingerprintOnSuccess: false,
            // Reset the parallelUploads option to not cause recursion.
            parallelUploads: 1,
            // Reset this option as we are not doing a parallel upload.
            parallelUploadBoundaries: null,
            metadata: {},
            // Add the header to indicate the this is a partial upload.
            headers: {
              ...this.options.headers,
              'Upload-Concat': 'partial'
            },
            // Reject or resolve the promise if the upload errors or completes.
            onSuccess: resolve,
            onError: reject,
            // Based in the progress for this partial upload, calculate the progress
            // for the entire final upload.
            onProgress: newPartProgress => {
              totalProgress = totalProgress - lastPartProgress + newPartProgress;
              lastPartProgress = newPartProgress;
              this._emitProgress(totalProgress, totalSize);
            },
            // Wait until every partial upload has an upload URL, so we can add
            // them to the URL storage.
            onUploadUrlAvailable: () => {
              this._parallelUploadUrls[index] = upload.url;
              // Test if all uploads have received an URL
              if (this._parallelUploadUrls.filter(u => Boolean(u)).length === parts.length) {
                this._saveUploadInUrlStorage();
              }
            }
          };
          const upload = new BaseUpload(value, options);
          upload.start();

          // Store the upload in an array, so we can later abort them if necessary.
          this._parallelUploads.push(upload);
        });
      });
    });
    let req;
    // Wait until all partial uploads are finished and we can send the POST request for
    // creating the final upload.
    Promise.all(uploads).then(() => {
      req = this._openRequest('POST', this.options.endpoint);
      req.setHeader('Upload-Concat', `final;${this._parallelUploadUrls.join(' ')}`);

      // Add metadata if values have been added
      const metadata = encodeMetadata(this.options.metadata);
      if (metadata !== '') {
        req.setHeader('Upload-Metadata', metadata);
      }
      return this._sendRequest(req, null);
    }).then(res => {
      if (!inStatusCategory(res.getStatus(), 200)) {
        this._emitHttpError(req, res, 'tus: unexpected response while creating upload');
        return;
      }
      const location = res.getHeader('Location');
      if (location == null) {
        this._emitHttpError(req, res, 'tus: invalid or missing Location header');
        return;
      }
      this.url = resolveUrl(this.options.endpoint, location);
      (0, _logger.log)(`Created upload at ${this.url}`);
      this._emitSuccess();
    }).catch(err => {
      this._emitError(err);
    });
  }

  /**
   * Initiate the uploading procedure for a non-parallel upload. Here the entire file is
   * uploaded in a sequential matter.
   *
   * @api private
   */
  _startSingleUpload() {
    // Reset the aborted flag when the upload is started or else the
    // _performUpload will stop before sending a request if the upload has been
    // aborted previously.
    this._aborted = false;

    // The upload had been started previously and we should reuse this URL.
    if (this.url != null) {
      (0, _logger.log)(`Resuming upload from previous URL: ${this.url}`);
      this._resumeUpload();
      return;
    }

    // A URL has manually been specified, so we try to resume
    if (this.options.uploadUrl != null) {
      (0, _logger.log)(`Resuming upload from provided URL: ${this.options.uploadUrl}`);
      this.url = this.options.uploadUrl;
      this._resumeUpload();
      return;
    }

    // An upload has not started for the file yet, so we start a new one
    (0, _logger.log)('Creating a new upload');
    this._createUpload();
  }

  /**
   * Abort any running request and stop the current upload. After abort is called, no event
   * handler will be invoked anymore. You can use the `start` method to resume the upload
   * again.
   * If `shouldTerminate` is true, the `terminate` function will be called to remove the
   * current upload from the server.
   *
   * @param {boolean} shouldTerminate True if the upload should be deleted from the server.
   * @return {Promise} The Promise will be resolved/rejected when the requests finish.
   */
  abort(shouldTerminate) {
    // Stop any parallel partial uploads, that have been started in _startParallelUploads.
    if (this._parallelUploads != null) {
      this._parallelUploads.forEach(upload => {
        upload.abort(shouldTerminate);
      });
    }

    // Stop any current running request.
    if (this._req !== null) {
      this._req.abort();
      // Note: We do not close the file source here, so the user can resume in the future.
    }
    this._aborted = true;

    // Stop any timeout used for initiating a retry.
    if (this._retryTimeout != null) {
      clearTimeout(this._retryTimeout);
      this._retryTimeout = null;
    }
    if (!shouldTerminate || this.url == null) {
      return Promise.resolve();
    }
    return BaseUpload.terminate(this.url, this.options)
    // Remove entry from the URL storage since the upload URL is no longer valid.
    .then(() => this._removeFromUrlStorage());
  }
  _emitHttpError(req, res, message, causingErr) {
    this._emitError(new _error.default(message, causingErr, req, res));
  }
  _emitError(err) {
    // Do not emit errors, e.g. from aborted HTTP requests, if the upload has been stopped.
    if (this._aborted) return;

    // Check if we should retry, when enabled, before sending the error to the user.
    if (this.options.retryDelays != null) {
      // We will reset the attempt counter if
      // - we were already able to connect to the server (offset != null) and
      // - we were able to upload a small chunk of data to the server
      const shouldResetDelays = this._offset != null && this._offset > this._offsetBeforeRetry;
      if (shouldResetDelays) {
        this._retryAttempt = 0;
      }
      if (shouldRetry(err, this._retryAttempt, this.options)) {
        const delay = this.options.retryDelays[this._retryAttempt++];
        this._offsetBeforeRetry = this._offset;
        this._retryTimeout = setTimeout(() => {
          this.start();
        }, delay);
        return;
      }
    }
    if (typeof this.options.onError === 'function') {
      this.options.onError(err);
    } else {
      throw err;
    }
  }

  /**
   * Publishes notification if the upload has been successfully completed.
   *
   * @api private
   */
  _emitSuccess() {
    if (this.options.removeFingerprintOnSuccess) {
      // Remove stored fingerprint and corresponding endpoint. This causes
      // new uploads of the same file to be treated as a different file.
      this._removeFromUrlStorage();
    }
    if (typeof this.options.onSuccess === 'function') {
      this.options.onSuccess();
    }
  }

  /**
   * Publishes notification when data has been sent to the server. This
   * data may not have been accepted by the server yet.
   *
   * @param {number} bytesSent  Number of bytes sent to the server.
   * @param {number} bytesTotal Total number of bytes to be sent to the server.
   * @api private
   */
  _emitProgress(bytesSent, bytesTotal) {
    if (typeof this.options.onProgress === 'function') {
      this.options.onProgress(bytesSent, bytesTotal);
    }
  }

  /**
   * Publishes notification when a chunk of data has been sent to the server
   * and accepted by the server.
   * @param {number} chunkSize  Size of the chunk that was accepted by the server.
   * @param {number} bytesAccepted Total number of bytes that have been
   *                                accepted by the server.
   * @param {number} bytesTotal Total number of bytes to be sent to the server.
   * @api private
   */
  _emitChunkComplete(chunkSize, bytesAccepted, bytesTotal) {
    if (typeof this.options.onChunkComplete === 'function') {
      this.options.onChunkComplete(chunkSize, bytesAccepted, bytesTotal);
    }
  }

  /**
   * Create a new upload using the creation extension by sending a POST
   * request to the endpoint. After successful creation the file will be
   * uploaded
   *
   * @api private
   */
  _createUpload() {
    if (!this.options.endpoint) {
      this._emitError(new Error('tus: unable to create upload because no endpoint is provided'));
      return;
    }
    const req = this._openRequest('POST', this.options.endpoint);
    if (this.options.uploadLengthDeferred) {
      req.setHeader('Upload-Defer-Length', 1);
    } else {
      req.setHeader('Upload-Length', this._size);
    }

    // Add metadata if values have been added
    const metadata = encodeMetadata(this.options.metadata);
    if (metadata !== '') {
      req.setHeader('Upload-Metadata', metadata);
    }
    let promise;
    if (this.options.uploadDataDuringCreation && !this.options.uploadLengthDeferred) {
      this._offset = 0;
      promise = this._addChunkToRequest(req);
    } else {
      if (this.options.protocol === PROTOCOL_IETF_DRAFT_03) {
        req.setHeader('Upload-Complete', '?0');
      }
      promise = this._sendRequest(req, null);
    }
    promise.then(res => {
      if (!inStatusCategory(res.getStatus(), 200)) {
        this._emitHttpError(req, res, 'tus: unexpected response while creating upload');
        return;
      }
      const location = res.getHeader('Location');
      if (location == null) {
        this._emitHttpError(req, res, 'tus: invalid or missing Location header');
        return;
      }
      this.url = resolveUrl(this.options.endpoint, location);
      (0, _logger.log)(`Created upload at ${this.url}`);
      if (typeof this.options.onUploadUrlAvailable === 'function') {
        this.options.onUploadUrlAvailable();
      }
      if (this._size === 0) {
        // Nothing to upload and file was successfully created
        this._emitSuccess();
        this._source.close();
        return;
      }
      this._saveUploadInUrlStorage().then(() => {
        if (this.options.uploadDataDuringCreation) {
          this._handleUploadResponse(req, res);
        } else {
          this._offset = 0;
          this._performUpload();
        }
      });
    }).catch(err => {
      this._emitHttpError(req, null, 'tus: failed to create upload', err);
    });
  }

  /*
   * Try to resume an existing upload. First a HEAD request will be sent
   * to retrieve the offset. If the request fails a new upload will be
   * created. In the case of a successful response the file will be uploaded.
   *
   * @api private
   */
  _resumeUpload() {
    const req = this._openRequest('HEAD', this.url);
    const promise = this._sendRequest(req, null);
    promise.then(res => {
      const status = res.getStatus();
      if (!inStatusCategory(status, 200)) {
        // If the upload is locked (indicated by the 423 Locked status code), we
        // emit an error instead of directly starting a new upload. This way the
        // retry logic can catch the error and will retry the upload. An upload
        // is usually locked for a short period of time and will be available
        // afterwards.
        if (status === 423) {
          this._emitHttpError(req, res, 'tus: upload is currently locked; retry later');
          return;
        }
        if (inStatusCategory(status, 400)) {
          // Remove stored fingerprint and corresponding endpoint,
          // on client errors since the file can not be found
          this._removeFromUrlStorage();
        }
        if (!this.options.endpoint) {
          // Don't attempt to create a new upload if no endpoint is provided.
          this._emitHttpError(req, res, 'tus: unable to resume upload (new upload cannot be created without an endpoint)');
          return;
        }

        // Try to create a new upload
        this.url = null;
        this._createUpload();
        return;
      }
      const offset = parseInt(res.getHeader('Upload-Offset'), 10);
      if (Number.isNaN(offset)) {
        this._emitHttpError(req, res, 'tus: invalid or missing offset value');
        return;
      }
      const length = parseInt(res.getHeader('Upload-Length'), 10);
      if (Number.isNaN(length) && !this.options.uploadLengthDeferred && this.options.protocol === PROTOCOL_TUS_V1) {
        this._emitHttpError(req, res, 'tus: invalid or missing length value');
        return;
      }
      if (typeof this.options.onUploadUrlAvailable === 'function') {
        this.options.onUploadUrlAvailable();
      }
      this._saveUploadInUrlStorage().then(() => {
        // Upload has already been completed and we do not need to send additional
        // data to the server
        if (offset === length) {
          this._emitProgress(length, length);
          this._emitSuccess();
          return;
        }
        this._offset = offset;
        this._performUpload();
      });
    }).catch(err => {
      this._emitHttpError(req, null, 'tus: failed to resume upload', err);
    });
  }

  /**
   * Start uploading the file using PATCH requests. The file will be divided
   * into chunks as specified in the chunkSize option. During the upload
   * the onProgress event handler may be invoked multiple times.
   *
   * @api private
   */
  _performUpload() {
    // If the upload has been aborted, we will not send the next PATCH request.
    // This is important if the abort method was called during a callback, such
    // as onChunkComplete or onProgress.
    if (this._aborted) {
      return;
    }
    let req;

    // Some browser and servers may not support the PATCH method. For those
    // cases, you can tell tus-js-client to use a POST request with the
    // X-HTTP-Method-Override header for simulating a PATCH request.
    if (this.options.overridePatchMethod) {
      req = this._openRequest('POST', this.url);
      req.setHeader('X-HTTP-Method-Override', 'PATCH');
    } else {
      req = this._openRequest('PATCH', this.url);
    }
    req.setHeader('Upload-Offset', this._offset);
    const promise = this._addChunkToRequest(req);
    promise.then(res => {
      if (!inStatusCategory(res.getStatus(), 200)) {
        this._emitHttpError(req, res, 'tus: unexpected response while uploading chunk');
        return;
      }
      this._handleUploadResponse(req, res);
    }).catch(err => {
      // Don't emit an error if the upload was aborted manually
      if (this._aborted) {
        return;
      }
      this._emitHttpError(req, null, `tus: failed to upload chunk at offset ${this._offset}`, err);
    });
  }

  /**
   * _addChunktoRequest reads a chunk from the source and sends it using the
   * supplied request object. It will not handle the response.
   *
   * @api private
   */
  _addChunkToRequest(req) {
    const start = this._offset;
    let end = this._offset + this.options.chunkSize;
    req.setProgressHandler(bytesSent => {
      this._emitProgress(start + bytesSent, this._size);
    });
    req.setHeader('Content-Type', 'application/offset+octet-stream');

    // The specified chunkSize may be Infinity or the calcluated end position
    // may exceed the file's size. In both cases, we limit the end position to
    // the input's total size for simpler calculations and correctness.
    if ((end === Infinity || end > this._size) && !this.options.uploadLengthDeferred) {
      end = this._size;
    }
    return this._source.slice(start, end).then(_ref2 => {
      let {
        value,
        done
      } = _ref2;
      const valueSize = value && value.size ? value.size : 0;

      // If the upload length is deferred, the upload size was not specified during
      // upload creation. So, if the file reader is done reading, we know the total
      // upload size and can tell the tus server.
      if (this.options.uploadLengthDeferred && done) {
        this._size = this._offset + valueSize;
        req.setHeader('Upload-Length', this._size);
      }

      // The specified uploadSize might not match the actual amount of data that a source
      // provides. In these cases, we cannot successfully complete the upload, so we
      // rather error out and let the user know. If not, tus-js-client will be stuck
      // in a loop of repeating empty PATCH requests.
      // See https://community.transloadit.com/t/how-to-abort-hanging-companion-uploads/16488/13
      const newSize = this._offset + valueSize;
      if (!this.options.uploadLengthDeferred && done && newSize !== this._size) {
        return Promise.reject(new Error(`upload was configured with a size of ${this._size} bytes, but the source is done after ${newSize} bytes`));
      }
      if (value === null) {
        return this._sendRequest(req);
      }
      if (this.options.protocol === PROTOCOL_IETF_DRAFT_03) {
        req.setHeader('Upload-Complete', done ? '?1' : '?0');
      }
      this._emitProgress(this._offset, this._size);
      return this._sendRequest(req, value);
    });
  }

  /**
   * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
   * and already have received a response.
   *
   * @api private
   */
  _handleUploadResponse(req, res) {
    const offset = parseInt(res.getHeader('Upload-Offset'), 10);
    if (Number.isNaN(offset)) {
      this._emitHttpError(req, res, 'tus: invalid or missing offset value');
      return;
    }
    this._emitProgress(offset, this._size);
    this._emitChunkComplete(offset - this._offset, offset, this._size);
    this._offset = offset;
    if (offset === this._size) {
      // Yay, finally done :)
      this._emitSuccess();
      this._source.close();
      return;
    }
    this._performUpload();
  }

  /**
   * Create a new HTTP request object with the given method and URL.
   *
   * @api private
   */
  _openRequest(method, url) {
    const req = openRequest(method, url, this.options);
    this._req = req;
    return req;
  }

  /**
   * Remove the entry in the URL storage, if it has been saved before.
   *
   * @api private
   */
  _removeFromUrlStorage() {
    if (!this._urlStorageKey) return;
    this._urlStorage.removeUpload(this._urlStorageKey).catch(err => {
      this._emitError(err);
    });
    this._urlStorageKey = null;
  }

  /**
   * Add the upload URL to the URL storage, if possible.
   *
   * @api private
   */
  _saveUploadInUrlStorage() {
    // We do not store the upload URL
    // - if it was disabled in the option, or
    // - if no fingerprint was calculated for the input (i.e. a stream), or
    // - if the URL is already stored (i.e. key is set alread).
    if (!this.options.storeFingerprintForResuming || !this._fingerprint || this._urlStorageKey !== null) {
      return Promise.resolve();
    }
    const storedUpload = {
      size: this._size,
      metadata: this.options.metadata,
      creationTime: new Date().toString()
    };
    if (this._parallelUploads) {
      // Save multiple URLs if the parallelUploads option is used ...
      storedUpload.parallelUploadUrls = this._parallelUploadUrls;
    } else {
      // ... otherwise we just save the one available URL.
      storedUpload.uploadUrl = this.url;
    }
    return this._urlStorage.addUpload(this._fingerprint, storedUpload).then(urlStorageKey => {
      this._urlStorageKey = urlStorageKey;
    });
  }

  /**
   * Send a request with the provided body.
   *
   * @api private
   */
  _sendRequest(req) {
    let body = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    return sendRequest(req, body, this.options);
  }
}
function encodeMetadata(metadata) {
  return Object.entries(metadata).map(_ref3 => {
    let [key, value] = _ref3;
    return `${key} ${btoa(String(value))}`;
  }).join(',');
}

/**
 * Checks whether a given status is in the range of the expected category.
 * For example, only a status between 200 and 299 will satisfy the category 200.
 *
 * @api private
 */
function inStatusCategory(status, category) {
  return status >= category && status < category + 100;
}

/**
 * Create a new HTTP request with the specified method and URL.
 * The necessary headers that are included in every request
 * will be added, including the request ID.
 *
 * @api private
 */
function openRequest(method, url, options) {
  const req = options.httpStack.createRequest(method, url);
  if (options.protocol === PROTOCOL_IETF_DRAFT_03) {
    req.setHeader('Upload-Draft-Interop-Version', '5');
  } else {
    req.setHeader('Tus-Resumable', '1.0.0');
  }
  const headers = options.headers || {};
  Object.entries(headers).forEach(_ref4 => {
    let [name, value] = _ref4;
    req.setHeader(name, value);
  });
  if (options.addRequestId) {
    const requestId = (0, _uuid.default)();
    req.setHeader('X-Request-ID', requestId);
  }
  return req;
}

/**
 * Send a request with the provided body while invoking the onBeforeRequest
 * and onAfterResponse callbacks.
 *
 * @api private
 */
async function sendRequest(req, body, options) {
  if (typeof options.onBeforeRequest === 'function') {
    await options.onBeforeRequest(req);
  }
  const res = await req.send(body);
  if (typeof options.onAfterResponse === 'function') {
    await options.onAfterResponse(req, res);
  }
  return res;
}

/**
 * Checks whether the browser running this code has internet access.
 * This function will always return true in the node.js environment
 *
 * @api private
 */
function isOnline() {
  let online = true;
  // Note: We don't reference `window` here because the navigator object also exists
  // in a Web Worker's context.
  // eslint-disable-next-line no-undef
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    online = false;
  }
  return online;
}

/**
 * Checks whether or not it is ok to retry a request.
 * @param {Error|DetailedError} err the error returned from the last request
 * @param {number} retryAttempt the number of times the request has already been retried
 * @param {object} options tus Upload options
 *
 * @api private
 */
function shouldRetry(err, retryAttempt, options) {
  // We only attempt a retry if
  // - retryDelays option is set
  // - we didn't exceed the maxium number of retries, yet, and
  // - this error was caused by a request or it's response and
  // - the error is server error (i.e. not a status 4xx except a 409 or 423) or
  // a onShouldRetry is specified and returns true
  // - the browser does not indicate that we are offline
  if (options.retryDelays == null || retryAttempt >= options.retryDelays.length || err.originalRequest == null) {
    return false;
  }
  if (options && typeof options.onShouldRetry === 'function') {
    return options.onShouldRetry(err, retryAttempt, options);
  }
  return defaultOnShouldRetry(err);
}

/**
 * determines if the request should be retried. Will only retry if not a status 4xx except a 409 or 423
 * @param {DetailedError} err
 * @returns {boolean}
 */
function defaultOnShouldRetry(err) {
  const status = err.originalResponse ? err.originalResponse.getStatus() : 0;
  return (!inStatusCategory(status, 400) || status === 409 || status === 423) && isOnline();
}

/**
 * Resolve a relative link given the origin as source. For example,
 * if a HTTP request to http://example.com/files/ returns a Location
 * header with the value /upload/abc, the resolved URL will be:
 * http://example.com/upload/abc
 */
function resolveUrl(origin, link) {
  return new URL(link, origin).toString();
}

/**
 * Calculate the start and end positions for the parts if an upload
 * is split into multiple parallel requests.
 *
 * @param {number} totalSize The byte size of the upload, which will be split.
 * @param {number} partCount The number in how many parts the upload will be split.
 * @return {object[]}
 * @api private
 */
function splitSizeIntoParts(totalSize, partCount) {
  const partSize = Math.floor(totalSize / partCount);
  const parts = [];
  for (let i = 0; i < partCount; i++) {
    parts.push({
      start: partSize * i,
      end: partSize * (i + 1)
    });
  }
  parts[partCount - 1].end = totalSize;
  return parts;
}
BaseUpload.defaultOptions = defaultOptions;
var _default = exports.default = BaseUpload;

},{"./error.js":12,"./logger.js":13,"./uuid.js":16}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = uuid;
/**
 * Generate a UUID v4 based on random numbers. We intentioanlly use the less
 * secure Math.random function here since the more secure crypto.getRandomNumbers
 * is not available on all platforms.
 * This is not a problem for us since we use the UUID only for generating a
 * request ID, so we can correlate server logs to client errors.
 *
 * This function is taken from following site:
 * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 *
 * @return {string} The generate UUID
 */
function uuid() {
  /* eslint-disable no-bitwise */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

},{}]},{},[4])(4)
});
//# sourceMappingURL=tus.js.map
