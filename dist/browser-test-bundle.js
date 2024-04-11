(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isReactNative = _interopRequireDefault(require("./isReactNative.js"));
var _uriToBlob = _interopRequireDefault(require("./uriToBlob.js"));
var _FileSource = _interopRequireDefault(require("./sources/FileSource.js"));
var _StreamSource = _interopRequireDefault(require("./sources/StreamSource.js"));
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
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
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
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
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
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
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
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
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
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

},{}],17:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":19}],18:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var transitionalDefaults = require('../defaults/transitional');
var AxiosError = require('../core/AxiosError');
var CanceledError = require('../cancel/CanceledError');
var parseProtocol = require('../helpers/parseProtocol');
var platform = require('../platform');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;
    var withXSRFToken = config.withXSRFToken;
    var onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }

    if (utils.isFormData(requestData) && utils.isStandardBrowserEnv()) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);

    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      var transitional = config.transitional || transitionalDefaults;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(new AxiosError(
        timeoutErrorMessage,
        transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
        config,
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      withXSRFToken && utils.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(config));
      if (withXSRFToken || (withXSRFToken !== false && isURLSameOrigin(fullPath))) {
        // Add xsrf header
        var xsrfValue = config.xsrfHeaderName && config.xsrfCookieName && cookies.read(config.xsrfCookieName);
        if (xsrfValue) {
          requestHeaders[config.xsrfHeaderName] = xsrfValue;
        }
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function(cancel) {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

    // false, 0 (zero number), and '' (empty string) are valid JSON values
    if (!requestData && requestData !== false && requestData !== 0 && requestData !== '') {
      requestData = null;
    }

    var protocol = parseProtocol(fullPath);

    if (protocol && platform.protocols.indexOf(protocol) === -1) {
      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
      return;
    }


    // Send the request
    request.send(requestData);
  });
};

},{"../cancel/CanceledError":21,"../core/AxiosError":24,"../core/buildFullPath":26,"../defaults/transitional":32,"../helpers/parseProtocol":46,"../platform":54,"./../core/settle":29,"./../helpers/buildURL":37,"./../helpers/cookies":39,"./../helpers/isURLSameOrigin":43,"./../helpers/parseHeaders":45,"./../utils":55}],19:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');
var formDataToJSON = require('./helpers/formDataToJSON');
/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.CanceledError = require('./cancel/CanceledError');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');
axios.VERSION = require('./env/data').version;
axios.toFormData = require('./helpers/toFormData');

// Expose AxiosError class
axios.AxiosError = require('../lib/core/AxiosError');

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = require('./helpers/isAxiosError');

axios.formToJSON = function(thing) {
  return formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);
};

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"../lib/core/AxiosError":24,"./cancel/CancelToken":20,"./cancel/CanceledError":21,"./cancel/isCancel":22,"./core/Axios":23,"./core/mergeConfig":28,"./defaults":31,"./env/data":34,"./helpers/bind":36,"./helpers/formDataToJSON":40,"./helpers/isAxiosError":42,"./helpers/spread":47,"./helpers/toFormData":48,"./utils":55}],20:[function(require,module,exports){
'use strict';

var CanceledError = require('./CanceledError');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;

  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;

  // eslint-disable-next-line func-names
  this.promise.then(function(cancel) {
    if (!token._listeners) return;

    var i = token._listeners.length;

    while (i-- > 0) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });

  // eslint-disable-next-line func-names
  this.promise.then = function(onfulfilled) {
    var _resolve;
    // eslint-disable-next-line func-names
    var promise = new Promise(function(resolve) {
      token.subscribe(resolve);
      _resolve = resolve;
    }).then(onfulfilled);

    promise.cancel = function reject() {
      token.unsubscribe(_resolve);
    };

    return promise;
  };

  executor(function cancel(message, config, request) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new CanceledError(message, config, request);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Subscribe to the cancel signal
 */

CancelToken.prototype.subscribe = function subscribe(listener) {
  if (this.reason) {
    listener(this.reason);
    return;
  }

  if (this._listeners) {
    this._listeners.push(listener);
  } else {
    this._listeners = [listener];
  }
};

/**
 * Unsubscribe from the cancel signal
 */

CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
  if (!this._listeners) {
    return;
  }
  var index = this._listeners.indexOf(listener);
  if (index !== -1) {
    this._listeners.splice(index, 1);
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./CanceledError":21}],21:[function(require,module,exports){
'use strict';

var AxiosError = require('../core/AxiosError');
var utils = require('../utils');

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 * @param {Object=} config The config.
 * @param {Object=} request The request.
 */
function CanceledError(message, config, request) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
  this.name = 'CanceledError';
}

utils.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});

module.exports = CanceledError;

},{"../core/AxiosError":24,"../utils":55}],22:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],23:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var buildFullPath = require('./buildFullPath');
var validator = require('../helpers/validator');

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
 * @param {?Object} config
 */
Axios.prototype.request = function request(configOrUrl, config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  var paramsSerializer = config.paramsSerializer;

  if (paramsSerializer !== undefined) {
    validator.assertOptions(paramsSerializer, {
      encode: validators.function,
      serialize: validators.function
    }, true);
  }

  utils.isFunction(paramsSerializer) && (config.paramsSerializer = {serialize: paramsSerializer});

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }

    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];

    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }


  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  var fullPath = buildFullPath(config.baseURL, config.url);
  return buildURL(fullPath, config.params, config.paramsSerializer);
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method: method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url: url,
        data: data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

module.exports = Axios;

},{"../helpers/buildURL":37,"../helpers/validator":50,"./../utils":55,"./InterceptorManager":25,"./buildFullPath":26,"./dispatchRequest":27,"./mergeConfig":28}],24:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = (new Error()).stack;
  }

  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}

utils.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});

var prototype = AxiosError.prototype;
var descriptors = {};

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_NOT_SUPPORT',
  'ERR_INVALID_URL'
// eslint-disable-next-line func-names
].forEach(function(code) {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', {value: true});

// eslint-disable-next-line func-names
AxiosError.from = function(error, code, config, request, response, customProps) {
  var axiosError = Object.create(prototype);

  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  });

  AxiosError.call(axiosError, error.message, code, config, request, response);

  axiosError.cause = error;

  axiosError.name = error.name;

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

module.exports = AxiosError;

},{"../utils":55}],25:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Clear all interceptors from the stack
 */
InterceptorManager.prototype.clear = function clear() {
  if (this.handlers) {
    this.handlers = [];
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":55}],26:[function(require,module,exports){
'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

},{"../helpers/combineURLs":38,"../helpers/isAbsoluteURL":41}],27:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');
var CanceledError = require('../cancel/CanceledError');
var normalizeHeaderName = require('../helpers/normalizeHeaderName');

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    null,
    config.transformRequest
  );

  normalizeHeaderName(config.headers, 'Accept');
  normalizeHeaderName(config.headers, 'Content-Type');

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      response.status,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          reason.response.data,
          reason.response.headers,
          reason.response.status,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/CanceledError":21,"../cancel/isCancel":22,"../defaults":31,"../helpers/normalizeHeaderName":44,"./../utils":55,"./transformData":30}],28:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isEmptyObject(source)) {
      return utils.merge({}, target);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(prop) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  var mergeMap = {
    'url': valueFromConfig2,
    'method': valueFromConfig2,
    'data': valueFromConfig2,
    'baseURL': defaultToConfig2,
    'transformRequest': defaultToConfig2,
    'transformResponse': defaultToConfig2,
    'paramsSerializer': defaultToConfig2,
    'timeout': defaultToConfig2,
    'timeoutMessage': defaultToConfig2,
    'withCredentials': defaultToConfig2,
    'withXSRFToken': defaultToConfig2,
    'adapter': defaultToConfig2,
    'responseType': defaultToConfig2,
    'xsrfCookieName': defaultToConfig2,
    'xsrfHeaderName': defaultToConfig2,
    'onUploadProgress': defaultToConfig2,
    'onDownloadProgress': defaultToConfig2,
    'decompress': defaultToConfig2,
    'maxContentLength': defaultToConfig2,
    'maxBodyLength': defaultToConfig2,
    'beforeRedirect': defaultToConfig2,
    'transport': defaultToConfig2,
    'httpAgent': defaultToConfig2,
    'httpsAgent': defaultToConfig2,
    'cancelToken': defaultToConfig2,
    'socketPath': defaultToConfig2,
    'responseEncoding': defaultToConfig2,
    'validateStatus': mergeDirectKeys
  };

  utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
    var merge = mergeMap[prop] || mergeDeepProperties;
    var configValue = merge(prop);
    (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
};

},{"../utils":55}],29:[function(require,module,exports){
'use strict';

var AxiosError = require('./AxiosError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError(
      'Request failed with status code ' + response.status,
      [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
};

},{"./AxiosError":24}],30:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var defaults = require('../defaults');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Number} status HTTP status code
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, status, fns) {
  var context = this || defaults;
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers, status);
  });

  return data;
};

},{"../defaults":31,"./../utils":55}],31:[function(require,module,exports){
(function (process){(function (){
'use strict';

var utils = require('../utils');
var normalizeHeaderName = require('../helpers/normalizeHeaderName');
var AxiosError = require('../core/AxiosError');
var transitionalDefaults = require('./transitional');
var toFormData = require('../helpers/toFormData');
var toURLEncodedForm = require('../helpers/toURLEncodedForm');
var platform = require('../platform');
var formDataToJSON = require('../helpers/formDataToJSON');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('../adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('../adapters/http');
  }
  return adapter;
}

function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

var defaults = {

  transitional: transitionalDefaults,

  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    var contentType = headers && headers['Content-Type'] || '';
    var hasJSONContentType = contentType.indexOf('application/json') > -1;
    var isObjectPayload = utils.isObject(data);

    if (isObjectPayload && utils.isHTMLForm(data)) {
      data = new FormData(data);
    }

    var isFormData = utils.isFormData(data);

    if (isFormData) {
      return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
    }

    if (utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }

    var isFileList;

    if (isObjectPayload) {
      if (contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
        return toURLEncodedForm(data, this.formSerializer).toString();
      }

      if ((isFileList = utils.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
        var _FormData = this.env && this.env.FormData;

        return toFormData(
          isFileList ? {'files[]': data} : data,
          _FormData && new _FormData(),
          this.formSerializer
        );
      }
    }

    if (isObjectPayload || hasJSONContentType ) {
      setContentTypeIfUnset(headers, 'application/json');
      return stringifySafely(data);
    }

    return data;
  }],

  transformResponse: [function transformResponse(data) {
    var transitional = this.transitional || defaults.transitional;
    var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    var JSONRequested = this.responseType === 'json';

    if (data && utils.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
      var silentJSONParsing = transitional && transitional.silentJSONParsing;
      var strictJSONParsing = !silentJSONParsing && JSONRequested;

      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  env: {
    FormData: platform.classes.FormData,
    Blob: platform.classes.Blob
  },

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this)}).call(this,require('_process'))

},{"../adapters/http":18,"../adapters/xhr":18,"../core/AxiosError":24,"../helpers/formDataToJSON":40,"../helpers/normalizeHeaderName":44,"../helpers/toFormData":48,"../helpers/toURLEncodedForm":49,"../platform":54,"../utils":55,"./transitional":32,"_process":60}],32:[function(require,module,exports){
'use strict';

module.exports = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};

},{}],33:[function(require,module,exports){
// eslint-disable-next-line strict
module.exports = require('form-data');

},{"form-data":58}],34:[function(require,module,exports){
module.exports = {
  "version": "0.28.1"
};
},{}],35:[function(require,module,exports){
'use strict';

var toFormData = require('./toFormData');

function encode(str) {
  var charMap = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
    '%00': '\x00'
  };
  return encodeURIComponent(str).replace(/[!'\(\)~]|%20|%00/g, function replacer(match) {
    return charMap[match];
  });
}

function AxiosURLSearchParams(params, options) {
  this._pairs = [];

  params && toFormData(params, this, options);
}

var prototype = AxiosURLSearchParams.prototype;

prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};

prototype.toString = function toString(encoder) {
  var _encode = encoder ? function(value) {
    return encoder.call(this, value, encode);
  } : encode;

  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + '=' + _encode(pair[1]);
  }, '').join('&');
};

module.exports = AxiosURLSearchParams;

},{"./toFormData":48}],36:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
};

},{}],37:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var AxiosURLSearchParams = require('../helpers/AxiosURLSearchParams');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @param {?object} options
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, options) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var hashmarkIndex = url.indexOf('#');

  if (hashmarkIndex !== -1) {
    url = url.slice(0, hashmarkIndex);
  }

  var _encode = options && options.encode || encode;

  var serializeFn = options && options.serialize;

  var serializedParams;

  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils.isURLSearchParams(params) ?
      params.toString() :
      new AxiosURLSearchParams(params, options).toString(_encode);
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"../helpers/AxiosURLSearchParams":35,"../utils":55}],38:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],39:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

},{"./../utils":55}],40:[function(require,module,exports){
'use strict';

var utils = require('../utils');

function parsePropPath(name) {
  // foo[x][y][z]
  // foo.x.y.z
  // foo-x-y-z
  // foo x y z
  return utils.matchAll(/\w+|\[(\w*)]/g, name).map(function(match) {
    return match[0] === '[]' ? '' : match[1] || match[0];
  });
}

function arrayToObject(arr) {
  var obj = {};
  var keys = Object.keys(arr);
  var i;
  var len = keys.length;
  var key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}

function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    var name = path[index++];
    var isNumericKey = Number.isFinite(+name);
    var isLast = index >= path.length;
    name = !name && utils.isArray(target) ? target.length : name;

    if (isLast) {
      if (utils.hasOwnProperty(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }

      return !isNumericKey;
    }

    if (!target[name] || !utils.isObject(target[name])) {
      target[name] = [];
    }

    var result = buildPath(path, value, target[name], index);

    if (result && utils.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }

    return !isNumericKey;
  }

  if (utils.isFormData(formData) && utils.isFunction(formData.entries)) {
    var obj = {};

    utils.forEachEntry(formData, function(name, value) {
      buildPath(parsePropPath(name), value, obj, 0);
    });

    return obj;
  }

  return null;
}

module.exports = formDataToJSON;

},{"../utils":55}],41:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
};

},{}],42:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return utils.isObject(payload) && (payload.isAxiosError === true);
};

},{"./../utils":55}],43:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
      * Parse a URL to discover it's components
      *
      * @param {String} url The URL to be parsed
      * @returns {Object}
      */
      function resolveURL(url) {
        var href = url;

        if (msie) {
          // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
      * Determine if a URL shares the same origin as the current location
      *
      * @param {String} requestURL The URL to test
      * @returns {boolean} True if URL shares the same origin, otherwise false
      */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

    // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

},{"./../utils":55}],44:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":55}],45:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.slice(0, i)).toLowerCase();
    val = utils.trim(line.slice(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":55}],46:[function(require,module,exports){
'use strict';

module.exports = function parseProtocol(url) {
  var match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || '';
};

},{}],47:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],48:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

var utils = require('../utils');
var AxiosError = require('../core/AxiosError');
var envFormData = require('../env/classes/FormData');

function isVisitable(thing) {
  return utils.isPlainObject(thing) || utils.isArray(thing);
}

function removeBrackets(key) {
  return utils.endsWith(key, '[]') ? key.slice(0, -2) : key;
}

function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    // eslint-disable-next-line no-param-reassign
    token = removeBrackets(token);
    return !dots && i ? '[' + token + ']' : token;
  }).join(dots ? '.' : '');
}

function isFlatArray(arr) {
  return utils.isArray(arr) && !arr.some(isVisitable);
}

var predicates = utils.toFlatObject(utils, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});

function isSpecCompliant(thing) {
  return thing && utils.isFunction(thing.append) && thing[Symbol.toStringTag] === 'FormData' && thing[Symbol.iterator];
}

/**
 * Convert a data object to FormData
 * @param {Object} obj
 * @param {?Object} [formData]
 * @param {?Object} [options]
 * @param {Function} [options.visitor]
 * @param {Boolean} [options.metaTokens = true]
 * @param {Boolean} [options.dots = false]
 * @param {?Boolean} [options.indexes = false]
 * @returns {Object}
 **/

function toFormData(obj, formData, options) {
  if (!utils.isObject(obj)) {
    throw new TypeError('target must be an object');
  }

  // eslint-disable-next-line no-param-reassign
  formData = formData || new (envFormData || FormData)();

  // eslint-disable-next-line no-param-reassign
  options = utils.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, function defined(option, source) {
    // eslint-disable-next-line no-eq-null,eqeqeq
    return !utils.isUndefined(source[option]);
  });

  var metaTokens = options.metaTokens;
  // eslint-disable-next-line no-use-before-define
  var visitor = options.visitor || defaultVisitor;
  var dots = options.dots;
  var indexes = options.indexes;
  var _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
  var useBlob = _Blob && isSpecCompliant(formData);

  if (!utils.isFunction(visitor)) {
    throw new TypeError('visitor must be a function');
  }

  function convertValue(value) {
    if (value === null) return '';

    if (utils.isDate(value)) {
      return value.toISOString();
    }

    if (!useBlob && utils.isBlob(value)) {
      throw new AxiosError('Blob is not supported. Use a Buffer instead.');
    }

    if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
      return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
    }

    return value;
  }

  /**
   *
   * @param {*} value
   * @param {String|Number} key
   * @param {Array<String|Number>} path
   * @this {FormData}
   * @returns {boolean} return true to visit the each prop of the value recursively
   */
  function defaultVisitor(value, key, path) {
    var arr = value;

    if (value && !path && typeof value === 'object') {
      if (utils.endsWith(key, '{}')) {
        // eslint-disable-next-line no-param-reassign
        key = metaTokens ? key : key.slice(0, -2);
        // eslint-disable-next-line no-param-reassign
        value = JSON.stringify(value);
      } else if (
        (utils.isArray(value) && isFlatArray(value)) ||
        (utils.isFileList(value) || utils.endsWith(key, '[]') && (arr = utils.toArray(value))
        )) {
        // eslint-disable-next-line no-param-reassign
        key = removeBrackets(key);

        arr.forEach(function each(el, index) {
          !utils.isUndefined(el) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
            convertValue(el)
          );
        });
        return false;
      }
    }

    if (isVisitable(value)) {
      return true;
    }

    formData.append(renderKey(path, key, dots), convertValue(value));

    return false;
  }

  var stack = [];

  var exposedHelpers = Object.assign(predicates, {
    defaultVisitor: defaultVisitor,
    convertValue: convertValue,
    isVisitable: isVisitable
  });

  function build(value, path) {
    if (utils.isUndefined(value)) return;

    if (stack.indexOf(value) !== -1) {
      throw Error('Circular reference detected in ' + path.join('.'));
    }

    stack.push(value);

    utils.forEach(value, function each(el, key) {
      var result = !utils.isUndefined(el) && visitor.call(
        formData, el, utils.isString(key) ? key.trim() : key, path, exposedHelpers
      );

      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    });

    stack.pop();
  }

  if (!utils.isObject(obj)) {
    throw new TypeError('data must be an object');
  }

  build(obj);

  return formData;
}

module.exports = toFormData;

}).call(this)}).call(this,require("buffer").Buffer)

},{"../core/AxiosError":24,"../env/classes/FormData":33,"../utils":55,"buffer":57}],49:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var toFormData = require('./toFormData');
var platform = require('../platform/');

module.exports = function toURLEncodedForm(data, options) {
  return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
    visitor: function(value, key, path, helpers) {
      if (platform.isNode && utils.isBuffer(value)) {
        this.append(key, value.toString('base64'));
        return false;
      }

      return helpers.defaultVisitor.apply(this, arguments);
    }
  }, options));
};

},{"../platform/":54,"../utils":55,"./toFormData":48}],50:[function(require,module,exports){
'use strict';

var VERSION = require('../env/data').version;
var AxiosError = require('../core/AxiosError');

var validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
  validators[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

var deprecatedWarnings = {};

/**
 * Transitional option validator
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return function(value, opt, opts) {
    if (validator === false) {
      throw new AxiosError(
        formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
        AxiosError.ERR_DEPRECATED
      );
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
    }
  }
}

module.exports = {
  assertOptions: assertOptions,
  validators: validators
};

},{"../core/AxiosError":24,"../env/data":34}],51:[function(require,module,exports){
'use strict';

module.exports = FormData;

},{}],52:[function(require,module,exports){
'use strict';

var AxiosURLSearchParams = require('../../../helpers/AxiosURLSearchParams');

module.exports = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;

},{"../../../helpers/AxiosURLSearchParams":35}],53:[function(require,module,exports){
'use strict';

module.exports = {
  isBrowser: true,
  classes: {
    URLSearchParams: require('./classes/URLSearchParams'),
    FormData: require('./classes/FormData'),
    Blob: Blob
  },
  protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
};

},{"./classes/FormData":51,"./classes/URLSearchParams":52}],54:[function(require,module,exports){
'use strict';

module.exports = require('./node/');

},{"./node/":53}],55:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

// eslint-disable-next-line func-names
var kindOf = (function(cache) {
  // eslint-disable-next-line func-names
  return function(thing) {
    var str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  };
})(Object.create(null));

function kindOfTest(type) {
  type = type.toLowerCase();
  return function isKindOf(thing) {
    return kindOf(thing) === type;
  };
}

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return Array.isArray(val);
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
var isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (kindOf(val) !== 'object') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a empty Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a empty Object, otherwise false
 */
function isEmptyObject(val) {
  return val && Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
var isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
var isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} thing The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(thing) {
  var pattern = '[object FormData]';
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) ||
    toString.call(thing) === pattern ||
    (isFunction(thing.toString) && thing.toString() === pattern)
  );
}

/**
 * Determine if a value is a URLSearchParams object
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
var isURLSearchParams = kindOfTest('URLSearchParams');

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  var product;
  if (typeof navigator !== 'undefined' && (
    (product = navigator.product) === 'ReactNative' ||
    product === 'NativeScript' ||
    product === 'NS')
  ) {
    return false;
  }

  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 */

function inherits(constructor, superConstructor, props, descriptors) {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  props && Object.assign(constructor.prototype, props);
}

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function|Boolean} [filter]
 * @param {Function} [propFilter]
 * @returns {Object}
 */

function toFlatObject(sourceObj, destObj, filter, propFilter) {
  var props;
  var i;
  var prop;
  var merged = {};

  destObj = destObj || {};
  // eslint-disable-next-line no-eq-null,eqeqeq
  if (sourceObj == null) return destObj;

  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter !== false && Object.getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
}

/*
 * determines whether a string ends with the characters of a specified string
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 * @returns {boolean}
 */
function endsWith(str, searchString, position) {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  var lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}


/**
 * Returns new array from array like object or null if failed
 * @param {*} [thing]
 * @returns {?Array}
 */
function toArray(thing) {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  var i = thing.length;
  if (!isNumber(i)) return null;
  var arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}

// eslint-disable-next-line func-names
var isTypedArray = (function(TypedArray) {
  // eslint-disable-next-line func-names
  return function(thing) {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== 'undefined' && Object.getPrototypeOf(Uint8Array));

function forEachEntry(obj, fn) {
  var generator = obj && obj[Symbol.iterator];

  var iterator = generator.call(obj);

  var result;

  while ((result = iterator.next()) && !result.done) {
    var pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
}

function matchAll(regExp, str) {
  var matches;
  var arr = [];

  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }

  return arr;
}

var isHTMLForm = kindOfTest('HTMLFormElement');

var hasOwnProperty = (function resolver(_hasOwnProperty) {
  return function(obj, prop) {
    return _hasOwnProperty.call(obj, prop);
  };
})(Object.prototype.hasOwnProperty);

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isEmptyObject: isEmptyObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM,
  inherits: inherits,
  toFlatObject: toFlatObject,
  kindOf: kindOf,
  kindOfTest: kindOfTest,
  endsWith: endsWith,
  toArray: toArray,
  isTypedArray: isTypedArray,
  isFileList: isFileList,
  forEachEntry: forEachEntry,
  matchAll: matchAll,
  isHTMLForm: isHTMLForm,
  hasOwnProperty: hasOwnProperty
};

},{"./helpers/bind":36}],56:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],57:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)

},{"base64-js":56,"buffer":57,"ieee754":59}],58:[function(require,module,exports){
/* eslint-env browser */
module.exports = typeof self == 'object' ? self.FormData : window.FormData;

},{}],59:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],60:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],61:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; };
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) });

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: true });
  defineProperty(
    GeneratorFunctionPrototype,
    "constructor",
    { value: GeneratorFunction, configurable: true }
  );
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    defineProperty(this, "_invoke", { value: enqueue });
  }

  defineIteratorMethods(AsyncIterator.prototype);
  define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  });
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per GeneratorResume behavior specified since ES2015:
        // ES2015 spec, step 3: https://262.ecma-international.org/6.0/#sec-generatorresume
        // Latest spec, step 2: https://tc39.es/ecma262/#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var methodName = context.method;
    var method = delegate.iterator[methodName];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method, or a missing .next method, always terminate the
      // yield* loop.
      context.delegate = null;

      // Note: ["return"] must be used for ES3 parsing compatibility.
      if (methodName === "throw" && delegate.iterator["return"]) {
        // If the delegate iterator has a return method, give it a
        // chance to clean up.
        context.method = "return";
        context.arg = undefined;
        maybeInvokeDelegate(delegate, context);

        if (context.method === "throw") {
          // If maybeInvokeDelegate(context) changed context.method from
          // "return" to "throw", let that override the TypeError below.
          return ContinueSentinel;
        }
      }
      if (methodName !== "return") {
        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a '" + methodName + "' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  define(Gp, iteratorSymbol, function() {
    return this;
  });

  define(Gp, "toString", function() {
    return "[object Generator]";
  });

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(val) {
    var object = Object(val);
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable != null) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    throw new TypeError(typeof iterable + " is not iterable");
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, in modern engines
  // we can explicitly access globalThis. In older engines we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}

},{}],62:[function(require,module,exports){
'use strict';

// The regenerator runtime is needed since the test use functions
// with the async/await keywords. See
// https://babeljs.io/docs/en/babel-plugin-transform-regenerator
require('regenerator-runtime/runtime');
beforeEach(() => {
  // Clear localStorage before every test to prevent stored URLs to
  // interfere with our setup.
  localStorage.clear();
});
require('./test-common');
require('./test-browser-specific');
require('./test-parallel-uploads');
require('./test-terminate');
require('./test-end-to-end');

},{"./test-browser-specific":65,"./test-common":66,"./test-end-to-end":67,"./test-parallel-uploads":68,"./test-terminate":69,"regenerator-runtime/runtime":61}],63:[function(require,module,exports){
'use strict';

module.exports = async function assertUrlStorage(urlStorage) {
  // In the beginning of the test, the storage should be empty.
  let result = await urlStorage.findAllUploads();
  expect(result).toEqual([]);

  // Add a few uploads into the storage
  const key1 = await urlStorage.addUpload('fingerprintA', {
    id: 1
  });
  const key2 = await urlStorage.addUpload('fingerprintA', {
    id: 2
  });
  const key3 = await urlStorage.addUpload('fingerprintB', {
    id: 3
  });
  expect(/^tus::fingerprintA::/.test(key1)).toBe(true);
  expect(/^tus::fingerprintA::/.test(key2)).toBe(true);
  expect(/^tus::fingerprintB::/.test(key3)).toBe(true);

  // Query the just stored uploads individually
  result = await urlStorage.findUploadsByFingerprint('fingerprintA');
  sort(result);
  expect(result).toEqual([{
    id: 1,
    urlStorageKey: key1
  }, {
    id: 2,
    urlStorageKey: key2
  }]);
  result = await urlStorage.findUploadsByFingerprint('fingerprintB');
  sort(result);
  expect(result).toEqual([{
    id: 3,
    urlStorageKey: key3
  }]);

  // Check that we can retrieve all stored uploads
  result = await urlStorage.findAllUploads();
  sort(result);
  expect(result).toEqual([{
    id: 1,
    urlStorageKey: key1
  }, {
    id: 2,
    urlStorageKey: key2
  }, {
    id: 3,
    urlStorageKey: key3
  }]);

  // Check that it can remove an upload and will not return it back
  await urlStorage.removeUpload(key2);
  await urlStorage.removeUpload(key3);
  result = await urlStorage.findUploadsByFingerprint('fingerprintA');
  expect(result).toEqual([{
    id: 1,
    urlStorageKey: key1
  }]);
  result = await urlStorage.findUploadsByFingerprint('fingerprintB');
  expect(result).toEqual([]);
};

// Sort the results from the URL storage since the order in not deterministic.
function sort(result) {
  result.sort((a, b) => a.id - b.id);
}

},{}],64:[function(require,module,exports){
(function (Buffer){(function (){
/* eslint-disable max-classes-per-file */

'use strict';

const isBrowser = typeof window !== 'undefined';
const isNode = !isBrowser;

/**
 * Obtain a platform specific buffer object, which can be
 * handled by tus-js-client.
 */
function getBlob(str) {
  if (isNode) {
    return Buffer.from(str);
  }
  return new Blob(str.split(''));
}

/**
 * Create a promise and obtain the resolve/reject functions
 * outside of the Promise callback.
 */
function flatPromise() {
  let resolveFn;
  let rejectFn;
  const p = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  return [p, resolveFn, rejectFn];
}

/**
 * Create a spy-able function which resolves a Promise
 * once it is called.
 */
function waitableFunction() {
  let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'func';
  const [promise, resolve] = flatPromise();
  const fn = jasmine.createSpy(name, resolve).and.callThrough();
  fn.toBeCalled = promise;
  return fn;
}

/**
 * Create a Promise that resolves after the specified duration.
 */
function wait(delay) {
  return new Promise(resolve => setTimeout(resolve, delay, 'timed out'));
}

/**
 * TestHttpStack implements the HTTP stack interface for tus-js-client
 * and can be used to assert outgoing requests and respond with mock data.
 */
class TestHttpStack {
  constructor() {
    this._pendingRequests = [];
    this._pendingWaits = [];
  }
  createRequest(method, url) {
    return new TestRequest(method, url, req => {
      if (this._pendingWaits.length >= 1) {
        const handler = this._pendingWaits.shift();
        handler(req);
        return;
      }
      this._pendingRequests.push(req);
    });
  }
  nextRequest() {
    if (this._pendingRequests.length >= 1) {
      return Promise.resolve(this._pendingRequests.shift());
    }
    return new Promise(resolve => {
      this._pendingWaits.push(resolve);
    });
  }
}
class TestRequest {
  constructor(method, url, onRequestSend) {
    this.method = method;
    this.url = url;
    this.requestHeaders = {};
    this.body = null;
    this._onRequestSend = onRequestSend;
    this._onProgress = () => {};
    [this._requestPromise, this._resolveRequest, this._rejectRequest] = flatPromise();
  }
  getMethod() {
    return this.method;
  }
  getURL() {
    return this.url;
  }
  setHeader(header, value) {
    this.requestHeaders[header] = value;
  }
  getHeader(header) {
    return this.requestHeaders[header] || null;
  }
  setProgressHandler(progressHandler) {
    this._onProgress = progressHandler;
  }
  send() {
    let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    this.body = body;
    if (body) {
      this._onProgress(0);
      this._onProgress(body.length || body.size || 0);
    }
    this._onRequestSend(this);
    return this._requestPromise;
  }
  abort() {
    this._rejectRequest(new Error('request aborted'));
  }
  getUnderlyingObject() {
    throw new Error('not implemented');
  }
  respondWith(resData) {
    resData.responseHeaders = resData.responseHeaders || {};
    const res = new TestResponse(resData);
    this._resolveRequest(res);
  }
  responseError(err) {
    this._rejectRequest(err);
  }
}
class TestResponse {
  constructor(res) {
    this._response = res;
  }
  getStatus() {
    return this._response.status;
  }
  getHeader(header) {
    return this._response.responseHeaders[header];
  }
  getBody() {
    return this._response.responseText;
  }
  getUnderlyingObject() {
    throw new Error('not implemented');
  }
}
module.exports = {
  TestHttpStack,
  waitableFunction,
  wait,
  getBlob
};

}).call(this)}).call(this,require("buffer").Buffer)

},{"buffer":57}],65:[function(require,module,exports){
'use strict';

const assertUrlStorage = require('./helpers/assertUrlStorage');
const {
  TestHttpStack,
  waitableFunction,
  wait
} = require('./helpers/utils');
const tus = require('../..');
describe('tus', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  describe('#Upload', () => {
    it('should resume an upload from a stored url', async () => {
      localStorage.setItem('tus::fingerprinted::1337', JSON.stringify({
        uploadUrl: 'http://tus.io/uploads/resuming'
      }));
      const testStack = new TestHttpStack();
      const file = new Blob('hello world'.split(''));
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onProgress() {},
        fingerprint() {}
      };
      spyOn(options, 'fingerprint').and.resolveTo('fingerprinted');
      spyOn(options, 'onProgress');
      const upload = new tus.Upload(file, options);
      const previousUploads = await upload.findPreviousUploads();
      expect(previousUploads).toEqual([{
        uploadUrl: 'http://tus.io/uploads/resuming',
        urlStorageKey: 'tus::fingerprinted::1337'
      }]);
      upload.resumeFromPreviousUpload(previousUploads[0]);
      upload.start();
      expect(options.fingerprint).toHaveBeenCalledWith(file, upload.options);
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/resuming');
      expect(req.method).toBe('HEAD');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 11,
          'Upload-Offset': 3
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/resuming');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(3);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(11 - 3);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      expect(upload.url).toBe('http://tus.io/uploads/resuming');
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
    });
    describe('storing of upload urls', () => {
      const testStack = new TestHttpStack();
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        fingerprint() {}
      };
      async function startUpload() {
        const file = new Blob('hello world'.split(''));
        spyOn(options, 'fingerprint').and.resolveTo('fingerprinted');
        options.onSuccess = waitableFunction('onSuccess');
        const upload = new tus.Upload(file, options);
        upload.start();
        expect(options.fingerprint).toHaveBeenCalled();
        const req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads');
        expect(req.method).toBe('POST');
        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: '/uploads/blargh'
          }
        });

        // Wait a short delay to allow the Promises to settle
        await wait(10);
      }
      async function finishUpload() {
        const req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/blargh');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        await options.onSuccess.toBeCalled;
      }
      it('should store and retain with default options', async () => {
        options.removeFingerprintOnSuccess = false;
        await startUpload();
        const key = localStorage.key(0);
        expect(key.indexOf('tus::fingerprinted::')).toBe(0);
        const storedUpload = JSON.parse(localStorage.getItem(key));
        expect(storedUpload.uploadUrl).toBe('http://tus.io/uploads/blargh');
        expect(storedUpload.size).toBe(11);
        await finishUpload();
        expect(localStorage.getItem(key)).toBe(JSON.stringify(storedUpload));
      });
      it('should store and remove with option removeFingerprintOnSuccess set', async () => {
        options.removeFingerprintOnSuccess = true;
        await startUpload();
        const key = localStorage.key(0);
        expect(key.indexOf('tus::fingerprinted::')).toBe(0);
        const storedUpload = JSON.parse(localStorage.getItem(key));
        expect(storedUpload.uploadUrl).toBe('http://tus.io/uploads/blargh');
        expect(storedUpload.size).toBe(11);
        await finishUpload();
        expect(localStorage.getItem(key)).toBe(null);
      });
      it('should store URLs passed in using the uploadUrl option', async () => {
        const file = new Blob('hello world'.split(''));
        const options2 = {
          httpStack: testStack,
          uploadUrl: 'http://tus.io/uploads/storedUrl',
          fingerprint() {},
          onSuccess: waitableFunction('onSuccess'),
          removeFingerprintOnSuccess: true
        };
        spyOn(options2, 'fingerprint').and.resolveTo('fingerprinted');
        const upload = new tus.Upload(file, options2);
        upload.start();
        expect(options2.fingerprint).toHaveBeenCalled();
        let req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/storedUrl');
        expect(req.method).toBe('HEAD');
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Length': 11,
            'Upload-Offset': 3
          }
        });

        // Wait a short delay to allow the Promises to settle
        await wait(10);
        const key = localStorage.key(0);
        expect(key.indexOf('tus::fingerprinted::')).toBe(0);
        const storedUpload = JSON.parse(localStorage.getItem(key));
        expect(storedUpload.uploadUrl).toBe('http://tus.io/uploads/storedUrl');
        expect(storedUpload.size).toBe(11);
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/storedUrl');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
        expect(req.requestHeaders['Upload-Offset']).toBe(3);
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
        expect(req.body.size).toBe(11 - 3);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        await options2.onSuccess.toBeCalled;

        // Entry in localStorage should be removed after successful upload
        expect(localStorage.getItem(key)).toBe(null);
      });
    });
    it('should delete upload urls on a 4XX', async () => {
      const testStack = new TestHttpStack();
      const file = new Blob('hello world'.split(''));
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        fingerprint() {}
      };
      spyOn(options, 'fingerprint').and.resolveTo('fingerprinted');
      const upload = new tus.Upload(file, options);
      upload.resumeFromPreviousUpload({
        uploadUrl: 'http://tus.io/uploads/resuming',
        urlStorageKey: 'tus::fingerprinted::1337'
      });
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/resuming');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 400
      });
      await wait(10);
      expect(localStorage.getItem('tus::fingerprinted::1337')).toBe(null);
    });
    describe('uploading data from a Reader', () => {
      function makeReader(content) {
        let readSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : content.length;
        const reader = {
          value: content.split(''),
          read() {
            let value;
            let done = false;
            if (this.value.length > 0) {
              value = this.value.slice(0, readSize);
              this.value = this.value.slice(readSize);
            } else {
              done = true;
            }
            return Promise.resolve({
              value,
              done
            });
          },
          cancel: waitableFunction('cancel')
        };
        return reader;
      }
      async function assertReaderUpload(_ref) {
        let {
          readSize,
          chunkSize
        } = _ref;
        const reader = makeReader('hello world', readSize);
        const testStack = new TestHttpStack();
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/uploads',
          chunkSize,
          onProgress: waitableFunction('onProgress'),
          onSuccess: waitableFunction('onSuccess'),
          fingerprint() {},
          uploadLengthDeferred: true
        };
        spyOn(options, 'fingerprint').and.resolveTo('fingerprinted');
        const upload = new tus.Upload(reader, options);
        upload.start();
        expect(options.fingerprint).toHaveBeenCalledWith(reader, upload.options);
        let req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads');
        expect(req.method).toBe('POST');
        expect(req.requestHeaders['Upload-Length']).toBe(undefined);
        expect(req.requestHeaders['Upload-Defer-Length']).toBe(1);
        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: 'http://tus.io/uploads/blargh'
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/blargh');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Upload-Offset']).toBe(0);
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
        expect(req.body.length).toBe(11);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        await options.onProgress.toBeCalled;
        expect(options.onProgress).toHaveBeenCalledWith(11, null);
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/blargh');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Upload-Offset']).toBe(11);
        expect(req.requestHeaders['Upload-Length']).toBe(11);
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
        expect(req.body).toBe(null);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        await options.onSuccess.toBeCalled;
        expect(upload.url).toBe('http://tus.io/uploads/blargh');
        expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      }
      it('should upload data', async () => {
        await assertReaderUpload({
          chunkSize: 100,
          readSize: 100
        });
      });
      it('should read multiple times from the reader', async () => {
        await assertReaderUpload({
          chunkSize: 100,
          readSize: 6
        });
      });
      it('should use multiple PATCH requests', async () => {
        const reader = makeReader('hello world', 1);
        const testStack = new TestHttpStack();
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/uploads',
          chunkSize: 6,
          onProgress: waitableFunction('onProgress'),
          onSuccess: waitableFunction('onSuccess'),
          fingerprint() {},
          uploadLengthDeferred: true
        };
        spyOn(options, 'fingerprint').and.resolveTo('fingerprinted');
        const upload = new tus.Upload(reader, options);
        upload.start();
        expect(options.fingerprint).toHaveBeenCalledWith(reader, upload.options);
        let req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads');
        expect(req.method).toBe('POST');
        expect(req.requestHeaders['Upload-Length']).toBe(undefined);
        expect(req.requestHeaders['Upload-Defer-Length']).toBe(1);
        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: 'http://tus.io/uploads/blargh'
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/blargh');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Upload-Offset']).toBe(0);
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
        expect(req.body.length).toBe(6);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 6
          }
        });
        await options.onProgress.toBeCalled;
        expect(options.onProgress).toHaveBeenCalledWith(6, null);
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/blargh');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
        expect(req.requestHeaders['Upload-Offset']).toBe(6);
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
        expect(req.body.length).toBe(5);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/blargh');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Upload-Offset']).toBe(11);
        expect(req.requestHeaders['Upload-Length']).toBe(11);
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
        expect(req.body).toBe(null);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        await options.onSuccess.toBeCalled;
        expect(upload.url).toBe('http://tus.io/uploads/blargh');
        expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      });
      it('should retry the POST request', async () => {
        const reader = makeReader('hello world', 1);
        const testStack = new TestHttpStack();
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/files/',
          chunkSize: 11,
          retryDelays: [10, 10, 10],
          onSuccess: waitableFunction('onSuccess'),
          uploadLengthDeferred: true
        };
        const upload = new tus.Upload(reader, options);
        upload.start();
        let req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/');
        expect(req.method).toBe('POST');
        req.respondWith({
          status: 500
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/');
        expect(req.method).toBe('POST');
        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: '/files/foo'
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Upload-Length']).toBe(11);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        await options.onSuccess.toBeCalled;
      });
      it('should retry the first PATCH request', async () => {
        const reader = makeReader('hello world', 1);
        const testStack = new TestHttpStack();
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/files/',
          chunkSize: 11,
          retryDelays: [10, 10, 10],
          onSuccess: waitableFunction('onSuccess'),
          uploadLengthDeferred: true
        };
        const upload = new tus.Upload(reader, options);
        upload.start();
        let req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/');
        expect(req.method).toBe('POST');
        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: '/files/foo'
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 500
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('HEAD');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 0
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Upload-Length']).toBe(11);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        await options.onSuccess.toBeCalled;
      });
      it('should retry following PATCH requests', async () => {
        const reader = makeReader('hello world there!');
        const testStack = new TestHttpStack();
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/files/',
          chunkSize: 6,
          retryDelays: [10, 10, 10],
          onSuccess() {},
          uploadLengthDeferred: true
        };
        const upload = new tus.Upload(reader, options);
        upload.start();
        let req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/');
        expect(req.method).toBe('POST');
        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: '/files/foo'
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 6
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 500
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('HEAD');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 6
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 12
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 18
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/files/foo');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Upload-Length']).toBe(18);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 18
          }
        });
        await options.onSuccess.toBeCalled;
      });
      it('should throw an error if the source provides less data than uploadSize', async () => {
        const reader = makeReader('hello world');
        const testStack = new TestHttpStack();
        const options = {
          httpStack: testStack,
          uploadSize: 100,
          chunkSize: 100,
          endpoint: 'http://tus.io/uploads',
          retryDelays: [],
          onError: waitableFunction('onError')
        };
        const upload = new tus.Upload(reader, options);
        upload.start();
        let req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads');
        expect(req.method).toBe('POST');
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
        req.respondWith({
          status: 204,
          responseHeaders: {
            Location: 'http://tus.io/uploads/foo'
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/foo');
        expect(req.method).toBe('PATCH');
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        const err = await options.onError.toBeCalled;
        expect(err.message).toBe('tus: failed to upload chunk at offset 11, caused by Error: upload was configured with a size of 100 bytes, but the source is done after 11 bytes, originated from request (method: PATCH, url: http://tus.io/uploads/foo, response code: n/a, response text: n/a, request id: n/a)');
      });
    });
    describe('resolving of URIs', () => {
      // Disable these tests for IE 10 and 11 because it's not possible to overwrite
      // the navigator.product property.
      const isIE = navigator.userAgent.indexOf('Trident/') > 0;
      if (isIE) {
        console.log('Skipping tests for React Native in Internet Explorer'); // eslint-disable-line no-console
        return;
      }
      const originalProduct = navigator.product;
      beforeEach(() => {
        jasmine.Ajax.install();
        // Simulate React Native environment to enable URIs as input objects.
        Object.defineProperty(navigator, 'product', {
          value: 'ReactNative',
          configurable: true
        });
      });
      afterEach(() => {
        jasmine.Ajax.uninstall();
        Object.defineProperty(navigator, 'product', {
          value: originalProduct,
          configurable: true
        });
      });
      it('should upload a file from an URI', async () => {
        const file = {
          uri: 'file:///my/file.dat'
        };
        const testStack = new TestHttpStack();
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/uploads',
          onSuccess: waitableFunction('onSuccess')
        };
        const upload = new tus.Upload(file, options);
        upload.start();

        // Wait a short interval to make sure that the XHR has been sent.
        await wait(0);
        let req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe('file:///my/file.dat');
        expect(req.method).toBe('GET');
        expect(req.responseType).toBe('blob');
        req.respondWith({
          status: 200,
          responseHeaders: {
            'Upload-Length': 11,
            'Upload-Offset': 3
          },
          response: new Blob('hello world'.split(''))
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads');
        expect(req.method).toBe('POST');
        expect(req.requestHeaders['Upload-Length']).toBe(11);
        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: '/uploads/blargh'
          }
        });
        req = await testStack.nextRequest();
        expect(req.url).toBe('http://tus.io/uploads/blargh');
        expect(req.method).toBe('PATCH');
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
        expect(req.requestHeaders['Upload-Offset']).toBe(0);
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
        expect(req.body.size).toBe(11);
        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 11
          }
        });
        await options.onSuccess.toBeCalled;
        expect(upload.url).toBe('http://tus.io/uploads/blargh');
      });
      it("should emit an error if it can't resolve the URI", async () => {
        const file = {
          uri: 'file:///my/file.dat'
        };
        const options = {
          endpoint: 'http://tus.io/uploads',
          onError: waitableFunction('onError')
        };
        const upload = new tus.Upload(file, options);
        upload.start();

        // Wait a short interval to make sure that the XHR has been sent.
        await wait(0);
        const req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe('file:///my/file.dat');
        expect(req.method).toBe('GET');
        expect(req.responseType).toBe('blob');
        req.responseError();
        await options.onError.toBeCalled;
        expect(options.onError).toHaveBeenCalledWith(new Error('tus: cannot fetch `file.uri` as Blob, make sure the uri is correct and accessible. [object Object]'));
      });
    });
  });
  describe('#LocalStorageUrlStorage', () => {
    it('should allow storing and retrieving uploads', async () => {
      await assertUrlStorage(tus.defaultOptions.urlStorage);
    });
  });
});

},{"../..":4,"./helpers/assertUrlStorage":63,"./helpers/utils":64}],66:[function(require,module,exports){
'use strict';

const {
  TestHttpStack,
  waitableFunction,
  wait,
  getBlob
} = require('./helpers/utils');
const tus = require('../..');

// Uncomment to enable debug log from tus-js-client
// tus.enableDebugLog();

describe('tus', () => {
  describe('#isSupported', () => {
    it('should be true', () => {
      expect(tus.isSupported).toBe(true);
    });
  });
  describe('#Upload', () => {
    it('should throw if no error handler is available', () => {
      const upload = new tus.Upload(null);
      expect(upload.start.bind(upload)).toThrowError('tus: no file or stream to upload provided');
    });
    it('should throw if no endpoint and upload URL is provided', () => {
      const file = getBlob('hello world');
      const upload = new tus.Upload(file);
      expect(upload.start.bind(upload)).toThrowError('tus: neither an endpoint or an upload URL is provided');
    });
    it('should upload a file', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'https://tus.io/uploads',
        headers: {
          Custom: 'blargh'
        },
        metadata: {
          foo: 'hello',
          bar: 'world',
          nonlatin: 'słońce',
          number: 100
        },
        onProgress() {},
        onUploadUrlAvailable: waitableFunction('onUploadUrlAvailable'),
        onSuccess: waitableFunction('onSuccess')
      };
      spyOn(options, 'onProgress');
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders.Custom).toBe('blargh');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(11);
      expect(req.requestHeaders['Upload-Metadata']).toBe('foo aGVsbG8=,bar d29ybGQ=,nonlatin c8WCb8WEY2U=,number MTAw');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/blargh'
        }
      });
      req = await testStack.nextRequest();
      expect(options.onUploadUrlAvailable).toHaveBeenCalled();
      expect(req.url).toBe('https://tus.io/uploads/blargh');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders.Custom).toBe('blargh');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(0);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(11);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(upload.url).toBe('https://tus.io/uploads/blargh');
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
    });
    it('should create an upload if resuming fails', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/uploads/resuming'
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/resuming');
      expect(req.method).toBe('HEAD');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      req.respondWith({
        status: 404
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(11);

      // The upload URL should be cleared when tus-js.client tries to create a new upload.
      expect(upload.url).toBe(null);
    });
    it('should create an upload using the creation-with-data extension', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadDataDuringCreation: true,
        onProgress() {},
        onChunkComplete() {},
        onSuccess: waitableFunction('onSuccess')
      };
      spyOn(options, 'onProgress');
      spyOn(options, 'onChunkComplete');
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(11);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(11);
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/blargh',
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(11, 11, 11);
      expect(options.onSuccess).toHaveBeenCalled();
      expect(upload.url).toBe('http://tus.io/uploads/blargh');
    });
    it('should create an upload with partial data and continue', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadDataDuringCreation: true,
        chunkSize: 6,
        onProgress() {},
        onChunkComplete() {},
        onSuccess: waitableFunction('onSuccess')
      };
      spyOn(options, 'onProgress');
      spyOn(options, 'onChunkComplete');
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(11);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(6);
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/blargh',
          'Upload-Offset': 6
        }
      });
      req = await testStack.nextRequest();

      // Once the second request has been sent, the progress handler must have been invoked.
      expect(options.onProgress).toHaveBeenCalledWith(6, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(6, 6, 11);
      expect(options.onSuccess).not.toHaveBeenCalled();
      expect(upload.url).toBe('http://tus.io/uploads/blargh');
      expect(req.url).toBe('http://tus.io/uploads/blargh');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(6);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(5);
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/blargh',
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(5, 11, 11);
      expect(options.onSuccess).toHaveBeenCalled();
    });
    it("should add the request's body and ID to errors", async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        addRequestId: true,
        retryDelays: null,
        onError: waitableFunction('onError')
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      const reqId = req.requestHeaders['X-Request-ID'];
      expect(typeof reqId).toBe('string');
      expect(reqId.length).toBe(36);
      req.respondWith({
        status: 500,
        responseText: 'server_error'
      });
      const err = await options.onError.toBeCalled;
      expect(err.message).toBe(`tus: unexpected response while creating upload, originated from request (method: POST, url: http://tus.io/uploads, response code: 500, response text: server_error, request id: ${reqId})`);
      expect(err.originalRequest).toBeDefined();
      expect(err.originalResponse).toBeDefined();
    });
    it('should invoke the request and response callbacks', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        uploadUrl: 'http://tus.io/uploads/foo',
        onBeforeRequest(req) {
          expect(req.getURL()).toBe('http://tus.io/uploads/foo');
          expect(req.getMethod()).toBe('HEAD');
        },
        onAfterResponse(req, res) {
          expect(req.getURL()).toBe('http://tus.io/uploads/foo');
          expect(req.getMethod()).toBe('HEAD');
          expect(res.getStatus()).toBe(204);
          expect(res.getHeader('Upload-Offset')).toBe(11);
        },
        onSuccess: waitableFunction('onSuccess')
      };
      spyOn(options, 'onBeforeRequest');
      spyOn(options, 'onAfterResponse');
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/foo');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11,
          'Upload-Length': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onBeforeRequest).toHaveBeenCalled();
      expect(options.onAfterResponse).toHaveBeenCalled();
    });
    it('should throw an error if resuming fails and no endpoint is provided', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        uploadUrl: 'http://tus.io/uploads/resuming',
        onError: waitableFunction('onError')
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/resuming');
      expect(req.method).toBe('HEAD');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      req.respondWith({
        status: 404
      });
      const err = await options.onError.toBeCalled;
      expect(err.message).toBe('tus: unable to resume upload (new upload cannot be created without an endpoint), originated from request (method: HEAD, url: http://tus.io/uploads/resuming, response code: 404, response text: , request id: n/a)');
    });
    it('should resolve relative URLs', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io:1080/files/'
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io:1080/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '//localhost/uploads/foo'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://localhost/uploads/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      expect(upload.url).toBe('http://localhost/uploads/foo');
    });
    it('should upload a file in chunks', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        chunkSize: 7,
        onSuccess: waitableFunction('onSuccess'),
        onProgress() {},
        onChunkComplete() {}
      };
      spyOn(options, 'onProgress');
      spyOn(options, 'onChunkComplete');
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(11);
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/uploads/blargh'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/blargh');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(0);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(7);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 7
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/blargh');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(7);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(4);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(upload.url).toBe('http://tus.io/uploads/blargh');
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(7, 7, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(4, 11, 11);
    });
    it('should add the original request to errors', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        retryDelays: null,
        onError: waitableFunction('onError')
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 500,
        responseHeaders: {
          Custom: 'blargh'
        }
      });
      const err = await options.onError.toBeCalled;
      expect(upload.url).toBe(null);
      expect(err.message).toBe('tus: unexpected response while creating upload, originated from request (method: POST, url: http://tus.io/uploads, response code: 500, response text: , request id: n/a)');
      expect(err.originalRequest).toBeDefined();
      expect(err.originalResponse).toBeDefined();
      expect(err.originalResponse.getHeader('Custom')).toBe('blargh');
    });
    it('should only create an upload for empty files', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onSuccess: waitableFunction('onSuccess')
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(0);
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/empty'
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onSuccess).toHaveBeenCalled();
    });
    it('should not resume a finished upload', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onProgress() {},
        onSuccess: waitableFunction('onSuccess'),
        uploadUrl: 'http://tus.io/uploads/resuming'
      };
      spyOn(options, 'onProgress');
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/resuming');
      expect(req.method).toBe('HEAD');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': '11',
          'Upload-Offset': '11'
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(options.onSuccess).toHaveBeenCalled();
    });
    it('should resume an upload from a specified url', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/files/upload',
        onProgress() {},
        onUploadUrlAvailable: waitableFunction('onUploadUrlAvailable'),
        onSuccess: waitableFunction('onSuccess'),
        fingerprint() {}
      };
      spyOn(options, 'fingerprint').and.resolveTo('fingerprinted');
      spyOn(options, 'onProgress');
      const upload = new tus.Upload(file, options);
      upload.start();
      expect(options.fingerprint).toHaveBeenCalled();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/upload');
      expect(req.method).toBe('HEAD');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 11,
          'Upload-Offset': 3
        }
      });
      req = await testStack.nextRequest();
      expect(options.onUploadUrlAvailable).toHaveBeenCalled();
      expect(req.url).toBe('http://tus.io/files/upload');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(3);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(11 - 3);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(upload.url).toBe('http://tus.io/files/upload');
    });
    it('should resume a previously started upload', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onSuccess: waitableFunction('onSuccess'),
        onError() {}
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/blargh'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/blargh');
      expect(req.method).toBe('PATCH');
      upload.abort();
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5
        }
      });
      upload.start();
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/blargh');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5,
          'Upload-Length': 11
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/blargh');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onSuccess).toHaveBeenCalled();
    });
    it('should override the PATCH method', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/files/upload',
        overridePatchMethod: true
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/upload');
      expect(req.method).toBe('HEAD');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 11,
          'Upload-Offset': 3
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/upload');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(3);
      expect(req.requestHeaders['X-HTTP-Method-Override']).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
    });
    it('should emit an error if an upload is locked', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/files/upload',
        onError: waitableFunction('onError'),
        retryDelays: null
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/upload');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 423 // Locked
      });
      await options.onError.toBeCalled;
      expect(options.onError).toHaveBeenCalledWith(new Error('tus: upload is currently locked; retry later, originated from request (method: HEAD, url: http://tus.io/files/upload, response code: 423, response text: , request id: n/a)'));
    });
    it('should emit an error if no Location header is presented', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onError: waitableFunction('onError'),
        retryDelays: null
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');

      // The Location header is omitted on purpose here
      req.respondWith({
        status: 201
      });
      await options.onError.toBeCalled;
      expect(options.onError).toHaveBeenCalledWith(new Error('tus: invalid or missing Location header, originated from request (method: POST, url: http://tus.io/uploads, response code: 201, response text: , request id: n/a)'));
    });
    it('should throw an error if the source provides less data than uploadSize', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        uploadSize: 100,
        endpoint: 'http://tus.io/uploads',
        retryDelays: [],
        onError: waitableFunction('onError')
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      req.respondWith({
        status: 204,
        responseHeaders: {
          Location: 'http://tus.io/uploads/foo'
        }
      });
      const err = await options.onError.toBeCalled;
      expect(err.message).toBe('tus: failed to upload chunk at offset 0, caused by Error: upload was configured with a size of 100 bytes, but the source is done after 11 bytes, originated from request (method: PATCH, url: http://tus.io/uploads/foo, response code: n/a, response text: n/a, request id: n/a)');
    });
    it('should throw if retryDelays is not an array', () => {
      const file = getBlob('hello world');
      const upload = new tus.Upload(file, {
        endpoint: 'http://endpoint/',
        retryDelays: 44
      });
      expect(upload.start.bind(upload)).toThrowError('tus: the `retryDelays` option must either be an array or null');
    });

    // This tests ensures that tus-js-client correctly retries if the
    // response has the code 500 Internal Error, 423 Locked or 409 Conflict.
    it('should retry the upload', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10],
        onSuccess: waitableFunction('onSuccess')
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 500
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 423
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 201,
        responseHeaders: {
          'Upload-Offset': 0,
          'Upload-Length': 11
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 409
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 201,
        responseHeaders: {
          'Upload-Offset': 0,
          'Upload-Length': 11
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onSuccess).toHaveBeenCalled();
    });

    // This tests ensures that tus-js-client correctly retries if the
    // return value of onShouldRetry is true.
    it('should retry the upload when onShouldRetry specified and returns true', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10],
        onSuccess: waitableFunction('onSuccess'),
        onShouldRetry: () => true
      };
      spyOn(options, 'onShouldRetry').and.callThrough();
      spyOn(tus.Upload.prototype, '_emitError').and.callThrough();
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 500
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 423
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 201,
        responseHeaders: {
          'Upload-Offset': 0,
          'Upload-Length': 11
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 409
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 201,
        responseHeaders: {
          'Upload-Offset': 0,
          'Upload-Length': 11
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onSuccess).toHaveBeenCalled();
      const [error1] = upload._emitError.calls.argsFor(0);
      expect(options.onShouldRetry).toHaveBeenCalled();
      expect(options.onShouldRetry.calls.argsFor(0)).toEqual([error1, 0, upload.options]);
      const [error2] = upload._emitError.calls.argsFor(1);
      expect(options.onShouldRetry.calls.argsFor(1)).toEqual([error2, 1, upload.options]);
    });

    // This tests ensures that tus-js-client correctly aborts if the
    // return value of onShouldRetry is false.
    it('should not retry the upload when callback specified and returns false', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10],
        onSuccess: waitableFunction('onSuccess'),
        onError: waitableFunction('onError'),
        onShouldRetry: () => false
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');

      // The error callback should not be invoked for the first error response.
      expect(options.onError).not.toHaveBeenCalled();
      req.respondWith({
        status: 500
      });
      await options.onError.toBeCalled;
      expect(options.onSuccess).not.toHaveBeenCalled();
      expect(options.onError).toHaveBeenCalledTimes(1);
    });
    it('should not retry if the error has not been caused by a request', async () => {
      const file = getBlob('hello world');
      const options = {
        httpStack: new TestHttpStack(),
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10],
        onSuccess() {},
        onError() {}
      };
      spyOn(options, 'onSuccess');
      spyOn(options, 'onError');
      const upload = new tus.Upload(file, options);
      spyOn(upload, '_createUpload');
      upload.start();
      await wait(200);
      const error = new Error('custom error');
      upload._emitError(error);
      expect(upload._createUpload).toHaveBeenCalledTimes(1);
      expect(options.onError).toHaveBeenCalledWith(error);
      expect(options.onSuccess).not.toHaveBeenCalled();
    });
    it('should stop retrying after all delays have been used', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10],
        onSuccess() {},
        onError: waitableFunction('onError')
      };
      spyOn(options, 'onSuccess');
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 500
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');

      // The error callback should not be invoked for the first error response.
      expect(options.onError).not.toHaveBeenCalled();
      req.respondWith({
        status: 500
      });
      await options.onError.toBeCalled;
      expect(options.onSuccess).not.toHaveBeenCalled();
      expect(options.onError).toHaveBeenCalledTimes(1);
    });
    it('should stop retrying when the abort function is called', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10],
        onError() {}
      };
      spyOn(options, 'onError');
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      spyOn(upload, 'start').and.callThrough();
      upload.abort();
      req.respondWith({
        status: 500
      });
      const result = await Promise.race([testStack.nextRequest(), wait(100)]);
      expect(result).toBe('timed out');
    });
    it('should stop upload when the abort function is called during a callback', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        chunkSize: 5,
        onChunkComplete() {
          upload.abort();
        }
      };
      spyOn(options, 'onChunkComplete').and.callThrough();
      let upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5
        }
      });
      const result = await Promise.race([testStack.nextRequest(), wait(200)]);
      expect(options.onChunkComplete).toHaveBeenCalled();
      expect(result).toBe('timed out');
    });
    it('should stop upload when the abort function is called during the POST request', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        onError() {}
      };
      spyOn(options, 'onError').and.callThrough();
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      upload.abort();
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo'
        }
      });
      const result = await Promise.race([testStack.nextRequest(), wait(200)]);
      expect(options.onError).not.toHaveBeenCalled();
      expect(result).toBe('timed out');
    });
    it('should reset the attempt counter if an upload proceeds', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10],
        onError() {},
        onSuccess: waitableFunction('onSuccess')
      };
      spyOn(options, 'onError');
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 500
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 0,
          'Upload-Length': 11
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 500
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5,
          'Upload-Length': 11
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11
        }
      });
      await options.onSuccess.toBeCalled;
      expect(options.onError).not.toHaveBeenCalled();
      expect(options.onSuccess).toHaveBeenCalled();
    });
  });
});

},{"../..":4,"./helpers/utils":64}],67:[function(require,module,exports){
'use strict';

const axios = require('axios');
const {
  getBlob
} = require('./helpers/utils');
const tus = require('../..');

// Test timeout for end-to-end tests when uploading to real server.
const END_TO_END_TIMEOUT = 20 * 1000;
describe('tus', () => {
  describe('end-to-end', () => {
    it('should upload to a real tus server', async () => {
      return new Promise((resolve, reject) => {
        const file = getBlob('hello world');
        const options = {
          endpoint: 'https://tusd.tusdemo.net/files/',
          metadata: {
            nonlatin: 'słońce',
            number: 100,
            filename: 'hello.txt',
            filetype: 'text/plain'
          },
          onSuccess() {
            expect(upload.url).toMatch(/^https:\/\/tusd\.tusdemo\.net\/files\//);
            console.log('Upload URL:', upload.url); // eslint-disable-line no-console

            resolve(upload);
          },
          onError(err) {
            reject(err);
          }
        };
        const upload = new tus.Upload(file, options);
        upload.start();
      }).then(validateUploadContent).then(upload => {
        return upload.abort(true).then(() => upload);
      }).then(validateUploadDeletion);
    }, END_TO_END_TIMEOUT);
    it('should upload to a real tus server with creation-with-upload', async () => {
      return new Promise((resolve, reject) => {
        const file = getBlob('hello world');
        const options = {
          endpoint: 'https://tusd.tusdemo.net/files/',
          metadata: {
            nonlatin: 'słońce',
            number: 100,
            filename: 'hello.txt',
            filetype: 'text/plain'
          },
          onSuccess() {
            expect(upload.url).toMatch(/^https:\/\/tusd\.tusdemo\.net\/files\//);
            console.log('Upload URL:', upload.url); // eslint-disable-line no-console

            resolve(upload);
          },
          onError(err) {
            reject(err);
          }
        };
        const upload = new tus.Upload(file, options);
        upload.start();
      }).then(validateUploadContent);
    }, END_TO_END_TIMEOUT);
  });
});
function validateUploadContent(upload) {
  return axios.get(upload.url).then(res => {
    expect(res.status).toBe(200);
    expect(res.data).toBe('hello world');
    return validateUploadMetadata(upload);
  });
}
function validateUploadMetadata(upload) {
  return axios.head(upload.url, {
    headers: {
      'Tus-Resumable': '1.0.0'
    }
  }).then(res => {
    expect(res.status).toBe(200);
    expect(res.data).toBe('');
    expect(res.headers['tus-resumable']).toBe('1.0.0');
    expect(res.headers['upload-offset']).toBe('11');
    expect(res.headers['upload-length']).toBe('11');

    // The values in the Upload-Metadata header may not be in the same
    // order as we submitted them (the specification does not require
    // that). Therefore, we split the values and verify that each one
    // is present.
    const metadataStr = res.headers['upload-metadata'];
    expect(metadataStr).toBeTruthy();
    const metadata = metadataStr.split(',');
    expect(metadata).toContain('filename aGVsbG8udHh0');
    expect(metadata).toContain('filetype dGV4dC9wbGFpbg==');
    expect(metadata).toContain('nonlatin c8WCb8WEY2U=');
    expect(metadata).toContain('number MTAw');
    expect(metadata.length).toBe(4);
    return upload;
  });
}
function validateUploadDeletion(upload) {
  return axios.get(upload.url, {
    validateStatus: status => status === 404
  }).then(res => {
    expect(res.status).toBe(404);
    return upload;
  });
}

},{"../..":4,"./helpers/utils":64,"axios":17}],68:[function(require,module,exports){
'use strict';

const {
  TestHttpStack,
  waitableFunction,
  wait,
  getBlob
} = require('./helpers/utils');
const tus = require('../..');
describe('tus', () => {
  describe('parallel uploading', () => {
    it('should throw if incompatible options are used', () => {
      const file = getBlob('hello world');
      const upload = new tus.Upload(file, {
        endpoint: 'https://tus.io/uploads',
        parallelUploads: 2,
        uploadUrl: 'foo'
      });
      expect(upload.start.bind(upload)).toThrowError('tus: cannot use the uploadUrl option when parallelUploads is enabled');
    });
    it('should throw if `parallelUploadBoundaries` is passed without `parallelUploads`', () => {
      const file = getBlob('hello world');
      const upload = new tus.Upload(file, {
        endpoint: 'https://tus.io/uploads',
        parallelUploadBoundaries: [{
          start: 0,
          end: 2
        }]
      });
      expect(upload.start.bind(upload)).toThrowError('tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled');
    });
    it('should throw if `parallelUploadBoundaries` is not the same length as the value of `parallelUploads`', () => {
      const file = getBlob('hello world');
      const upload = new tus.Upload(file, {
        endpoint: 'https://tus.io/uploads',
        parallelUploads: 3,
        parallelUploadBoundaries: [{
          start: 0,
          end: 2
        }]
      });
      expect(upload.start.bind(upload)).toThrowError('tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`');
    });
    it('should split a file into multiple parts and create an upload for each', async () => {
      const testStack = new TestHttpStack();
      const testUrlStorage = {
        addUpload: (fingerprint, upload) => {
          expect(fingerprint).toBe('fingerprinted');
          expect(upload.uploadUrl).toBeUndefined();
          expect(upload.size).toBe(11);
          expect(upload.parallelUploadUrls).toEqual(['https://tus.io/uploads/upload1', 'https://tus.io/uploads/upload2']);
          return Promise.resolve('tus::fingerprinted::1337');
        },
        removeUpload: urlStorageKey => {
          expect(urlStorageKey).toBe('tus::fingerprinted::1337');
          return Promise.resolve();
        }
      };
      spyOn(testUrlStorage, 'removeUpload').and.callThrough();
      spyOn(testUrlStorage, 'addUpload').and.callThrough();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        urlStorage: testUrlStorage,
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess: true,
        parallelUploads: 2,
        retryDelays: [10],
        endpoint: 'https://tus.io/uploads',
        headers: {
          Custom: 'blargh'
        },
        metadata: {
          foo: 'hello'
        },
        onProgress() {},
        onSuccess: waitableFunction(),
        fingerprint: () => Promise.resolve('fingerprinted')
      };
      spyOn(options, 'onProgress');
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders.Custom).toBe('blargh');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(5);
      expect(req.requestHeaders['Upload-Concat']).toBe('partial');
      expect(req.requestHeaders['Upload-Metadata']).toBeUndefined();
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload1'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders.Custom).toBe('blargh');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(6);
      expect(req.requestHeaders['Upload-Concat']).toBe('partial');
      expect(req.requestHeaders['Upload-Metadata']).toBeUndefined();
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload2'
        }
      });
      req = await testStack.nextRequest();

      // Assert that the URLs have been stored.
      expect(testUrlStorage.addUpload).toHaveBeenCalled();
      expect(req.url).toBe('https://tus.io/uploads/upload1');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders.Custom).toBe('blargh');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(0);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(5);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload2');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders.Custom).toBe('blargh');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(0);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(6);

      // Return an error to ensure that the individual partial upload is properly retried.
      req.respondWith({
        status: 500
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload2');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 11,
          'Upload-Offset': 0
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload2');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders.Custom).toBe('blargh');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(0);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(6);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 6
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders.Custom).toBe('blargh');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBeUndefined();
      expect(req.requestHeaders['Upload-Concat']).toBe('final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2');
      expect(req.requestHeaders['Upload-Metadata']).toBe('foo aGVsbG8=');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload3'
        }
      });
      await options.onSuccess.toBeCalled;
      expect(upload.url).toBe('https://tus.io/uploads/upload3');
      expect(options.onProgress).toHaveBeenCalledWith(5, 11);
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(testUrlStorage.removeUpload).toHaveBeenCalled();
    });
    it('should split a file into multiple parts based on custom `parallelUploadBoundaries`', async () => {
      const testStack = new TestHttpStack();
      const parallelUploadBoundaries = [{
        start: 0,
        end: 1
      }, {
        start: 1,
        end: 11
      }];
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        parallelUploads: 2,
        parallelUploadBoundaries,
        endpoint: 'https://tus.io/uploads',
        onSuccess: waitableFunction()
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(1);
      expect(req.requestHeaders['Upload-Concat']).toBe('partial');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload1'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(10);
      expect(req.requestHeaders['Upload-Concat']).toBe('partial');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload2'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload1');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(0);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(1);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 1
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload2');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(0);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(10);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 11,
          'Upload-Offset': 0
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload2');
      expect(req.method).toBe('PATCH');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Offset']).toBe(0);
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req.body.size).toBe(10);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 10
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBeUndefined();
      expect(req.requestHeaders['Upload-Concat']).toBe('final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload3'
        }
      });
      await options.onSuccess.toBeCalled;
      expect(upload.url).toBe('https://tus.io/uploads/upload3');
    });
    it('should emit error from a partial upload', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        parallelUploads: 2,
        retryDelays: null,
        endpoint: 'https://tus.io/uploads',
        onError: waitableFunction('onError')
      };
      const upload = new tus.Upload(file, options);
      upload.start();
      const req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(5);
      req.respondWith({
        status: 500
      });
      const err = await options.onError.toBeCalled;
      expect(err.message).toBe('tus: unexpected response while creating upload, originated from request (method: POST, url: https://tus.io/uploads, response code: 500, response text: , request id: n/a)');
      expect(err.originalRequest).toBe(req);
    });
    it('should resume the partial uploads', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        // The client should resume the parallel uploads, even if it is not
        // configured for new uploads.
        parallelUploads: 1,
        endpoint: 'https://tus.io/uploads',
        onProgress() {},
        onSuccess: waitableFunction()
      };
      spyOn(options, 'onProgress');
      const upload = new tus.Upload(file, options);
      upload.resumeFromPreviousUpload({
        urlStorageKey: 'tus::fingerprint::1337',
        parallelUploadUrls: ['https://tus.io/uploads/upload1', 'https://tus.io/uploads/upload2']
      });
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload1');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 5,
          'Upload-Offset': 2
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload2');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 6,
          'Upload-Offset': 0
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload1');
      expect(req.method).toBe('PATCH');
      expect(req.body.size).toBe(3);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload2');
      expect(req.method).toBe('PATCH');
      expect(req.body.size).toBe(6);
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 6
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Upload-Concat']).toBe('final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload3'
        }
      });
      await options.onSuccess.toBeCalled;
      expect(upload.url).toBe('https://tus.io/uploads/upload3');
      expect(options.onProgress).toHaveBeenCalledWith(5, 11);
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
    });
    it('should abort all partial uploads and resume from them', async () => {
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        parallelUploads: 2,
        endpoint: 'https://tus.io/uploads',
        onProgress() {},
        onSuccess: waitableFunction(),
        fingerprint: () => Promise.resolve('fingerprinted')
      };
      spyOn(options, 'onProgress');
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(5);
      expect(req.requestHeaders['Upload-Concat']).toBe('partial');
      expect(req.requestHeaders['Upload-Metadata']).toBeUndefined();
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload1'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBe(6);
      expect(req.requestHeaders['Upload-Concat']).toBe('partial');
      expect(req.requestHeaders['Upload-Metadata']).toBeUndefined();
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload2'
        }
      });
      const req1 = await testStack.nextRequest();
      expect(req1.url).toBe('https://tus.io/uploads/upload1');
      expect(req1.method).toBe('PATCH');
      expect(req1.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req1.requestHeaders['Upload-Offset']).toBe(0);
      expect(req1.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req1.body.size).toBe(5);
      const req2 = await testStack.nextRequest();
      expect(req2.url).toBe('https://tus.io/uploads/upload2');
      expect(req2.method).toBe('PATCH');
      expect(req2.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req2.requestHeaders['Upload-Offset']).toBe(0);
      expect(req2.requestHeaders['Content-Type']).toBe('application/offset+octet-stream');
      expect(req2.body.size).toBe(6);
      upload.abort();
      req1.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5
        }
      });
      req2.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 6
        }
      });

      // No further requests should be sent.
      const reqPromise = testStack.nextRequest();
      const result = await Promise.race([reqPromise, wait(100)]);
      expect(result).toBe('timed out');

      // Restart the upload
      upload.start();

      // Reuse the promise from before as it is not cancelled.
      req = await reqPromise;
      expect(req.url).toBe('https://tus.io/uploads/upload1');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 5,
          'Upload-Offset': 5
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads/upload2');
      expect(req.method).toBe('HEAD');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 6,
          'Upload-Offset': 6
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('https://tus.io/uploads');
      expect(req.method).toBe('POST');
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0');
      expect(req.requestHeaders['Upload-Length']).toBeUndefined();
      expect(req.requestHeaders['Upload-Concat']).toBe('final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/upload3'
        }
      });
      await options.onSuccess.toBeCalled;
      expect(upload.url).toBe('https://tus.io/uploads/upload3');
      expect(options.onProgress).toHaveBeenCalledWith(5, 11);
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
    });
  });
});

},{"../..":4,"./helpers/utils":64}],69:[function(require,module,exports){
'use strict';

const {
  TestHttpStack,
  getBlob
} = require('./helpers/utils');
const tus = require('../..');
describe('tus', () => {
  describe('terminate upload', () => {
    it('should terminate upload when abort is called with true', async () => {
      let abortPromise;
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        chunkSize: 5,
        onChunkComplete() {
          abortPromise = upload.abort(true);
        }
      };
      spyOn(options, 'onChunkComplete').and.callThrough();
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('DELETE');
      req.respondWith({
        status: 204
      });
      expect(options.onChunkComplete).toHaveBeenCalled();
      await abortPromise;
    });
    it('should retry terminate when an error is returned on first try', async () => {
      let abortPromise;
      const testStack = new TestHttpStack();
      const file = getBlob('hello world');
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        chunkSize: 5,
        retryDelays: [10, 10, 10],
        onChunkComplete() {
          abortPromise = upload.abort(true);
        }
      };
      spyOn(options, 'onChunkComplete').and.callThrough();
      const upload = new tus.Upload(file, options);
      upload.start();
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/');
      expect(req.method).toBe('POST');
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo'
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('PATCH');
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 5
        }
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('DELETE');
      req.respondWith({
        status: 423
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('DELETE');
      req.respondWith({
        status: 204
      });
      await abortPromise;
      expect(options.onChunkComplete).toHaveBeenCalled();
    });
    it('should stop retrying when all delays are used up', async () => {
      const testStack = new TestHttpStack();
      const options = {
        httpStack: testStack,
        retryDelays: [10, 10]
      };
      const terminatePromise = tus.Upload.terminate('http://tus.io/files/foo', options);
      let req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('DELETE');
      req.respondWith({
        status: 500
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('DELETE');
      req.respondWith({
        status: 500
      });
      req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/files/foo');
      expect(req.method).toBe('DELETE');
      req.respondWith({
        status: 500
      });
      await expectAsync(terminatePromise).toBeRejectedWithError(/tus: unexpected response while terminating upload/);
    });
    it('should invoke the request and response Promises', async () => {
      const testStack = new TestHttpStack();
      const options = {
        httpStack: testStack,
        onBeforeRequest(req) {
          return new Promise(resolve => {
            expect(req.getURL()).toBe('http://tus.io/uploads/foo');
            expect(req.getMethod()).toBe('DELETE');
            resolve();
          });
        },
        onAfterResponse(req, res) {
          return new Promise(resolve => {
            expect(req.getURL()).toBe('http://tus.io/uploads/foo');
            expect(req.getMethod()).toBe('DELETE');
            expect(res.getStatus()).toBe(204);
            resolve();
          });
        }
      };
      spyOn(options, 'onBeforeRequest');
      spyOn(options, 'onAfterResponse');
      const terminatePromise = tus.Upload.terminate('http://tus.io/uploads/foo', options);
      const req = await testStack.nextRequest();
      expect(req.url).toBe('http://tus.io/uploads/foo');
      expect(req.method).toBe('DELETE');
      req.respondWith({
        status: 204
      });
      await expectAsync(terminatePromise).toBeResolved();
      expect(options.onBeforeRequest).toHaveBeenCalled();
      expect(options.onAfterResponse).toHaveBeenCalled();
    });
  });
});

},{"../..":4,"./helpers/utils":64}]},{},[62])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIuZXM1L2Jyb3dzZXIvZmlsZVJlYWRlci5qcyIsImxpYi5lczUvYnJvd3Nlci9maWxlU2lnbmF0dXJlLmpzIiwibGliLmVzNS9icm93c2VyL2h0dHBTdGFjay5qcyIsImxpYi5lczUvYnJvd3Nlci9pbmRleC5qcyIsImxpYi5lczUvYnJvd3Nlci9pc1JlYWN0TmF0aXZlLmpzIiwibGliLmVzNS9icm93c2VyL3NvdXJjZXMvRmlsZVNvdXJjZS5qcyIsImxpYi5lczUvYnJvd3Nlci9zb3VyY2VzL1N0cmVhbVNvdXJjZS5qcyIsImxpYi5lczUvYnJvd3Nlci9zb3VyY2VzL2lzQ29yZG92YS5qcyIsImxpYi5lczUvYnJvd3Nlci9zb3VyY2VzL3JlYWRBc0J5dGVBcnJheS5qcyIsImxpYi5lczUvYnJvd3Nlci91cmlUb0Jsb2IuanMiLCJsaWIuZXM1L2Jyb3dzZXIvdXJsU3RvcmFnZS5qcyIsImxpYi5lczUvZXJyb3IuanMiLCJsaWIuZXM1L2xvZ2dlci5qcyIsImxpYi5lczUvbm9vcFVybFN0b3JhZ2UuanMiLCJsaWIuZXM1L3VwbG9hZC5qcyIsImxpYi5lczUvdXVpZC5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvYWRhcHRlcnMveGhyLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9heGlvcy5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvY2FuY2VsL0NhbmNlbFRva2VuLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jYW5jZWwvQ2FuY2VsZWRFcnJvci5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvY2FuY2VsL2lzQ2FuY2VsLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jb3JlL0F4aW9zLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jb3JlL0F4aW9zRXJyb3IuanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL2NvcmUvSW50ZXJjZXB0b3JNYW5hZ2VyLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jb3JlL2J1aWxkRnVsbFBhdGguanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL2NvcmUvZGlzcGF0Y2hSZXF1ZXN0LmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jb3JlL21lcmdlQ29uZmlnLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jb3JlL3NldHRsZS5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvY29yZS90cmFuc2Zvcm1EYXRhLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9kZWZhdWx0cy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvZGVmYXVsdHMvdHJhbnNpdGlvbmFsLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9lbnYvY2xhc3Nlcy9Gb3JtRGF0YS5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvZW52L2RhdGEuanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvQXhpb3NVUkxTZWFyY2hQYXJhbXMuanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvYmluZC5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9idWlsZFVSTC5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9jb21iaW5lVVJMcy5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9jb29raWVzLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL2Zvcm1EYXRhVG9KU09OLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL2lzQWJzb2x1dGVVUkwuanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvaXNBeGlvc0Vycm9yLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL2lzVVJMU2FtZU9yaWdpbi5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9ub3JtYWxpemVIZWFkZXJOYW1lLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL3BhcnNlSGVhZGVycy5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9wYXJzZVByb3RvY29sLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL3NwcmVhZC5qcyIsIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy90b0Zvcm1EYXRhLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL3RvVVJMRW5jb2RlZEZvcm0uanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvdmFsaWRhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9wbGF0Zm9ybS9icm93c2VyL2NsYXNzZXMvRm9ybURhdGEuanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL3BsYXRmb3JtL2Jyb3dzZXIvY2xhc3Nlcy9VUkxTZWFyY2hQYXJhbXMuanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL3BsYXRmb3JtL2Jyb3dzZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYXhpb3MvbGliL3BsYXRmb3JtL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2F4aW9zL2xpYi91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9iYXNlNjQtanMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Zvcm0tZGF0YS9saWIvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWdlbmVyYXRvci1ydW50aW1lL3J1bnRpbWUuanMiLCJ0ZXN0L3NwZWMvYnJvd3Nlci1pbmRleC5qcyIsInRlc3Qvc3BlYy9oZWxwZXJzL2Fzc2VydFVybFN0b3JhZ2UuanMiLCJ0ZXN0L3NwZWMvaGVscGVycy91dGlscy5qcyIsInRlc3Qvc3BlYy90ZXN0LWJyb3dzZXItc3BlY2lmaWMuanMiLCJ0ZXN0L3NwZWMvdGVzdC1jb21tb24uanMiLCJ0ZXN0L3NwZWMvdGVzdC1lbmQtdG8tZW5kLmpzIiwidGVzdC9zcGVjL3Rlc3QtcGFyYWxsZWwtdXBsb2Fkcy5qcyIsInRlc3Qvc3BlYy90ZXN0LXRlcm1pbmF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFlBQVk7O0FBRVosTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFO0VBQzNDLEtBQUssRUFBRTtBQUNULENBQUMsQ0FBQztBQUNGLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3hCLElBQUksY0FBYyxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQzFFLElBQUksVUFBVSxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ2xFLElBQUksV0FBVyxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQzVFLElBQUksYUFBYSxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQ2hGLFNBQVMsc0JBQXNCLENBQUMsR0FBRyxFQUFFO0VBQUUsT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHLEdBQUc7SUFBRSxPQUFPLEVBQUU7RUFBSSxDQUFDO0FBQUU7QUFDOUYsTUFBTSxVQUFVLENBQUM7RUFDZixNQUFNLFFBQVEsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO0lBQy9CO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsSUFBSSxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLENBQUMsR0FBRyxLQUFLLFdBQVcsRUFBRTtNQUM5RSxJQUFJO1FBQ0YsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRSxV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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p2REE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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Q0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztNQUVqQyxHQUFHLENBQUMsV0FBVyxDQUFDO1FBQ2QsTUFBTSxFQUFFO01BQ1YsQ0FBQyxDQUFDO01BRUYsTUFBTSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztNQUNsRCxNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7TUFDbEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3BELENBQUMsQ0FBQztFQUNKLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm9pZCAwO1xudmFyIF9pc1JlYWN0TmF0aXZlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9pc1JlYWN0TmF0aXZlLmpzXCIpKTtcbnZhciBfdXJpVG9CbG9iID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi91cmlUb0Jsb2IuanNcIikpO1xudmFyIF9GaWxlU291cmNlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9zb3VyY2VzL0ZpbGVTb3VyY2UuanNcIikpO1xudmFyIF9TdHJlYW1Tb3VyY2UgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3NvdXJjZXMvU3RyZWFtU291cmNlLmpzXCIpKTtcbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5jbGFzcyBGaWxlUmVhZGVyIHtcbiAgYXN5bmMgb3BlbkZpbGUoaW5wdXQsIGNodW5rU2l6ZSkge1xuICAgIC8vIEluIFJlYWN0IE5hdGl2ZSwgd2hlbiB1c2VyIHNlbGVjdHMgYSBmaWxlLCBpbnN0ZWFkIG9mIGEgRmlsZSBvciBCbG9iLFxuICAgIC8vIHlvdSB1c3VhbGx5IGdldCBhIGZpbGUgb2JqZWN0IHt9IHdpdGggYSB1cmkgcHJvcGVydHkgdGhhdCBjb250YWluc1xuICAgIC8vIGEgbG9jYWwgcGF0aCB0byB0aGUgZmlsZS4gV2UgdXNlIFhNTEh0dHBSZXF1ZXN0IHRvIGZldGNoXG4gICAgLy8gdGhlIGZpbGUgYmxvYiwgYmVmb3JlIHVwbG9hZGluZyB3aXRoIHR1cy5cbiAgICBpZiAoKDAsIF9pc1JlYWN0TmF0aXZlLmRlZmF1bHQpKCkgJiYgaW5wdXQgJiYgdHlwZW9mIGlucHV0LnVyaSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCAoMCwgX3VyaVRvQmxvYi5kZWZhdWx0KShpbnB1dC51cmkpO1xuICAgICAgICByZXR1cm4gbmV3IF9GaWxlU291cmNlLmRlZmF1bHQoYmxvYik7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB0dXM6IGNhbm5vdCBmZXRjaCBcXGBmaWxlLnVyaVxcYCBhcyBCbG9iLCBtYWtlIHN1cmUgdGhlIHVyaSBpcyBjb3JyZWN0IGFuZCBhY2Nlc3NpYmxlLiAke2Vycn1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTaW5jZSB3ZSBlbXVsYXRlIHRoZSBCbG9iIHR5cGUgaW4gb3VyIHRlc3RzIChub3QgYWxsIHRhcmdldCBicm93c2Vyc1xuICAgIC8vIHN1cHBvcnQgaXQpLCB3ZSBjYW5ub3QgdXNlIGBpbnN0YW5jZW9mYCBmb3IgdGVzdGluZyB3aGV0aGVyIHRoZSBpbnB1dCB2YWx1ZVxuICAgIC8vIGNhbiBiZSBoYW5kbGVkLiBJbnN0ZWFkLCB3ZSBzaW1wbHkgY2hlY2sgaXMgdGhlIHNsaWNlKCkgZnVuY3Rpb24gYW5kIHRoZVxuICAgIC8vIHNpemUgcHJvcGVydHkgYXJlIGF2YWlsYWJsZS5cbiAgICBpZiAodHlwZW9mIGlucHV0LnNsaWNlID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBpbnB1dC5zaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgX0ZpbGVTb3VyY2UuZGVmYXVsdChpbnB1dCkpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGlucHV0LnJlYWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNodW5rU2l6ZSA9IE51bWJlcihjaHVua1NpemUpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoY2h1bmtTaXplKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdjYW5ub3QgY3JlYXRlIHNvdXJjZSBmb3Igc3RyZWFtIHdpdGhvdXQgYSBmaW5pdGUgdmFsdWUgZm9yIHRoZSBgY2h1bmtTaXplYCBvcHRpb24nKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBfU3RyZWFtU291cmNlLmRlZmF1bHQoaW5wdXQsIGNodW5rU2l6ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdzb3VyY2Ugb2JqZWN0IG1heSBvbmx5IGJlIGFuIGluc3RhbmNlIG9mIEZpbGUsIEJsb2IsIG9yIFJlYWRlciBpbiB0aGlzIGVudmlyb25tZW50JykpO1xuICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBGaWxlUmVhZGVyOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZmluZ2VycHJpbnQ7XG52YXIgX2lzUmVhY3ROYXRpdmUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL2lzUmVhY3ROYXRpdmUuanNcIikpO1xuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cbi8vIFRPRE86IERpZmZlcmVuY2lhdGUgYmV0d2VlbiBpbnB1dCB0eXBlc1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgZmluZ2VycHJpbnQgZm9yIGEgZmlsZSB3aGljaCB3aWxsIGJlIHVzZWQgdGhlIHN0b3JlIHRoZSBlbmRwb2ludFxuICpcbiAqIEBwYXJhbSB7RmlsZX0gZmlsZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cbmZ1bmN0aW9uIGZpbmdlcnByaW50KGZpbGUsIG9wdGlvbnMpIHtcbiAgaWYgKCgwLCBfaXNSZWFjdE5hdGl2ZS5kZWZhdWx0KSgpKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWFjdE5hdGl2ZUZpbmdlcnByaW50KGZpbGUsIG9wdGlvbnMpKTtcbiAgfVxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFsndHVzLWJyJywgZmlsZS5uYW1lLCBmaWxlLnR5cGUsIGZpbGUuc2l6ZSwgZmlsZS5sYXN0TW9kaWZpZWQsIG9wdGlvbnMuZW5kcG9pbnRdLmpvaW4oJy0nKSk7XG59XG5mdW5jdGlvbiByZWFjdE5hdGl2ZUZpbmdlcnByaW50KGZpbGUsIG9wdGlvbnMpIHtcbiAgY29uc3QgZXhpZkhhc2ggPSBmaWxlLmV4aWYgPyBoYXNoQ29kZShKU09OLnN0cmluZ2lmeShmaWxlLmV4aWYpKSA6ICdub2V4aWYnO1xuICByZXR1cm4gWyd0dXMtcm4nLCBmaWxlLm5hbWUgfHwgJ25vbmFtZScsIGZpbGUuc2l6ZSB8fCAnbm9zaXplJywgZXhpZkhhc2gsIG9wdGlvbnMuZW5kcG9pbnRdLmpvaW4oJy8nKTtcbn1cbmZ1bmN0aW9uIGhhc2hDb2RlKHN0cikge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1iaXR3aXNlICovXG4gIC8vIGZyb20gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzg4MzE5MzcvMTUxNjY2XG4gIGxldCBoYXNoID0gMDtcbiAgaWYgKHN0ci5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gaGFzaDtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoYXIgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICBoYXNoID0gKGhhc2ggPDwgNSkgLSBoYXNoICsgY2hhcjtcbiAgICBoYXNoICY9IGhhc2g7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuICB9XG4gIHJldHVybiBoYXNoO1xufSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm9pZCAwO1xuLyogZXNsaW50LWRpc2FibGUgbWF4LWNsYXNzZXMtcGVyLWZpbGUgKi9cbmNsYXNzIFhIUkh0dHBTdGFjayB7XG4gIGNyZWF0ZVJlcXVlc3QobWV0aG9kLCB1cmwpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3QobWV0aG9kLCB1cmwpO1xuICB9XG4gIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuICdYSFJIdHRwU3RhY2snO1xuICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBYSFJIdHRwU3RhY2s7XG5jbGFzcyBSZXF1ZXN0IHtcbiAgY29uc3RydWN0b3IobWV0aG9kLCB1cmwpIHtcbiAgICB0aGlzLl94aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB0aGlzLl94aHIub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gICAgdGhpcy5fbWV0aG9kID0gbWV0aG9kO1xuICAgIHRoaXMuX3VybCA9IHVybDtcbiAgICB0aGlzLl9oZWFkZXJzID0ge307XG4gIH1cbiAgZ2V0TWV0aG9kKCkge1xuICAgIHJldHVybiB0aGlzLl9tZXRob2Q7XG4gIH1cbiAgZ2V0VVJMKCkge1xuICAgIHJldHVybiB0aGlzLl91cmw7XG4gIH1cbiAgc2V0SGVhZGVyKGhlYWRlciwgdmFsdWUpIHtcbiAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKTtcbiAgICB0aGlzLl9oZWFkZXJzW2hlYWRlcl0gPSB2YWx1ZTtcbiAgfVxuICBnZXRIZWFkZXIoaGVhZGVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hlYWRlcnNbaGVhZGVyXTtcbiAgfVxuICBzZXRQcm9ncmVzc0hhbmRsZXIocHJvZ3Jlc3NIYW5kbGVyKSB7XG4gICAgLy8gVGVzdCBzdXBwb3J0IGZvciBwcm9ncmVzcyBldmVudHMgYmVmb3JlIGF0dGFjaGluZyBhbiBldmVudCBsaXN0ZW5lclxuICAgIGlmICghKCd1cGxvYWQnIGluIHRoaXMuX3hocikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5feGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZSA9PiB7XG4gICAgICBpZiAoIWUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwcm9ncmVzc0hhbmRsZXIoZS5sb2FkZWQpO1xuICAgIH07XG4gIH1cbiAgc2VuZCgpIHtcbiAgICBsZXQgYm9keSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogbnVsbDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5feGhyLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UodGhpcy5feGhyKSk7XG4gICAgICB9O1xuICAgICAgdGhpcy5feGhyLm9uZXJyb3IgPSBlcnIgPT4ge1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH07XG4gICAgICB0aGlzLl94aHIuc2VuZChib2R5KTtcbiAgICB9KTtcbiAgfVxuICBhYm9ydCgpIHtcbiAgICB0aGlzLl94aHIuYWJvcnQoKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbiAgZ2V0VW5kZXJseWluZ09iamVjdCgpIHtcbiAgICByZXR1cm4gdGhpcy5feGhyO1xuICB9XG59XG5jbGFzcyBSZXNwb25zZSB7XG4gIGNvbnN0cnVjdG9yKHhocikge1xuICAgIHRoaXMuX3hociA9IHhocjtcbiAgfVxuICBnZXRTdGF0dXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3hoci5zdGF0dXM7XG4gIH1cbiAgZ2V0SGVhZGVyKGhlYWRlcikge1xuICAgIHJldHVybiB0aGlzLl94aHIuZ2V0UmVzcG9uc2VIZWFkZXIoaGVhZGVyKTtcbiAgfVxuICBnZXRCb2R5KCkge1xuICAgIHJldHVybiB0aGlzLl94aHIucmVzcG9uc2VUZXh0O1xuICB9XG4gIGdldFVuZGVybHlpbmdPYmplY3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3hocjtcbiAgfVxufSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiRGVmYXVsdEh0dHBTdGFja1wiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfaHR0cFN0YWNrLmRlZmF1bHQ7XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiRGV0YWlsZWRFcnJvclwiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZXJyb3IuZGVmYXVsdDtcbiAgfVxufSk7XG5leHBvcnRzLlVwbG9hZCA9IHZvaWQgMDtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcImNhblN0b3JlVVJMc1wiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfdXJsU3RvcmFnZS5jYW5TdG9yZVVSTHM7XG4gIH1cbn0pO1xuZXhwb3J0cy5kZWZhdWx0T3B0aW9ucyA9IHZvaWQgMDtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcImVuYWJsZURlYnVnTG9nXCIsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9sb2dnZXIuZW5hYmxlRGVidWdMb2c7XG4gIH1cbn0pO1xuZXhwb3J0cy5pc1N1cHBvcnRlZCA9IHZvaWQgMDtcbnZhciBfdXBsb2FkID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi4vdXBsb2FkLmpzXCIpKTtcbnZhciBfbm9vcFVybFN0b3JhZ2UgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuLi9ub29wVXJsU3RvcmFnZS5qc1wiKSk7XG52YXIgX2xvZ2dlciA9IHJlcXVpcmUoXCIuLi9sb2dnZXIuanNcIik7XG52YXIgX2Vycm9yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi4vZXJyb3IuanNcIikpO1xudmFyIF91cmxTdG9yYWdlID0gcmVxdWlyZShcIi4vdXJsU3RvcmFnZS5qc1wiKTtcbnZhciBfaHR0cFN0YWNrID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9odHRwU3RhY2suanNcIikpO1xudmFyIF9maWxlUmVhZGVyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9maWxlUmVhZGVyLmpzXCIpKTtcbnZhciBfZmlsZVNpZ25hdHVyZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vZmlsZVNpZ25hdHVyZS5qc1wiKSk7XG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSBleHBvcnRzLmRlZmF1bHRPcHRpb25zID0ge1xuICAuLi5fdXBsb2FkLmRlZmF1bHQuZGVmYXVsdE9wdGlvbnMsXG4gIGh0dHBTdGFjazogbmV3IF9odHRwU3RhY2suZGVmYXVsdCgpLFxuICBmaWxlUmVhZGVyOiBuZXcgX2ZpbGVSZWFkZXIuZGVmYXVsdCgpLFxuICB1cmxTdG9yYWdlOiBfdXJsU3RvcmFnZS5jYW5TdG9yZVVSTHMgPyBuZXcgX3VybFN0b3JhZ2UuV2ViU3RvcmFnZVVybFN0b3JhZ2UoKSA6IG5ldyBfbm9vcFVybFN0b3JhZ2UuZGVmYXVsdCgpLFxuICBmaW5nZXJwcmludDogX2ZpbGVTaWduYXR1cmUuZGVmYXVsdFxufTtcbmNsYXNzIFVwbG9hZCBleHRlbmRzIF91cGxvYWQuZGVmYXVsdCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGxldCBmaWxlID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBudWxsO1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBvcHRpb25zID0ge1xuICAgICAgLi4uZGVmYXVsdE9wdGlvbnMsXG4gICAgICAuLi5vcHRpb25zXG4gICAgfTtcbiAgICBzdXBlcihmaWxlLCBvcHRpb25zKTtcbiAgfVxuICBzdGF0aWMgdGVybWluYXRlKHVybCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBvcHRpb25zID0ge1xuICAgICAgLi4uZGVmYXVsdE9wdGlvbnMsXG4gICAgICAuLi5vcHRpb25zXG4gICAgfTtcbiAgICByZXR1cm4gX3VwbG9hZC5kZWZhdWx0LnRlcm1pbmF0ZSh1cmwsIG9wdGlvbnMpO1xuICB9XG59XG5cbi8vIE5vdGU6IFdlIGRvbid0IHJlZmVyZW5jZSBgd2luZG93YCBoZXJlIGJlY2F1c2UgdGhlc2UgY2xhc3NlcyBhbHNvIGV4aXN0IGluIGEgV2ViIFdvcmtlcidzIGNvbnRleHQuXG5leHBvcnRzLlVwbG9hZCA9IFVwbG9hZDtcbmNvbnN0IGlzU3VwcG9ydGVkID0gZXhwb3J0cy5pc1N1cHBvcnRlZCA9IHR5cGVvZiBYTUxIdHRwUmVxdWVzdCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgQmxvYiA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgQmxvYi5wcm90b3R5cGUuc2xpY2UgPT09ICdmdW5jdGlvbic7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5jb25zdCBpc1JlYWN0TmF0aXZlID0gKCkgPT4gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG5hdmlnYXRvci5wcm9kdWN0ID09PSAnc3RyaW5nJyAmJiBuYXZpZ2F0b3IucHJvZHVjdC50b0xvd2VyQ2FzZSgpID09PSAncmVhY3RuYXRpdmUnO1xudmFyIF9kZWZhdWx0ID0gZXhwb3J0cy5kZWZhdWx0ID0gaXNSZWFjdE5hdGl2ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZvaWQgMDtcbnZhciBfaXNDb3Jkb3ZhID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9pc0NvcmRvdmEuanNcIikpO1xudmFyIF9yZWFkQXNCeXRlQXJyYXkgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3JlYWRBc0J5dGVBcnJheS5qc1wiKSk7XG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuY2xhc3MgRmlsZVNvdXJjZSB7XG4gIC8vIE1ha2UgdGhpcy5zaXplIGEgbWV0aG9kXG4gIGNvbnN0cnVjdG9yKGZpbGUpIHtcbiAgICB0aGlzLl9maWxlID0gZmlsZTtcbiAgICB0aGlzLnNpemUgPSBmaWxlLnNpemU7XG4gIH1cbiAgc2xpY2Uoc3RhcnQsIGVuZCkge1xuICAgIC8vIEluIEFwYWNoZSBDb3Jkb3ZhIGFwcGxpY2F0aW9ucywgYSBGaWxlIG11c3QgYmUgcmVzb2x2ZWQgdXNpbmdcbiAgICAvLyBGaWxlUmVhZGVyIGluc3RhbmNlcywgc2VlXG4gICAgLy8gaHR0cHM6Ly9jb3Jkb3ZhLmFwYWNoZS5vcmcvZG9jcy9lbi84LngvcmVmZXJlbmNlL2NvcmRvdmEtcGx1Z2luLWZpbGUvaW5kZXguaHRtbCNyZWFkLWEtZmlsZVxuICAgIGlmICgoMCwgX2lzQ29yZG92YS5kZWZhdWx0KSgpKSB7XG4gICAgICByZXR1cm4gKDAsIF9yZWFkQXNCeXRlQXJyYXkuZGVmYXVsdCkodGhpcy5fZmlsZS5zbGljZShzdGFydCwgZW5kKSk7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5fZmlsZS5zbGljZShzdGFydCwgZW5kKTtcbiAgICBjb25zdCBkb25lID0gZW5kID49IHRoaXMuc2l6ZTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIHZhbHVlLFxuICAgICAgZG9uZVxuICAgIH0pO1xuICB9XG4gIGNsb3NlKCkge1xuICAgIC8vIE5vdGhpbmcgdG8gZG8gaGVyZSBzaW5jZSB3ZSBkb24ndCBuZWVkIHRvIHJlbGVhc2UgYW55IHJlc291cmNlcy5cbiAgfVxufVxuZXhwb3J0cy5kZWZhdWx0ID0gRmlsZVNvdXJjZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZvaWQgMDtcbmZ1bmN0aW9uIGxlbihibG9iT3JBcnJheSkge1xuICBpZiAoYmxvYk9yQXJyYXkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDA7XG4gIGlmIChibG9iT3JBcnJheS5zaXplICE9PSB1bmRlZmluZWQpIHJldHVybiBibG9iT3JBcnJheS5zaXplO1xuICByZXR1cm4gYmxvYk9yQXJyYXkubGVuZ3RoO1xufVxuXG4vKlxuICBUeXBlZCBhcnJheXMgYW5kIGJsb2JzIGRvbid0IGhhdmUgYSBjb25jYXQgbWV0aG9kLlxuICBUaGlzIGZ1bmN0aW9uIGhlbHBzIFN0cmVhbVNvdXJjZSBhY2N1bXVsYXRlIGRhdGEgdG8gcmVhY2ggY2h1bmtTaXplLlxuKi9cbmZ1bmN0aW9uIGNvbmNhdChhLCBiKSB7XG4gIGlmIChhLmNvbmNhdCkge1xuICAgIC8vIElzIGBhYCBhbiBBcnJheT9cbiAgICByZXR1cm4gYS5jb25jYXQoYik7XG4gIH1cbiAgaWYgKGEgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgcmV0dXJuIG5ldyBCbG9iKFthLCBiXSwge1xuICAgICAgdHlwZTogYS50eXBlXG4gICAgfSk7XG4gIH1cbiAgaWYgKGEuc2V0KSB7XG4gICAgLy8gSXMgYGFgIGEgdHlwZWQgYXJyYXk/XG4gICAgY29uc3QgYyA9IG5ldyBhLmNvbnN0cnVjdG9yKGEubGVuZ3RoICsgYi5sZW5ndGgpO1xuICAgIGMuc2V0KGEpO1xuICAgIGMuc2V0KGIsIGEubGVuZ3RoKTtcbiAgICByZXR1cm4gYztcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZGF0YSB0eXBlJyk7XG59XG5jbGFzcyBTdHJlYW1Tb3VyY2Uge1xuICBjb25zdHJ1Y3RvcihyZWFkZXIpIHtcbiAgICB0aGlzLl9idWZmZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fYnVmZmVyT2Zmc2V0ID0gMDtcbiAgICB0aGlzLl9yZWFkZXIgPSByZWFkZXI7XG4gICAgdGhpcy5fZG9uZSA9IGZhbHNlO1xuICB9XG4gIHNsaWNlKHN0YXJ0LCBlbmQpIHtcbiAgICBpZiAoc3RhcnQgPCB0aGlzLl9idWZmZXJPZmZzZXQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJSZXF1ZXN0ZWQgZGF0YSBpcyBiZWZvcmUgdGhlIHJlYWRlcidzIGN1cnJlbnQgb2Zmc2V0XCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3JlYWRVbnRpbEVub3VnaERhdGFPckRvbmUoc3RhcnQsIGVuZCk7XG4gIH1cbiAgX3JlYWRVbnRpbEVub3VnaERhdGFPckRvbmUoc3RhcnQsIGVuZCkge1xuICAgIGNvbnN0IGhhc0Vub3VnaERhdGEgPSBlbmQgPD0gdGhpcy5fYnVmZmVyT2Zmc2V0ICsgbGVuKHRoaXMuX2J1ZmZlcik7XG4gICAgaWYgKHRoaXMuX2RvbmUgfHwgaGFzRW5vdWdoRGF0YSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLl9nZXREYXRhRnJvbUJ1ZmZlcihzdGFydCwgZW5kKTtcbiAgICAgIGNvbnN0IGRvbmUgPSB2YWx1ZSA9PSBudWxsID8gdGhpcy5fZG9uZSA6IGZhbHNlO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHZhbHVlLFxuICAgICAgICBkb25lXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3JlYWRlci5yZWFkKCkudGhlbihfcmVmID0+IHtcbiAgICAgIGxldCB7XG4gICAgICAgIHZhbHVlLFxuICAgICAgICBkb25lXG4gICAgICB9ID0gX3JlZjtcbiAgICAgIGlmIChkb25lKSB7XG4gICAgICAgIHRoaXMuX2RvbmUgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9idWZmZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9idWZmZXIgPSB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IGNvbmNhdCh0aGlzLl9idWZmZXIsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9yZWFkVW50aWxFbm91Z2hEYXRhT3JEb25lKHN0YXJ0LCBlbmQpO1xuICAgIH0pO1xuICB9XG4gIF9nZXREYXRhRnJvbUJ1ZmZlcihzdGFydCwgZW5kKSB7XG4gICAgLy8gUmVtb3ZlIGRhdGEgZnJvbSBidWZmZXIgYmVmb3JlIGBzdGFydGAuXG4gICAgLy8gRGF0YSBtaWdodCBiZSByZXJlYWQgZnJvbSB0aGUgYnVmZmVyIGlmIGFuIHVwbG9hZCBmYWlscywgc28gd2UgY2FuIG9ubHlcbiAgICAvLyBzYWZlbHkgZGVsZXRlIGRhdGEgd2hlbiBpdCBjb21lcyAqYmVmb3JlKiB3aGF0IGlzIGN1cnJlbnRseSBiZWluZyByZWFkLlxuICAgIGlmIChzdGFydCA+IHRoaXMuX2J1ZmZlck9mZnNldCkge1xuICAgICAgdGhpcy5fYnVmZmVyID0gdGhpcy5fYnVmZmVyLnNsaWNlKHN0YXJ0IC0gdGhpcy5fYnVmZmVyT2Zmc2V0KTtcbiAgICAgIHRoaXMuX2J1ZmZlck9mZnNldCA9IHN0YXJ0O1xuICAgIH1cbiAgICAvLyBJZiB0aGUgYnVmZmVyIGlzIGVtcHR5IGFmdGVyIHJlbW92aW5nIG9sZCBkYXRhLCBhbGwgZGF0YSBoYXMgYmVlbiByZWFkLlxuICAgIGNvbnN0IGhhc0FsbERhdGFCZWVuUmVhZCA9IGxlbih0aGlzLl9idWZmZXIpID09PSAwO1xuICAgIGlmICh0aGlzLl9kb25lICYmIGhhc0FsbERhdGFCZWVuUmVhZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIFdlIGFscmVhZHkgcmVtb3ZlZCBkYXRhIGJlZm9yZSBgc3RhcnRgLCBzbyB3ZSBqdXN0IHJldHVybiB0aGUgZmlyc3RcbiAgICAvLyBjaHVuayBmcm9tIHRoZSBidWZmZXIuXG4gICAgcmV0dXJuIHRoaXMuX2J1ZmZlci5zbGljZSgwLCBlbmQgLSBzdGFydCk7XG4gIH1cbiAgY2xvc2UoKSB7XG4gICAgaWYgKHRoaXMuX3JlYWRlci5jYW5jZWwpIHtcbiAgICAgIHRoaXMuX3JlYWRlci5jYW5jZWwoKTtcbiAgICB9XG4gIH1cbn1cbmV4cG9ydHMuZGVmYXVsdCA9IFN0cmVhbVNvdXJjZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZvaWQgMDtcbmNvbnN0IGlzQ29yZG92YSA9ICgpID0+IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmICh0eXBlb2Ygd2luZG93LlBob25lR2FwICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2Ygd2luZG93LkNvcmRvdmEgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiB3aW5kb3cuY29yZG92YSAhPT0gJ3VuZGVmaW5lZCcpO1xudmFyIF9kZWZhdWx0ID0gZXhwb3J0cy5kZWZhdWx0ID0gaXNDb3Jkb3ZhOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gcmVhZEFzQnl0ZUFycmF5O1xuLyoqXG4gKiByZWFkQXNCeXRlQXJyYXkgY29udmVydHMgYSBGaWxlIG9iamVjdCB0byBhIFVpbnQ4QXJyYXkuXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCBvbiB0aGUgQXBhY2hlIENvcmRvdmEgcGxhdGZvcm0uXG4gKiBTZWUgaHR0cHM6Ly9jb3Jkb3ZhLmFwYWNoZS5vcmcvZG9jcy9lbi9sYXRlc3QvcmVmZXJlbmNlL2NvcmRvdmEtcGx1Z2luLWZpbGUvaW5kZXguaHRtbCNyZWFkLWEtZmlsZVxuICovXG5mdW5jdGlvbiByZWFkQXNCeXRlQXJyYXkoY2h1bmspIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIHJlYWRlci5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG5ldyBVaW50OEFycmF5KHJlYWRlci5yZXN1bHQpO1xuICAgICAgcmVzb2x2ZSh7XG4gICAgICAgIHZhbHVlXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJlYWRlci5vbmVycm9yID0gZXJyID0+IHtcbiAgICAgIHJlamVjdChlcnIpO1xuICAgIH07XG4gICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGNodW5rKTtcbiAgfSk7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB1cmlUb0Jsb2I7XG4vKipcbiAqIHVyaVRvQmxvYiByZXNvbHZlcyBhIFVSSSB0byBhIEJsb2Igb2JqZWN0LiBUaGlzIGlzIHVzZWQgZm9yXG4gKiBSZWFjdCBOYXRpdmUgdG8gcmV0cmlldmUgYSBmaWxlIChpZGVudGlmaWVkIGJ5IGEgZmlsZTovL1xuICogVVJJKSBhcyBhIGJsb2IuXG4gKi9cbmZ1bmN0aW9uIHVyaVRvQmxvYih1cmkpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InO1xuICAgIHhoci5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBibG9iID0geGhyLnJlc3BvbnNlO1xuICAgICAgcmVzb2x2ZShibG9iKTtcbiAgICB9O1xuICAgIHhoci5vbmVycm9yID0gZXJyID0+IHtcbiAgICAgIHJlamVjdChlcnIpO1xuICAgIH07XG4gICAgeGhyLm9wZW4oJ0dFVCcsIHVyaSk7XG4gICAgeGhyLnNlbmQoKTtcbiAgfSk7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmNhblN0b3JlVVJMcyA9IGV4cG9ydHMuV2ViU3RvcmFnZVVybFN0b3JhZ2UgPSB2b2lkIDA7XG5sZXQgaGFzU3RvcmFnZSA9IGZhbHNlO1xudHJ5IHtcbiAgLy8gTm90ZTogbG9jYWxTdG9yYWdlIGRvZXMgbm90IGV4aXN0IGluIHRoZSBXZWIgV29ya2VyJ3MgY29udGV4dCwgc28gd2UgbXVzdCB1c2Ugd2luZG93IGhlcmUuXG4gIGhhc1N0b3JhZ2UgPSAnbG9jYWxTdG9yYWdlJyBpbiB3aW5kb3c7XG5cbiAgLy8gQXR0ZW1wdCB0byBzdG9yZSBhbmQgcmVhZCBlbnRyaWVzIGZyb20gdGhlIGxvY2FsIHN0b3JhZ2UgdG8gZGV0ZWN0IFByaXZhdGVcbiAgLy8gTW9kZSBvbiBTYWZhcmkgb24gaU9TIChzZWUgIzQ5KVxuICAvLyBJZiB0aGUga2V5IHdhcyBub3QgdXNlZCBiZWZvcmUsIHdlIHJlbW92ZSBpdCBmcm9tIGxvY2FsIHN0b3JhZ2UgYWdhaW4gdG9cbiAgLy8gbm90IGNhdXNlIGNvbmZ1c2lvbiB3aGVyZSB0aGUgZW50cnkgY2FtZSBmcm9tLlxuICBjb25zdCBrZXkgPSAndHVzU3VwcG9ydCc7XG4gIGNvbnN0IG9yaWdpbmFsVmFsdWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIG9yaWdpbmFsVmFsdWUpO1xuICBpZiAob3JpZ2luYWxWYWx1ZSA9PT0gbnVsbCkgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcbn0gY2F0Y2ggKGUpIHtcbiAgLy8gSWYgd2UgdHJ5IHRvIGFjY2VzcyBsb2NhbFN0b3JhZ2UgaW5zaWRlIGEgc2FuZGJveGVkIGlmcmFtZSwgYSBTZWN1cml0eUVycm9yXG4gIC8vIGlzIHRocm93bi4gV2hlbiBpbiBwcml2YXRlIG1vZGUgb24gaU9TIFNhZmFyaSwgYSBRdW90YUV4Y2VlZGVkRXJyb3IgaXNcbiAgLy8gdGhyb3duIChzZWUgIzQ5KVxuICBpZiAoZS5jb2RlID09PSBlLlNFQ1VSSVRZX0VSUiB8fCBlLmNvZGUgPT09IGUuUVVPVEFfRVhDRUVERURfRVJSKSB7XG4gICAgaGFzU3RvcmFnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRocm93IGU7XG4gIH1cbn1cbmNvbnN0IGNhblN0b3JlVVJMcyA9IGV4cG9ydHMuY2FuU3RvcmVVUkxzID0gaGFzU3RvcmFnZTtcbmNsYXNzIFdlYlN0b3JhZ2VVcmxTdG9yYWdlIHtcbiAgZmluZEFsbFVwbG9hZHMoKSB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMuX2ZpbmRFbnRyaWVzKCd0dXM6OicpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0cyk7XG4gIH1cbiAgZmluZFVwbG9hZHNCeUZpbmdlcnByaW50KGZpbmdlcnByaW50KSB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMuX2ZpbmRFbnRyaWVzKGB0dXM6OiR7ZmluZ2VycHJpbnR9OjpgKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdHMpO1xuICB9XG4gIHJlbW92ZVVwbG9hZCh1cmxTdG9yYWdlS2V5KSB7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odXJsU3RvcmFnZUtleSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG4gIGFkZFVwbG9hZChmaW5nZXJwcmludCwgdXBsb2FkKSB7XG4gICAgY29uc3QgaWQgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxZTEyKTtcbiAgICBjb25zdCBrZXkgPSBgdHVzOjoke2ZpbmdlcnByaW50fTo6JHtpZH1gO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkodXBsb2FkKSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShrZXkpO1xuICB9XG4gIF9maW5kRW50cmllcyhwcmVmaXgpIHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSk7XG4gICAgICBpZiAoa2V5LmluZGV4T2YocHJlZml4KSAhPT0gMCkgY29udGludWU7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB1cGxvYWQgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICAgICAgICB1cGxvYWQudXJsU3RvcmFnZUtleSA9IGtleTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHVwbG9hZCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFRoZSBKU09OIHBhcnNlIGVycm9yIGlzIGludGVudGlvbmFsbHkgaWdub3JlZCBoZXJlLCBzbyBhIG1hbGZvcm1lZFxuICAgICAgICAvLyBlbnRyeSBpbiB0aGUgc3RvcmFnZSBjYW5ub3QgcHJldmVudCBhbiB1cGxvYWQuXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5leHBvcnRzLldlYlN0b3JhZ2VVcmxTdG9yYWdlID0gV2ViU3RvcmFnZVVybFN0b3JhZ2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5jbGFzcyBEZXRhaWxlZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XG4gICAgbGV0IGNhdXNpbmdFcnIgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XG4gICAgbGV0IHJlcSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogbnVsbDtcbiAgICBsZXQgcmVzID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiBudWxsO1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMub3JpZ2luYWxSZXF1ZXN0ID0gcmVxO1xuICAgIHRoaXMub3JpZ2luYWxSZXNwb25zZSA9IHJlcztcbiAgICB0aGlzLmNhdXNpbmdFcnJvciA9IGNhdXNpbmdFcnI7XG4gICAgaWYgKGNhdXNpbmdFcnIgIT0gbnVsbCkge1xuICAgICAgbWVzc2FnZSArPSBgLCBjYXVzZWQgYnkgJHtjYXVzaW5nRXJyLnRvU3RyaW5nKCl9YDtcbiAgICB9XG4gICAgaWYgKHJlcSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByZXF1ZXN0SWQgPSByZXEuZ2V0SGVhZGVyKCdYLVJlcXVlc3QtSUQnKSB8fCAnbi9hJztcbiAgICAgIGNvbnN0IG1ldGhvZCA9IHJlcS5nZXRNZXRob2QoKTtcbiAgICAgIGNvbnN0IHVybCA9IHJlcS5nZXRVUkwoKTtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHJlcyA/IHJlcy5nZXRTdGF0dXMoKSA6ICduL2EnO1xuICAgICAgY29uc3QgYm9keSA9IHJlcyA/IHJlcy5nZXRCb2R5KCkgfHwgJycgOiAnbi9hJztcbiAgICAgIG1lc3NhZ2UgKz0gYCwgb3JpZ2luYXRlZCBmcm9tIHJlcXVlc3QgKG1ldGhvZDogJHttZXRob2R9LCB1cmw6ICR7dXJsfSwgcmVzcG9uc2UgY29kZTogJHtzdGF0dXN9LCByZXNwb25zZSB0ZXh0OiAke2JvZHl9LCByZXF1ZXN0IGlkOiAke3JlcXVlc3RJZH0pYDtcbiAgICB9XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgfVxufVxudmFyIF9kZWZhdWx0ID0gZXhwb3J0cy5kZWZhdWx0ID0gRGV0YWlsZWRFcnJvcjsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZW5hYmxlRGVidWdMb2cgPSBlbmFibGVEZWJ1Z0xvZztcbmV4cG9ydHMubG9nID0gbG9nO1xuLyogZXNsaW50IG5vLWNvbnNvbGU6IFwib2ZmXCIgKi9cblxubGV0IGlzRW5hYmxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gZW5hYmxlRGVidWdMb2coKSB7XG4gIGlzRW5hYmxlZCA9IHRydWU7XG59XG5mdW5jdGlvbiBsb2cobXNnKSB7XG4gIGlmICghaXNFbmFibGVkKSByZXR1cm47XG4gIGNvbnNvbGUubG9nKG1zZyk7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG4vKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IFwib2ZmXCIgKi9cblxuY2xhc3MgTm9vcFVybFN0b3JhZ2Uge1xuICBsaXN0QWxsVXBsb2FkcygpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgfVxuICBmaW5kVXBsb2Fkc0J5RmluZ2VycHJpbnQoZmluZ2VycHJpbnQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgfVxuICByZW1vdmVVcGxvYWQodXJsU3RvcmFnZUtleSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuICBhZGRVcGxvYWQoZmluZ2VycHJpbnQsIHVwbG9hZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cbn1cbmV4cG9ydHMuZGVmYXVsdCA9IE5vb3BVcmxTdG9yYWdlOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm9pZCAwO1xudmFyIF9lcnJvciA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vZXJyb3IuanNcIikpO1xudmFyIF9sb2dnZXIgPSByZXF1aXJlKFwiLi9sb2dnZXIuanNcIik7XG52YXIgX3V1aWQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3V1aWQuanNcIikpO1xuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cbmNvbnN0IFBST1RPQ09MX1RVU19WMSA9ICd0dXMtdjEnO1xuY29uc3QgUFJPVE9DT0xfSUVURl9EUkFGVF8wMyA9ICdpZXRmLWRyYWZ0LTAzJztcbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICBlbmRwb2ludDogbnVsbCxcbiAgdXBsb2FkVXJsOiBudWxsLFxuICBtZXRhZGF0YToge30sXG4gIGZpbmdlcnByaW50OiBudWxsLFxuICB1cGxvYWRTaXplOiBudWxsLFxuICBvblByb2dyZXNzOiBudWxsLFxuICBvbkNodW5rQ29tcGxldGU6IG51bGwsXG4gIG9uU3VjY2VzczogbnVsbCxcbiAgb25FcnJvcjogbnVsbCxcbiAgb25VcGxvYWRVcmxBdmFpbGFibGU6IG51bGwsXG4gIG92ZXJyaWRlUGF0Y2hNZXRob2Q6IGZhbHNlLFxuICBoZWFkZXJzOiB7fSxcbiAgYWRkUmVxdWVzdElkOiBmYWxzZSxcbiAgb25CZWZvcmVSZXF1ZXN0OiBudWxsLFxuICBvbkFmdGVyUmVzcG9uc2U6IG51bGwsXG4gIG9uU2hvdWxkUmV0cnk6IGRlZmF1bHRPblNob3VsZFJldHJ5LFxuICBjaHVua1NpemU6IEluZmluaXR5LFxuICByZXRyeURlbGF5czogWzAsIDEwMDAsIDMwMDAsIDUwMDBdLFxuICBwYXJhbGxlbFVwbG9hZHM6IDEsXG4gIHBhcmFsbGVsVXBsb2FkQm91bmRhcmllczogbnVsbCxcbiAgc3RvcmVGaW5nZXJwcmludEZvclJlc3VtaW5nOiB0cnVlLFxuICByZW1vdmVGaW5nZXJwcmludE9uU3VjY2VzczogZmFsc2UsXG4gIHVwbG9hZExlbmd0aERlZmVycmVkOiBmYWxzZSxcbiAgdXBsb2FkRGF0YUR1cmluZ0NyZWF0aW9uOiBmYWxzZSxcbiAgdXJsU3RvcmFnZTogbnVsbCxcbiAgZmlsZVJlYWRlcjogbnVsbCxcbiAgaHR0cFN0YWNrOiBudWxsLFxuICBwcm90b2NvbDogUFJPVE9DT0xfVFVTX1YxXG59O1xuY2xhc3MgQmFzZVVwbG9hZCB7XG4gIGNvbnN0cnVjdG9yKGZpbGUsIG9wdGlvbnMpIHtcbiAgICAvLyBXYXJuIGFib3V0IHJlbW92ZWQgb3B0aW9ucyBmcm9tIHByZXZpb3VzIHZlcnNpb25zXG4gICAgaWYgKCdyZXN1bWUnIGluIG9wdGlvbnMpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmxvZygndHVzOiBUaGUgYHJlc3VtZWAgb3B0aW9uIGhhcyBiZWVuIHJlbW92ZWQgaW4gdHVzLWpzLWNsaWVudCB2Mi4gUGxlYXNlIHVzZSB0aGUgVVJMIHN0b3JhZ2UgQVBJIGluc3RlYWQuJyk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGRlZmF1bHQgb3B0aW9ucyB3aWxsIGFscmVhZHkgYmUgYWRkZWQgZnJvbSB0aGUgd3JhcHBlciBjbGFzc2VzLlxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAvLyBDYXN0IGNodW5rU2l6ZSB0byBpbnRlZ2VyXG4gICAgdGhpcy5vcHRpb25zLmNodW5rU2l6ZSA9IE51bWJlcih0aGlzLm9wdGlvbnMuY2h1bmtTaXplKTtcblxuICAgIC8vIFRoZSBzdG9yYWdlIG1vZHVsZSB1c2VkIHRvIHN0b3JlIFVSTHNcbiAgICB0aGlzLl91cmxTdG9yYWdlID0gdGhpcy5vcHRpb25zLnVybFN0b3JhZ2U7XG5cbiAgICAvLyBUaGUgdW5kZXJseWluZyBGaWxlL0Jsb2Igb2JqZWN0XG4gICAgdGhpcy5maWxlID0gZmlsZTtcblxuICAgIC8vIFRoZSBVUkwgYWdhaW5zdCB3aGljaCB0aGUgZmlsZSB3aWxsIGJlIHVwbG9hZGVkXG4gICAgdGhpcy51cmwgPSBudWxsO1xuXG4gICAgLy8gVGhlIHVuZGVybHlpbmcgcmVxdWVzdCBvYmplY3QgZm9yIHRoZSBjdXJyZW50IFBBVENIIHJlcXVlc3RcbiAgICB0aGlzLl9yZXEgPSBudWxsO1xuXG4gICAgLy8gVGhlIGZpbmdlcnBpbnJ0IGZvciB0aGUgY3VycmVudCBmaWxlIChzZXQgYWZ0ZXIgc3RhcnQoKSlcbiAgICB0aGlzLl9maW5nZXJwcmludCA9IG51bGw7XG5cbiAgICAvLyBUaGUga2V5IHRoYXQgdGhlIFVSTCBzdG9yYWdlIHJldHVybmVkIHdoZW4gc2F2aW5nIGFuIFVSTCB3aXRoIGEgZmluZ2VycHJpbnQsXG4gICAgdGhpcy5fdXJsU3RvcmFnZUtleSA9IG51bGw7XG5cbiAgICAvLyBUaGUgb2Zmc2V0IHVzZWQgaW4gdGhlIGN1cnJlbnQgUEFUQ0ggcmVxdWVzdFxuICAgIHRoaXMuX29mZnNldCA9IG51bGw7XG5cbiAgICAvLyBUcnVlIGlmIHRoZSBjdXJyZW50IFBBVENIIHJlcXVlc3QgaGFzIGJlZW4gYWJvcnRlZFxuICAgIHRoaXMuX2Fib3J0ZWQgPSBmYWxzZTtcblxuICAgIC8vIFRoZSBmaWxlJ3Mgc2l6ZSBpbiBieXRlc1xuICAgIHRoaXMuX3NpemUgPSBudWxsO1xuXG4gICAgLy8gVGhlIFNvdXJjZSBvYmplY3Qgd2hpY2ggd2lsbCB3cmFwIGFyb3VuZCB0aGUgZ2l2ZW4gZmlsZSBhbmQgcHJvdmlkZXMgdXNcbiAgICAvLyB3aXRoIGEgdW5pZmllZCBpbnRlcmZhY2UgZm9yIGdldHRpbmcgaXRzIHNpemUgYW5kIHNsaWNlIGNodW5rcyBmcm9tIGl0c1xuICAgIC8vIGNvbnRlbnQgYWxsb3dpbmcgdXMgdG8gZWFzaWx5IGhhbmRsZSBGaWxlcywgQmxvYnMsIEJ1ZmZlcnMgYW5kIFN0cmVhbXMuXG4gICAgdGhpcy5fc291cmNlID0gbnVsbDtcblxuICAgIC8vIFRoZSBjdXJyZW50IGNvdW50IG9mIGF0dGVtcHRzIHdoaWNoIGhhdmUgYmVlbiBtYWRlLiBaZXJvIGluZGljYXRlcyBub25lLlxuICAgIHRoaXMuX3JldHJ5QXR0ZW1wdCA9IDA7XG5cbiAgICAvLyBUaGUgdGltZW91dCdzIElEIHdoaWNoIGlzIHVzZWQgdG8gZGVsYXkgdGhlIG5leHQgcmV0cnlcbiAgICB0aGlzLl9yZXRyeVRpbWVvdXQgPSBudWxsO1xuXG4gICAgLy8gVGhlIG9mZnNldCBvZiB0aGUgcmVtb3RlIHVwbG9hZCBiZWZvcmUgdGhlIGxhdGVzdCBhdHRlbXB0IHdhcyBzdGFydGVkLlxuICAgIHRoaXMuX29mZnNldEJlZm9yZVJldHJ5ID0gMDtcblxuICAgIC8vIEFuIGFycmF5IG9mIEJhc2VVcGxvYWQgaW5zdGFuY2VzIHdoaWNoIGFyZSB1c2VkIGZvciB1cGxvYWRpbmcgdGhlIGRpZmZlcmVudFxuICAgIC8vIHBhcnRzLCBpZiB0aGUgcGFyYWxsZWxVcGxvYWRzIG9wdGlvbiBpcyB1c2VkLlxuICAgIHRoaXMuX3BhcmFsbGVsVXBsb2FkcyA9IG51bGw7XG5cbiAgICAvLyBBbiBhcnJheSBvZiB1cGxvYWQgVVJMcyB3aGljaCBhcmUgdXNlZCBmb3IgdXBsb2FkaW5nIHRoZSBkaWZmZXJlbnRcbiAgICAvLyBwYXJ0cywgaWYgdGhlIHBhcmFsbGVsVXBsb2FkcyBvcHRpb24gaXMgdXNlZC5cbiAgICB0aGlzLl9wYXJhbGxlbFVwbG9hZFVybHMgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZSB0aGUgVGVybWluYXRpb24gZXh0ZW5zaW9uIHRvIGRlbGV0ZSBhbiB1cGxvYWQgZnJvbSB0aGUgc2VydmVyIGJ5IHNlbmRpbmcgYSBERUxFVEVcbiAgICogcmVxdWVzdCB0byB0aGUgc3BlY2lmaWVkIHVwbG9hZCBVUkwuIFRoaXMgaXMgb25seSBwb3NzaWJsZSBpZiB0aGUgc2VydmVyIHN1cHBvcnRzIHRoZVxuICAgKiBUZXJtaW5hdGlvbiBleHRlbnNpb24uIElmIHRoZSBgb3B0aW9ucy5yZXRyeURlbGF5c2AgcHJvcGVydHkgaXMgc2V0LCB0aGUgbWV0aG9kIHdpbGxcbiAgICogYWxzbyByZXRyeSBpZiBhbiBlcnJvciBvY3VycnMuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIHVwbG9hZCdzIFVSTCB3aGljaCB3aWxsIGJlIHRlcm1pbmF0ZWQuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIE9wdGlvbmFsIG9wdGlvbnMgZm9yIGluZmx1ZW5jaW5nIEhUVFAgcmVxdWVzdHMuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IFRoZSBQcm9taXNlIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgcmVxdWVzdHMgZmluaXNoLlxuICAgKi9cbiAgc3RhdGljIHRlcm1pbmF0ZSh1cmwpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgY29uc3QgcmVxID0gb3BlblJlcXVlc3QoJ0RFTEVURScsIHVybCwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHNlbmRSZXF1ZXN0KHJlcSwgbnVsbCwgb3B0aW9ucykudGhlbihyZXMgPT4ge1xuICAgICAgLy8gQSAyMDQgcmVzcG9uc2UgaW5kaWNhdGVzIGEgc3VjY2Vzc2Z1bGwgcmVxdWVzdFxuICAgICAgaWYgKHJlcy5nZXRTdGF0dXMoKSA9PT0gMjA0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBfZXJyb3IuZGVmYXVsdCgndHVzOiB1bmV4cGVjdGVkIHJlc3BvbnNlIHdoaWxlIHRlcm1pbmF0aW5nIHVwbG9hZCcsIG51bGwsIHJlcSwgcmVzKTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgX2Vycm9yLmRlZmF1bHQpKSB7XG4gICAgICAgIGVyciA9IG5ldyBfZXJyb3IuZGVmYXVsdCgndHVzOiBmYWlsZWQgdG8gdGVybWluYXRlIHVwbG9hZCcsIGVyciwgcmVxLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGlmICghc2hvdWxkUmV0cnkoZXJyLCAwLCBvcHRpb25zKSkge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG5cbiAgICAgIC8vIEluc3RlYWQgb2Yga2VlcGluZyB0cmFjayBvZiB0aGUgcmV0cnkgYXR0ZW1wdHMsIHdlIHJlbW92ZSB0aGUgZmlyc3QgZWxlbWVudCBmcm9tIHRoZSBkZWxheXNcbiAgICAgIC8vIGFycmF5LiBJZiB0aGUgYXJyYXkgaXMgZW1wdHksIGFsbCByZXRyeSBhdHRlbXB0cyBhcmUgdXNlZCB1cCBhbmQgd2Ugd2lsbCBidWJibGUgdXAgdGhlIGVycm9yLlxuICAgICAgLy8gV2UgcmVjdXJzaXZlbHkgY2FsbCB0aGUgdGVybWluYXRlIGZ1bmN0aW9uIHdpbGwgcmVtb3ZpbmcgZWxlbWVudHMgZnJvbSB0aGUgcmV0cnlEZWxheXMgYXJyYXkuXG4gICAgICBjb25zdCBkZWxheSA9IG9wdGlvbnMucmV0cnlEZWxheXNbMF07XG4gICAgICBjb25zdCByZW1haW5pbmdEZWxheXMgPSBvcHRpb25zLnJldHJ5RGVsYXlzLnNsaWNlKDEpO1xuICAgICAgY29uc3QgbmV3T3B0aW9ucyA9IHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgcmV0cnlEZWxheXM6IHJlbWFpbmluZ0RlbGF5c1xuICAgICAgfTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgZGVsYXkpKS50aGVuKCgpID0+IEJhc2VVcGxvYWQudGVybWluYXRlKHVybCwgbmV3T3B0aW9ucykpO1xuICAgIH0pO1xuICB9XG4gIGZpbmRQcmV2aW91c1VwbG9hZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5maW5nZXJwcmludCh0aGlzLmZpbGUsIHRoaXMub3B0aW9ucykudGhlbihmaW5nZXJwcmludCA9PiB0aGlzLl91cmxTdG9yYWdlLmZpbmRVcGxvYWRzQnlGaW5nZXJwcmludChmaW5nZXJwcmludCkpO1xuICB9XG4gIHJlc3VtZUZyb21QcmV2aW91c1VwbG9hZChwcmV2aW91c1VwbG9hZCkge1xuICAgIHRoaXMudXJsID0gcHJldmlvdXNVcGxvYWQudXBsb2FkVXJsIHx8IG51bGw7XG4gICAgdGhpcy5fcGFyYWxsZWxVcGxvYWRVcmxzID0gcHJldmlvdXNVcGxvYWQucGFyYWxsZWxVcGxvYWRVcmxzIHx8IG51bGw7XG4gICAgdGhpcy5fdXJsU3RvcmFnZUtleSA9IHByZXZpb3VzVXBsb2FkLnVybFN0b3JhZ2VLZXk7XG4gIH1cbiAgc3RhcnQoKSB7XG4gICAgY29uc3Qge1xuICAgICAgZmlsZVxuICAgIH0gPSB0aGlzO1xuICAgIGlmICghZmlsZSkge1xuICAgICAgdGhpcy5fZW1pdEVycm9yKG5ldyBFcnJvcigndHVzOiBubyBmaWxlIG9yIHN0cmVhbSB0byB1cGxvYWQgcHJvdmlkZWQnKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghW1BST1RPQ09MX1RVU19WMSwgUFJPVE9DT0xfSUVURl9EUkFGVF8wM10uaW5jbHVkZXModGhpcy5vcHRpb25zLnByb3RvY29sKSkge1xuICAgICAgdGhpcy5fZW1pdEVycm9yKG5ldyBFcnJvcihgdHVzOiB1bnN1cHBvcnRlZCBwcm90b2NvbCAke3RoaXMub3B0aW9ucy5wcm90b2NvbH1gKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHRpb25zLmVuZHBvaW50ICYmICF0aGlzLm9wdGlvbnMudXBsb2FkVXJsICYmICF0aGlzLnVybCkge1xuICAgICAgdGhpcy5fZW1pdEVycm9yKG5ldyBFcnJvcigndHVzOiBuZWl0aGVyIGFuIGVuZHBvaW50IG9yIGFuIHVwbG9hZCBVUkwgaXMgcHJvdmlkZWQnKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHtcbiAgICAgIHJldHJ5RGVsYXlzXG4gICAgfSA9IHRoaXMub3B0aW9ucztcbiAgICBpZiAocmV0cnlEZWxheXMgIT0gbnVsbCAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocmV0cnlEZWxheXMpICE9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICB0aGlzLl9lbWl0RXJyb3IobmV3IEVycm9yKCd0dXM6IHRoZSBgcmV0cnlEZWxheXNgIG9wdGlvbiBtdXN0IGVpdGhlciBiZSBhbiBhcnJheSBvciBudWxsJykpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLnBhcmFsbGVsVXBsb2FkcyA+IDEpIHtcbiAgICAgIC8vIFRlc3Qgd2hpY2ggb3B0aW9ucyBhcmUgaW5jb21wYXRpYmxlIHdpdGggcGFyYWxsZWwgdXBsb2Fkcy5cbiAgICAgIGZvciAoY29uc3Qgb3B0aW9uTmFtZSBvZiBbJ3VwbG9hZFVybCcsICd1cGxvYWRTaXplJywgJ3VwbG9hZExlbmd0aERlZmVycmVkJ10pIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9uc1tvcHRpb25OYW1lXSkge1xuICAgICAgICAgIHRoaXMuX2VtaXRFcnJvcihuZXcgRXJyb3IoYHR1czogY2Fubm90IHVzZSB0aGUgJHtvcHRpb25OYW1lfSBvcHRpb24gd2hlbiBwYXJhbGxlbFVwbG9hZHMgaXMgZW5hYmxlZGApKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5wYXJhbGxlbFVwbG9hZEJvdW5kYXJpZXMpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFyYWxsZWxVcGxvYWRzIDw9IDEpIHtcbiAgICAgICAgdGhpcy5fZW1pdEVycm9yKG5ldyBFcnJvcigndHVzOiBjYW5ub3QgdXNlIHRoZSBgcGFyYWxsZWxVcGxvYWRCb3VuZGFyaWVzYCBvcHRpb24gd2hlbiBgcGFyYWxsZWxVcGxvYWRzYCBpcyBkaXNhYmxlZCcpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXJhbGxlbFVwbG9hZHMgIT09IHRoaXMub3B0aW9ucy5wYXJhbGxlbFVwbG9hZEJvdW5kYXJpZXMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuX2VtaXRFcnJvcihuZXcgRXJyb3IoJ3R1czogdGhlIGBwYXJhbGxlbFVwbG9hZEJvdW5kYXJpZXNgIG11c3QgaGF2ZSB0aGUgc2FtZSBsZW5ndGggYXMgdGhlIHZhbHVlIG9mIGBwYXJhbGxlbFVwbG9hZHNgJykpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucy5maW5nZXJwcmludChmaWxlLCB0aGlzLm9wdGlvbnMpLnRoZW4oZmluZ2VycHJpbnQgPT4ge1xuICAgICAgaWYgKGZpbmdlcnByaW50ID09IG51bGwpIHtcbiAgICAgICAgKDAsIF9sb2dnZXIubG9nKSgnTm8gZmluZ2VycHJpbnQgd2FzIGNhbGN1bGF0ZWQgbWVhbmluZyB0aGF0IHRoZSB1cGxvYWQgY2Fubm90IGJlIHN0b3JlZCBpbiB0aGUgVVJMIHN0b3JhZ2UuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoMCwgX2xvZ2dlci5sb2cpKGBDYWxjdWxhdGVkIGZpbmdlcnByaW50OiAke2ZpbmdlcnByaW50fWApO1xuICAgICAgfVxuICAgICAgdGhpcy5fZmluZ2VycHJpbnQgPSBmaW5nZXJwcmludDtcbiAgICAgIGlmICh0aGlzLl9zb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NvdXJjZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZmlsZVJlYWRlci5vcGVuRmlsZShmaWxlLCB0aGlzLm9wdGlvbnMuY2h1bmtTaXplKTtcbiAgICB9KS50aGVuKHNvdXJjZSA9PiB7XG4gICAgICB0aGlzLl9zb3VyY2UgPSBzb3VyY2U7XG5cbiAgICAgIC8vIEZpcnN0LCB3ZSBsb29rIGF0IHRoZSB1cGxvYWRMZW5ndGhEZWZlcnJlZCBvcHRpb24uXG4gICAgICAvLyBOZXh0LCB3ZSBjaGVjayBpZiB0aGUgY2FsbGVyIGhhcyBzdXBwbGllZCBhIG1hbnVhbCB1cGxvYWQgc2l6ZS5cbiAgICAgIC8vIEZpbmFsbHksIHdlIHRyeSB0byB1c2UgdGhlIGNhbGN1bGF0ZWQgc2l6ZSBmcm9tIHRoZSBzb3VyY2Ugb2JqZWN0LlxuICAgICAgaWYgKHRoaXMub3B0aW9ucy51cGxvYWRMZW5ndGhEZWZlcnJlZCkge1xuICAgICAgICB0aGlzLl9zaXplID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnVwbG9hZFNpemUgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9zaXplID0gTnVtYmVyKHRoaXMub3B0aW9ucy51cGxvYWRTaXplKTtcbiAgICAgICAgaWYgKE51bWJlci5pc05hTih0aGlzLl9zaXplKSkge1xuICAgICAgICAgIHRoaXMuX2VtaXRFcnJvcihuZXcgRXJyb3IoJ3R1czogY2Fubm90IGNvbnZlcnQgYHVwbG9hZFNpemVgIG9wdGlvbiBpbnRvIGEgbnVtYmVyJykpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc2l6ZSA9IHRoaXMuX3NvdXJjZS5zaXplO1xuICAgICAgICBpZiAodGhpcy5fc2l6ZSA9PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5fZW1pdEVycm9yKG5ldyBFcnJvcihcInR1czogY2Fubm90IGF1dG9tYXRpY2FsbHkgZGVyaXZlIHVwbG9hZCdzIHNpemUgZnJvbSBpbnB1dC4gU3BlY2lmeSBpdCBtYW51YWxseSB1c2luZyB0aGUgYHVwbG9hZFNpemVgIG9wdGlvbiBvciB1c2UgdGhlIGB1cGxvYWRMZW5ndGhEZWZlcnJlZGAgb3B0aW9uXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIHVwbG9hZCB3YXMgY29uZmlndXJlZCB0byB1c2UgbXVsdGlwbGUgcmVxdWVzdHMgb3IgaWYgd2UgcmVzdW1lIGZyb21cbiAgICAgIC8vIGFuIHVwbG9hZCB3aGljaCB1c2VkIG11bHRpcGxlIHJlcXVlc3RzLCB3ZSBzdGFydCBhIHBhcmFsbGVsIHVwbG9hZC5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFyYWxsZWxVcGxvYWRzID4gMSB8fCB0aGlzLl9wYXJhbGxlbFVwbG9hZFVybHMgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9zdGFydFBhcmFsbGVsVXBsb2FkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdGFydFNpbmdsZVVwbG9hZCgpO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLl9lbWl0RXJyb3IoZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSB0aGUgdXBsb2FkaW5nIHByb2NlZHVyZSBmb3IgYSBwYXJhbGxlbGl6ZWQgdXBsb2FkLCB3aGVyZSBvbmUgZmlsZSBpcyBzcGxpdCBpbnRvXG4gICAqIG11bHRpcGxlIHJlcXVlc3Qgd2hpY2ggYXJlIHJ1biBpbiBwYXJhbGxlbC5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuICBfc3RhcnRQYXJhbGxlbFVwbG9hZCgpIHtcbiAgICBjb25zdCB0b3RhbFNpemUgPSB0aGlzLl9zaXplO1xuICAgIGxldCB0b3RhbFByb2dyZXNzID0gMDtcbiAgICB0aGlzLl9wYXJhbGxlbFVwbG9hZHMgPSBbXTtcbiAgICBjb25zdCBwYXJ0Q291bnQgPSB0aGlzLl9wYXJhbGxlbFVwbG9hZFVybHMgIT0gbnVsbCA/IHRoaXMuX3BhcmFsbGVsVXBsb2FkVXJscy5sZW5ndGggOiB0aGlzLm9wdGlvbnMucGFyYWxsZWxVcGxvYWRzO1xuXG4gICAgLy8gVGhlIGlucHV0IGZpbGUgd2lsbCBiZSBzcGxpdCBpbnRvIG11bHRpcGxlIHNsaWNlcyB3aGljaCBhcmUgdXBsb2FkZWQgaW4gc2VwYXJhdGVcbiAgICAvLyByZXF1ZXN0cy4gSGVyZSB3ZSBnZXQgdGhlIHN0YXJ0IGFuZCBlbmQgcG9zaXRpb24gZm9yIHRoZSBzbGljZXMuXG4gICAgY29uc3QgcGFydHMgPSB0aGlzLm9wdGlvbnMucGFyYWxsZWxVcGxvYWRCb3VuZGFyaWVzID8/IHNwbGl0U2l6ZUludG9QYXJ0cyh0aGlzLl9zb3VyY2Uuc2l6ZSwgcGFydENvdW50KTtcblxuICAgIC8vIEF0dGFjaCBVUkxzIGZyb20gcHJldmlvdXMgdXBsb2FkcywgaWYgYXZhaWxhYmxlLlxuICAgIGlmICh0aGlzLl9wYXJhbGxlbFVwbG9hZFVybHMpIHtcbiAgICAgIHBhcnRzLmZvckVhY2goKHBhcnQsIGluZGV4KSA9PiB7XG4gICAgICAgIHBhcnQudXBsb2FkVXJsID0gdGhpcy5fcGFyYWxsZWxVcGxvYWRVcmxzW2luZGV4XSB8fCBudWxsO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGFuIGVtcHR5IGxpc3QgZm9yIHN0b3JpbmcgdGhlIHVwbG9hZCBVUkxzXG4gICAgdGhpcy5fcGFyYWxsZWxVcGxvYWRVcmxzID0gbmV3IEFycmF5KHBhcnRzLmxlbmd0aCk7XG5cbiAgICAvLyBHZW5lcmF0ZSBhIHByb21pc2UgZm9yIGVhY2ggc2xpY2UgdGhhdCB3aWxsIGJlIHJlc29sdmUgaWYgdGhlIHJlc3BlY3RpdmVcbiAgICAvLyB1cGxvYWQgaXMgY29tcGxldGVkLlxuICAgIGNvbnN0IHVwbG9hZHMgPSBwYXJ0cy5tYXAoKHBhcnQsIGluZGV4KSA9PiB7XG4gICAgICBsZXQgbGFzdFBhcnRQcm9ncmVzcyA9IDA7XG4gICAgICByZXR1cm4gdGhpcy5fc291cmNlLnNsaWNlKHBhcnQuc3RhcnQsIHBhcnQuZW5kKS50aGVuKF9yZWYgPT4ge1xuICAgICAgICBsZXQge1xuICAgICAgICAgIHZhbHVlXG4gICAgICAgIH0gPSBfcmVmO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIC8vIE1lcmdlIHdpdGggdGhlIHVzZXIgc3VwcGxpZWQgb3B0aW9ucyBidXQgb3ZlcndyaXRlIHNvbWUgdmFsdWVzLlxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAuLi50aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAvLyBJZiBhdmFpbGFibGUsIHRoZSBwYXJ0aWFsIHVwbG9hZCBzaG91bGQgYmUgcmVzdW1lZCBmcm9tIGEgcHJldmlvdXMgVVJMLlxuICAgICAgICAgICAgdXBsb2FkVXJsOiBwYXJ0LnVwbG9hZFVybCB8fCBudWxsLFxuICAgICAgICAgICAgLy8gV2UgdGFrZSBtYW51YWxseSBjYXJlIG9mIHJlc3VtaW5nIGZvciBwYXJ0aWFsIHVwbG9hZHMsIHNvIHRoZXkgc2hvdWxkXG4gICAgICAgICAgICAvLyBub3QgYmUgc3RvcmVkIGluIHRoZSBVUkwgc3RvcmFnZS5cbiAgICAgICAgICAgIHN0b3JlRmluZ2VycHJpbnRGb3JSZXN1bWluZzogZmFsc2UsXG4gICAgICAgICAgICByZW1vdmVGaW5nZXJwcmludE9uU3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgcGFyYWxsZWxVcGxvYWRzIG9wdGlvbiB0byBub3QgY2F1c2UgcmVjdXJzaW9uLlxuICAgICAgICAgICAgcGFyYWxsZWxVcGxvYWRzOiAxLFxuICAgICAgICAgICAgLy8gUmVzZXQgdGhpcyBvcHRpb24gYXMgd2UgYXJlIG5vdCBkb2luZyBhIHBhcmFsbGVsIHVwbG9hZC5cbiAgICAgICAgICAgIHBhcmFsbGVsVXBsb2FkQm91bmRhcmllczogbnVsbCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7fSxcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgaGVhZGVyIHRvIGluZGljYXRlIHRoZSB0aGlzIGlzIGEgcGFydGlhbCB1cGxvYWQuXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgIC4uLnRoaXMub3B0aW9ucy5oZWFkZXJzLFxuICAgICAgICAgICAgICAnVXBsb2FkLUNvbmNhdCc6ICdwYXJ0aWFsJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJlamVjdCBvciByZXNvbHZlIHRoZSBwcm9taXNlIGlmIHRoZSB1cGxvYWQgZXJyb3JzIG9yIGNvbXBsZXRlcy5cbiAgICAgICAgICAgIG9uU3VjY2VzczogcmVzb2x2ZSxcbiAgICAgICAgICAgIG9uRXJyb3I6IHJlamVjdCxcbiAgICAgICAgICAgIC8vIEJhc2VkIGluIHRoZSBwcm9ncmVzcyBmb3IgdGhpcyBwYXJ0aWFsIHVwbG9hZCwgY2FsY3VsYXRlIHRoZSBwcm9ncmVzc1xuICAgICAgICAgICAgLy8gZm9yIHRoZSBlbnRpcmUgZmluYWwgdXBsb2FkLlxuICAgICAgICAgICAgb25Qcm9ncmVzczogbmV3UGFydFByb2dyZXNzID0+IHtcbiAgICAgICAgICAgICAgdG90YWxQcm9ncmVzcyA9IHRvdGFsUHJvZ3Jlc3MgLSBsYXN0UGFydFByb2dyZXNzICsgbmV3UGFydFByb2dyZXNzO1xuICAgICAgICAgICAgICBsYXN0UGFydFByb2dyZXNzID0gbmV3UGFydFByb2dyZXNzO1xuICAgICAgICAgICAgICB0aGlzLl9lbWl0UHJvZ3Jlc3ModG90YWxQcm9ncmVzcywgdG90YWxTaXplKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBXYWl0IHVudGlsIGV2ZXJ5IHBhcnRpYWwgdXBsb2FkIGhhcyBhbiB1cGxvYWQgVVJMLCBzbyB3ZSBjYW4gYWRkXG4gICAgICAgICAgICAvLyB0aGVtIHRvIHRoZSBVUkwgc3RvcmFnZS5cbiAgICAgICAgICAgIG9uVXBsb2FkVXJsQXZhaWxhYmxlOiAoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuX3BhcmFsbGVsVXBsb2FkVXJsc1tpbmRleF0gPSB1cGxvYWQudXJsO1xuICAgICAgICAgICAgICAvLyBUZXN0IGlmIGFsbCB1cGxvYWRzIGhhdmUgcmVjZWl2ZWQgYW4gVVJMXG4gICAgICAgICAgICAgIGlmICh0aGlzLl9wYXJhbGxlbFVwbG9hZFVybHMuZmlsdGVyKHUgPT4gQm9vbGVhbih1KSkubGVuZ3RoID09PSBwYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zYXZlVXBsb2FkSW5VcmxTdG9yYWdlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyBCYXNlVXBsb2FkKHZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICB1cGxvYWQuc3RhcnQoKTtcblxuICAgICAgICAgIC8vIFN0b3JlIHRoZSB1cGxvYWQgaW4gYW4gYXJyYXksIHNvIHdlIGNhbiBsYXRlciBhYm9ydCB0aGVtIGlmIG5lY2Vzc2FyeS5cbiAgICAgICAgICB0aGlzLl9wYXJhbGxlbFVwbG9hZHMucHVzaCh1cGxvYWQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGxldCByZXE7XG4gICAgLy8gV2FpdCB1bnRpbCBhbGwgcGFydGlhbCB1cGxvYWRzIGFyZSBmaW5pc2hlZCBhbmQgd2UgY2FuIHNlbmQgdGhlIFBPU1QgcmVxdWVzdCBmb3JcbiAgICAvLyBjcmVhdGluZyB0aGUgZmluYWwgdXBsb2FkLlxuICAgIFByb21pc2UuYWxsKHVwbG9hZHMpLnRoZW4oKCkgPT4ge1xuICAgICAgcmVxID0gdGhpcy5fb3BlblJlcXVlc3QoJ1BPU1QnLCB0aGlzLm9wdGlvbnMuZW5kcG9pbnQpO1xuICAgICAgcmVxLnNldEhlYWRlcignVXBsb2FkLUNvbmNhdCcsIGBmaW5hbDske3RoaXMuX3BhcmFsbGVsVXBsb2FkVXJscy5qb2luKCcgJyl9YCk7XG5cbiAgICAgIC8vIEFkZCBtZXRhZGF0YSBpZiB2YWx1ZXMgaGF2ZSBiZWVuIGFkZGVkXG4gICAgICBjb25zdCBtZXRhZGF0YSA9IGVuY29kZU1ldGFkYXRhKHRoaXMub3B0aW9ucy5tZXRhZGF0YSk7XG4gICAgICBpZiAobWV0YWRhdGEgIT09ICcnKSB7XG4gICAgICAgIHJlcS5zZXRIZWFkZXIoJ1VwbG9hZC1NZXRhZGF0YScsIG1ldGFkYXRhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdChyZXEsIG51bGwpO1xuICAgIH0pLnRoZW4ocmVzID0+IHtcbiAgICAgIGlmICghaW5TdGF0dXNDYXRlZ29yeShyZXMuZ2V0U3RhdHVzKCksIDIwMCkpIHtcbiAgICAgICAgdGhpcy5fZW1pdEh0dHBFcnJvcihyZXEsIHJlcywgJ3R1czogdW5leHBlY3RlZCByZXNwb25zZSB3aGlsZSBjcmVhdGluZyB1cGxvYWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbG9jYXRpb24gPSByZXMuZ2V0SGVhZGVyKCdMb2NhdGlvbicpO1xuICAgICAgaWYgKGxvY2F0aW9uID09IG51bGwpIHtcbiAgICAgICAgdGhpcy5fZW1pdEh0dHBFcnJvcihyZXEsIHJlcywgJ3R1czogaW52YWxpZCBvciBtaXNzaW5nIExvY2F0aW9uIGhlYWRlcicpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnVybCA9IHJlc29sdmVVcmwodGhpcy5vcHRpb25zLmVuZHBvaW50LCBsb2NhdGlvbik7XG4gICAgICAoMCwgX2xvZ2dlci5sb2cpKGBDcmVhdGVkIHVwbG9hZCBhdCAke3RoaXMudXJsfWApO1xuICAgICAgdGhpcy5fZW1pdFN1Y2Nlc3MoKTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgdGhpcy5fZW1pdEVycm9yKGVycik7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgdGhlIHVwbG9hZGluZyBwcm9jZWR1cmUgZm9yIGEgbm9uLXBhcmFsbGVsIHVwbG9hZC4gSGVyZSB0aGUgZW50aXJlIGZpbGUgaXNcbiAgICogdXBsb2FkZWQgaW4gYSBzZXF1ZW50aWFsIG1hdHRlci5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuICBfc3RhcnRTaW5nbGVVcGxvYWQoKSB7XG4gICAgLy8gUmVzZXQgdGhlIGFib3J0ZWQgZmxhZyB3aGVuIHRoZSB1cGxvYWQgaXMgc3RhcnRlZCBvciBlbHNlIHRoZVxuICAgIC8vIF9wZXJmb3JtVXBsb2FkIHdpbGwgc3RvcCBiZWZvcmUgc2VuZGluZyBhIHJlcXVlc3QgaWYgdGhlIHVwbG9hZCBoYXMgYmVlblxuICAgIC8vIGFib3J0ZWQgcHJldmlvdXNseS5cbiAgICB0aGlzLl9hYm9ydGVkID0gZmFsc2U7XG5cbiAgICAvLyBUaGUgdXBsb2FkIGhhZCBiZWVuIHN0YXJ0ZWQgcHJldmlvdXNseSBhbmQgd2Ugc2hvdWxkIHJldXNlIHRoaXMgVVJMLlxuICAgIGlmICh0aGlzLnVybCAhPSBudWxsKSB7XG4gICAgICAoMCwgX2xvZ2dlci5sb2cpKGBSZXN1bWluZyB1cGxvYWQgZnJvbSBwcmV2aW91cyBVUkw6ICR7dGhpcy51cmx9YCk7XG4gICAgICB0aGlzLl9yZXN1bWVVcGxvYWQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBBIFVSTCBoYXMgbWFudWFsbHkgYmVlbiBzcGVjaWZpZWQsIHNvIHdlIHRyeSB0byByZXN1bWVcbiAgICBpZiAodGhpcy5vcHRpb25zLnVwbG9hZFVybCAhPSBudWxsKSB7XG4gICAgICAoMCwgX2xvZ2dlci5sb2cpKGBSZXN1bWluZyB1cGxvYWQgZnJvbSBwcm92aWRlZCBVUkw6ICR7dGhpcy5vcHRpb25zLnVwbG9hZFVybH1gKTtcbiAgICAgIHRoaXMudXJsID0gdGhpcy5vcHRpb25zLnVwbG9hZFVybDtcbiAgICAgIHRoaXMuX3Jlc3VtZVVwbG9hZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFuIHVwbG9hZCBoYXMgbm90IHN0YXJ0ZWQgZm9yIHRoZSBmaWxlIHlldCwgc28gd2Ugc3RhcnQgYSBuZXcgb25lXG4gICAgKDAsIF9sb2dnZXIubG9nKSgnQ3JlYXRpbmcgYSBuZXcgdXBsb2FkJyk7XG4gICAgdGhpcy5fY3JlYXRlVXBsb2FkKCk7XG4gIH1cblxuICAvKipcbiAgICogQWJvcnQgYW55IHJ1bm5pbmcgcmVxdWVzdCBhbmQgc3RvcCB0aGUgY3VycmVudCB1cGxvYWQuIEFmdGVyIGFib3J0IGlzIGNhbGxlZCwgbm8gZXZlbnRcbiAgICogaGFuZGxlciB3aWxsIGJlIGludm9rZWQgYW55bW9yZS4gWW91IGNhbiB1c2UgdGhlIGBzdGFydGAgbWV0aG9kIHRvIHJlc3VtZSB0aGUgdXBsb2FkXG4gICAqIGFnYWluLlxuICAgKiBJZiBgc2hvdWxkVGVybWluYXRlYCBpcyB0cnVlLCB0aGUgYHRlcm1pbmF0ZWAgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgdG8gcmVtb3ZlIHRoZVxuICAgKiBjdXJyZW50IHVwbG9hZCBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hvdWxkVGVybWluYXRlIFRydWUgaWYgdGhlIHVwbG9hZCBzaG91bGQgYmUgZGVsZXRlZCBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9IFRoZSBQcm9taXNlIHdpbGwgYmUgcmVzb2x2ZWQvcmVqZWN0ZWQgd2hlbiB0aGUgcmVxdWVzdHMgZmluaXNoLlxuICAgKi9cbiAgYWJvcnQoc2hvdWxkVGVybWluYXRlKSB7XG4gICAgLy8gU3RvcCBhbnkgcGFyYWxsZWwgcGFydGlhbCB1cGxvYWRzLCB0aGF0IGhhdmUgYmVlbiBzdGFydGVkIGluIF9zdGFydFBhcmFsbGVsVXBsb2Fkcy5cbiAgICBpZiAodGhpcy5fcGFyYWxsZWxVcGxvYWRzICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX3BhcmFsbGVsVXBsb2Fkcy5mb3JFYWNoKHVwbG9hZCA9PiB7XG4gICAgICAgIHVwbG9hZC5hYm9ydChzaG91bGRUZXJtaW5hdGUpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBhbnkgY3VycmVudCBydW5uaW5nIHJlcXVlc3QuXG4gICAgaWYgKHRoaXMuX3JlcSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5fcmVxLmFib3J0KCk7XG4gICAgICAvLyBOb3RlOiBXZSBkbyBub3QgY2xvc2UgdGhlIGZpbGUgc291cmNlIGhlcmUsIHNvIHRoZSB1c2VyIGNhbiByZXN1bWUgaW4gdGhlIGZ1dHVyZS5cbiAgICB9XG4gICAgdGhpcy5fYWJvcnRlZCA9IHRydWU7XG5cbiAgICAvLyBTdG9wIGFueSB0aW1lb3V0IHVzZWQgZm9yIGluaXRpYXRpbmcgYSByZXRyeS5cbiAgICBpZiAodGhpcy5fcmV0cnlUaW1lb3V0ICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9yZXRyeVRpbWVvdXQpO1xuICAgICAgdGhpcy5fcmV0cnlUaW1lb3V0ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKCFzaG91bGRUZXJtaW5hdGUgfHwgdGhpcy51cmwgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gQmFzZVVwbG9hZC50ZXJtaW5hdGUodGhpcy51cmwsIHRoaXMub3B0aW9ucylcbiAgICAvLyBSZW1vdmUgZW50cnkgZnJvbSB0aGUgVVJMIHN0b3JhZ2Ugc2luY2UgdGhlIHVwbG9hZCBVUkwgaXMgbm8gbG9uZ2VyIHZhbGlkLlxuICAgIC50aGVuKCgpID0+IHRoaXMuX3JlbW92ZUZyb21VcmxTdG9yYWdlKCkpO1xuICB9XG4gIF9lbWl0SHR0cEVycm9yKHJlcSwgcmVzLCBtZXNzYWdlLCBjYXVzaW5nRXJyKSB7XG4gICAgdGhpcy5fZW1pdEVycm9yKG5ldyBfZXJyb3IuZGVmYXVsdChtZXNzYWdlLCBjYXVzaW5nRXJyLCByZXEsIHJlcykpO1xuICB9XG4gIF9lbWl0RXJyb3IoZXJyKSB7XG4gICAgLy8gRG8gbm90IGVtaXQgZXJyb3JzLCBlLmcuIGZyb20gYWJvcnRlZCBIVFRQIHJlcXVlc3RzLCBpZiB0aGUgdXBsb2FkIGhhcyBiZWVuIHN0b3BwZWQuXG4gICAgaWYgKHRoaXMuX2Fib3J0ZWQpIHJldHVybjtcblxuICAgIC8vIENoZWNrIGlmIHdlIHNob3VsZCByZXRyeSwgd2hlbiBlbmFibGVkLCBiZWZvcmUgc2VuZGluZyB0aGUgZXJyb3IgdG8gdGhlIHVzZXIuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXRyeURlbGF5cyAhPSBudWxsKSB7XG4gICAgICAvLyBXZSB3aWxsIHJlc2V0IHRoZSBhdHRlbXB0IGNvdW50ZXIgaWZcbiAgICAgIC8vIC0gd2Ugd2VyZSBhbHJlYWR5IGFibGUgdG8gY29ubmVjdCB0byB0aGUgc2VydmVyIChvZmZzZXQgIT0gbnVsbCkgYW5kXG4gICAgICAvLyAtIHdlIHdlcmUgYWJsZSB0byB1cGxvYWQgYSBzbWFsbCBjaHVuayBvZiBkYXRhIHRvIHRoZSBzZXJ2ZXJcbiAgICAgIGNvbnN0IHNob3VsZFJlc2V0RGVsYXlzID0gdGhpcy5fb2Zmc2V0ICE9IG51bGwgJiYgdGhpcy5fb2Zmc2V0ID4gdGhpcy5fb2Zmc2V0QmVmb3JlUmV0cnk7XG4gICAgICBpZiAoc2hvdWxkUmVzZXREZWxheXMpIHtcbiAgICAgICAgdGhpcy5fcmV0cnlBdHRlbXB0ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRSZXRyeShlcnIsIHRoaXMuX3JldHJ5QXR0ZW1wdCwgdGhpcy5vcHRpb25zKSkge1xuICAgICAgICBjb25zdCBkZWxheSA9IHRoaXMub3B0aW9ucy5yZXRyeURlbGF5c1t0aGlzLl9yZXRyeUF0dGVtcHQrK107XG4gICAgICAgIHRoaXMuX29mZnNldEJlZm9yZVJldHJ5ID0gdGhpcy5fb2Zmc2V0O1xuICAgICAgICB0aGlzLl9yZXRyeVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vbkVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLm9wdGlvbnMub25FcnJvcihlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFB1Ymxpc2hlcyBub3RpZmljYXRpb24gaWYgdGhlIHVwbG9hZCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgY29tcGxldGVkLlxuICAgKlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIF9lbWl0U3VjY2VzcygpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnJlbW92ZUZpbmdlcnByaW50T25TdWNjZXNzKSB7XG4gICAgICAvLyBSZW1vdmUgc3RvcmVkIGZpbmdlcnByaW50IGFuZCBjb3JyZXNwb25kaW5nIGVuZHBvaW50LiBUaGlzIGNhdXNlc1xuICAgICAgLy8gbmV3IHVwbG9hZHMgb2YgdGhlIHNhbWUgZmlsZSB0byBiZSB0cmVhdGVkIGFzIGEgZGlmZmVyZW50IGZpbGUuXG4gICAgICB0aGlzLl9yZW1vdmVGcm9tVXJsU3RvcmFnZSgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vblN1Y2Nlc3MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vblN1Y2Nlc3MoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaGVzIG5vdGlmaWNhdGlvbiB3aGVuIGRhdGEgaGFzIGJlZW4gc2VudCB0byB0aGUgc2VydmVyLiBUaGlzXG4gICAqIGRhdGEgbWF5IG5vdCBoYXZlIGJlZW4gYWNjZXB0ZWQgYnkgdGhlIHNlcnZlciB5ZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBieXRlc1NlbnQgIE51bWJlciBvZiBieXRlcyBzZW50IHRvIHRoZSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBieXRlc1RvdGFsIFRvdGFsIG51bWJlciBvZiBieXRlcyB0byBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIuXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cbiAgX2VtaXRQcm9ncmVzcyhieXRlc1NlbnQsIGJ5dGVzVG90YWwpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vblByb2dyZXNzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLm9wdGlvbnMub25Qcm9ncmVzcyhieXRlc1NlbnQsIGJ5dGVzVG90YWwpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQdWJsaXNoZXMgbm90aWZpY2F0aW9uIHdoZW4gYSBjaHVuayBvZiBkYXRhIGhhcyBiZWVuIHNlbnQgdG8gdGhlIHNlcnZlclxuICAgKiBhbmQgYWNjZXB0ZWQgYnkgdGhlIHNlcnZlci5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNodW5rU2l6ZSAgU2l6ZSBvZiB0aGUgY2h1bmsgdGhhdCB3YXMgYWNjZXB0ZWQgYnkgdGhlIHNlcnZlci5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzQWNjZXB0ZWQgVG90YWwgbnVtYmVyIG9mIGJ5dGVzIHRoYXQgaGF2ZSBiZWVuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHRlZCBieSB0aGUgc2VydmVyLlxuICAgKiBAcGFyYW0ge251bWJlcn0gYnl0ZXNUb3RhbCBUb3RhbCBudW1iZXIgb2YgYnl0ZXMgdG8gYmUgc2VudCB0byB0aGUgc2VydmVyLlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIF9lbWl0Q2h1bmtDb21wbGV0ZShjaHVua1NpemUsIGJ5dGVzQWNjZXB0ZWQsIGJ5dGVzVG90YWwpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vbkNodW5rQ29tcGxldGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vbkNodW5rQ29tcGxldGUoY2h1bmtTaXplLCBieXRlc0FjY2VwdGVkLCBieXRlc1RvdGFsKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHVwbG9hZCB1c2luZyB0aGUgY3JlYXRpb24gZXh0ZW5zaW9uIGJ5IHNlbmRpbmcgYSBQT1NUXG4gICAqIHJlcXVlc3QgdG8gdGhlIGVuZHBvaW50LiBBZnRlciBzdWNjZXNzZnVsIGNyZWF0aW9uIHRoZSBmaWxlIHdpbGwgYmVcbiAgICogdXBsb2FkZWRcbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuICBfY3JlYXRlVXBsb2FkKCkge1xuICAgIGlmICghdGhpcy5vcHRpb25zLmVuZHBvaW50KSB7XG4gICAgICB0aGlzLl9lbWl0RXJyb3IobmV3IEVycm9yKCd0dXM6IHVuYWJsZSB0byBjcmVhdGUgdXBsb2FkIGJlY2F1c2Ugbm8gZW5kcG9pbnQgaXMgcHJvdmlkZWQnKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJlcSA9IHRoaXMuX29wZW5SZXF1ZXN0KCdQT1NUJywgdGhpcy5vcHRpb25zLmVuZHBvaW50KTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnVwbG9hZExlbmd0aERlZmVycmVkKSB7XG4gICAgICByZXEuc2V0SGVhZGVyKCdVcGxvYWQtRGVmZXItTGVuZ3RoJywgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcS5zZXRIZWFkZXIoJ1VwbG9hZC1MZW5ndGgnLCB0aGlzLl9zaXplKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgbWV0YWRhdGEgaWYgdmFsdWVzIGhhdmUgYmVlbiBhZGRlZFxuICAgIGNvbnN0IG1ldGFkYXRhID0gZW5jb2RlTWV0YWRhdGEodGhpcy5vcHRpb25zLm1ldGFkYXRhKTtcbiAgICBpZiAobWV0YWRhdGEgIT09ICcnKSB7XG4gICAgICByZXEuc2V0SGVhZGVyKCdVcGxvYWQtTWV0YWRhdGEnLCBtZXRhZGF0YSk7XG4gICAgfVxuICAgIGxldCBwcm9taXNlO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudXBsb2FkRGF0YUR1cmluZ0NyZWF0aW9uICYmICF0aGlzLm9wdGlvbnMudXBsb2FkTGVuZ3RoRGVmZXJyZWQpIHtcbiAgICAgIHRoaXMuX29mZnNldCA9IDA7XG4gICAgICBwcm9taXNlID0gdGhpcy5fYWRkQ2h1bmtUb1JlcXVlc3QocmVxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcm90b2NvbCA9PT0gUFJPVE9DT0xfSUVURl9EUkFGVF8wMykge1xuICAgICAgICByZXEuc2V0SGVhZGVyKCdVcGxvYWQtQ29tcGxldGUnLCAnPzAnKTtcbiAgICAgIH1cbiAgICAgIHByb21pc2UgPSB0aGlzLl9zZW5kUmVxdWVzdChyZXEsIG51bGwpO1xuICAgIH1cbiAgICBwcm9taXNlLnRoZW4ocmVzID0+IHtcbiAgICAgIGlmICghaW5TdGF0dXNDYXRlZ29yeShyZXMuZ2V0U3RhdHVzKCksIDIwMCkpIHtcbiAgICAgICAgdGhpcy5fZW1pdEh0dHBFcnJvcihyZXEsIHJlcywgJ3R1czogdW5leHBlY3RlZCByZXNwb25zZSB3aGlsZSBjcmVhdGluZyB1cGxvYWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbG9jYXRpb24gPSByZXMuZ2V0SGVhZGVyKCdMb2NhdGlvbicpO1xuICAgICAgaWYgKGxvY2F0aW9uID09IG51bGwpIHtcbiAgICAgICAgdGhpcy5fZW1pdEh0dHBFcnJvcihyZXEsIHJlcywgJ3R1czogaW52YWxpZCBvciBtaXNzaW5nIExvY2F0aW9uIGhlYWRlcicpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnVybCA9IHJlc29sdmVVcmwodGhpcy5vcHRpb25zLmVuZHBvaW50LCBsb2NhdGlvbik7XG4gICAgICAoMCwgX2xvZ2dlci5sb2cpKGBDcmVhdGVkIHVwbG9hZCBhdCAke3RoaXMudXJsfWApO1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub25VcGxvYWRVcmxBdmFpbGFibGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uVXBsb2FkVXJsQXZhaWxhYmxlKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fc2l6ZSA9PT0gMCkge1xuICAgICAgICAvLyBOb3RoaW5nIHRvIHVwbG9hZCBhbmQgZmlsZSB3YXMgc3VjY2Vzc2Z1bGx5IGNyZWF0ZWRcbiAgICAgICAgdGhpcy5fZW1pdFN1Y2Nlc3MoKTtcbiAgICAgICAgdGhpcy5fc291cmNlLmNsb3NlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NhdmVVcGxvYWRJblVybFN0b3JhZ2UoKS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy51cGxvYWREYXRhRHVyaW5nQ3JlYXRpb24pIHtcbiAgICAgICAgICB0aGlzLl9oYW5kbGVVcGxvYWRSZXNwb25zZShyZXEsIHJlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fb2Zmc2V0ID0gMDtcbiAgICAgICAgICB0aGlzLl9wZXJmb3JtVXBsb2FkKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aGlzLl9lbWl0SHR0cEVycm9yKHJlcSwgbnVsbCwgJ3R1czogZmFpbGVkIHRvIGNyZWF0ZSB1cGxvYWQnLCBlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogVHJ5IHRvIHJlc3VtZSBhbiBleGlzdGluZyB1cGxvYWQuIEZpcnN0IGEgSEVBRCByZXF1ZXN0IHdpbGwgYmUgc2VudFxuICAgKiB0byByZXRyaWV2ZSB0aGUgb2Zmc2V0LiBJZiB0aGUgcmVxdWVzdCBmYWlscyBhIG5ldyB1cGxvYWQgd2lsbCBiZVxuICAgKiBjcmVhdGVkLiBJbiB0aGUgY2FzZSBvZiBhIHN1Y2Nlc3NmdWwgcmVzcG9uc2UgdGhlIGZpbGUgd2lsbCBiZSB1cGxvYWRlZC5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuICBfcmVzdW1lVXBsb2FkKCkge1xuICAgIGNvbnN0IHJlcSA9IHRoaXMuX29wZW5SZXF1ZXN0KCdIRUFEJywgdGhpcy51cmwpO1xuICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLl9zZW5kUmVxdWVzdChyZXEsIG51bGwpO1xuICAgIHByb21pc2UudGhlbihyZXMgPT4ge1xuICAgICAgY29uc3Qgc3RhdHVzID0gcmVzLmdldFN0YXR1cygpO1xuICAgICAgaWYgKCFpblN0YXR1c0NhdGVnb3J5KHN0YXR1cywgMjAwKSkge1xuICAgICAgICAvLyBJZiB0aGUgdXBsb2FkIGlzIGxvY2tlZCAoaW5kaWNhdGVkIGJ5IHRoZSA0MjMgTG9ja2VkIHN0YXR1cyBjb2RlKSwgd2VcbiAgICAgICAgLy8gZW1pdCBhbiBlcnJvciBpbnN0ZWFkIG9mIGRpcmVjdGx5IHN0YXJ0aW5nIGEgbmV3IHVwbG9hZC4gVGhpcyB3YXkgdGhlXG4gICAgICAgIC8vIHJldHJ5IGxvZ2ljIGNhbiBjYXRjaCB0aGUgZXJyb3IgYW5kIHdpbGwgcmV0cnkgdGhlIHVwbG9hZC4gQW4gdXBsb2FkXG4gICAgICAgIC8vIGlzIHVzdWFsbHkgbG9ja2VkIGZvciBhIHNob3J0IHBlcmlvZCBvZiB0aW1lIGFuZCB3aWxsIGJlIGF2YWlsYWJsZVxuICAgICAgICAvLyBhZnRlcndhcmRzLlxuICAgICAgICBpZiAoc3RhdHVzID09PSA0MjMpIHtcbiAgICAgICAgICB0aGlzLl9lbWl0SHR0cEVycm9yKHJlcSwgcmVzLCAndHVzOiB1cGxvYWQgaXMgY3VycmVudGx5IGxvY2tlZDsgcmV0cnkgbGF0ZXInKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluU3RhdHVzQ2F0ZWdvcnkoc3RhdHVzLCA0MDApKSB7XG4gICAgICAgICAgLy8gUmVtb3ZlIHN0b3JlZCBmaW5nZXJwcmludCBhbmQgY29ycmVzcG9uZGluZyBlbmRwb2ludCxcbiAgICAgICAgICAvLyBvbiBjbGllbnQgZXJyb3JzIHNpbmNlIHRoZSBmaWxlIGNhbiBub3QgYmUgZm91bmRcbiAgICAgICAgICB0aGlzLl9yZW1vdmVGcm9tVXJsU3RvcmFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmVuZHBvaW50KSB7XG4gICAgICAgICAgLy8gRG9uJ3QgYXR0ZW1wdCB0byBjcmVhdGUgYSBuZXcgdXBsb2FkIGlmIG5vIGVuZHBvaW50IGlzIHByb3ZpZGVkLlxuICAgICAgICAgIHRoaXMuX2VtaXRIdHRwRXJyb3IocmVxLCByZXMsICd0dXM6IHVuYWJsZSB0byByZXN1bWUgdXBsb2FkIChuZXcgdXBsb2FkIGNhbm5vdCBiZSBjcmVhdGVkIHdpdGhvdXQgYW4gZW5kcG9pbnQpJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVHJ5IHRvIGNyZWF0ZSBhIG5ldyB1cGxvYWRcbiAgICAgICAgdGhpcy51cmwgPSBudWxsO1xuICAgICAgICB0aGlzLl9jcmVhdGVVcGxvYWQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qgb2Zmc2V0ID0gcGFyc2VJbnQocmVzLmdldEhlYWRlcignVXBsb2FkLU9mZnNldCcpLCAxMCk7XG4gICAgICBpZiAoTnVtYmVyLmlzTmFOKG9mZnNldCkpIHtcbiAgICAgICAgdGhpcy5fZW1pdEh0dHBFcnJvcihyZXEsIHJlcywgJ3R1czogaW52YWxpZCBvciBtaXNzaW5nIG9mZnNldCB2YWx1ZScpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBsZW5ndGggPSBwYXJzZUludChyZXMuZ2V0SGVhZGVyKCdVcGxvYWQtTGVuZ3RoJyksIDEwKTtcbiAgICAgIGlmIChOdW1iZXIuaXNOYU4obGVuZ3RoKSAmJiAhdGhpcy5vcHRpb25zLnVwbG9hZExlbmd0aERlZmVycmVkICYmIHRoaXMub3B0aW9ucy5wcm90b2NvbCA9PT0gUFJPVE9DT0xfVFVTX1YxKSB7XG4gICAgICAgIHRoaXMuX2VtaXRIdHRwRXJyb3IocmVxLCByZXMsICd0dXM6IGludmFsaWQgb3IgbWlzc2luZyBsZW5ndGggdmFsdWUnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub25VcGxvYWRVcmxBdmFpbGFibGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uVXBsb2FkVXJsQXZhaWxhYmxlKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9zYXZlVXBsb2FkSW5VcmxTdG9yYWdlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vIFVwbG9hZCBoYXMgYWxyZWFkeSBiZWVuIGNvbXBsZXRlZCBhbmQgd2UgZG8gbm90IG5lZWQgdG8gc2VuZCBhZGRpdGlvbmFsXG4gICAgICAgIC8vIGRhdGEgdG8gdGhlIHNlcnZlclxuICAgICAgICBpZiAob2Zmc2V0ID09PSBsZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLl9lbWl0UHJvZ3Jlc3MobGVuZ3RoLCBsZW5ndGgpO1xuICAgICAgICAgIHRoaXMuX2VtaXRTdWNjZXNzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX29mZnNldCA9IG9mZnNldDtcbiAgICAgICAgdGhpcy5fcGVyZm9ybVVwbG9hZCgpO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRoaXMuX2VtaXRIdHRwRXJyb3IocmVxLCBudWxsLCAndHVzOiBmYWlsZWQgdG8gcmVzdW1lIHVwbG9hZCcsIGVycik7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgdXBsb2FkaW5nIHRoZSBmaWxlIHVzaW5nIFBBVENIIHJlcXVlc3RzLiBUaGUgZmlsZSB3aWxsIGJlIGRpdmlkZWRcbiAgICogaW50byBjaHVua3MgYXMgc3BlY2lmaWVkIGluIHRoZSBjaHVua1NpemUgb3B0aW9uLiBEdXJpbmcgdGhlIHVwbG9hZFxuICAgKiB0aGUgb25Qcm9ncmVzcyBldmVudCBoYW5kbGVyIG1heSBiZSBpbnZva2VkIG11bHRpcGxlIHRpbWVzLlxuICAgKlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIF9wZXJmb3JtVXBsb2FkKCkge1xuICAgIC8vIElmIHRoZSB1cGxvYWQgaGFzIGJlZW4gYWJvcnRlZCwgd2Ugd2lsbCBub3Qgc2VuZCB0aGUgbmV4dCBQQVRDSCByZXF1ZXN0LlxuICAgIC8vIFRoaXMgaXMgaW1wb3J0YW50IGlmIHRoZSBhYm9ydCBtZXRob2Qgd2FzIGNhbGxlZCBkdXJpbmcgYSBjYWxsYmFjaywgc3VjaFxuICAgIC8vIGFzIG9uQ2h1bmtDb21wbGV0ZSBvciBvblByb2dyZXNzLlxuICAgIGlmICh0aGlzLl9hYm9ydGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCByZXE7XG5cbiAgICAvLyBTb21lIGJyb3dzZXIgYW5kIHNlcnZlcnMgbWF5IG5vdCBzdXBwb3J0IHRoZSBQQVRDSCBtZXRob2QuIEZvciB0aG9zZVxuICAgIC8vIGNhc2VzLCB5b3UgY2FuIHRlbGwgdHVzLWpzLWNsaWVudCB0byB1c2UgYSBQT1NUIHJlcXVlc3Qgd2l0aCB0aGVcbiAgICAvLyBYLUhUVFAtTWV0aG9kLU92ZXJyaWRlIGhlYWRlciBmb3Igc2ltdWxhdGluZyBhIFBBVENIIHJlcXVlc3QuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVycmlkZVBhdGNoTWV0aG9kKSB7XG4gICAgICByZXEgPSB0aGlzLl9vcGVuUmVxdWVzdCgnUE9TVCcsIHRoaXMudXJsKTtcbiAgICAgIHJlcS5zZXRIZWFkZXIoJ1gtSFRUUC1NZXRob2QtT3ZlcnJpZGUnLCAnUEFUQ0gnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxID0gdGhpcy5fb3BlblJlcXVlc3QoJ1BBVENIJywgdGhpcy51cmwpO1xuICAgIH1cbiAgICByZXEuc2V0SGVhZGVyKCdVcGxvYWQtT2Zmc2V0JywgdGhpcy5fb2Zmc2V0KTtcbiAgICBjb25zdCBwcm9taXNlID0gdGhpcy5fYWRkQ2h1bmtUb1JlcXVlc3QocmVxKTtcbiAgICBwcm9taXNlLnRoZW4ocmVzID0+IHtcbiAgICAgIGlmICghaW5TdGF0dXNDYXRlZ29yeShyZXMuZ2V0U3RhdHVzKCksIDIwMCkpIHtcbiAgICAgICAgdGhpcy5fZW1pdEh0dHBFcnJvcihyZXEsIHJlcywgJ3R1czogdW5leHBlY3RlZCByZXNwb25zZSB3aGlsZSB1cGxvYWRpbmcgY2h1bmsnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5faGFuZGxlVXBsb2FkUmVzcG9uc2UocmVxLCByZXMpO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAvLyBEb24ndCBlbWl0IGFuIGVycm9yIGlmIHRoZSB1cGxvYWQgd2FzIGFib3J0ZWQgbWFudWFsbHlcbiAgICAgIGlmICh0aGlzLl9hYm9ydGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2VtaXRIdHRwRXJyb3IocmVxLCBudWxsLCBgdHVzOiBmYWlsZWQgdG8gdXBsb2FkIGNodW5rIGF0IG9mZnNldCAke3RoaXMuX29mZnNldH1gLCBlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIF9hZGRDaHVua3RvUmVxdWVzdCByZWFkcyBhIGNodW5rIGZyb20gdGhlIHNvdXJjZSBhbmQgc2VuZHMgaXQgdXNpbmcgdGhlXG4gICAqIHN1cHBsaWVkIHJlcXVlc3Qgb2JqZWN0LiBJdCB3aWxsIG5vdCBoYW5kbGUgdGhlIHJlc3BvbnNlLlxuICAgKlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIF9hZGRDaHVua1RvUmVxdWVzdChyZXEpIHtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuX29mZnNldDtcbiAgICBsZXQgZW5kID0gdGhpcy5fb2Zmc2V0ICsgdGhpcy5vcHRpb25zLmNodW5rU2l6ZTtcbiAgICByZXEuc2V0UHJvZ3Jlc3NIYW5kbGVyKGJ5dGVzU2VudCA9PiB7XG4gICAgICB0aGlzLl9lbWl0UHJvZ3Jlc3Moc3RhcnQgKyBieXRlc1NlbnQsIHRoaXMuX3NpemUpO1xuICAgIH0pO1xuICAgIHJlcS5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9vZmZzZXQrb2N0ZXQtc3RyZWFtJyk7XG5cbiAgICAvLyBUaGUgc3BlY2lmaWVkIGNodW5rU2l6ZSBtYXkgYmUgSW5maW5pdHkgb3IgdGhlIGNhbGNsdWF0ZWQgZW5kIHBvc2l0aW9uXG4gICAgLy8gbWF5IGV4Y2VlZCB0aGUgZmlsZSdzIHNpemUuIEluIGJvdGggY2FzZXMsIHdlIGxpbWl0IHRoZSBlbmQgcG9zaXRpb24gdG9cbiAgICAvLyB0aGUgaW5wdXQncyB0b3RhbCBzaXplIGZvciBzaW1wbGVyIGNhbGN1bGF0aW9ucyBhbmQgY29ycmVjdG5lc3MuXG4gICAgaWYgKChlbmQgPT09IEluZmluaXR5IHx8IGVuZCA+IHRoaXMuX3NpemUpICYmICF0aGlzLm9wdGlvbnMudXBsb2FkTGVuZ3RoRGVmZXJyZWQpIHtcbiAgICAgIGVuZCA9IHRoaXMuX3NpemU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9zb3VyY2Uuc2xpY2Uoc3RhcnQsIGVuZCkudGhlbihfcmVmMiA9PiB7XG4gICAgICBsZXQge1xuICAgICAgICB2YWx1ZSxcbiAgICAgICAgZG9uZVxuICAgICAgfSA9IF9yZWYyO1xuICAgICAgY29uc3QgdmFsdWVTaXplID0gdmFsdWUgJiYgdmFsdWUuc2l6ZSA/IHZhbHVlLnNpemUgOiAwO1xuXG4gICAgICAvLyBJZiB0aGUgdXBsb2FkIGxlbmd0aCBpcyBkZWZlcnJlZCwgdGhlIHVwbG9hZCBzaXplIHdhcyBub3Qgc3BlY2lmaWVkIGR1cmluZ1xuICAgICAgLy8gdXBsb2FkIGNyZWF0aW9uLiBTbywgaWYgdGhlIGZpbGUgcmVhZGVyIGlzIGRvbmUgcmVhZGluZywgd2Uga25vdyB0aGUgdG90YWxcbiAgICAgIC8vIHVwbG9hZCBzaXplIGFuZCBjYW4gdGVsbCB0aGUgdHVzIHNlcnZlci5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXBsb2FkTGVuZ3RoRGVmZXJyZWQgJiYgZG9uZSkge1xuICAgICAgICB0aGlzLl9zaXplID0gdGhpcy5fb2Zmc2V0ICsgdmFsdWVTaXplO1xuICAgICAgICByZXEuc2V0SGVhZGVyKCdVcGxvYWQtTGVuZ3RoJywgdGhpcy5fc2l6ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBzcGVjaWZpZWQgdXBsb2FkU2l6ZSBtaWdodCBub3QgbWF0Y2ggdGhlIGFjdHVhbCBhbW91bnQgb2YgZGF0YSB0aGF0IGEgc291cmNlXG4gICAgICAvLyBwcm92aWRlcy4gSW4gdGhlc2UgY2FzZXMsIHdlIGNhbm5vdCBzdWNjZXNzZnVsbHkgY29tcGxldGUgdGhlIHVwbG9hZCwgc28gd2VcbiAgICAgIC8vIHJhdGhlciBlcnJvciBvdXQgYW5kIGxldCB0aGUgdXNlciBrbm93LiBJZiBub3QsIHR1cy1qcy1jbGllbnQgd2lsbCBiZSBzdHVja1xuICAgICAgLy8gaW4gYSBsb29wIG9mIHJlcGVhdGluZyBlbXB0eSBQQVRDSCByZXF1ZXN0cy5cbiAgICAgIC8vIFNlZSBodHRwczovL2NvbW11bml0eS50cmFuc2xvYWRpdC5jb20vdC9ob3ctdG8tYWJvcnQtaGFuZ2luZy1jb21wYW5pb24tdXBsb2Fkcy8xNjQ4OC8xM1xuICAgICAgY29uc3QgbmV3U2l6ZSA9IHRoaXMuX29mZnNldCArIHZhbHVlU2l6ZTtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLnVwbG9hZExlbmd0aERlZmVycmVkICYmIGRvbmUgJiYgbmV3U2l6ZSAhPT0gdGhpcy5fc2l6ZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGB1cGxvYWQgd2FzIGNvbmZpZ3VyZWQgd2l0aCBhIHNpemUgb2YgJHt0aGlzLl9zaXplfSBieXRlcywgYnV0IHRoZSBzb3VyY2UgaXMgZG9uZSBhZnRlciAke25ld1NpemV9IGJ5dGVzYCkpO1xuICAgICAgfVxuICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdChyZXEpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcm90b2NvbCA9PT0gUFJPVE9DT0xfSUVURl9EUkFGVF8wMykge1xuICAgICAgICByZXEuc2V0SGVhZGVyKCdVcGxvYWQtQ29tcGxldGUnLCBkb25lID8gJz8xJyA6ICc/MCcpO1xuICAgICAgfVxuICAgICAgdGhpcy5fZW1pdFByb2dyZXNzKHRoaXMuX29mZnNldCwgdGhpcy5fc2l6ZSk7XG4gICAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QocmVxLCB2YWx1ZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogX2hhbmRsZVVwbG9hZFJlc3BvbnNlIGlzIHVzZWQgYnkgcmVxdWVzdHMgdGhhdCBoYXZlbiBiZWVuIHNlbnQgdXNpbmcgX2FkZENodW5rVG9SZXF1ZXN0XG4gICAqIGFuZCBhbHJlYWR5IGhhdmUgcmVjZWl2ZWQgYSByZXNwb25zZS5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuICBfaGFuZGxlVXBsb2FkUmVzcG9uc2UocmVxLCByZXMpIHtcbiAgICBjb25zdCBvZmZzZXQgPSBwYXJzZUludChyZXMuZ2V0SGVhZGVyKCdVcGxvYWQtT2Zmc2V0JyksIDEwKTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG9mZnNldCkpIHtcbiAgICAgIHRoaXMuX2VtaXRIdHRwRXJyb3IocmVxLCByZXMsICd0dXM6IGludmFsaWQgb3IgbWlzc2luZyBvZmZzZXQgdmFsdWUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fZW1pdFByb2dyZXNzKG9mZnNldCwgdGhpcy5fc2l6ZSk7XG4gICAgdGhpcy5fZW1pdENodW5rQ29tcGxldGUob2Zmc2V0IC0gdGhpcy5fb2Zmc2V0LCBvZmZzZXQsIHRoaXMuX3NpemUpO1xuICAgIHRoaXMuX29mZnNldCA9IG9mZnNldDtcbiAgICBpZiAob2Zmc2V0ID09PSB0aGlzLl9zaXplKSB7XG4gICAgICAvLyBZYXksIGZpbmFsbHkgZG9uZSA6KVxuICAgICAgdGhpcy5fZW1pdFN1Y2Nlc3MoKTtcbiAgICAgIHRoaXMuX3NvdXJjZS5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9wZXJmb3JtVXBsb2FkKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IEhUVFAgcmVxdWVzdCBvYmplY3Qgd2l0aCB0aGUgZ2l2ZW4gbWV0aG9kIGFuZCBVUkwuXG4gICAqXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cbiAgX29wZW5SZXF1ZXN0KG1ldGhvZCwgdXJsKSB7XG4gICAgY29uc3QgcmVxID0gb3BlblJlcXVlc3QobWV0aG9kLCB1cmwsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5fcmVxID0gcmVxO1xuICAgIHJldHVybiByZXE7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHRoZSBlbnRyeSBpbiB0aGUgVVJMIHN0b3JhZ2UsIGlmIGl0IGhhcyBiZWVuIHNhdmVkIGJlZm9yZS5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuICBfcmVtb3ZlRnJvbVVybFN0b3JhZ2UoKSB7XG4gICAgaWYgKCF0aGlzLl91cmxTdG9yYWdlS2V5KSByZXR1cm47XG4gICAgdGhpcy5fdXJsU3RvcmFnZS5yZW1vdmVVcGxvYWQodGhpcy5fdXJsU3RvcmFnZUtleSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRoaXMuX2VtaXRFcnJvcihlcnIpO1xuICAgIH0pO1xuICAgIHRoaXMuX3VybFN0b3JhZ2VLZXkgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCB0aGUgdXBsb2FkIFVSTCB0byB0aGUgVVJMIHN0b3JhZ2UsIGlmIHBvc3NpYmxlLlxuICAgKlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIF9zYXZlVXBsb2FkSW5VcmxTdG9yYWdlKCkge1xuICAgIC8vIFdlIGRvIG5vdCBzdG9yZSB0aGUgdXBsb2FkIFVSTFxuICAgIC8vIC0gaWYgaXQgd2FzIGRpc2FibGVkIGluIHRoZSBvcHRpb24sIG9yXG4gICAgLy8gLSBpZiBubyBmaW5nZXJwcmludCB3YXMgY2FsY3VsYXRlZCBmb3IgdGhlIGlucHV0IChpLmUuIGEgc3RyZWFtKSwgb3JcbiAgICAvLyAtIGlmIHRoZSBVUkwgaXMgYWxyZWFkeSBzdG9yZWQgKGkuZS4ga2V5IGlzIHNldCBhbHJlYWQpLlxuICAgIGlmICghdGhpcy5vcHRpb25zLnN0b3JlRmluZ2VycHJpbnRGb3JSZXN1bWluZyB8fCAhdGhpcy5fZmluZ2VycHJpbnQgfHwgdGhpcy5fdXJsU3RvcmFnZUtleSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBjb25zdCBzdG9yZWRVcGxvYWQgPSB7XG4gICAgICBzaXplOiB0aGlzLl9zaXplLFxuICAgICAgbWV0YWRhdGE6IHRoaXMub3B0aW9ucy5tZXRhZGF0YSxcbiAgICAgIGNyZWF0aW9uVGltZTogbmV3IERhdGUoKS50b1N0cmluZygpXG4gICAgfTtcbiAgICBpZiAodGhpcy5fcGFyYWxsZWxVcGxvYWRzKSB7XG4gICAgICAvLyBTYXZlIG11bHRpcGxlIFVSTHMgaWYgdGhlIHBhcmFsbGVsVXBsb2FkcyBvcHRpb24gaXMgdXNlZCAuLi5cbiAgICAgIHN0b3JlZFVwbG9hZC5wYXJhbGxlbFVwbG9hZFVybHMgPSB0aGlzLl9wYXJhbGxlbFVwbG9hZFVybHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIC4uLiBvdGhlcndpc2Ugd2UganVzdCBzYXZlIHRoZSBvbmUgYXZhaWxhYmxlIFVSTC5cbiAgICAgIHN0b3JlZFVwbG9hZC51cGxvYWRVcmwgPSB0aGlzLnVybDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3VybFN0b3JhZ2UuYWRkVXBsb2FkKHRoaXMuX2ZpbmdlcnByaW50LCBzdG9yZWRVcGxvYWQpLnRoZW4odXJsU3RvcmFnZUtleSA9PiB7XG4gICAgICB0aGlzLl91cmxTdG9yYWdlS2V5ID0gdXJsU3RvcmFnZUtleTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmVxdWVzdCB3aXRoIHRoZSBwcm92aWRlZCBib2R5LlxuICAgKlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIF9zZW5kUmVxdWVzdChyZXEpIHtcbiAgICBsZXQgYm9keSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogbnVsbDtcbiAgICByZXR1cm4gc2VuZFJlcXVlc3QocmVxLCBib2R5LCB0aGlzLm9wdGlvbnMpO1xuICB9XG59XG5mdW5jdGlvbiBlbmNvZGVNZXRhZGF0YShtZXRhZGF0YSkge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMobWV0YWRhdGEpLm1hcChfcmVmMyA9PiB7XG4gICAgbGV0IFtrZXksIHZhbHVlXSA9IF9yZWYzO1xuICAgIHJldHVybiBgJHtrZXl9ICR7YnRvYShTdHJpbmcodmFsdWUpKX1gO1xuICB9KS5qb2luKCcsJyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiBzdGF0dXMgaXMgaW4gdGhlIHJhbmdlIG9mIHRoZSBleHBlY3RlZCBjYXRlZ29yeS5cbiAqIEZvciBleGFtcGxlLCBvbmx5IGEgc3RhdHVzIGJldHdlZW4gMjAwIGFuZCAyOTkgd2lsbCBzYXRpc2Z5IHRoZSBjYXRlZ29yeSAyMDAuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGluU3RhdHVzQ2F0ZWdvcnkoc3RhdHVzLCBjYXRlZ29yeSkge1xuICByZXR1cm4gc3RhdHVzID49IGNhdGVnb3J5ICYmIHN0YXR1cyA8IGNhdGVnb3J5ICsgMTAwO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBIVFRQIHJlcXVlc3Qgd2l0aCB0aGUgc3BlY2lmaWVkIG1ldGhvZCBhbmQgVVJMLlxuICogVGhlIG5lY2Vzc2FyeSBoZWFkZXJzIHRoYXQgYXJlIGluY2x1ZGVkIGluIGV2ZXJ5IHJlcXVlc3RcbiAqIHdpbGwgYmUgYWRkZWQsIGluY2x1ZGluZyB0aGUgcmVxdWVzdCBJRC5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gb3BlblJlcXVlc3QobWV0aG9kLCB1cmwsIG9wdGlvbnMpIHtcbiAgY29uc3QgcmVxID0gb3B0aW9ucy5odHRwU3RhY2suY3JlYXRlUmVxdWVzdChtZXRob2QsIHVybCk7XG4gIGlmIChvcHRpb25zLnByb3RvY29sID09PSBQUk9UT0NPTF9JRVRGX0RSQUZUXzAzKSB7XG4gICAgcmVxLnNldEhlYWRlcignVXBsb2FkLURyYWZ0LUludGVyb3AtVmVyc2lvbicsICc1Jyk7XG4gIH0gZWxzZSB7XG4gICAgcmVxLnNldEhlYWRlcignVHVzLVJlc3VtYWJsZScsICcxLjAuMCcpO1xuICB9XG4gIGNvbnN0IGhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgfHwge307XG4gIE9iamVjdC5lbnRyaWVzKGhlYWRlcnMpLmZvckVhY2goX3JlZjQgPT4ge1xuICAgIGxldCBbbmFtZSwgdmFsdWVdID0gX3JlZjQ7XG4gICAgcmVxLnNldEhlYWRlcihuYW1lLCB2YWx1ZSk7XG4gIH0pO1xuICBpZiAob3B0aW9ucy5hZGRSZXF1ZXN0SWQpIHtcbiAgICBjb25zdCByZXF1ZXN0SWQgPSAoMCwgX3V1aWQuZGVmYXVsdCkoKTtcbiAgICByZXEuc2V0SGVhZGVyKCdYLVJlcXVlc3QtSUQnLCByZXF1ZXN0SWQpO1xuICB9XG4gIHJldHVybiByZXE7XG59XG5cbi8qKlxuICogU2VuZCBhIHJlcXVlc3Qgd2l0aCB0aGUgcHJvdmlkZWQgYm9keSB3aGlsZSBpbnZva2luZyB0aGUgb25CZWZvcmVSZXF1ZXN0XG4gKiBhbmQgb25BZnRlclJlc3BvbnNlIGNhbGxiYWNrcy5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuYXN5bmMgZnVuY3Rpb24gc2VuZFJlcXVlc3QocmVxLCBib2R5LCBvcHRpb25zKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5vbkJlZm9yZVJlcXVlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICBhd2FpdCBvcHRpb25zLm9uQmVmb3JlUmVxdWVzdChyZXEpO1xuICB9XG4gIGNvbnN0IHJlcyA9IGF3YWl0IHJlcS5zZW5kKGJvZHkpO1xuICBpZiAodHlwZW9mIG9wdGlvbnMub25BZnRlclJlc3BvbnNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgYXdhaXQgb3B0aW9ucy5vbkFmdGVyUmVzcG9uc2UocmVxLCByZXMpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIGJyb3dzZXIgcnVubmluZyB0aGlzIGNvZGUgaGFzIGludGVybmV0IGFjY2Vzcy5cbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHdheXMgcmV0dXJuIHRydWUgaW4gdGhlIG5vZGUuanMgZW52aXJvbm1lbnRcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gaXNPbmxpbmUoKSB7XG4gIGxldCBvbmxpbmUgPSB0cnVlO1xuICAvLyBOb3RlOiBXZSBkb24ndCByZWZlcmVuY2UgYHdpbmRvd2AgaGVyZSBiZWNhdXNlIHRoZSBuYXZpZ2F0b3Igb2JqZWN0IGFsc28gZXhpc3RzXG4gIC8vIGluIGEgV2ViIFdvcmtlcidzIGNvbnRleHQuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLm9uTGluZSA9PT0gZmFsc2UpIHtcbiAgICBvbmxpbmUgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gb25saW5lO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCBpdCBpcyBvayB0byByZXRyeSBhIHJlcXVlc3QuXG4gKiBAcGFyYW0ge0Vycm9yfERldGFpbGVkRXJyb3J9IGVyciB0aGUgZXJyb3IgcmV0dXJuZWQgZnJvbSB0aGUgbGFzdCByZXF1ZXN0XG4gKiBAcGFyYW0ge251bWJlcn0gcmV0cnlBdHRlbXB0IHRoZSBudW1iZXIgb2YgdGltZXMgdGhlIHJlcXVlc3QgaGFzIGFscmVhZHkgYmVlbiByZXRyaWVkXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB0dXMgVXBsb2FkIG9wdGlvbnNcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2hvdWxkUmV0cnkoZXJyLCByZXRyeUF0dGVtcHQsIG9wdGlvbnMpIHtcbiAgLy8gV2Ugb25seSBhdHRlbXB0IGEgcmV0cnkgaWZcbiAgLy8gLSByZXRyeURlbGF5cyBvcHRpb24gaXMgc2V0XG4gIC8vIC0gd2UgZGlkbid0IGV4Y2VlZCB0aGUgbWF4aXVtIG51bWJlciBvZiByZXRyaWVzLCB5ZXQsIGFuZFxuICAvLyAtIHRoaXMgZXJyb3Igd2FzIGNhdXNlZCBieSBhIHJlcXVlc3Qgb3IgaXQncyByZXNwb25zZSBhbmRcbiAgLy8gLSB0aGUgZXJyb3IgaXMgc2VydmVyIGVycm9yIChpLmUuIG5vdCBhIHN0YXR1cyA0eHggZXhjZXB0IGEgNDA5IG9yIDQyMykgb3JcbiAgLy8gYSBvblNob3VsZFJldHJ5IGlzIHNwZWNpZmllZCBhbmQgcmV0dXJucyB0cnVlXG4gIC8vIC0gdGhlIGJyb3dzZXIgZG9lcyBub3QgaW5kaWNhdGUgdGhhdCB3ZSBhcmUgb2ZmbGluZVxuICBpZiAob3B0aW9ucy5yZXRyeURlbGF5cyA9PSBudWxsIHx8IHJldHJ5QXR0ZW1wdCA+PSBvcHRpb25zLnJldHJ5RGVsYXlzLmxlbmd0aCB8fCBlcnIub3JpZ2luYWxSZXF1ZXN0ID09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMub25TaG91bGRSZXRyeSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBvcHRpb25zLm9uU2hvdWxkUmV0cnkoZXJyLCByZXRyeUF0dGVtcHQsIG9wdGlvbnMpO1xuICB9XG4gIHJldHVybiBkZWZhdWx0T25TaG91bGRSZXRyeShlcnIpO1xufVxuXG4vKipcbiAqIGRldGVybWluZXMgaWYgdGhlIHJlcXVlc3Qgc2hvdWxkIGJlIHJldHJpZWQuIFdpbGwgb25seSByZXRyeSBpZiBub3QgYSBzdGF0dXMgNHh4IGV4Y2VwdCBhIDQwOSBvciA0MjNcbiAqIEBwYXJhbSB7RGV0YWlsZWRFcnJvcn0gZXJyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gZGVmYXVsdE9uU2hvdWxkUmV0cnkoZXJyKSB7XG4gIGNvbnN0IHN0YXR1cyA9IGVyci5vcmlnaW5hbFJlc3BvbnNlID8gZXJyLm9yaWdpbmFsUmVzcG9uc2UuZ2V0U3RhdHVzKCkgOiAwO1xuICByZXR1cm4gKCFpblN0YXR1c0NhdGVnb3J5KHN0YXR1cywgNDAwKSB8fCBzdGF0dXMgPT09IDQwOSB8fCBzdGF0dXMgPT09IDQyMykgJiYgaXNPbmxpbmUoKTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGEgcmVsYXRpdmUgbGluayBnaXZlbiB0aGUgb3JpZ2luIGFzIHNvdXJjZS4gRm9yIGV4YW1wbGUsXG4gKiBpZiBhIEhUVFAgcmVxdWVzdCB0byBodHRwOi8vZXhhbXBsZS5jb20vZmlsZXMvIHJldHVybnMgYSBMb2NhdGlvblxuICogaGVhZGVyIHdpdGggdGhlIHZhbHVlIC91cGxvYWQvYWJjLCB0aGUgcmVzb2x2ZWQgVVJMIHdpbGwgYmU6XG4gKiBodHRwOi8vZXhhbXBsZS5jb20vdXBsb2FkL2FiY1xuICovXG5mdW5jdGlvbiByZXNvbHZlVXJsKG9yaWdpbiwgbGluaykge1xuICByZXR1cm4gbmV3IFVSTChsaW5rLCBvcmlnaW4pLnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlIHRoZSBzdGFydCBhbmQgZW5kIHBvc2l0aW9ucyBmb3IgdGhlIHBhcnRzIGlmIGFuIHVwbG9hZFxuICogaXMgc3BsaXQgaW50byBtdWx0aXBsZSBwYXJhbGxlbCByZXF1ZXN0cy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdG90YWxTaXplIFRoZSBieXRlIHNpemUgb2YgdGhlIHVwbG9hZCwgd2hpY2ggd2lsbCBiZSBzcGxpdC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBwYXJ0Q291bnQgVGhlIG51bWJlciBpbiBob3cgbWFueSBwYXJ0cyB0aGUgdXBsb2FkIHdpbGwgYmUgc3BsaXQuXG4gKiBAcmV0dXJuIHtvYmplY3RbXX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBzcGxpdFNpemVJbnRvUGFydHModG90YWxTaXplLCBwYXJ0Q291bnQpIHtcbiAgY29uc3QgcGFydFNpemUgPSBNYXRoLmZsb29yKHRvdGFsU2l6ZSAvIHBhcnRDb3VudCk7XG4gIGNvbnN0IHBhcnRzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydENvdW50OyBpKyspIHtcbiAgICBwYXJ0cy5wdXNoKHtcbiAgICAgIHN0YXJ0OiBwYXJ0U2l6ZSAqIGksXG4gICAgICBlbmQ6IHBhcnRTaXplICogKGkgKyAxKVxuICAgIH0pO1xuICB9XG4gIHBhcnRzW3BhcnRDb3VudCAtIDFdLmVuZCA9IHRvdGFsU2l6ZTtcbiAgcmV0dXJuIHBhcnRzO1xufVxuQmFzZVVwbG9hZC5kZWZhdWx0T3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zO1xudmFyIF9kZWZhdWx0ID0gZXhwb3J0cy5kZWZhdWx0ID0gQmFzZVVwbG9hZDsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHV1aWQ7XG4vKipcbiAqIEdlbmVyYXRlIGEgVVVJRCB2NCBiYXNlZCBvbiByYW5kb20gbnVtYmVycy4gV2UgaW50ZW50aW9hbmxseSB1c2UgdGhlIGxlc3NcbiAqIHNlY3VyZSBNYXRoLnJhbmRvbSBmdW5jdGlvbiBoZXJlIHNpbmNlIHRoZSBtb3JlIHNlY3VyZSBjcnlwdG8uZ2V0UmFuZG9tTnVtYmVyc1xuICogaXMgbm90IGF2YWlsYWJsZSBvbiBhbGwgcGxhdGZvcm1zLlxuICogVGhpcyBpcyBub3QgYSBwcm9ibGVtIGZvciB1cyBzaW5jZSB3ZSB1c2UgdGhlIFVVSUQgb25seSBmb3IgZ2VuZXJhdGluZyBhXG4gKiByZXF1ZXN0IElELCBzbyB3ZSBjYW4gY29ycmVsYXRlIHNlcnZlciBsb2dzIHRvIGNsaWVudCBlcnJvcnMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB0YWtlbiBmcm9tIGZvbGxvd2luZyBzaXRlOlxuICogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGdlbmVyYXRlIFVVSURcbiAqL1xuZnVuY3Rpb24gdXVpZCgpIHtcbiAgLyogZXNsaW50LWRpc2FibGUgbm8tYml0d2lzZSAqL1xuICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBjID0+IHtcbiAgICBjb25zdCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMDtcbiAgICBjb25zdCB2ID0gYyA9PT0gJ3gnID8gciA6IHIgJiAweDMgfCAweDg7XG4gICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICB9KTtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2F4aW9zJyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XG52YXIgc2V0dGxlID0gcmVxdWlyZSgnLi8uLi9jb3JlL3NldHRsZScpO1xudmFyIGNvb2tpZXMgPSByZXF1aXJlKCcuLy4uL2hlbHBlcnMvY29va2llcycpO1xudmFyIGJ1aWxkVVJMID0gcmVxdWlyZSgnLi8uLi9oZWxwZXJzL2J1aWxkVVJMJyk7XG52YXIgYnVpbGRGdWxsUGF0aCA9IHJlcXVpcmUoJy4uL2NvcmUvYnVpbGRGdWxsUGF0aCcpO1xudmFyIHBhcnNlSGVhZGVycyA9IHJlcXVpcmUoJy4vLi4vaGVscGVycy9wYXJzZUhlYWRlcnMnKTtcbnZhciBpc1VSTFNhbWVPcmlnaW4gPSByZXF1aXJlKCcuLy4uL2hlbHBlcnMvaXNVUkxTYW1lT3JpZ2luJyk7XG52YXIgdHJhbnNpdGlvbmFsRGVmYXVsdHMgPSByZXF1aXJlKCcuLi9kZWZhdWx0cy90cmFuc2l0aW9uYWwnKTtcbnZhciBBeGlvc0Vycm9yID0gcmVxdWlyZSgnLi4vY29yZS9BeGlvc0Vycm9yJyk7XG52YXIgQ2FuY2VsZWRFcnJvciA9IHJlcXVpcmUoJy4uL2NhbmNlbC9DYW5jZWxlZEVycm9yJyk7XG52YXIgcGFyc2VQcm90b2NvbCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvcGFyc2VQcm90b2NvbCcpO1xudmFyIHBsYXRmb3JtID0gcmVxdWlyZSgnLi4vcGxhdGZvcm0nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB4aHJBZGFwdGVyKGNvbmZpZykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gZGlzcGF0Y2hYaHJSZXF1ZXN0KHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXF1ZXN0RGF0YSA9IGNvbmZpZy5kYXRhO1xuICAgIHZhciByZXF1ZXN0SGVhZGVycyA9IGNvbmZpZy5oZWFkZXJzO1xuICAgIHZhciByZXNwb25zZVR5cGUgPSBjb25maWcucmVzcG9uc2VUeXBlO1xuICAgIHZhciB3aXRoWFNSRlRva2VuID0gY29uZmlnLndpdGhYU1JGVG9rZW47XG4gICAgdmFyIG9uQ2FuY2VsZWQ7XG4gICAgZnVuY3Rpb24gZG9uZSgpIHtcbiAgICAgIGlmIChjb25maWcuY2FuY2VsVG9rZW4pIHtcbiAgICAgICAgY29uZmlnLmNhbmNlbFRva2VuLnVuc3Vic2NyaWJlKG9uQ2FuY2VsZWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLnNpZ25hbCkge1xuICAgICAgICBjb25maWcuc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25DYW5jZWxlZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHV0aWxzLmlzRm9ybURhdGEocmVxdWVzdERhdGEpICYmIHV0aWxzLmlzU3RhbmRhcmRCcm93c2VyRW52KCkpIHtcbiAgICAgIGRlbGV0ZSByZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ107IC8vIExldCB0aGUgYnJvd3NlciBzZXQgaXRcbiAgICB9XG5cbiAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgLy8gSFRUUCBiYXNpYyBhdXRoZW50aWNhdGlvblxuICAgIGlmIChjb25maWcuYXV0aCkge1xuICAgICAgdmFyIHVzZXJuYW1lID0gY29uZmlnLmF1dGgudXNlcm5hbWUgfHwgJyc7XG4gICAgICB2YXIgcGFzc3dvcmQgPSBjb25maWcuYXV0aC5wYXNzd29yZCA/IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChjb25maWcuYXV0aC5wYXNzd29yZCkpIDogJyc7XG4gICAgICByZXF1ZXN0SGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcgKyBidG9hKHVzZXJuYW1lICsgJzonICsgcGFzc3dvcmQpO1xuICAgIH1cblxuICAgIHZhciBmdWxsUGF0aCA9IGJ1aWxkRnVsbFBhdGgoY29uZmlnLmJhc2VVUkwsIGNvbmZpZy51cmwpO1xuXG4gICAgcmVxdWVzdC5vcGVuKGNvbmZpZy5tZXRob2QudG9VcHBlckNhc2UoKSwgYnVpbGRVUkwoZnVsbFBhdGgsIGNvbmZpZy5wYXJhbXMsIGNvbmZpZy5wYXJhbXNTZXJpYWxpemVyKSwgdHJ1ZSk7XG5cbiAgICAvLyBTZXQgdGhlIHJlcXVlc3QgdGltZW91dCBpbiBNU1xuICAgIHJlcXVlc3QudGltZW91dCA9IGNvbmZpZy50aW1lb3V0O1xuXG4gICAgZnVuY3Rpb24gb25sb2FkZW5kKCkge1xuICAgICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIFByZXBhcmUgdGhlIHJlc3BvbnNlXG4gICAgICB2YXIgcmVzcG9uc2VIZWFkZXJzID0gJ2dldEFsbFJlc3BvbnNlSGVhZGVycycgaW4gcmVxdWVzdCA/IHBhcnNlSGVhZGVycyhyZXF1ZXN0LmdldEFsbFJlc3BvbnNlSGVhZGVycygpKSA6IG51bGw7XG4gICAgICB2YXIgcmVzcG9uc2VEYXRhID0gIXJlc3BvbnNlVHlwZSB8fCByZXNwb25zZVR5cGUgPT09ICd0ZXh0JyB8fCAgcmVzcG9uc2VUeXBlID09PSAnanNvbicgP1xuICAgICAgICByZXF1ZXN0LnJlc3BvbnNlVGV4dCA6IHJlcXVlc3QucmVzcG9uc2U7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7XG4gICAgICAgIGRhdGE6IHJlc3BvbnNlRGF0YSxcbiAgICAgICAgc3RhdHVzOiByZXF1ZXN0LnN0YXR1cyxcbiAgICAgICAgc3RhdHVzVGV4dDogcmVxdWVzdC5zdGF0dXNUZXh0LFxuICAgICAgICBoZWFkZXJzOiByZXNwb25zZUhlYWRlcnMsXG4gICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICByZXF1ZXN0OiByZXF1ZXN0XG4gICAgICB9O1xuXG4gICAgICBzZXR0bGUoZnVuY3Rpb24gX3Jlc29sdmUodmFsdWUpIHtcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH0sIGZ1bmN0aW9uIF9yZWplY3QoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICBkb25lKCk7XG4gICAgICB9LCByZXNwb25zZSk7XG5cbiAgICAgIC8vIENsZWFuIHVwIHJlcXVlc3RcbiAgICAgIHJlcXVlc3QgPSBudWxsO1xuICAgIH1cblxuICAgIGlmICgnb25sb2FkZW5kJyBpbiByZXF1ZXN0KSB7XG4gICAgICAvLyBVc2Ugb25sb2FkZW5kIGlmIGF2YWlsYWJsZVxuICAgICAgcmVxdWVzdC5vbmxvYWRlbmQgPSBvbmxvYWRlbmQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIExpc3RlbiBmb3IgcmVhZHkgc3RhdGUgdG8gZW11bGF0ZSBvbmxvYWRlbmRcbiAgICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gaGFuZGxlTG9hZCgpIHtcbiAgICAgICAgaWYgKCFyZXF1ZXN0IHx8IHJlcXVlc3QucmVhZHlTdGF0ZSAhPT0gNCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSByZXF1ZXN0IGVycm9yZWQgb3V0IGFuZCB3ZSBkaWRuJ3QgZ2V0IGEgcmVzcG9uc2UsIHRoaXMgd2lsbCBiZVxuICAgICAgICAvLyBoYW5kbGVkIGJ5IG9uZXJyb3IgaW5zdGVhZFxuICAgICAgICAvLyBXaXRoIG9uZSBleGNlcHRpb246IHJlcXVlc3QgdGhhdCB1c2luZyBmaWxlOiBwcm90b2NvbCwgbW9zdCBicm93c2Vyc1xuICAgICAgICAvLyB3aWxsIHJldHVybiBzdGF0dXMgYXMgMCBldmVuIHRob3VnaCBpdCdzIGEgc3VjY2Vzc2Z1bCByZXF1ZXN0XG4gICAgICAgIGlmIChyZXF1ZXN0LnN0YXR1cyA9PT0gMCAmJiAhKHJlcXVlc3QucmVzcG9uc2VVUkwgJiYgcmVxdWVzdC5yZXNwb25zZVVSTC5pbmRleE9mKCdmaWxlOicpID09PSAwKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyByZWFkeXN0YXRlIGhhbmRsZXIgaXMgY2FsbGluZyBiZWZvcmUgb25lcnJvciBvciBvbnRpbWVvdXQgaGFuZGxlcnMsXG4gICAgICAgIC8vIHNvIHdlIHNob3VsZCBjYWxsIG9ubG9hZGVuZCBvbiB0aGUgbmV4dCAndGljaydcbiAgICAgICAgc2V0VGltZW91dChvbmxvYWRlbmQpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgYnJvd3NlciByZXF1ZXN0IGNhbmNlbGxhdGlvbiAoYXMgb3Bwb3NlZCB0byBhIG1hbnVhbCBjYW5jZWxsYXRpb24pXG4gICAgcmVxdWVzdC5vbmFib3J0ID0gZnVuY3Rpb24gaGFuZGxlQWJvcnQoKSB7XG4gICAgICBpZiAoIXJlcXVlc3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZWplY3QobmV3IEF4aW9zRXJyb3IoJ1JlcXVlc3QgYWJvcnRlZCcsIEF4aW9zRXJyb3IuRUNPTk5BQk9SVEVELCBjb25maWcsIHJlcXVlc3QpKTtcblxuICAgICAgLy8gQ2xlYW4gdXAgcmVxdWVzdFxuICAgICAgcmVxdWVzdCA9IG51bGw7XG4gICAgfTtcblxuICAgIC8vIEhhbmRsZSBsb3cgbGV2ZWwgbmV0d29yayBlcnJvcnNcbiAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiBoYW5kbGVFcnJvcigpIHtcbiAgICAgIC8vIFJlYWwgZXJyb3JzIGFyZSBoaWRkZW4gZnJvbSB1cyBieSB0aGUgYnJvd3NlclxuICAgICAgLy8gb25lcnJvciBzaG91bGQgb25seSBmaXJlIGlmIGl0J3MgYSBuZXR3b3JrIGVycm9yXG4gICAgICByZWplY3QobmV3IEF4aW9zRXJyb3IoJ05ldHdvcmsgRXJyb3InLCBBeGlvc0Vycm9yLkVSUl9ORVRXT1JLLCBjb25maWcsIHJlcXVlc3QpKTtcblxuICAgICAgLy8gQ2xlYW4gdXAgcmVxdWVzdFxuICAgICAgcmVxdWVzdCA9IG51bGw7XG4gICAgfTtcblxuICAgIC8vIEhhbmRsZSB0aW1lb3V0XG4gICAgcmVxdWVzdC5vbnRpbWVvdXQgPSBmdW5jdGlvbiBoYW5kbGVUaW1lb3V0KCkge1xuICAgICAgdmFyIHRpbWVvdXRFcnJvck1lc3NhZ2UgPSBjb25maWcudGltZW91dCA/ICd0aW1lb3V0IG9mICcgKyBjb25maWcudGltZW91dCArICdtcyBleGNlZWRlZCcgOiAndGltZW91dCBleGNlZWRlZCc7XG4gICAgICB2YXIgdHJhbnNpdGlvbmFsID0gY29uZmlnLnRyYW5zaXRpb25hbCB8fCB0cmFuc2l0aW9uYWxEZWZhdWx0cztcbiAgICAgIGlmIChjb25maWcudGltZW91dEVycm9yTWVzc2FnZSkge1xuICAgICAgICB0aW1lb3V0RXJyb3JNZXNzYWdlID0gY29uZmlnLnRpbWVvdXRFcnJvck1lc3NhZ2U7XG4gICAgICB9XG4gICAgICByZWplY3QobmV3IEF4aW9zRXJyb3IoXG4gICAgICAgIHRpbWVvdXRFcnJvck1lc3NhZ2UsXG4gICAgICAgIHRyYW5zaXRpb25hbC5jbGFyaWZ5VGltZW91dEVycm9yID8gQXhpb3NFcnJvci5FVElNRURPVVQgOiBBeGlvc0Vycm9yLkVDT05OQUJPUlRFRCxcbiAgICAgICAgY29uZmlnLFxuICAgICAgICByZXF1ZXN0KSk7XG5cbiAgICAgIC8vIENsZWFuIHVwIHJlcXVlc3RcbiAgICAgIHJlcXVlc3QgPSBudWxsO1xuICAgIH07XG5cbiAgICAvLyBBZGQgeHNyZiBoZWFkZXJcbiAgICAvLyBUaGlzIGlzIG9ubHkgZG9uZSBpZiBydW5uaW5nIGluIGEgc3RhbmRhcmQgYnJvd3NlciBlbnZpcm9ubWVudC5cbiAgICAvLyBTcGVjaWZpY2FsbHkgbm90IGlmIHdlJ3JlIGluIGEgd2ViIHdvcmtlciwgb3IgcmVhY3QtbmF0aXZlLlxuICAgIGlmICh1dGlscy5pc1N0YW5kYXJkQnJvd3NlckVudigpKSB7XG4gICAgICAvLyBBZGQgeHNyZiBoZWFkZXJcbiAgICAgIHdpdGhYU1JGVG9rZW4gJiYgdXRpbHMuaXNGdW5jdGlvbih3aXRoWFNSRlRva2VuKSAmJiAod2l0aFhTUkZUb2tlbiA9IHdpdGhYU1JGVG9rZW4oY29uZmlnKSk7XG4gICAgICBpZiAod2l0aFhTUkZUb2tlbiB8fCAod2l0aFhTUkZUb2tlbiAhPT0gZmFsc2UgJiYgaXNVUkxTYW1lT3JpZ2luKGZ1bGxQYXRoKSkpIHtcbiAgICAgICAgLy8gQWRkIHhzcmYgaGVhZGVyXG4gICAgICAgIHZhciB4c3JmVmFsdWUgPSBjb25maWcueHNyZkhlYWRlck5hbWUgJiYgY29uZmlnLnhzcmZDb29raWVOYW1lICYmIGNvb2tpZXMucmVhZChjb25maWcueHNyZkNvb2tpZU5hbWUpO1xuICAgICAgICBpZiAoeHNyZlZhbHVlKSB7XG4gICAgICAgICAgcmVxdWVzdEhlYWRlcnNbY29uZmlnLnhzcmZIZWFkZXJOYW1lXSA9IHhzcmZWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZCBoZWFkZXJzIHRvIHRoZSByZXF1ZXN0XG4gICAgaWYgKCdzZXRSZXF1ZXN0SGVhZGVyJyBpbiByZXF1ZXN0KSB7XG4gICAgICB1dGlscy5mb3JFYWNoKHJlcXVlc3RIZWFkZXJzLCBmdW5jdGlvbiBzZXRSZXF1ZXN0SGVhZGVyKHZhbCwga2V5KSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVxdWVzdERhdGEgPT09ICd1bmRlZmluZWQnICYmIGtleS50b0xvd2VyQ2FzZSgpID09PSAnY29udGVudC10eXBlJykge1xuICAgICAgICAgIC8vIFJlbW92ZSBDb250ZW50LVR5cGUgaWYgZGF0YSBpcyB1bmRlZmluZWRcbiAgICAgICAgICBkZWxldGUgcmVxdWVzdEhlYWRlcnNba2V5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBPdGhlcndpc2UgYWRkIGhlYWRlciB0byB0aGUgcmVxdWVzdFxuICAgICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcihrZXksIHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEFkZCB3aXRoQ3JlZGVudGlhbHMgdG8gcmVxdWVzdCBpZiBuZWVkZWRcbiAgICBpZiAoIXV0aWxzLmlzVW5kZWZpbmVkKGNvbmZpZy53aXRoQ3JlZGVudGlhbHMpKSB7XG4gICAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9ICEhY29uZmlnLndpdGhDcmVkZW50aWFscztcbiAgICB9XG5cbiAgICAvLyBBZGQgcmVzcG9uc2VUeXBlIHRvIHJlcXVlc3QgaWYgbmVlZGVkXG4gICAgaWYgKHJlc3BvbnNlVHlwZSAmJiByZXNwb25zZVR5cGUgIT09ICdqc29uJykge1xuICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBjb25maWcucmVzcG9uc2VUeXBlO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBwcm9ncmVzcyBpZiBuZWVkZWRcbiAgICBpZiAodHlwZW9mIGNvbmZpZy5vbkRvd25sb2FkUHJvZ3Jlc3MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBjb25maWcub25Eb3dubG9hZFByb2dyZXNzKTtcbiAgICB9XG5cbiAgICAvLyBOb3QgYWxsIGJyb3dzZXJzIHN1cHBvcnQgdXBsb2FkIGV2ZW50c1xuICAgIGlmICh0eXBlb2YgY29uZmlnLm9uVXBsb2FkUHJvZ3Jlc3MgPT09ICdmdW5jdGlvbicgJiYgcmVxdWVzdC51cGxvYWQpIHtcbiAgICAgIHJlcXVlc3QudXBsb2FkLmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgY29uZmlnLm9uVXBsb2FkUHJvZ3Jlc3MpO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuY2FuY2VsVG9rZW4gfHwgY29uZmlnLnNpZ25hbCkge1xuICAgICAgLy8gSGFuZGxlIGNhbmNlbGxhdGlvblxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbiAgICAgIG9uQ2FuY2VsZWQgPSBmdW5jdGlvbihjYW5jZWwpIHtcbiAgICAgICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlamVjdCghY2FuY2VsIHx8IGNhbmNlbC50eXBlID8gbmV3IENhbmNlbGVkRXJyb3IobnVsbCwgY29uZmlnLCByZXF1ZXN0KSA6IGNhbmNlbCk7XG4gICAgICAgIHJlcXVlc3QuYWJvcnQoKTtcbiAgICAgICAgcmVxdWVzdCA9IG51bGw7XG4gICAgICB9O1xuXG4gICAgICBjb25maWcuY2FuY2VsVG9rZW4gJiYgY29uZmlnLmNhbmNlbFRva2VuLnN1YnNjcmliZShvbkNhbmNlbGVkKTtcbiAgICAgIGlmIChjb25maWcuc2lnbmFsKSB7XG4gICAgICAgIGNvbmZpZy5zaWduYWwuYWJvcnRlZCA/IG9uQ2FuY2VsZWQoKSA6IGNvbmZpZy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkNhbmNlbGVkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBmYWxzZSwgMCAoemVybyBudW1iZXIpLCBhbmQgJycgKGVtcHR5IHN0cmluZykgYXJlIHZhbGlkIEpTT04gdmFsdWVzXG4gICAgaWYgKCFyZXF1ZXN0RGF0YSAmJiByZXF1ZXN0RGF0YSAhPT0gZmFsc2UgJiYgcmVxdWVzdERhdGEgIT09IDAgJiYgcmVxdWVzdERhdGEgIT09ICcnKSB7XG4gICAgICByZXF1ZXN0RGF0YSA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHByb3RvY29sID0gcGFyc2VQcm90b2NvbChmdWxsUGF0aCk7XG5cbiAgICBpZiAocHJvdG9jb2wgJiYgcGxhdGZvcm0ucHJvdG9jb2xzLmluZGV4T2YocHJvdG9jb2wpID09PSAtMSkge1xuICAgICAgcmVqZWN0KG5ldyBBeGlvc0Vycm9yKCdVbnN1cHBvcnRlZCBwcm90b2NvbCAnICsgcHJvdG9jb2wgKyAnOicsIEF4aW9zRXJyb3IuRVJSX0JBRF9SRVFVRVNULCBjb25maWcpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cblxuICAgIC8vIFNlbmQgdGhlIHJlcXVlc3RcbiAgICByZXF1ZXN0LnNlbmQocmVxdWVzdERhdGEpO1xuICB9KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBiaW5kID0gcmVxdWlyZSgnLi9oZWxwZXJzL2JpbmQnKTtcbnZhciBBeGlvcyA9IHJlcXVpcmUoJy4vY29yZS9BeGlvcycpO1xudmFyIG1lcmdlQ29uZmlnID0gcmVxdWlyZSgnLi9jb3JlL21lcmdlQ29uZmlnJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyk7XG52YXIgZm9ybURhdGFUb0pTT04gPSByZXF1aXJlKCcuL2hlbHBlcnMvZm9ybURhdGFUb0pTT04nKTtcbi8qKlxuICogQ3JlYXRlIGFuIGluc3RhbmNlIG9mIEF4aW9zXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlZmF1bHRDb25maWcgVGhlIGRlZmF1bHQgY29uZmlnIGZvciB0aGUgaW5zdGFuY2VcbiAqIEByZXR1cm4ge0F4aW9zfSBBIG5ldyBpbnN0YW5jZSBvZiBBeGlvc1xuICovXG5mdW5jdGlvbiBjcmVhdGVJbnN0YW5jZShkZWZhdWx0Q29uZmlnKSB7XG4gIHZhciBjb250ZXh0ID0gbmV3IEF4aW9zKGRlZmF1bHRDb25maWcpO1xuICB2YXIgaW5zdGFuY2UgPSBiaW5kKEF4aW9zLnByb3RvdHlwZS5yZXF1ZXN0LCBjb250ZXh0KTtcblxuICAvLyBDb3B5IGF4aW9zLnByb3RvdHlwZSB0byBpbnN0YW5jZVxuICB1dGlscy5leHRlbmQoaW5zdGFuY2UsIEF4aW9zLnByb3RvdHlwZSwgY29udGV4dCk7XG5cbiAgLy8gQ29weSBjb250ZXh0IHRvIGluc3RhbmNlXG4gIHV0aWxzLmV4dGVuZChpbnN0YW5jZSwgY29udGV4dCk7XG5cbiAgLy8gRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGluc3RhbmNlc1xuICBpbnN0YW5jZS5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoaW5zdGFuY2VDb25maWcpIHtcbiAgICByZXR1cm4gY3JlYXRlSW5zdGFuY2UobWVyZ2VDb25maWcoZGVmYXVsdENvbmZpZywgaW5zdGFuY2VDb25maWcpKTtcbiAgfTtcblxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbi8vIENyZWF0ZSB0aGUgZGVmYXVsdCBpbnN0YW5jZSB0byBiZSBleHBvcnRlZFxudmFyIGF4aW9zID0gY3JlYXRlSW5zdGFuY2UoZGVmYXVsdHMpO1xuXG4vLyBFeHBvc2UgQXhpb3MgY2xhc3MgdG8gYWxsb3cgY2xhc3MgaW5oZXJpdGFuY2VcbmF4aW9zLkF4aW9zID0gQXhpb3M7XG5cbi8vIEV4cG9zZSBDYW5jZWwgJiBDYW5jZWxUb2tlblxuYXhpb3MuQ2FuY2VsZWRFcnJvciA9IHJlcXVpcmUoJy4vY2FuY2VsL0NhbmNlbGVkRXJyb3InKTtcbmF4aW9zLkNhbmNlbFRva2VuID0gcmVxdWlyZSgnLi9jYW5jZWwvQ2FuY2VsVG9rZW4nKTtcbmF4aW9zLmlzQ2FuY2VsID0gcmVxdWlyZSgnLi9jYW5jZWwvaXNDYW5jZWwnKTtcbmF4aW9zLlZFUlNJT04gPSByZXF1aXJlKCcuL2Vudi9kYXRhJykudmVyc2lvbjtcbmF4aW9zLnRvRm9ybURhdGEgPSByZXF1aXJlKCcuL2hlbHBlcnMvdG9Gb3JtRGF0YScpO1xuXG4vLyBFeHBvc2UgQXhpb3NFcnJvciBjbGFzc1xuYXhpb3MuQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4uL2xpYi9jb3JlL0F4aW9zRXJyb3InKTtcblxuLy8gYWxpYXMgZm9yIENhbmNlbGVkRXJyb3IgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbmF4aW9zLkNhbmNlbCA9IGF4aW9zLkNhbmNlbGVkRXJyb3I7XG5cbi8vIEV4cG9zZSBhbGwvc3ByZWFkXG5heGlvcy5hbGwgPSBmdW5jdGlvbiBhbGwocHJvbWlzZXMpIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbn07XG5heGlvcy5zcHJlYWQgPSByZXF1aXJlKCcuL2hlbHBlcnMvc3ByZWFkJyk7XG5cbi8vIEV4cG9zZSBpc0F4aW9zRXJyb3JcbmF4aW9zLmlzQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4vaGVscGVycy9pc0F4aW9zRXJyb3InKTtcblxuYXhpb3MuZm9ybVRvSlNPTiA9IGZ1bmN0aW9uKHRoaW5nKSB7XG4gIHJldHVybiBmb3JtRGF0YVRvSlNPTih1dGlscy5pc0hUTUxGb3JtKHRoaW5nKSA/IG5ldyBGb3JtRGF0YSh0aGluZykgOiB0aGluZyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGF4aW9zO1xuXG4vLyBBbGxvdyB1c2Ugb2YgZGVmYXVsdCBpbXBvcnQgc3ludGF4IGluIFR5cGVTY3JpcHRcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBheGlvcztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENhbmNlbGVkRXJyb3IgPSByZXF1aXJlKCcuL0NhbmNlbGVkRXJyb3InKTtcblxuLyoqXG4gKiBBIGBDYW5jZWxUb2tlbmAgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVxdWVzdCBjYW5jZWxsYXRpb24gb2YgYW4gb3BlcmF0aW9uLlxuICpcbiAqIEBjbGFzc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZXhlY3V0b3IgVGhlIGV4ZWN1dG9yIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBDYW5jZWxUb2tlbihleGVjdXRvcikge1xuICBpZiAodHlwZW9mIGV4ZWN1dG9yICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZXhlY3V0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICB9XG5cbiAgdmFyIHJlc29sdmVQcm9taXNlO1xuXG4gIHRoaXMucHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIHByb21pc2VFeGVjdXRvcihyZXNvbHZlKSB7XG4gICAgcmVzb2x2ZVByb21pc2UgPSByZXNvbHZlO1xuICB9KTtcblxuICB2YXIgdG9rZW4gPSB0aGlzO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG4gIHRoaXMucHJvbWlzZS50aGVuKGZ1bmN0aW9uKGNhbmNlbCkge1xuICAgIGlmICghdG9rZW4uX2xpc3RlbmVycykgcmV0dXJuO1xuXG4gICAgdmFyIGkgPSB0b2tlbi5fbGlzdGVuZXJzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgICB0b2tlbi5fbGlzdGVuZXJzW2ldKGNhbmNlbCk7XG4gICAgfVxuICAgIHRva2VuLl9saXN0ZW5lcnMgPSBudWxsO1xuICB9KTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xuICB0aGlzLnByb21pc2UudGhlbiA9IGZ1bmN0aW9uKG9uZnVsZmlsbGVkKSB7XG4gICAgdmFyIF9yZXNvbHZlO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICB0b2tlbi5zdWJzY3JpYmUocmVzb2x2ZSk7XG4gICAgICBfcmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgfSkudGhlbihvbmZ1bGZpbGxlZCk7XG5cbiAgICBwcm9taXNlLmNhbmNlbCA9IGZ1bmN0aW9uIHJlamVjdCgpIHtcbiAgICAgIHRva2VuLnVuc3Vic2NyaWJlKF9yZXNvbHZlKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH07XG5cbiAgZXhlY3V0b3IoZnVuY3Rpb24gY2FuY2VsKG1lc3NhZ2UsIGNvbmZpZywgcmVxdWVzdCkge1xuICAgIGlmICh0b2tlbi5yZWFzb24pIHtcbiAgICAgIC8vIENhbmNlbGxhdGlvbiBoYXMgYWxyZWFkeSBiZWVuIHJlcXVlc3RlZFxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRva2VuLnJlYXNvbiA9IG5ldyBDYW5jZWxlZEVycm9yKG1lc3NhZ2UsIGNvbmZpZywgcmVxdWVzdCk7XG4gICAgcmVzb2x2ZVByb21pc2UodG9rZW4ucmVhc29uKTtcbiAgfSk7XG59XG5cbi8qKlxuICogVGhyb3dzIGEgYENhbmNlbGVkRXJyb3JgIGlmIGNhbmNlbGxhdGlvbiBoYXMgYmVlbiByZXF1ZXN0ZWQuXG4gKi9cbkNhbmNlbFRva2VuLnByb3RvdHlwZS50aHJvd0lmUmVxdWVzdGVkID0gZnVuY3Rpb24gdGhyb3dJZlJlcXVlc3RlZCgpIHtcbiAgaWYgKHRoaXMucmVhc29uKSB7XG4gICAgdGhyb3cgdGhpcy5yZWFzb247XG4gIH1cbn07XG5cbi8qKlxuICogU3Vic2NyaWJlIHRvIHRoZSBjYW5jZWwgc2lnbmFsXG4gKi9cblxuQ2FuY2VsVG9rZW4ucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIHN1YnNjcmliZShsaXN0ZW5lcikge1xuICBpZiAodGhpcy5yZWFzb24pIHtcbiAgICBsaXN0ZW5lcih0aGlzLnJlYXNvbik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHRoaXMuX2xpc3RlbmVycykge1xuICAgIHRoaXMuX2xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9saXN0ZW5lcnMgPSBbbGlzdGVuZXJdO1xuICB9XG59O1xuXG4vKipcbiAqIFVuc3Vic2NyaWJlIGZyb20gdGhlIGNhbmNlbCBzaWduYWxcbiAqL1xuXG5DYW5jZWxUb2tlbi5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShsaXN0ZW5lcikge1xuICBpZiAoIXRoaXMuX2xpc3RlbmVycykge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgaW5kZXggPSB0aGlzLl9saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICB0aGlzLl9saXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXR1cm5zIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGEgbmV3IGBDYW5jZWxUb2tlbmAgYW5kIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsXG4gKiBjYW5jZWxzIHRoZSBgQ2FuY2VsVG9rZW5gLlxuICovXG5DYW5jZWxUb2tlbi5zb3VyY2UgPSBmdW5jdGlvbiBzb3VyY2UoKSB7XG4gIHZhciBjYW5jZWw7XG4gIHZhciB0b2tlbiA9IG5ldyBDYW5jZWxUb2tlbihmdW5jdGlvbiBleGVjdXRvcihjKSB7XG4gICAgY2FuY2VsID0gYztcbiAgfSk7XG4gIHJldHVybiB7XG4gICAgdG9rZW46IHRva2VuLFxuICAgIGNhbmNlbDogY2FuY2VsXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbmNlbFRva2VuO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4uL2NvcmUvQXhpb3NFcnJvcicpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBBIGBDYW5jZWxlZEVycm9yYCBpcyBhbiBvYmplY3QgdGhhdCBpcyB0aHJvd24gd2hlbiBhbiBvcGVyYXRpb24gaXMgY2FuY2VsZWQuXG4gKlxuICogQGNsYXNzXG4gKiBAcGFyYW0ge3N0cmluZz19IG1lc3NhZ2UgVGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdD19IGNvbmZpZyBUaGUgY29uZmlnLlxuICogQHBhcmFtIHtPYmplY3Q9fSByZXF1ZXN0IFRoZSByZXF1ZXN0LlxuICovXG5mdW5jdGlvbiBDYW5jZWxlZEVycm9yKG1lc3NhZ2UsIGNvbmZpZywgcmVxdWVzdCkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZXEtbnVsbCxlcWVxZXFcbiAgQXhpb3NFcnJvci5jYWxsKHRoaXMsIG1lc3NhZ2UgPT0gbnVsbCA/ICdjYW5jZWxlZCcgOiBtZXNzYWdlLCBBeGlvc0Vycm9yLkVSUl9DQU5DRUxFRCwgY29uZmlnLCByZXF1ZXN0KTtcbiAgdGhpcy5uYW1lID0gJ0NhbmNlbGVkRXJyb3InO1xufVxuXG51dGlscy5pbmhlcml0cyhDYW5jZWxlZEVycm9yLCBBeGlvc0Vycm9yLCB7XG4gIF9fQ0FOQ0VMX186IHRydWVcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbmNlbGVkRXJyb3I7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNDYW5jZWwodmFsdWUpIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmIHZhbHVlLl9fQ0FOQ0VMX18pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xudmFyIGJ1aWxkVVJMID0gcmVxdWlyZSgnLi4vaGVscGVycy9idWlsZFVSTCcpO1xudmFyIEludGVyY2VwdG9yTWFuYWdlciA9IHJlcXVpcmUoJy4vSW50ZXJjZXB0b3JNYW5hZ2VyJyk7XG52YXIgZGlzcGF0Y2hSZXF1ZXN0ID0gcmVxdWlyZSgnLi9kaXNwYXRjaFJlcXVlc3QnKTtcbnZhciBtZXJnZUNvbmZpZyA9IHJlcXVpcmUoJy4vbWVyZ2VDb25maWcnKTtcbnZhciBidWlsZEZ1bGxQYXRoID0gcmVxdWlyZSgnLi9idWlsZEZ1bGxQYXRoJyk7XG52YXIgdmFsaWRhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy92YWxpZGF0b3InKTtcblxudmFyIHZhbGlkYXRvcnMgPSB2YWxpZGF0b3IudmFsaWRhdG9ycztcbi8qKlxuICogQ3JlYXRlIGEgbmV3IGluc3RhbmNlIG9mIEF4aW9zXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGluc3RhbmNlQ29uZmlnIFRoZSBkZWZhdWx0IGNvbmZpZyBmb3IgdGhlIGluc3RhbmNlXG4gKi9cbmZ1bmN0aW9uIEF4aW9zKGluc3RhbmNlQ29uZmlnKSB7XG4gIHRoaXMuZGVmYXVsdHMgPSBpbnN0YW5jZUNvbmZpZztcbiAgdGhpcy5pbnRlcmNlcHRvcnMgPSB7XG4gICAgcmVxdWVzdDogbmV3IEludGVyY2VwdG9yTWFuYWdlcigpLFxuICAgIHJlc3BvbnNlOiBuZXcgSW50ZXJjZXB0b3JNYW5hZ2VyKClcbiAgfTtcbn1cblxuLyoqXG4gKiBEaXNwYXRjaCBhIHJlcXVlc3RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGNvbmZpZ09yVXJsIFRoZSBjb25maWcgc3BlY2lmaWMgZm9yIHRoaXMgcmVxdWVzdCAobWVyZ2VkIHdpdGggdGhpcy5kZWZhdWx0cylcbiAqIEBwYXJhbSB7P09iamVjdH0gY29uZmlnXG4gKi9cbkF4aW9zLnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdChjb25maWdPclVybCwgY29uZmlnKSB7XG4gIC8qZXNsaW50IG5vLXBhcmFtLXJlYXNzaWduOjAqL1xuICAvLyBBbGxvdyBmb3IgYXhpb3MoJ2V4YW1wbGUvdXJsJ1ssIGNvbmZpZ10pIGEgbGEgZmV0Y2ggQVBJXG4gIGlmICh0eXBlb2YgY29uZmlnT3JVcmwgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGNvbmZpZy51cmwgPSBjb25maWdPclVybDtcbiAgfSBlbHNlIHtcbiAgICBjb25maWcgPSBjb25maWdPclVybCB8fCB7fTtcbiAgfVxuXG4gIGNvbmZpZyA9IG1lcmdlQ29uZmlnKHRoaXMuZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgLy8gU2V0IGNvbmZpZy5tZXRob2RcbiAgaWYgKGNvbmZpZy5tZXRob2QpIHtcbiAgICBjb25maWcubWV0aG9kID0gY29uZmlnLm1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuICB9IGVsc2UgaWYgKHRoaXMuZGVmYXVsdHMubWV0aG9kKSB7XG4gICAgY29uZmlnLm1ldGhvZCA9IHRoaXMuZGVmYXVsdHMubWV0aG9kLnRvTG93ZXJDYXNlKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uZmlnLm1ldGhvZCA9ICdnZXQnO1xuICB9XG5cbiAgdmFyIHRyYW5zaXRpb25hbCA9IGNvbmZpZy50cmFuc2l0aW9uYWw7XG5cbiAgaWYgKHRyYW5zaXRpb25hbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFsaWRhdG9yLmFzc2VydE9wdGlvbnModHJhbnNpdGlvbmFsLCB7XG4gICAgICBzaWxlbnRKU09OUGFyc2luZzogdmFsaWRhdG9ycy50cmFuc2l0aW9uYWwodmFsaWRhdG9ycy5ib29sZWFuKSxcbiAgICAgIGZvcmNlZEpTT05QYXJzaW5nOiB2YWxpZGF0b3JzLnRyYW5zaXRpb25hbCh2YWxpZGF0b3JzLmJvb2xlYW4pLFxuICAgICAgY2xhcmlmeVRpbWVvdXRFcnJvcjogdmFsaWRhdG9ycy50cmFuc2l0aW9uYWwodmFsaWRhdG9ycy5ib29sZWFuKVxuICAgIH0sIGZhbHNlKTtcbiAgfVxuXG4gIHZhciBwYXJhbXNTZXJpYWxpemVyID0gY29uZmlnLnBhcmFtc1NlcmlhbGl6ZXI7XG5cbiAgaWYgKHBhcmFtc1NlcmlhbGl6ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhbGlkYXRvci5hc3NlcnRPcHRpb25zKHBhcmFtc1NlcmlhbGl6ZXIsIHtcbiAgICAgIGVuY29kZTogdmFsaWRhdG9ycy5mdW5jdGlvbixcbiAgICAgIHNlcmlhbGl6ZTogdmFsaWRhdG9ycy5mdW5jdGlvblxuICAgIH0sIHRydWUpO1xuICB9XG5cbiAgdXRpbHMuaXNGdW5jdGlvbihwYXJhbXNTZXJpYWxpemVyKSAmJiAoY29uZmlnLnBhcmFtc1NlcmlhbGl6ZXIgPSB7c2VyaWFsaXplOiBwYXJhbXNTZXJpYWxpemVyfSk7XG5cbiAgLy8gZmlsdGVyIG91dCBza2lwcGVkIGludGVyY2VwdG9yc1xuICB2YXIgcmVxdWVzdEludGVyY2VwdG9yQ2hhaW4gPSBbXTtcbiAgdmFyIHN5bmNocm9ub3VzUmVxdWVzdEludGVyY2VwdG9ycyA9IHRydWU7XG4gIHRoaXMuaW50ZXJjZXB0b3JzLnJlcXVlc3QuZm9yRWFjaChmdW5jdGlvbiB1bnNoaWZ0UmVxdWVzdEludGVyY2VwdG9ycyhpbnRlcmNlcHRvcikge1xuICAgIGlmICh0eXBlb2YgaW50ZXJjZXB0b3IucnVuV2hlbiA9PT0gJ2Z1bmN0aW9uJyAmJiBpbnRlcmNlcHRvci5ydW5XaGVuKGNvbmZpZykgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3luY2hyb25vdXNSZXF1ZXN0SW50ZXJjZXB0b3JzID0gc3luY2hyb25vdXNSZXF1ZXN0SW50ZXJjZXB0b3JzICYmIGludGVyY2VwdG9yLnN5bmNocm9ub3VzO1xuXG4gICAgcmVxdWVzdEludGVyY2VwdG9yQ2hhaW4udW5zaGlmdChpbnRlcmNlcHRvci5mdWxmaWxsZWQsIGludGVyY2VwdG9yLnJlamVjdGVkKTtcbiAgfSk7XG5cbiAgdmFyIHJlc3BvbnNlSW50ZXJjZXB0b3JDaGFpbiA9IFtdO1xuICB0aGlzLmludGVyY2VwdG9ycy5yZXNwb25zZS5mb3JFYWNoKGZ1bmN0aW9uIHB1c2hSZXNwb25zZUludGVyY2VwdG9ycyhpbnRlcmNlcHRvcikge1xuICAgIHJlc3BvbnNlSW50ZXJjZXB0b3JDaGFpbi5wdXNoKGludGVyY2VwdG9yLmZ1bGZpbGxlZCwgaW50ZXJjZXB0b3IucmVqZWN0ZWQpO1xuICB9KTtcblxuICB2YXIgcHJvbWlzZTtcblxuICBpZiAoIXN5bmNocm9ub3VzUmVxdWVzdEludGVyY2VwdG9ycykge1xuICAgIHZhciBjaGFpbiA9IFtkaXNwYXRjaFJlcXVlc3QsIHVuZGVmaW5lZF07XG5cbiAgICBBcnJheS5wcm90b3R5cGUudW5zaGlmdC5hcHBseShjaGFpbiwgcmVxdWVzdEludGVyY2VwdG9yQ2hhaW4pO1xuICAgIGNoYWluID0gY2hhaW4uY29uY2F0KHJlc3BvbnNlSW50ZXJjZXB0b3JDaGFpbik7XG5cbiAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKGNvbmZpZyk7XG4gICAgd2hpbGUgKGNoYWluLmxlbmd0aCkge1xuICAgICAgcHJvbWlzZSA9IHByb21pc2UudGhlbihjaGFpbi5zaGlmdCgpLCBjaGFpbi5zaGlmdCgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG5cbiAgdmFyIG5ld0NvbmZpZyA9IGNvbmZpZztcbiAgd2hpbGUgKHJlcXVlc3RJbnRlcmNlcHRvckNoYWluLmxlbmd0aCkge1xuICAgIHZhciBvbkZ1bGZpbGxlZCA9IHJlcXVlc3RJbnRlcmNlcHRvckNoYWluLnNoaWZ0KCk7XG4gICAgdmFyIG9uUmVqZWN0ZWQgPSByZXF1ZXN0SW50ZXJjZXB0b3JDaGFpbi5zaGlmdCgpO1xuICAgIHRyeSB7XG4gICAgICBuZXdDb25maWcgPSBvbkZ1bGZpbGxlZChuZXdDb25maWcpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBvblJlamVjdGVkKGVycm9yKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHRyeSB7XG4gICAgcHJvbWlzZSA9IGRpc3BhdGNoUmVxdWVzdChuZXdDb25maWcpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gIH1cblxuICB3aGlsZSAocmVzcG9uc2VJbnRlcmNlcHRvckNoYWluLmxlbmd0aCkge1xuICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4ocmVzcG9uc2VJbnRlcmNlcHRvckNoYWluLnNoaWZ0KCksIHJlc3BvbnNlSW50ZXJjZXB0b3JDaGFpbi5zaGlmdCgpKTtcbiAgfVxuXG4gIHJldHVybiBwcm9taXNlO1xufTtcblxuQXhpb3MucHJvdG90eXBlLmdldFVyaSA9IGZ1bmN0aW9uIGdldFVyaShjb25maWcpIHtcbiAgY29uZmlnID0gbWVyZ2VDb25maWcodGhpcy5kZWZhdWx0cywgY29uZmlnKTtcbiAgdmFyIGZ1bGxQYXRoID0gYnVpbGRGdWxsUGF0aChjb25maWcuYmFzZVVSTCwgY29uZmlnLnVybCk7XG4gIHJldHVybiBidWlsZFVSTChmdWxsUGF0aCwgY29uZmlnLnBhcmFtcywgY29uZmlnLnBhcmFtc1NlcmlhbGl6ZXIpO1xufTtcblxuLy8gUHJvdmlkZSBhbGlhc2VzIGZvciBzdXBwb3J0ZWQgcmVxdWVzdCBtZXRob2RzXG51dGlscy5mb3JFYWNoKFsnZGVsZXRlJywgJ2dldCcsICdoZWFkJywgJ29wdGlvbnMnXSwgZnVuY3Rpb24gZm9yRWFjaE1ldGhvZE5vRGF0YShtZXRob2QpIHtcbiAgLyplc2xpbnQgZnVuYy1uYW1lczowKi9cbiAgQXhpb3MucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbih1cmwsIGNvbmZpZykge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3QobWVyZ2VDb25maWcoY29uZmlnIHx8IHt9LCB7XG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIHVybDogdXJsLFxuICAgICAgZGF0YTogKGNvbmZpZyB8fCB7fSkuZGF0YVxuICAgIH0pKTtcbiAgfTtcbn0pO1xuXG51dGlscy5mb3JFYWNoKFsncG9zdCcsICdwdXQnLCAncGF0Y2gnXSwgZnVuY3Rpb24gZm9yRWFjaE1ldGhvZFdpdGhEYXRhKG1ldGhvZCkge1xuICAvKmVzbGludCBmdW5jLW5hbWVzOjAqL1xuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlSFRUUE1ldGhvZChpc0Zvcm0pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaHR0cE1ldGhvZCh1cmwsIGRhdGEsIGNvbmZpZykge1xuICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdChtZXJnZUNvbmZpZyhjb25maWcgfHwge30sIHtcbiAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgIGhlYWRlcnM6IGlzRm9ybSA/IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ211bHRpcGFydC9mb3JtLWRhdGEnXG4gICAgICAgIH0gOiB7fSxcbiAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICAgIH0pKTtcbiAgICB9O1xuICB9XG5cbiAgQXhpb3MucHJvdG90eXBlW21ldGhvZF0gPSBnZW5lcmF0ZUhUVFBNZXRob2QoKTtcblxuICBBeGlvcy5wcm90b3R5cGVbbWV0aG9kICsgJ0Zvcm0nXSA9IGdlbmVyYXRlSFRUUE1ldGhvZCh0cnVlKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF4aW9zO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIENyZWF0ZSBhbiBFcnJvciB3aXRoIHRoZSBzcGVjaWZpZWQgbWVzc2FnZSwgY29uZmlnLCBlcnJvciBjb2RlLCByZXF1ZXN0IGFuZCByZXNwb25zZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBUaGUgZXJyb3IgbWVzc2FnZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29kZV0gVGhlIGVycm9yIGNvZGUgKGZvciBleGFtcGxlLCAnRUNPTk5BQk9SVEVEJykuXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZ10gVGhlIGNvbmZpZy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbcmVxdWVzdF0gVGhlIHJlcXVlc3QuXG4gKiBAcGFyYW0ge09iamVjdH0gW3Jlc3BvbnNlXSBUaGUgcmVzcG9uc2UuXG4gKiBAcmV0dXJucyB7RXJyb3J9IFRoZSBjcmVhdGVkIGVycm9yLlxuICovXG5mdW5jdGlvbiBBeGlvc0Vycm9yKG1lc3NhZ2UsIGNvZGUsIGNvbmZpZywgcmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgRXJyb3IuY2FsbCh0aGlzKTtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnN0YWNrID0gKG5ldyBFcnJvcigpKS5zdGFjaztcbiAgfVxuXG4gIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gIHRoaXMubmFtZSA9ICdBeGlvc0Vycm9yJztcbiAgY29kZSAmJiAodGhpcy5jb2RlID0gY29kZSk7XG4gIGNvbmZpZyAmJiAodGhpcy5jb25maWcgPSBjb25maWcpO1xuICByZXF1ZXN0ICYmICh0aGlzLnJlcXVlc3QgPSByZXF1ZXN0KTtcbiAgcmVzcG9uc2UgJiYgKHRoaXMucmVzcG9uc2UgPSByZXNwb25zZSk7XG59XG5cbnV0aWxzLmluaGVyaXRzKEF4aW9zRXJyb3IsIEVycm9yLCB7XG4gIHRvSlNPTjogZnVuY3Rpb24gdG9KU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICAvLyBTdGFuZGFyZFxuICAgICAgbWVzc2FnZTogdGhpcy5tZXNzYWdlLFxuICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgLy8gTWljcm9zb2Z0XG4gICAgICBkZXNjcmlwdGlvbjogdGhpcy5kZXNjcmlwdGlvbixcbiAgICAgIG51bWJlcjogdGhpcy5udW1iZXIsXG4gICAgICAvLyBNb3ppbGxhXG4gICAgICBmaWxlTmFtZTogdGhpcy5maWxlTmFtZSxcbiAgICAgIGxpbmVOdW1iZXI6IHRoaXMubGluZU51bWJlcixcbiAgICAgIGNvbHVtbk51bWJlcjogdGhpcy5jb2x1bW5OdW1iZXIsXG4gICAgICBzdGFjazogdGhpcy5zdGFjayxcbiAgICAgIC8vIEF4aW9zXG4gICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgc3RhdHVzOiB0aGlzLnJlc3BvbnNlICYmIHRoaXMucmVzcG9uc2Uuc3RhdHVzID8gdGhpcy5yZXNwb25zZS5zdGF0dXMgOiBudWxsXG4gICAgfTtcbiAgfVxufSk7XG5cbnZhciBwcm90b3R5cGUgPSBBeGlvc0Vycm9yLnByb3RvdHlwZTtcbnZhciBkZXNjcmlwdG9ycyA9IHt9O1xuXG5bXG4gICdFUlJfQkFEX09QVElPTl9WQUxVRScsXG4gICdFUlJfQkFEX09QVElPTicsXG4gICdFQ09OTkFCT1JURUQnLFxuICAnRVRJTUVET1VUJyxcbiAgJ0VSUl9ORVRXT1JLJyxcbiAgJ0VSUl9GUl9UT09fTUFOWV9SRURJUkVDVFMnLFxuICAnRVJSX0RFUFJFQ0FURUQnLFxuICAnRVJSX0JBRF9SRVNQT05TRScsXG4gICdFUlJfQkFEX1JFUVVFU1QnLFxuICAnRVJSX0NBTkNFTEVEJyxcbiAgJ0VSUl9OT1RfU1VQUE9SVCcsXG4gICdFUlJfSU5WQUxJRF9VUkwnXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xuXS5mb3JFYWNoKGZ1bmN0aW9uKGNvZGUpIHtcbiAgZGVzY3JpcHRvcnNbY29kZV0gPSB7dmFsdWU6IGNvZGV9O1xufSk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKEF4aW9zRXJyb3IsIGRlc2NyaXB0b3JzKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90b3R5cGUsICdpc0F4aW9zRXJyb3InLCB7dmFsdWU6IHRydWV9KTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbkF4aW9zRXJyb3IuZnJvbSA9IGZ1bmN0aW9uKGVycm9yLCBjb2RlLCBjb25maWcsIHJlcXVlc3QsIHJlc3BvbnNlLCBjdXN0b21Qcm9wcykge1xuICB2YXIgYXhpb3NFcnJvciA9IE9iamVjdC5jcmVhdGUocHJvdG90eXBlKTtcblxuICB1dGlscy50b0ZsYXRPYmplY3QoZXJyb3IsIGF4aW9zRXJyb3IsIGZ1bmN0aW9uIGZpbHRlcihvYmopIHtcbiAgICByZXR1cm4gb2JqICE9PSBFcnJvci5wcm90b3R5cGU7XG4gIH0pO1xuXG4gIEF4aW9zRXJyb3IuY2FsbChheGlvc0Vycm9yLCBlcnJvci5tZXNzYWdlLCBjb2RlLCBjb25maWcsIHJlcXVlc3QsIHJlc3BvbnNlKTtcblxuICBheGlvc0Vycm9yLmNhdXNlID0gZXJyb3I7XG5cbiAgYXhpb3NFcnJvci5uYW1lID0gZXJyb3IubmFtZTtcblxuICBjdXN0b21Qcm9wcyAmJiBPYmplY3QuYXNzaWduKGF4aW9zRXJyb3IsIGN1c3RvbVByb3BzKTtcblxuICByZXR1cm4gYXhpb3NFcnJvcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXhpb3NFcnJvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xuXG5mdW5jdGlvbiBJbnRlcmNlcHRvck1hbmFnZXIoKSB7XG4gIHRoaXMuaGFuZGxlcnMgPSBbXTtcbn1cblxuLyoqXG4gKiBBZGQgYSBuZXcgaW50ZXJjZXB0b3IgdG8gdGhlIHN0YWNrXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVsZmlsbGVkIFRoZSBmdW5jdGlvbiB0byBoYW5kbGUgYHRoZW5gIGZvciBhIGBQcm9taXNlYFxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVqZWN0ZWQgVGhlIGZ1bmN0aW9uIHRvIGhhbmRsZSBgcmVqZWN0YCBmb3IgYSBgUHJvbWlzZWBcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEFuIElEIHVzZWQgdG8gcmVtb3ZlIGludGVyY2VwdG9yIGxhdGVyXG4gKi9cbkludGVyY2VwdG9yTWFuYWdlci5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gdXNlKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIG9wdGlvbnMpIHtcbiAgdGhpcy5oYW5kbGVycy5wdXNoKHtcbiAgICBmdWxmaWxsZWQ6IGZ1bGZpbGxlZCxcbiAgICByZWplY3RlZDogcmVqZWN0ZWQsXG4gICAgc3luY2hyb25vdXM6IG9wdGlvbnMgPyBvcHRpb25zLnN5bmNocm9ub3VzIDogZmFsc2UsXG4gICAgcnVuV2hlbjogb3B0aW9ucyA/IG9wdGlvbnMucnVuV2hlbiA6IG51bGxcbiAgfSk7XG4gIHJldHVybiB0aGlzLmhhbmRsZXJzLmxlbmd0aCAtIDE7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBpbnRlcmNlcHRvciBmcm9tIHRoZSBzdGFja1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBpZCBUaGUgSUQgdGhhdCB3YXMgcmV0dXJuZWQgYnkgYHVzZWBcbiAqL1xuSW50ZXJjZXB0b3JNYW5hZ2VyLnByb3RvdHlwZS5lamVjdCA9IGZ1bmN0aW9uIGVqZWN0KGlkKSB7XG4gIGlmICh0aGlzLmhhbmRsZXJzW2lkXSkge1xuICAgIHRoaXMuaGFuZGxlcnNbaWRdID0gbnVsbDtcbiAgfVxufTtcblxuLyoqXG4gKiBDbGVhciBhbGwgaW50ZXJjZXB0b3JzIGZyb20gdGhlIHN0YWNrXG4gKi9cbkludGVyY2VwdG9yTWFuYWdlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgaWYgKHRoaXMuaGFuZGxlcnMpIHtcbiAgICB0aGlzLmhhbmRsZXJzID0gW107XG4gIH1cbn07XG5cbi8qKlxuICogSXRlcmF0ZSBvdmVyIGFsbCB0aGUgcmVnaXN0ZXJlZCBpbnRlcmNlcHRvcnNcbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyBwYXJ0aWN1bGFybHkgdXNlZnVsIGZvciBza2lwcGluZyBvdmVyIGFueVxuICogaW50ZXJjZXB0b3JzIHRoYXQgbWF5IGhhdmUgYmVjb21lIGBudWxsYCBjYWxsaW5nIGBlamVjdGAuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggaW50ZXJjZXB0b3JcbiAqL1xuSW50ZXJjZXB0b3JNYW5hZ2VyLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gZm9yRWFjaChmbikge1xuICB1dGlscy5mb3JFYWNoKHRoaXMuaGFuZGxlcnMsIGZ1bmN0aW9uIGZvckVhY2hIYW5kbGVyKGgpIHtcbiAgICBpZiAoaCAhPT0gbnVsbCkge1xuICAgICAgZm4oaCk7XG4gICAgfVxuICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW50ZXJjZXB0b3JNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNBYnNvbHV0ZVVSTCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvaXNBYnNvbHV0ZVVSTCcpO1xudmFyIGNvbWJpbmVVUkxzID0gcmVxdWlyZSgnLi4vaGVscGVycy9jb21iaW5lVVJMcycpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgVVJMIGJ5IGNvbWJpbmluZyB0aGUgYmFzZVVSTCB3aXRoIHRoZSByZXF1ZXN0ZWRVUkwsXG4gKiBvbmx5IHdoZW4gdGhlIHJlcXVlc3RlZFVSTCBpcyBub3QgYWxyZWFkeSBhbiBhYnNvbHV0ZSBVUkwuXG4gKiBJZiB0aGUgcmVxdWVzdFVSTCBpcyBhYnNvbHV0ZSwgdGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSByZXF1ZXN0ZWRVUkwgdW50b3VjaGVkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBiYXNlVVJMIFRoZSBiYXNlIFVSTFxuICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3RlZFVSTCBBYnNvbHV0ZSBvciByZWxhdGl2ZSBVUkwgdG8gY29tYmluZVxuICogQHJldHVybnMge3N0cmluZ30gVGhlIGNvbWJpbmVkIGZ1bGwgcGF0aFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJ1aWxkRnVsbFBhdGgoYmFzZVVSTCwgcmVxdWVzdGVkVVJMKSB7XG4gIGlmIChiYXNlVVJMICYmICFpc0Fic29sdXRlVVJMKHJlcXVlc3RlZFVSTCkpIHtcbiAgICByZXR1cm4gY29tYmluZVVSTHMoYmFzZVVSTCwgcmVxdWVzdGVkVVJMKTtcbiAgfVxuICByZXR1cm4gcmVxdWVzdGVkVVJMO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xudmFyIHRyYW5zZm9ybURhdGEgPSByZXF1aXJlKCcuL3RyYW5zZm9ybURhdGEnKTtcbnZhciBpc0NhbmNlbCA9IHJlcXVpcmUoJy4uL2NhbmNlbC9pc0NhbmNlbCcpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnLi4vZGVmYXVsdHMnKTtcbnZhciBDYW5jZWxlZEVycm9yID0gcmVxdWlyZSgnLi4vY2FuY2VsL0NhbmNlbGVkRXJyb3InKTtcbnZhciBub3JtYWxpemVIZWFkZXJOYW1lID0gcmVxdWlyZSgnLi4vaGVscGVycy9ub3JtYWxpemVIZWFkZXJOYW1lJyk7XG5cbi8qKlxuICogVGhyb3dzIGEgYENhbmNlbGVkRXJyb3JgIGlmIGNhbmNlbGxhdGlvbiBoYXMgYmVlbiByZXF1ZXN0ZWQuXG4gKi9cbmZ1bmN0aW9uIHRocm93SWZDYW5jZWxsYXRpb25SZXF1ZXN0ZWQoY29uZmlnKSB7XG4gIGlmIChjb25maWcuY2FuY2VsVG9rZW4pIHtcbiAgICBjb25maWcuY2FuY2VsVG9rZW4udGhyb3dJZlJlcXVlc3RlZCgpO1xuICB9XG5cbiAgaWYgKGNvbmZpZy5zaWduYWwgJiYgY29uZmlnLnNpZ25hbC5hYm9ydGVkKSB7XG4gICAgdGhyb3cgbmV3IENhbmNlbGVkRXJyb3IoKTtcbiAgfVxufVxuXG4vKipcbiAqIERpc3BhdGNoIGEgcmVxdWVzdCB0byB0aGUgc2VydmVyIHVzaW5nIHRoZSBjb25maWd1cmVkIGFkYXB0ZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyBUaGUgY29uZmlnIHRoYXQgaXMgdG8gYmUgdXNlZCBmb3IgdGhlIHJlcXVlc3RcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBUaGUgUHJvbWlzZSB0byBiZSBmdWxmaWxsZWRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkaXNwYXRjaFJlcXVlc3QoY29uZmlnKSB7XG4gIHRocm93SWZDYW5jZWxsYXRpb25SZXF1ZXN0ZWQoY29uZmlnKTtcblxuICAvLyBFbnN1cmUgaGVhZGVycyBleGlzdFxuICBjb25maWcuaGVhZGVycyA9IGNvbmZpZy5oZWFkZXJzIHx8IHt9O1xuXG4gIC8vIFRyYW5zZm9ybSByZXF1ZXN0IGRhdGFcbiAgY29uZmlnLmRhdGEgPSB0cmFuc2Zvcm1EYXRhLmNhbGwoXG4gICAgY29uZmlnLFxuICAgIGNvbmZpZy5kYXRhLFxuICAgIGNvbmZpZy5oZWFkZXJzLFxuICAgIG51bGwsXG4gICAgY29uZmlnLnRyYW5zZm9ybVJlcXVlc3RcbiAgKTtcblxuICBub3JtYWxpemVIZWFkZXJOYW1lKGNvbmZpZy5oZWFkZXJzLCAnQWNjZXB0Jyk7XG4gIG5vcm1hbGl6ZUhlYWRlck5hbWUoY29uZmlnLmhlYWRlcnMsICdDb250ZW50LVR5cGUnKTtcblxuICAvLyBGbGF0dGVuIGhlYWRlcnNcbiAgY29uZmlnLmhlYWRlcnMgPSB1dGlscy5tZXJnZShcbiAgICBjb25maWcuaGVhZGVycy5jb21tb24gfHwge30sXG4gICAgY29uZmlnLmhlYWRlcnNbY29uZmlnLm1ldGhvZF0gfHwge30sXG4gICAgY29uZmlnLmhlYWRlcnNcbiAgKTtcblxuICB1dGlscy5mb3JFYWNoKFxuICAgIFsnZGVsZXRlJywgJ2dldCcsICdoZWFkJywgJ3Bvc3QnLCAncHV0JywgJ3BhdGNoJywgJ2NvbW1vbiddLFxuICAgIGZ1bmN0aW9uIGNsZWFuSGVhZGVyQ29uZmlnKG1ldGhvZCkge1xuICAgICAgZGVsZXRlIGNvbmZpZy5oZWFkZXJzW21ldGhvZF07XG4gICAgfVxuICApO1xuXG4gIHZhciBhZGFwdGVyID0gY29uZmlnLmFkYXB0ZXIgfHwgZGVmYXVsdHMuYWRhcHRlcjtcblxuICByZXR1cm4gYWRhcHRlcihjb25maWcpLnRoZW4oZnVuY3Rpb24gb25BZGFwdGVyUmVzb2x1dGlvbihyZXNwb25zZSkge1xuICAgIHRocm93SWZDYW5jZWxsYXRpb25SZXF1ZXN0ZWQoY29uZmlnKTtcblxuICAgIC8vIFRyYW5zZm9ybSByZXNwb25zZSBkYXRhXG4gICAgcmVzcG9uc2UuZGF0YSA9IHRyYW5zZm9ybURhdGEuY2FsbChcbiAgICAgIGNvbmZpZyxcbiAgICAgIHJlc3BvbnNlLmRhdGEsXG4gICAgICByZXNwb25zZS5oZWFkZXJzLFxuICAgICAgcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgY29uZmlnLnRyYW5zZm9ybVJlc3BvbnNlXG4gICAgKTtcblxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfSwgZnVuY3Rpb24gb25BZGFwdGVyUmVqZWN0aW9uKHJlYXNvbikge1xuICAgIGlmICghaXNDYW5jZWwocmVhc29uKSkge1xuICAgICAgdGhyb3dJZkNhbmNlbGxhdGlvblJlcXVlc3RlZChjb25maWcpO1xuXG4gICAgICAvLyBUcmFuc2Zvcm0gcmVzcG9uc2UgZGF0YVxuICAgICAgaWYgKHJlYXNvbiAmJiByZWFzb24ucmVzcG9uc2UpIHtcbiAgICAgICAgcmVhc29uLnJlc3BvbnNlLmRhdGEgPSB0cmFuc2Zvcm1EYXRhLmNhbGwoXG4gICAgICAgICAgY29uZmlnLFxuICAgICAgICAgIHJlYXNvbi5yZXNwb25zZS5kYXRhLFxuICAgICAgICAgIHJlYXNvbi5yZXNwb25zZS5oZWFkZXJzLFxuICAgICAgICAgIHJlYXNvbi5yZXNwb25zZS5zdGF0dXMsXG4gICAgICAgICAgY29uZmlnLnRyYW5zZm9ybVJlc3BvbnNlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHJlYXNvbik7XG4gIH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBDb25maWctc3BlY2lmaWMgbWVyZ2UtZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhIG5ldyBjb25maWctb2JqZWN0XG4gKiBieSBtZXJnaW5nIHR3byBjb25maWd1cmF0aW9uIG9iamVjdHMgdG9nZXRoZXIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZzFcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBOZXcgb2JqZWN0IHJlc3VsdGluZyBmcm9tIG1lcmdpbmcgY29uZmlnMiB0byBjb25maWcxXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWVyZ2VDb25maWcoY29uZmlnMSwgY29uZmlnMikge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgY29uZmlnMiA9IGNvbmZpZzIgfHwge307XG4gIHZhciBjb25maWcgPSB7fTtcblxuICBmdW5jdGlvbiBnZXRNZXJnZWRWYWx1ZSh0YXJnZXQsIHNvdXJjZSkge1xuICAgIGlmICh1dGlscy5pc1BsYWluT2JqZWN0KHRhcmdldCkgJiYgdXRpbHMuaXNQbGFpbk9iamVjdChzb3VyY2UpKSB7XG4gICAgICByZXR1cm4gdXRpbHMubWVyZ2UodGFyZ2V0LCBzb3VyY2UpO1xuICAgIH0gZWxzZSBpZiAodXRpbHMuaXNFbXB0eU9iamVjdChzb3VyY2UpKSB7XG4gICAgICByZXR1cm4gdXRpbHMubWVyZ2Uoe30sIHRhcmdldCk7XG4gICAgfSBlbHNlIGlmICh1dGlscy5pc1BsYWluT2JqZWN0KHNvdXJjZSkpIHtcbiAgICAgIHJldHVybiB1dGlscy5tZXJnZSh7fSwgc291cmNlKTtcbiAgICB9IGVsc2UgaWYgKHV0aWxzLmlzQXJyYXkoc291cmNlKSkge1xuICAgICAgcmV0dXJuIHNvdXJjZS5zbGljZSgpO1xuICAgIH1cbiAgICByZXR1cm4gc291cmNlO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXG4gIGZ1bmN0aW9uIG1lcmdlRGVlcFByb3BlcnRpZXMocHJvcCkge1xuICAgIGlmICghdXRpbHMuaXNVbmRlZmluZWQoY29uZmlnMltwcm9wXSkpIHtcbiAgICAgIHJldHVybiBnZXRNZXJnZWRWYWx1ZShjb25maWcxW3Byb3BdLCBjb25maWcyW3Byb3BdKTtcbiAgICB9IGVsc2UgaWYgKCF1dGlscy5pc1VuZGVmaW5lZChjb25maWcxW3Byb3BdKSkge1xuICAgICAgcmV0dXJuIGdldE1lcmdlZFZhbHVlKHVuZGVmaW5lZCwgY29uZmlnMVtwcm9wXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXG4gIGZ1bmN0aW9uIHZhbHVlRnJvbUNvbmZpZzIocHJvcCkge1xuICAgIGlmICghdXRpbHMuaXNVbmRlZmluZWQoY29uZmlnMltwcm9wXSkpIHtcbiAgICAgIHJldHVybiBnZXRNZXJnZWRWYWx1ZSh1bmRlZmluZWQsIGNvbmZpZzJbcHJvcF0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXJldHVyblxuICBmdW5jdGlvbiBkZWZhdWx0VG9Db25maWcyKHByb3ApIHtcbiAgICBpZiAoIXV0aWxzLmlzVW5kZWZpbmVkKGNvbmZpZzJbcHJvcF0pKSB7XG4gICAgICByZXR1cm4gZ2V0TWVyZ2VkVmFsdWUodW5kZWZpbmVkLCBjb25maWcyW3Byb3BdKTtcbiAgICB9IGVsc2UgaWYgKCF1dGlscy5pc1VuZGVmaW5lZChjb25maWcxW3Byb3BdKSkge1xuICAgICAgcmV0dXJuIGdldE1lcmdlZFZhbHVlKHVuZGVmaW5lZCwgY29uZmlnMVtwcm9wXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXG4gIGZ1bmN0aW9uIG1lcmdlRGlyZWN0S2V5cyhwcm9wKSB7XG4gICAgaWYgKHByb3AgaW4gY29uZmlnMikge1xuICAgICAgcmV0dXJuIGdldE1lcmdlZFZhbHVlKGNvbmZpZzFbcHJvcF0sIGNvbmZpZzJbcHJvcF0pO1xuICAgIH0gZWxzZSBpZiAocHJvcCBpbiBjb25maWcxKSB7XG4gICAgICByZXR1cm4gZ2V0TWVyZ2VkVmFsdWUodW5kZWZpbmVkLCBjb25maWcxW3Byb3BdKTtcbiAgICB9XG4gIH1cblxuICB2YXIgbWVyZ2VNYXAgPSB7XG4gICAgJ3VybCc6IHZhbHVlRnJvbUNvbmZpZzIsXG4gICAgJ21ldGhvZCc6IHZhbHVlRnJvbUNvbmZpZzIsXG4gICAgJ2RhdGEnOiB2YWx1ZUZyb21Db25maWcyLFxuICAgICdiYXNlVVJMJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAndHJhbnNmb3JtUmVxdWVzdCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3RyYW5zZm9ybVJlc3BvbnNlJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAncGFyYW1zU2VyaWFsaXplcic6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3RpbWVvdXQnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICd0aW1lb3V0TWVzc2FnZSc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3dpdGhDcmVkZW50aWFscyc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3dpdGhYU1JGVG9rZW4nOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdhZGFwdGVyJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAncmVzcG9uc2VUeXBlJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAneHNyZkNvb2tpZU5hbWUnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICd4c3JmSGVhZGVyTmFtZSc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ29uVXBsb2FkUHJvZ3Jlc3MnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdvbkRvd25sb2FkUHJvZ3Jlc3MnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdkZWNvbXByZXNzJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAnbWF4Q29udGVudExlbmd0aCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ21heEJvZHlMZW5ndGgnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdiZWZvcmVSZWRpcmVjdCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3RyYW5zcG9ydCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ2h0dHBBZ2VudCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ2h0dHBzQWdlbnQnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdjYW5jZWxUb2tlbic6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3NvY2tldFBhdGgnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdyZXNwb25zZUVuY29kaW5nJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAndmFsaWRhdGVTdGF0dXMnOiBtZXJnZURpcmVjdEtleXNcbiAgfTtcblxuICB1dGlscy5mb3JFYWNoKE9iamVjdC5rZXlzKGNvbmZpZzEpLmNvbmNhdChPYmplY3Qua2V5cyhjb25maWcyKSksIGZ1bmN0aW9uIGNvbXB1dGVDb25maWdWYWx1ZShwcm9wKSB7XG4gICAgdmFyIG1lcmdlID0gbWVyZ2VNYXBbcHJvcF0gfHwgbWVyZ2VEZWVwUHJvcGVydGllcztcbiAgICB2YXIgY29uZmlnVmFsdWUgPSBtZXJnZShwcm9wKTtcbiAgICAodXRpbHMuaXNVbmRlZmluZWQoY29uZmlnVmFsdWUpICYmIG1lcmdlICE9PSBtZXJnZURpcmVjdEtleXMpIHx8IChjb25maWdbcHJvcF0gPSBjb25maWdWYWx1ZSk7XG4gIH0pO1xuXG4gIHJldHVybiBjb25maWc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4vQXhpb3NFcnJvcicpO1xuXG4vKipcbiAqIFJlc29sdmUgb3IgcmVqZWN0IGEgUHJvbWlzZSBiYXNlZCBvbiByZXNwb25zZSBzdGF0dXMuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdGhlIHByb21pc2UuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZWplY3QgQSBmdW5jdGlvbiB0aGF0IHJlamVjdHMgdGhlIHByb21pc2UuXG4gKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgVGhlIHJlc3BvbnNlLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHJlc3BvbnNlKSB7XG4gIHZhciB2YWxpZGF0ZVN0YXR1cyA9IHJlc3BvbnNlLmNvbmZpZy52YWxpZGF0ZVN0YXR1cztcbiAgaWYgKCFyZXNwb25zZS5zdGF0dXMgfHwgIXZhbGlkYXRlU3RhdHVzIHx8IHZhbGlkYXRlU3RhdHVzKHJlc3BvbnNlLnN0YXR1cykpIHtcbiAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgfSBlbHNlIHtcbiAgICByZWplY3QobmV3IEF4aW9zRXJyb3IoXG4gICAgICAnUmVxdWVzdCBmYWlsZWQgd2l0aCBzdGF0dXMgY29kZSAnICsgcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgW0F4aW9zRXJyb3IuRVJSX0JBRF9SRVFVRVNULCBBeGlvc0Vycm9yLkVSUl9CQURfUkVTUE9OU0VdW01hdGguZmxvb3IocmVzcG9uc2Uuc3RhdHVzIC8gMTAwKSAtIDRdLFxuICAgICAgcmVzcG9uc2UuY29uZmlnLFxuICAgICAgcmVzcG9uc2UucmVxdWVzdCxcbiAgICAgIHJlc3BvbnNlXG4gICAgKSk7XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vLi4vdXRpbHMnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJy4uL2RlZmF1bHRzJyk7XG5cbi8qKlxuICogVHJhbnNmb3JtIHRoZSBkYXRhIGZvciBhIHJlcXVlc3Qgb3IgYSByZXNwb25zZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gZGF0YSBUaGUgZGF0YSB0byBiZSB0cmFuc2Zvcm1lZFxuICogQHBhcmFtIHtBcnJheX0gaGVhZGVycyBUaGUgaGVhZGVycyBmb3IgdGhlIHJlcXVlc3Qgb3IgcmVzcG9uc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdGF0dXMgSFRUUCBzdGF0dXMgY29kZVxuICogQHBhcmFtIHtBcnJheXxGdW5jdGlvbn0gZm5zIEEgc2luZ2xlIGZ1bmN0aW9uIG9yIEFycmF5IG9mIGZ1bmN0aW9uc1xuICogQHJldHVybnMgeyp9IFRoZSByZXN1bHRpbmcgdHJhbnNmb3JtZWQgZGF0YVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRyYW5zZm9ybURhdGEoZGF0YSwgaGVhZGVycywgc3RhdHVzLCBmbnMpIHtcbiAgdmFyIGNvbnRleHQgPSB0aGlzIHx8IGRlZmF1bHRzO1xuICAvKmVzbGludCBuby1wYXJhbS1yZWFzc2lnbjowKi9cbiAgdXRpbHMuZm9yRWFjaChmbnMsIGZ1bmN0aW9uIHRyYW5zZm9ybShmbikge1xuICAgIGRhdGEgPSBmbi5jYWxsKGNvbnRleHQsIGRhdGEsIGhlYWRlcnMsIHN0YXR1cyk7XG4gIH0pO1xuXG4gIHJldHVybiBkYXRhO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbnZhciBub3JtYWxpemVIZWFkZXJOYW1lID0gcmVxdWlyZSgnLi4vaGVscGVycy9ub3JtYWxpemVIZWFkZXJOYW1lJyk7XG52YXIgQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4uL2NvcmUvQXhpb3NFcnJvcicpO1xudmFyIHRyYW5zaXRpb25hbERlZmF1bHRzID0gcmVxdWlyZSgnLi90cmFuc2l0aW9uYWwnKTtcbnZhciB0b0Zvcm1EYXRhID0gcmVxdWlyZSgnLi4vaGVscGVycy90b0Zvcm1EYXRhJyk7XG52YXIgdG9VUkxFbmNvZGVkRm9ybSA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvdG9VUkxFbmNvZGVkRm9ybScpO1xudmFyIHBsYXRmb3JtID0gcmVxdWlyZSgnLi4vcGxhdGZvcm0nKTtcbnZhciBmb3JtRGF0YVRvSlNPTiA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZm9ybURhdGFUb0pTT04nKTtcblxudmFyIERFRkFVTFRfQ09OVEVOVF9UWVBFID0ge1xuICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbn07XG5cbmZ1bmN0aW9uIHNldENvbnRlbnRUeXBlSWZVbnNldChoZWFkZXJzLCB2YWx1ZSkge1xuICBpZiAoIXV0aWxzLmlzVW5kZWZpbmVkKGhlYWRlcnMpICYmIHV0aWxzLmlzVW5kZWZpbmVkKGhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddKSkge1xuICAgIGhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gdmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdEFkYXB0ZXIoKSB7XG4gIHZhciBhZGFwdGVyO1xuICBpZiAodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIC8vIEZvciBicm93c2VycyB1c2UgWEhSIGFkYXB0ZXJcbiAgICBhZGFwdGVyID0gcmVxdWlyZSgnLi4vYWRhcHRlcnMveGhyJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nKSB7XG4gICAgLy8gRm9yIG5vZGUgdXNlIEhUVFAgYWRhcHRlclxuICAgIGFkYXB0ZXIgPSByZXF1aXJlKCcuLi9hZGFwdGVycy9odHRwJyk7XG4gIH1cbiAgcmV0dXJuIGFkYXB0ZXI7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeVNhZmVseShyYXdWYWx1ZSwgcGFyc2VyLCBlbmNvZGVyKSB7XG4gIGlmICh1dGlscy5pc1N0cmluZyhyYXdWYWx1ZSkpIHtcbiAgICB0cnkge1xuICAgICAgKHBhcnNlciB8fCBKU09OLnBhcnNlKShyYXdWYWx1ZSk7XG4gICAgICByZXR1cm4gdXRpbHMudHJpbShyYXdWYWx1ZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUubmFtZSAhPT0gJ1N5bnRheEVycm9yJykge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoZW5jb2RlciB8fCBKU09OLnN0cmluZ2lmeSkocmF3VmFsdWUpO1xufVxuXG52YXIgZGVmYXVsdHMgPSB7XG5cbiAgdHJhbnNpdGlvbmFsOiB0cmFuc2l0aW9uYWxEZWZhdWx0cyxcblxuICBhZGFwdGVyOiBnZXREZWZhdWx0QWRhcHRlcigpLFxuXG4gIHRyYW5zZm9ybVJlcXVlc3Q6IFtmdW5jdGlvbiB0cmFuc2Zvcm1SZXF1ZXN0KGRhdGEsIGhlYWRlcnMpIHtcbiAgICBub3JtYWxpemVIZWFkZXJOYW1lKGhlYWRlcnMsICdBY2NlcHQnKTtcbiAgICBub3JtYWxpemVIZWFkZXJOYW1lKGhlYWRlcnMsICdDb250ZW50LVR5cGUnKTtcblxuICAgIHZhciBjb250ZW50VHlwZSA9IGhlYWRlcnMgJiYgaGVhZGVyc1snQ29udGVudC1UeXBlJ10gfHwgJyc7XG4gICAgdmFyIGhhc0pTT05Db250ZW50VHlwZSA9IGNvbnRlbnRUeXBlLmluZGV4T2YoJ2FwcGxpY2F0aW9uL2pzb24nKSA+IC0xO1xuICAgIHZhciBpc09iamVjdFBheWxvYWQgPSB1dGlscy5pc09iamVjdChkYXRhKTtcblxuICAgIGlmIChpc09iamVjdFBheWxvYWQgJiYgdXRpbHMuaXNIVE1MRm9ybShkYXRhKSkge1xuICAgICAgZGF0YSA9IG5ldyBGb3JtRGF0YShkYXRhKTtcbiAgICB9XG5cbiAgICB2YXIgaXNGb3JtRGF0YSA9IHV0aWxzLmlzRm9ybURhdGEoZGF0YSk7XG5cbiAgICBpZiAoaXNGb3JtRGF0YSkge1xuICAgICAgcmV0dXJuIGhhc0pTT05Db250ZW50VHlwZSA/IEpTT04uc3RyaW5naWZ5KGZvcm1EYXRhVG9KU09OKGRhdGEpKSA6IGRhdGE7XG4gICAgfVxuXG4gICAgaWYgKHV0aWxzLmlzQXJyYXlCdWZmZXIoZGF0YSkgfHxcbiAgICAgIHV0aWxzLmlzQnVmZmVyKGRhdGEpIHx8XG4gICAgICB1dGlscy5pc1N0cmVhbShkYXRhKSB8fFxuICAgICAgdXRpbHMuaXNGaWxlKGRhdGEpIHx8XG4gICAgICB1dGlscy5pc0Jsb2IoZGF0YSlcbiAgICApIHtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICBpZiAodXRpbHMuaXNBcnJheUJ1ZmZlclZpZXcoZGF0YSkpIHtcbiAgICAgIHJldHVybiBkYXRhLmJ1ZmZlcjtcbiAgICB9XG4gICAgaWYgKHV0aWxzLmlzVVJMU2VhcmNoUGFyYW1zKGRhdGEpKSB7XG4gICAgICBzZXRDb250ZW50VHlwZUlmVW5zZXQoaGVhZGVycywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PXV0Zi04Jyk7XG4gICAgICByZXR1cm4gZGF0YS50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHZhciBpc0ZpbGVMaXN0O1xuXG4gICAgaWYgKGlzT2JqZWN0UGF5bG9hZCkge1xuICAgICAgaWYgKGNvbnRlbnRUeXBlLmluZGV4T2YoJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gdG9VUkxFbmNvZGVkRm9ybShkYXRhLCB0aGlzLmZvcm1TZXJpYWxpemVyKS50b1N0cmluZygpO1xuICAgICAgfVxuXG4gICAgICBpZiAoKGlzRmlsZUxpc3QgPSB1dGlscy5pc0ZpbGVMaXN0KGRhdGEpKSB8fCBjb250ZW50VHlwZS5pbmRleE9mKCdtdWx0aXBhcnQvZm9ybS1kYXRhJykgPiAtMSkge1xuICAgICAgICB2YXIgX0Zvcm1EYXRhID0gdGhpcy5lbnYgJiYgdGhpcy5lbnYuRm9ybURhdGE7XG5cbiAgICAgICAgcmV0dXJuIHRvRm9ybURhdGEoXG4gICAgICAgICAgaXNGaWxlTGlzdCA/IHsnZmlsZXNbXSc6IGRhdGF9IDogZGF0YSxcbiAgICAgICAgICBfRm9ybURhdGEgJiYgbmV3IF9Gb3JtRGF0YSgpLFxuICAgICAgICAgIHRoaXMuZm9ybVNlcmlhbGl6ZXJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNPYmplY3RQYXlsb2FkIHx8IGhhc0pTT05Db250ZW50VHlwZSApIHtcbiAgICAgIHNldENvbnRlbnRUeXBlSWZVbnNldChoZWFkZXJzLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgcmV0dXJuIHN0cmluZ2lmeVNhZmVseShkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfV0sXG5cbiAgdHJhbnNmb3JtUmVzcG9uc2U6IFtmdW5jdGlvbiB0cmFuc2Zvcm1SZXNwb25zZShkYXRhKSB7XG4gICAgdmFyIHRyYW5zaXRpb25hbCA9IHRoaXMudHJhbnNpdGlvbmFsIHx8IGRlZmF1bHRzLnRyYW5zaXRpb25hbDtcbiAgICB2YXIgZm9yY2VkSlNPTlBhcnNpbmcgPSB0cmFuc2l0aW9uYWwgJiYgdHJhbnNpdGlvbmFsLmZvcmNlZEpTT05QYXJzaW5nO1xuICAgIHZhciBKU09OUmVxdWVzdGVkID0gdGhpcy5yZXNwb25zZVR5cGUgPT09ICdqc29uJztcblxuICAgIGlmIChkYXRhICYmIHV0aWxzLmlzU3RyaW5nKGRhdGEpICYmICgoZm9yY2VkSlNPTlBhcnNpbmcgJiYgIXRoaXMucmVzcG9uc2VUeXBlKSB8fCBKU09OUmVxdWVzdGVkKSkge1xuICAgICAgdmFyIHNpbGVudEpTT05QYXJzaW5nID0gdHJhbnNpdGlvbmFsICYmIHRyYW5zaXRpb25hbC5zaWxlbnRKU09OUGFyc2luZztcbiAgICAgIHZhciBzdHJpY3RKU09OUGFyc2luZyA9ICFzaWxlbnRKU09OUGFyc2luZyAmJiBKU09OUmVxdWVzdGVkO1xuXG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKHN0cmljdEpTT05QYXJzaW5nKSB7XG4gICAgICAgICAgaWYgKGUubmFtZSA9PT0gJ1N5bnRheEVycm9yJykge1xuICAgICAgICAgICAgdGhyb3cgQXhpb3NFcnJvci5mcm9tKGUsIEF4aW9zRXJyb3IuRVJSX0JBRF9SRVNQT05TRSwgdGhpcywgbnVsbCwgdGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfV0sXG5cbiAgLyoqXG4gICAqIEEgdGltZW91dCBpbiBtaWxsaXNlY29uZHMgdG8gYWJvcnQgYSByZXF1ZXN0LiBJZiBzZXQgdG8gMCAoZGVmYXVsdCkgYVxuICAgKiB0aW1lb3V0IGlzIG5vdCBjcmVhdGVkLlxuICAgKi9cbiAgdGltZW91dDogMCxcblxuICB4c3JmQ29va2llTmFtZTogJ1hTUkYtVE9LRU4nLFxuICB4c3JmSGVhZGVyTmFtZTogJ1gtWFNSRi1UT0tFTicsXG5cbiAgbWF4Q29udGVudExlbmd0aDogLTEsXG4gIG1heEJvZHlMZW5ndGg6IC0xLFxuXG4gIGVudjoge1xuICAgIEZvcm1EYXRhOiBwbGF0Zm9ybS5jbGFzc2VzLkZvcm1EYXRhLFxuICAgIEJsb2I6IHBsYXRmb3JtLmNsYXNzZXMuQmxvYlxuICB9LFxuXG4gIHZhbGlkYXRlU3RhdHVzOiBmdW5jdGlvbiB2YWxpZGF0ZVN0YXR1cyhzdGF0dXMpIHtcbiAgICByZXR1cm4gc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDA7XG4gIH0sXG5cbiAgaGVhZGVyczoge1xuICAgIGNvbW1vbjoge1xuICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L3BsYWluLCAqLyonXG4gICAgfVxuICB9XG59O1xuXG51dGlscy5mb3JFYWNoKFsnZGVsZXRlJywgJ2dldCcsICdoZWFkJ10sIGZ1bmN0aW9uIGZvckVhY2hNZXRob2ROb0RhdGEobWV0aG9kKSB7XG4gIGRlZmF1bHRzLmhlYWRlcnNbbWV0aG9kXSA9IHt9O1xufSk7XG5cbnV0aWxzLmZvckVhY2goWydwb3N0JywgJ3B1dCcsICdwYXRjaCddLCBmdW5jdGlvbiBmb3JFYWNoTWV0aG9kV2l0aERhdGEobWV0aG9kKSB7XG4gIGRlZmF1bHRzLmhlYWRlcnNbbWV0aG9kXSA9IHV0aWxzLm1lcmdlKERFRkFVTFRfQ09OVEVOVF9UWVBFKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmF1bHRzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2lsZW50SlNPTlBhcnNpbmc6IHRydWUsXG4gIGZvcmNlZEpTT05QYXJzaW5nOiB0cnVlLFxuICBjbGFyaWZ5VGltZW91dEVycm9yOiBmYWxzZVxufTtcbiIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBzdHJpY3Rcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZm9ybS1kYXRhJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgXCJ2ZXJzaW9uXCI6IFwiMC4yOC4xXCJcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG9Gb3JtRGF0YSA9IHJlcXVpcmUoJy4vdG9Gb3JtRGF0YScpO1xuXG5mdW5jdGlvbiBlbmNvZGUoc3RyKSB7XG4gIHZhciBjaGFyTWFwID0ge1xuICAgICchJzogJyUyMScsXG4gICAgXCInXCI6ICclMjcnLFxuICAgICcoJzogJyUyOCcsXG4gICAgJyknOiAnJTI5JyxcbiAgICAnfic6ICclN0UnLFxuICAgICclMjAnOiAnKycsXG4gICAgJyUwMCc6ICdcXHgwMCdcbiAgfTtcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzdHIpLnJlcGxhY2UoL1shJ1xcKFxcKX5dfCUyMHwlMDAvZywgZnVuY3Rpb24gcmVwbGFjZXIobWF0Y2gpIHtcbiAgICByZXR1cm4gY2hhck1hcFttYXRjaF07XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBBeGlvc1VSTFNlYXJjaFBhcmFtcyhwYXJhbXMsIG9wdGlvbnMpIHtcbiAgdGhpcy5fcGFpcnMgPSBbXTtcblxuICBwYXJhbXMgJiYgdG9Gb3JtRGF0YShwYXJhbXMsIHRoaXMsIG9wdGlvbnMpO1xufVxuXG52YXIgcHJvdG90eXBlID0gQXhpb3NVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlO1xuXG5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24gYXBwZW5kKG5hbWUsIHZhbHVlKSB7XG4gIHRoaXMuX3BhaXJzLnB1c2goW25hbWUsIHZhbHVlXSk7XG59O1xuXG5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyhlbmNvZGVyKSB7XG4gIHZhciBfZW5jb2RlID0gZW5jb2RlciA/IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGVuY29kZXIuY2FsbCh0aGlzLCB2YWx1ZSwgZW5jb2RlKTtcbiAgfSA6IGVuY29kZTtcblxuICByZXR1cm4gdGhpcy5fcGFpcnMubWFwKGZ1bmN0aW9uIGVhY2gocGFpcikge1xuICAgIHJldHVybiBfZW5jb2RlKHBhaXJbMF0pICsgJz0nICsgX2VuY29kZShwYWlyWzFdKTtcbiAgfSwgJycpLmpvaW4oJyYnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXhpb3NVUkxTZWFyY2hQYXJhbXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmluZChmbiwgdGhpc0FyZykge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcCgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgQXhpb3NVUkxTZWFyY2hQYXJhbXMgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0F4aW9zVVJMU2VhcmNoUGFyYW1zJyk7XG5cbmZ1bmN0aW9uIGVuY29kZSh2YWwpIHtcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudCh2YWwpLlxuICAgIHJlcGxhY2UoLyUzQS9naSwgJzonKS5cbiAgICByZXBsYWNlKC8lMjQvZywgJyQnKS5cbiAgICByZXBsYWNlKC8lMkMvZ2ksICcsJykuXG4gICAgcmVwbGFjZSgvJTIwL2csICcrJykuXG4gICAgcmVwbGFjZSgvJTVCL2dpLCAnWycpLlxuICAgIHJlcGxhY2UoLyU1RC9naSwgJ10nKTtcbn1cblxuLyoqXG4gKiBCdWlsZCBhIFVSTCBieSBhcHBlbmRpbmcgcGFyYW1zIHRvIHRoZSBlbmRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIFRoZSBiYXNlIG9mIHRoZSB1cmwgKGUuZy4sIGh0dHA6Ly93d3cuZ29vZ2xlLmNvbSlcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcGFyYW1zXSBUaGUgcGFyYW1zIHRvIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gez9vYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBmb3JtYXR0ZWQgdXJsXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYnVpbGRVUkwodXJsLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgLyplc2xpbnQgbm8tcGFyYW0tcmVhc3NpZ246MCovXG4gIGlmICghcGFyYW1zKSB7XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuXG4gIHZhciBoYXNobWFya0luZGV4ID0gdXJsLmluZGV4T2YoJyMnKTtcblxuICBpZiAoaGFzaG1hcmtJbmRleCAhPT0gLTEpIHtcbiAgICB1cmwgPSB1cmwuc2xpY2UoMCwgaGFzaG1hcmtJbmRleCk7XG4gIH1cblxuICB2YXIgX2VuY29kZSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5lbmNvZGUgfHwgZW5jb2RlO1xuXG4gIHZhciBzZXJpYWxpemVGbiA9IG9wdGlvbnMgJiYgb3B0aW9ucy5zZXJpYWxpemU7XG5cbiAgdmFyIHNlcmlhbGl6ZWRQYXJhbXM7XG5cbiAgaWYgKHNlcmlhbGl6ZUZuKSB7XG4gICAgc2VyaWFsaXplZFBhcmFtcyA9IHNlcmlhbGl6ZUZuKHBhcmFtcywgb3B0aW9ucyk7XG4gIH0gZWxzZSB7XG4gICAgc2VyaWFsaXplZFBhcmFtcyA9IHV0aWxzLmlzVVJMU2VhcmNoUGFyYW1zKHBhcmFtcykgP1xuICAgICAgcGFyYW1zLnRvU3RyaW5nKCkgOlxuICAgICAgbmV3IEF4aW9zVVJMU2VhcmNoUGFyYW1zKHBhcmFtcywgb3B0aW9ucykudG9TdHJpbmcoX2VuY29kZSk7XG4gIH1cblxuICBpZiAoc2VyaWFsaXplZFBhcmFtcykge1xuICAgIHVybCArPSAodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEgPyAnPycgOiAnJicpICsgc2VyaWFsaXplZFBhcmFtcztcbiAgfVxuXG4gIHJldHVybiB1cmw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgVVJMIGJ5IGNvbWJpbmluZyB0aGUgc3BlY2lmaWVkIFVSTHNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmFzZVVSTCBUaGUgYmFzZSBVUkxcbiAqIEBwYXJhbSB7c3RyaW5nfSByZWxhdGl2ZVVSTCBUaGUgcmVsYXRpdmUgVVJMXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgY29tYmluZWQgVVJMXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29tYmluZVVSTHMoYmFzZVVSTCwgcmVsYXRpdmVVUkwpIHtcbiAgcmV0dXJuIHJlbGF0aXZlVVJMXG4gICAgPyBiYXNlVVJMLnJlcGxhY2UoL1xcLyskLywgJycpICsgJy8nICsgcmVsYXRpdmVVUkwucmVwbGFjZSgvXlxcLysvLCAnJylcbiAgICA6IGJhc2VVUkw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKFxuICB1dGlscy5pc1N0YW5kYXJkQnJvd3NlckVudigpID9cblxuICAvLyBTdGFuZGFyZCBicm93c2VyIGVudnMgc3VwcG9ydCBkb2N1bWVudC5jb29raWVcbiAgICAoZnVuY3Rpb24gc3RhbmRhcmRCcm93c2VyRW52KCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uIHdyaXRlKG5hbWUsIHZhbHVlLCBleHBpcmVzLCBwYXRoLCBkb21haW4sIHNlY3VyZSkge1xuICAgICAgICAgIHZhciBjb29raWUgPSBbXTtcbiAgICAgICAgICBjb29raWUucHVzaChuYW1lICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSk7XG5cbiAgICAgICAgICBpZiAodXRpbHMuaXNOdW1iZXIoZXhwaXJlcykpIHtcbiAgICAgICAgICAgIGNvb2tpZS5wdXNoKCdleHBpcmVzPScgKyBuZXcgRGF0ZShleHBpcmVzKS50b0dNVFN0cmluZygpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodXRpbHMuaXNTdHJpbmcocGF0aCkpIHtcbiAgICAgICAgICAgIGNvb2tpZS5wdXNoKCdwYXRoPScgKyBwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodXRpbHMuaXNTdHJpbmcoZG9tYWluKSkge1xuICAgICAgICAgICAgY29va2llLnB1c2goJ2RvbWFpbj0nICsgZG9tYWluKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2VjdXJlID09PSB0cnVlKSB7XG4gICAgICAgICAgICBjb29raWUucHVzaCgnc2VjdXJlJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZG9jdW1lbnQuY29va2llID0gY29va2llLmpvaW4oJzsgJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVhZDogZnVuY3Rpb24gcmVhZChuYW1lKSB7XG4gICAgICAgICAgdmFyIG1hdGNoID0gZG9jdW1lbnQuY29va2llLm1hdGNoKG5ldyBSZWdFeHAoJyhefDtcXFxccyopKCcgKyBuYW1lICsgJyk9KFteO10qKScpKTtcbiAgICAgICAgICByZXR1cm4gKG1hdGNoID8gZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzNdKSA6IG51bGwpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKG5hbWUpIHtcbiAgICAgICAgICB0aGlzLndyaXRlKG5hbWUsICcnLCBEYXRlLm5vdygpIC0gODY0MDAwMDApO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKCkgOlxuXG4gIC8vIE5vbiBzdGFuZGFyZCBicm93c2VyIGVudiAod2ViIHdvcmtlcnMsIHJlYWN0LW5hdGl2ZSkgbGFjayBuZWVkZWQgc3VwcG9ydC5cbiAgICAoZnVuY3Rpb24gbm9uU3RhbmRhcmRCcm93c2VyRW52KCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uIHdyaXRlKCkge30sXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQoKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZSgpIHt9XG4gICAgICB9O1xuICAgIH0pKClcbik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbmZ1bmN0aW9uIHBhcnNlUHJvcFBhdGgobmFtZSkge1xuICAvLyBmb29beF1beV1bel1cbiAgLy8gZm9vLngueS56XG4gIC8vIGZvby14LXktelxuICAvLyBmb28geCB5IHpcbiAgcmV0dXJuIHV0aWxzLm1hdGNoQWxsKC9cXHcrfFxcWyhcXHcqKV0vZywgbmFtZSkubWFwKGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgcmV0dXJuIG1hdGNoWzBdID09PSAnW10nID8gJycgOiBtYXRjaFsxXSB8fCBtYXRjaFswXTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFycmF5VG9PYmplY3QoYXJyKSB7XG4gIHZhciBvYmogPSB7fTtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhcnIpO1xuICB2YXIgaTtcbiAgdmFyIGxlbiA9IGtleXMubGVuZ3RoO1xuICB2YXIga2V5O1xuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBrZXkgPSBrZXlzW2ldO1xuICAgIG9ialtrZXldID0gYXJyW2tleV07XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gZm9ybURhdGFUb0pTT04oZm9ybURhdGEpIHtcbiAgZnVuY3Rpb24gYnVpbGRQYXRoKHBhdGgsIHZhbHVlLCB0YXJnZXQsIGluZGV4KSB7XG4gICAgdmFyIG5hbWUgPSBwYXRoW2luZGV4KytdO1xuICAgIHZhciBpc051bWVyaWNLZXkgPSBOdW1iZXIuaXNGaW5pdGUoK25hbWUpO1xuICAgIHZhciBpc0xhc3QgPSBpbmRleCA+PSBwYXRoLmxlbmd0aDtcbiAgICBuYW1lID0gIW5hbWUgJiYgdXRpbHMuaXNBcnJheSh0YXJnZXQpID8gdGFyZ2V0Lmxlbmd0aCA6IG5hbWU7XG5cbiAgICBpZiAoaXNMYXN0KSB7XG4gICAgICBpZiAodXRpbHMuaGFzT3duUHJvcGVydHkodGFyZ2V0LCBuYW1lKSkge1xuICAgICAgICB0YXJnZXRbbmFtZV0gPSBbdGFyZ2V0W25hbWVdLCB2YWx1ZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICFpc051bWVyaWNLZXk7XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXRbbmFtZV0gfHwgIXV0aWxzLmlzT2JqZWN0KHRhcmdldFtuYW1lXSkpIHtcbiAgICAgIHRhcmdldFtuYW1lXSA9IFtdO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBidWlsZFBhdGgocGF0aCwgdmFsdWUsIHRhcmdldFtuYW1lXSwgaW5kZXgpO1xuXG4gICAgaWYgKHJlc3VsdCAmJiB1dGlscy5pc0FycmF5KHRhcmdldFtuYW1lXSkpIHtcbiAgICAgIHRhcmdldFtuYW1lXSA9IGFycmF5VG9PYmplY3QodGFyZ2V0W25hbWVdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gIWlzTnVtZXJpY0tleTtcbiAgfVxuXG4gIGlmICh1dGlscy5pc0Zvcm1EYXRhKGZvcm1EYXRhKSAmJiB1dGlscy5pc0Z1bmN0aW9uKGZvcm1EYXRhLmVudHJpZXMpKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuXG4gICAgdXRpbHMuZm9yRWFjaEVudHJ5KGZvcm1EYXRhLCBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgYnVpbGRQYXRoKHBhcnNlUHJvcFBhdGgobmFtZSksIHZhbHVlLCBvYmosIDApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZvcm1EYXRhVG9KU09OO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgc3BlY2lmaWVkIFVSTCBpcyBhYnNvbHV0ZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGhlIFVSTCB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgc3BlY2lmaWVkIFVSTCBpcyBhYnNvbHV0ZSwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBYnNvbHV0ZVVSTCh1cmwpIHtcbiAgLy8gQSBVUkwgaXMgY29uc2lkZXJlZCBhYnNvbHV0ZSBpZiBpdCBiZWdpbnMgd2l0aCBcIjxzY2hlbWU+Oi8vXCIgb3IgXCIvL1wiIChwcm90b2NvbC1yZWxhdGl2ZSBVUkwpLlxuICAvLyBSRkMgMzk4NiBkZWZpbmVzIHNjaGVtZSBuYW1lIGFzIGEgc2VxdWVuY2Ugb2YgY2hhcmFjdGVycyBiZWdpbm5pbmcgd2l0aCBhIGxldHRlciBhbmQgZm9sbG93ZWRcbiAgLy8gYnkgYW55IGNvbWJpbmF0aW9uIG9mIGxldHRlcnMsIGRpZ2l0cywgcGx1cywgcGVyaW9kLCBvciBoeXBoZW4uXG4gIHJldHVybiAvXihbYS16XVthLXpcXGQrXFwtLl0qOik/XFwvXFwvL2kudGVzdCh1cmwpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcGF5bG9hZCBpcyBhbiBlcnJvciB0aHJvd24gYnkgQXhpb3NcbiAqXG4gKiBAcGFyYW0geyp9IHBheWxvYWQgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBwYXlsb2FkIGlzIGFuIGVycm9yIHRocm93biBieSBBeGlvcywgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBeGlvc0Vycm9yKHBheWxvYWQpIHtcbiAgcmV0dXJuIHV0aWxzLmlzT2JqZWN0KHBheWxvYWQpICYmIChwYXlsb2FkLmlzQXhpb3NFcnJvciA9PT0gdHJ1ZSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKFxuICB1dGlscy5pc1N0YW5kYXJkQnJvd3NlckVudigpID9cblxuICAvLyBTdGFuZGFyZCBicm93c2VyIGVudnMgaGF2ZSBmdWxsIHN1cHBvcnQgb2YgdGhlIEFQSXMgbmVlZGVkIHRvIHRlc3RcbiAgLy8gd2hldGhlciB0aGUgcmVxdWVzdCBVUkwgaXMgb2YgdGhlIHNhbWUgb3JpZ2luIGFzIGN1cnJlbnQgbG9jYXRpb24uXG4gICAgKGZ1bmN0aW9uIHN0YW5kYXJkQnJvd3NlckVudigpIHtcbiAgICAgIHZhciBtc2llID0gLyhtc2llfHRyaWRlbnQpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgICAgIHZhciB1cmxQYXJzaW5nTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgIHZhciBvcmlnaW5VUkw7XG5cbiAgICAgIC8qKlxuICAgICAgKiBQYXJzZSBhIFVSTCB0byBkaXNjb3ZlciBpdCdzIGNvbXBvbmVudHNcbiAgICAgICpcbiAgICAgICogQHBhcmFtIHtTdHJpbmd9IHVybCBUaGUgVVJMIHRvIGJlIHBhcnNlZFxuICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAgKi9cbiAgICAgIGZ1bmN0aW9uIHJlc29sdmVVUkwodXJsKSB7XG4gICAgICAgIHZhciBocmVmID0gdXJsO1xuXG4gICAgICAgIGlmIChtc2llKSB7XG4gICAgICAgICAgLy8gSUUgbmVlZHMgYXR0cmlidXRlIHNldCB0d2ljZSB0byBub3JtYWxpemUgcHJvcGVydGllc1xuICAgICAgICAgIHVybFBhcnNpbmdOb2RlLnNldEF0dHJpYnV0ZSgnaHJlZicsIGhyZWYpO1xuICAgICAgICAgIGhyZWYgPSB1cmxQYXJzaW5nTm9kZS5ocmVmO1xuICAgICAgICB9XG5cbiAgICAgICAgdXJsUGFyc2luZ05vZGUuc2V0QXR0cmlidXRlKCdocmVmJywgaHJlZik7XG5cbiAgICAgICAgLy8gdXJsUGFyc2luZ05vZGUgcHJvdmlkZXMgdGhlIFVybFV0aWxzIGludGVyZmFjZSAtIGh0dHA6Ly91cmwuc3BlYy53aGF0d2cub3JnLyN1cmx1dGlsc1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGhyZWY6IHVybFBhcnNpbmdOb2RlLmhyZWYsXG4gICAgICAgICAgcHJvdG9jb2w6IHVybFBhcnNpbmdOb2RlLnByb3RvY29sID8gdXJsUGFyc2luZ05vZGUucHJvdG9jb2wucmVwbGFjZSgvOiQvLCAnJykgOiAnJyxcbiAgICAgICAgICBob3N0OiB1cmxQYXJzaW5nTm9kZS5ob3N0LFxuICAgICAgICAgIHNlYXJjaDogdXJsUGFyc2luZ05vZGUuc2VhcmNoID8gdXJsUGFyc2luZ05vZGUuc2VhcmNoLnJlcGxhY2UoL15cXD8vLCAnJykgOiAnJyxcbiAgICAgICAgICBoYXNoOiB1cmxQYXJzaW5nTm9kZS5oYXNoID8gdXJsUGFyc2luZ05vZGUuaGFzaC5yZXBsYWNlKC9eIy8sICcnKSA6ICcnLFxuICAgICAgICAgIGhvc3RuYW1lOiB1cmxQYXJzaW5nTm9kZS5ob3N0bmFtZSxcbiAgICAgICAgICBwb3J0OiB1cmxQYXJzaW5nTm9kZS5wb3J0LFxuICAgICAgICAgIHBhdGhuYW1lOiAodXJsUGFyc2luZ05vZGUucGF0aG5hbWUuY2hhckF0KDApID09PSAnLycpID9cbiAgICAgICAgICAgIHVybFBhcnNpbmdOb2RlLnBhdGhuYW1lIDpcbiAgICAgICAgICAgICcvJyArIHVybFBhcnNpbmdOb2RlLnBhdGhuYW1lXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIG9yaWdpblVSTCA9IHJlc29sdmVVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXG4gICAgICAvKipcbiAgICAgICogRGV0ZXJtaW5lIGlmIGEgVVJMIHNoYXJlcyB0aGUgc2FtZSBvcmlnaW4gYXMgdGhlIGN1cnJlbnQgbG9jYXRpb25cbiAgICAgICpcbiAgICAgICogQHBhcmFtIHtTdHJpbmd9IHJlcXVlc3RVUkwgVGhlIFVSTCB0byB0ZXN0XG4gICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIFVSTCBzaGFyZXMgdGhlIHNhbWUgb3JpZ2luLCBvdGhlcndpc2UgZmFsc2VcbiAgICAgICovXG4gICAgICByZXR1cm4gZnVuY3Rpb24gaXNVUkxTYW1lT3JpZ2luKHJlcXVlc3RVUkwpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9ICh1dGlscy5pc1N0cmluZyhyZXF1ZXN0VVJMKSkgPyByZXNvbHZlVVJMKHJlcXVlc3RVUkwpIDogcmVxdWVzdFVSTDtcbiAgICAgICAgcmV0dXJuIChwYXJzZWQucHJvdG9jb2wgPT09IG9yaWdpblVSTC5wcm90b2NvbCAmJlxuICAgICAgICAgICAgcGFyc2VkLmhvc3QgPT09IG9yaWdpblVSTC5ob3N0KTtcbiAgICAgIH07XG4gICAgfSkoKSA6XG5cbiAgICAvLyBOb24gc3RhbmRhcmQgYnJvd3NlciBlbnZzICh3ZWIgd29ya2VycywgcmVhY3QtbmF0aXZlKSBsYWNrIG5lZWRlZCBzdXBwb3J0LlxuICAgIChmdW5jdGlvbiBub25TdGFuZGFyZEJyb3dzZXJFbnYoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gaXNVUkxTYW1lT3JpZ2luKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG4gICAgfSkoKVxuKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBub3JtYWxpemVIZWFkZXJOYW1lKGhlYWRlcnMsIG5vcm1hbGl6ZWROYW1lKSB7XG4gIHV0aWxzLmZvckVhY2goaGVhZGVycywgZnVuY3Rpb24gcHJvY2Vzc0hlYWRlcih2YWx1ZSwgbmFtZSkge1xuICAgIGlmIChuYW1lICE9PSBub3JtYWxpemVkTmFtZSAmJiBuYW1lLnRvVXBwZXJDYXNlKCkgPT09IG5vcm1hbGl6ZWROYW1lLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgIGhlYWRlcnNbbm9ybWFsaXplZE5hbWVdID0gdmFsdWU7XG4gICAgICBkZWxldGUgaGVhZGVyc1tuYW1lXTtcbiAgICB9XG4gIH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xuXG4vLyBIZWFkZXJzIHdob3NlIGR1cGxpY2F0ZXMgYXJlIGlnbm9yZWQgYnkgbm9kZVxuLy8gYy5mLiBodHRwczovL25vZGVqcy5vcmcvYXBpL2h0dHAuaHRtbCNodHRwX21lc3NhZ2VfaGVhZGVyc1xudmFyIGlnbm9yZUR1cGxpY2F0ZU9mID0gW1xuICAnYWdlJywgJ2F1dGhvcml6YXRpb24nLCAnY29udGVudC1sZW5ndGgnLCAnY29udGVudC10eXBlJywgJ2V0YWcnLFxuICAnZXhwaXJlcycsICdmcm9tJywgJ2hvc3QnLCAnaWYtbW9kaWZpZWQtc2luY2UnLCAnaWYtdW5tb2RpZmllZC1zaW5jZScsXG4gICdsYXN0LW1vZGlmaWVkJywgJ2xvY2F0aW9uJywgJ21heC1mb3J3YXJkcycsICdwcm94eS1hdXRob3JpemF0aW9uJyxcbiAgJ3JlZmVyZXInLCAncmV0cnktYWZ0ZXInLCAndXNlci1hZ2VudCdcbl07XG5cbi8qKlxuICogUGFyc2UgaGVhZGVycyBpbnRvIGFuIG9iamVjdFxuICpcbiAqIGBgYFxuICogRGF0ZTogV2VkLCAyNyBBdWcgMjAxNCAwODo1ODo0OSBHTVRcbiAqIENvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvblxuICogQ29ubmVjdGlvbjoga2VlcC1hbGl2ZVxuICogVHJhbnNmZXItRW5jb2Rpbmc6IGNodW5rZWRcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBoZWFkZXJzIEhlYWRlcnMgbmVlZGluZyB0byBiZSBwYXJzZWRcbiAqIEByZXR1cm5zIHtPYmplY3R9IEhlYWRlcnMgcGFyc2VkIGludG8gYW4gb2JqZWN0XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VIZWFkZXJzKGhlYWRlcnMpIHtcbiAgdmFyIHBhcnNlZCA9IHt9O1xuICB2YXIga2V5O1xuICB2YXIgdmFsO1xuICB2YXIgaTtcblxuICBpZiAoIWhlYWRlcnMpIHsgcmV0dXJuIHBhcnNlZDsgfVxuXG4gIHV0aWxzLmZvckVhY2goaGVhZGVycy5zcGxpdCgnXFxuJyksIGZ1bmN0aW9uIHBhcnNlcihsaW5lKSB7XG4gICAgaSA9IGxpbmUuaW5kZXhPZignOicpO1xuICAgIGtleSA9IHV0aWxzLnRyaW0obGluZS5zbGljZSgwLCBpKSkudG9Mb3dlckNhc2UoKTtcbiAgICB2YWwgPSB1dGlscy50cmltKGxpbmUuc2xpY2UoaSArIDEpKTtcblxuICAgIGlmIChrZXkpIHtcbiAgICAgIGlmIChwYXJzZWRba2V5XSAmJiBpZ25vcmVEdXBsaWNhdGVPZi5pbmRleE9mKGtleSkgPj0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoa2V5ID09PSAnc2V0LWNvb2tpZScpIHtcbiAgICAgICAgcGFyc2VkW2tleV0gPSAocGFyc2VkW2tleV0gPyBwYXJzZWRba2V5XSA6IFtdKS5jb25jYXQoW3ZhbF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyc2VkW2tleV0gPSBwYXJzZWRba2V5XSA/IHBhcnNlZFtrZXldICsgJywgJyArIHZhbCA6IHZhbDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBwYXJzZWQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlUHJvdG9jb2wodXJsKSB7XG4gIHZhciBtYXRjaCA9IC9eKFstK1xcd117MSwyNX0pKDo/XFwvXFwvfDopLy5leGVjKHVybCk7XG4gIHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXSB8fCAnJztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU3ludGFjdGljIHN1Z2FyIGZvciBpbnZva2luZyBhIGZ1bmN0aW9uIGFuZCBleHBhbmRpbmcgYW4gYXJyYXkgZm9yIGFyZ3VtZW50cy5cbiAqXG4gKiBDb21tb24gdXNlIGNhc2Ugd291bGQgYmUgdG8gdXNlIGBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHlgLlxuICpcbiAqICBgYGBqc1xuICogIGZ1bmN0aW9uIGYoeCwgeSwgeikge31cbiAqICB2YXIgYXJncyA9IFsxLCAyLCAzXTtcbiAqICBmLmFwcGx5KG51bGwsIGFyZ3MpO1xuICogIGBgYFxuICpcbiAqIFdpdGggYHNwcmVhZGAgdGhpcyBleGFtcGxlIGNhbiBiZSByZS13cml0dGVuLlxuICpcbiAqICBgYGBqc1xuICogIHNwcmVhZChmdW5jdGlvbih4LCB5LCB6KSB7fSkoWzEsIDIsIDNdKTtcbiAqICBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNwcmVhZChjYWxsYmFjaykge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcChhcnIpIHtcbiAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkobnVsbCwgYXJyKTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4uL2NvcmUvQXhpb3NFcnJvcicpO1xudmFyIGVudkZvcm1EYXRhID0gcmVxdWlyZSgnLi4vZW52L2NsYXNzZXMvRm9ybURhdGEnKTtcblxuZnVuY3Rpb24gaXNWaXNpdGFibGUodGhpbmcpIHtcbiAgcmV0dXJuIHV0aWxzLmlzUGxhaW5PYmplY3QodGhpbmcpIHx8IHV0aWxzLmlzQXJyYXkodGhpbmcpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVCcmFja2V0cyhrZXkpIHtcbiAgcmV0dXJuIHV0aWxzLmVuZHNXaXRoKGtleSwgJ1tdJykgPyBrZXkuc2xpY2UoMCwgLTIpIDoga2V5O1xufVxuXG5mdW5jdGlvbiByZW5kZXJLZXkocGF0aCwga2V5LCBkb3RzKSB7XG4gIGlmICghcGF0aCkgcmV0dXJuIGtleTtcbiAgcmV0dXJuIHBhdGguY29uY2F0KGtleSkubWFwKGZ1bmN0aW9uIGVhY2godG9rZW4sIGkpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICB0b2tlbiA9IHJlbW92ZUJyYWNrZXRzKHRva2VuKTtcbiAgICByZXR1cm4gIWRvdHMgJiYgaSA/ICdbJyArIHRva2VuICsgJ10nIDogdG9rZW47XG4gIH0pLmpvaW4oZG90cyA/ICcuJyA6ICcnKTtcbn1cblxuZnVuY3Rpb24gaXNGbGF0QXJyYXkoYXJyKSB7XG4gIHJldHVybiB1dGlscy5pc0FycmF5KGFycikgJiYgIWFyci5zb21lKGlzVmlzaXRhYmxlKTtcbn1cblxudmFyIHByZWRpY2F0ZXMgPSB1dGlscy50b0ZsYXRPYmplY3QodXRpbHMsIHt9LCBudWxsLCBmdW5jdGlvbiBmaWx0ZXIocHJvcCkge1xuICByZXR1cm4gL15pc1tBLVpdLy50ZXN0KHByb3ApO1xufSk7XG5cbmZ1bmN0aW9uIGlzU3BlY0NvbXBsaWFudCh0aGluZykge1xuICByZXR1cm4gdGhpbmcgJiYgdXRpbHMuaXNGdW5jdGlvbih0aGluZy5hcHBlbmQpICYmIHRoaW5nW1N5bWJvbC50b1N0cmluZ1RhZ10gPT09ICdGb3JtRGF0YScgJiYgdGhpbmdbU3ltYm9sLml0ZXJhdG9yXTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgZGF0YSBvYmplY3QgdG8gRm9ybURhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7P09iamVjdH0gW2Zvcm1EYXRhXVxuICogQHBhcmFtIHs/T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLnZpc2l0b3JdXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLm1ldGFUb2tlbnMgPSB0cnVlXVxuICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5kb3RzID0gZmFsc2VdXG4gKiBAcGFyYW0gez9Cb29sZWFufSBbb3B0aW9ucy5pbmRleGVzID0gZmFsc2VdXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICoqL1xuXG5mdW5jdGlvbiB0b0Zvcm1EYXRhKG9iaiwgZm9ybURhdGEsIG9wdGlvbnMpIHtcbiAgaWYgKCF1dGlscy5pc09iamVjdChvYmopKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndGFyZ2V0IG11c3QgYmUgYW4gb2JqZWN0Jyk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgZm9ybURhdGEgPSBmb3JtRGF0YSB8fCBuZXcgKGVudkZvcm1EYXRhIHx8IEZvcm1EYXRhKSgpO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICBvcHRpb25zID0gdXRpbHMudG9GbGF0T2JqZWN0KG9wdGlvbnMsIHtcbiAgICBtZXRhVG9rZW5zOiB0cnVlLFxuICAgIGRvdHM6IGZhbHNlLFxuICAgIGluZGV4ZXM6IGZhbHNlXG4gIH0sIGZhbHNlLCBmdW5jdGlvbiBkZWZpbmVkKG9wdGlvbiwgc291cmNlKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWVxLW51bGwsZXFlcWVxXG4gICAgcmV0dXJuICF1dGlscy5pc1VuZGVmaW5lZChzb3VyY2Vbb3B0aW9uXSk7XG4gIH0pO1xuXG4gIHZhciBtZXRhVG9rZW5zID0gb3B0aW9ucy5tZXRhVG9rZW5zO1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgdmFyIHZpc2l0b3IgPSBvcHRpb25zLnZpc2l0b3IgfHwgZGVmYXVsdFZpc2l0b3I7XG4gIHZhciBkb3RzID0gb3B0aW9ucy5kb3RzO1xuICB2YXIgaW5kZXhlcyA9IG9wdGlvbnMuaW5kZXhlcztcbiAgdmFyIF9CbG9iID0gb3B0aW9ucy5CbG9iIHx8IHR5cGVvZiBCbG9iICE9PSAndW5kZWZpbmVkJyAmJiBCbG9iO1xuICB2YXIgdXNlQmxvYiA9IF9CbG9iICYmIGlzU3BlY0NvbXBsaWFudChmb3JtRGF0YSk7XG5cbiAgaWYgKCF1dGlscy5pc0Z1bmN0aW9uKHZpc2l0b3IpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmlzaXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnZlcnRWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuICcnO1xuXG4gICAgaWYgKHV0aWxzLmlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS50b0lTT1N0cmluZygpO1xuICAgIH1cblxuICAgIGlmICghdXNlQmxvYiAmJiB1dGlscy5pc0Jsb2IodmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgQXhpb3NFcnJvcignQmxvYiBpcyBub3Qgc3VwcG9ydGVkLiBVc2UgYSBCdWZmZXIgaW5zdGVhZC4nKTtcbiAgICB9XG5cbiAgICBpZiAodXRpbHMuaXNBcnJheUJ1ZmZlcih2YWx1ZSkgfHwgdXRpbHMuaXNUeXBlZEFycmF5KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHVzZUJsb2IgJiYgdHlwZW9mIEJsb2IgPT09ICdmdW5jdGlvbicgPyBuZXcgQmxvYihbdmFsdWVdKSA6IEJ1ZmZlci5mcm9tKHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHsqfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IGtleVxuICAgKiBAcGFyYW0ge0FycmF5PFN0cmluZ3xOdW1iZXI+fSBwYXRoXG4gICAqIEB0aGlzIHtGb3JtRGF0YX1cbiAgICogQHJldHVybnMge2Jvb2xlYW59IHJldHVybiB0cnVlIHRvIHZpc2l0IHRoZSBlYWNoIHByb3Agb2YgdGhlIHZhbHVlIHJlY3Vyc2l2ZWx5XG4gICAqL1xuICBmdW5jdGlvbiBkZWZhdWx0VmlzaXRvcih2YWx1ZSwga2V5LCBwYXRoKSB7XG4gICAgdmFyIGFyciA9IHZhbHVlO1xuXG4gICAgaWYgKHZhbHVlICYmICFwYXRoICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmICh1dGlscy5lbmRzV2l0aChrZXksICd7fScpKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICBrZXkgPSBtZXRhVG9rZW5zID8ga2V5IDoga2V5LnNsaWNlKDAsIC0yKTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgKHV0aWxzLmlzQXJyYXkodmFsdWUpICYmIGlzRmxhdEFycmF5KHZhbHVlKSkgfHxcbiAgICAgICAgKHV0aWxzLmlzRmlsZUxpc3QodmFsdWUpIHx8IHV0aWxzLmVuZHNXaXRoKGtleSwgJ1tdJykgJiYgKGFyciA9IHV0aWxzLnRvQXJyYXkodmFsdWUpKVxuICAgICAgICApKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICBrZXkgPSByZW1vdmVCcmFja2V0cyhrZXkpO1xuXG4gICAgICAgIGFyci5mb3JFYWNoKGZ1bmN0aW9uIGVhY2goZWwsIGluZGV4KSB7XG4gICAgICAgICAgIXV0aWxzLmlzVW5kZWZpbmVkKGVsKSAmJiBmb3JtRGF0YS5hcHBlbmQoXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmVzdGVkLXRlcm5hcnlcbiAgICAgICAgICAgIGluZGV4ZXMgPT09IHRydWUgPyByZW5kZXJLZXkoW2tleV0sIGluZGV4LCBkb3RzKSA6IChpbmRleGVzID09PSBudWxsID8ga2V5IDoga2V5ICsgJ1tdJyksXG4gICAgICAgICAgICBjb252ZXJ0VmFsdWUoZWwpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNWaXNpdGFibGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3JtRGF0YS5hcHBlbmQocmVuZGVyS2V5KHBhdGgsIGtleSwgZG90cyksIGNvbnZlcnRWYWx1ZSh2YWx1ZSkpO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIHN0YWNrID0gW107XG5cbiAgdmFyIGV4cG9zZWRIZWxwZXJzID0gT2JqZWN0LmFzc2lnbihwcmVkaWNhdGVzLCB7XG4gICAgZGVmYXVsdFZpc2l0b3I6IGRlZmF1bHRWaXNpdG9yLFxuICAgIGNvbnZlcnRWYWx1ZTogY29udmVydFZhbHVlLFxuICAgIGlzVmlzaXRhYmxlOiBpc1Zpc2l0YWJsZVxuICB9KTtcblxuICBmdW5jdGlvbiBidWlsZCh2YWx1ZSwgcGF0aCkge1xuICAgIGlmICh1dGlscy5pc1VuZGVmaW5lZCh2YWx1ZSkpIHJldHVybjtcblxuICAgIGlmIChzdGFjay5pbmRleE9mKHZhbHVlKSAhPT0gLTEpIHtcbiAgICAgIHRocm93IEVycm9yKCdDaXJjdWxhciByZWZlcmVuY2UgZGV0ZWN0ZWQgaW4gJyArIHBhdGguam9pbignLicpKTtcbiAgICB9XG5cbiAgICBzdGFjay5wdXNoKHZhbHVlKTtcblxuICAgIHV0aWxzLmZvckVhY2godmFsdWUsIGZ1bmN0aW9uIGVhY2goZWwsIGtleSkge1xuICAgICAgdmFyIHJlc3VsdCA9ICF1dGlscy5pc1VuZGVmaW5lZChlbCkgJiYgdmlzaXRvci5jYWxsKFxuICAgICAgICBmb3JtRGF0YSwgZWwsIHV0aWxzLmlzU3RyaW5nKGtleSkgPyBrZXkudHJpbSgpIDoga2V5LCBwYXRoLCBleHBvc2VkSGVscGVyc1xuICAgICAgKTtcblxuICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICBidWlsZChlbCwgcGF0aCA/IHBhdGguY29uY2F0KGtleSkgOiBba2V5XSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzdGFjay5wb3AoKTtcbiAgfVxuXG4gIGlmICghdXRpbHMuaXNPYmplY3Qob2JqKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2RhdGEgbXVzdCBiZSBhbiBvYmplY3QnKTtcbiAgfVxuXG4gIGJ1aWxkKG9iaik7XG5cbiAgcmV0dXJuIGZvcm1EYXRhO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvRm9ybURhdGE7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgdG9Gb3JtRGF0YSA9IHJlcXVpcmUoJy4vdG9Gb3JtRGF0YScpO1xudmFyIHBsYXRmb3JtID0gcmVxdWlyZSgnLi4vcGxhdGZvcm0vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9VUkxFbmNvZGVkRm9ybShkYXRhLCBvcHRpb25zKSB7XG4gIHJldHVybiB0b0Zvcm1EYXRhKGRhdGEsIG5ldyBwbGF0Zm9ybS5jbGFzc2VzLlVSTFNlYXJjaFBhcmFtcygpLCBPYmplY3QuYXNzaWduKHtcbiAgICB2aXNpdG9yOiBmdW5jdGlvbih2YWx1ZSwga2V5LCBwYXRoLCBoZWxwZXJzKSB7XG4gICAgICBpZiAocGxhdGZvcm0uaXNOb2RlICYmIHV0aWxzLmlzQnVmZmVyKHZhbHVlKSkge1xuICAgICAgICB0aGlzLmFwcGVuZChrZXksIHZhbHVlLnRvU3RyaW5nKCdiYXNlNjQnKSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGhlbHBlcnMuZGVmYXVsdFZpc2l0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH0sIG9wdGlvbnMpKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBWRVJTSU9OID0gcmVxdWlyZSgnLi4vZW52L2RhdGEnKS52ZXJzaW9uO1xudmFyIEF4aW9zRXJyb3IgPSByZXF1aXJlKCcuLi9jb3JlL0F4aW9zRXJyb3InKTtcblxudmFyIHZhbGlkYXRvcnMgPSB7fTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcblsnb2JqZWN0JywgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ2Z1bmN0aW9uJywgJ3N0cmluZycsICdzeW1ib2wnXS5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUsIGkpIHtcbiAgdmFsaWRhdG9yc1t0eXBlXSA9IGZ1bmN0aW9uIHZhbGlkYXRvcih0aGluZykge1xuICAgIHJldHVybiB0eXBlb2YgdGhpbmcgPT09IHR5cGUgfHwgJ2EnICsgKGkgPCAxID8gJ24gJyA6ICcgJykgKyB0eXBlO1xuICB9O1xufSk7XG5cbnZhciBkZXByZWNhdGVkV2FybmluZ3MgPSB7fTtcblxuLyoqXG4gKiBUcmFuc2l0aW9uYWwgb3B0aW9uIHZhbGlkYXRvclxuICogQHBhcmFtIHtmdW5jdGlvbnxib29sZWFuP30gdmFsaWRhdG9yIC0gc2V0IHRvIGZhbHNlIGlmIHRoZSB0cmFuc2l0aW9uYWwgb3B0aW9uIGhhcyBiZWVuIHJlbW92ZWRcbiAqIEBwYXJhbSB7c3RyaW5nP30gdmVyc2lvbiAtIGRlcHJlY2F0ZWQgdmVyc2lvbiAvIHJlbW92ZWQgc2luY2UgdmVyc2lvblxuICogQHBhcmFtIHtzdHJpbmc/fSBtZXNzYWdlIC0gc29tZSBtZXNzYWdlIHdpdGggYWRkaXRpb25hbCBpbmZvXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259XG4gKi9cbnZhbGlkYXRvcnMudHJhbnNpdGlvbmFsID0gZnVuY3Rpb24gdHJhbnNpdGlvbmFsKHZhbGlkYXRvciwgdmVyc2lvbiwgbWVzc2FnZSkge1xuICBmdW5jdGlvbiBmb3JtYXRNZXNzYWdlKG9wdCwgZGVzYykge1xuICAgIHJldHVybiAnW0F4aW9zIHYnICsgVkVSU0lPTiArICddIFRyYW5zaXRpb25hbCBvcHRpb24gXFwnJyArIG9wdCArICdcXCcnICsgZGVzYyArIChtZXNzYWdlID8gJy4gJyArIG1lc3NhZ2UgOiAnJyk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIG9wdCwgb3B0cykge1xuICAgIGlmICh2YWxpZGF0b3IgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgQXhpb3NFcnJvcihcbiAgICAgICAgZm9ybWF0TWVzc2FnZShvcHQsICcgaGFzIGJlZW4gcmVtb3ZlZCcgKyAodmVyc2lvbiA/ICcgaW4gJyArIHZlcnNpb24gOiAnJykpLFxuICAgICAgICBBeGlvc0Vycm9yLkVSUl9ERVBSRUNBVEVEXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh2ZXJzaW9uICYmICFkZXByZWNhdGVkV2FybmluZ3Nbb3B0XSkge1xuICAgICAgZGVwcmVjYXRlZFdhcm5pbmdzW29wdF0gPSB0cnVlO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgZm9ybWF0TWVzc2FnZShcbiAgICAgICAgICBvcHQsXG4gICAgICAgICAgJyBoYXMgYmVlbiBkZXByZWNhdGVkIHNpbmNlIHYnICsgdmVyc2lvbiArICcgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgbmVhciBmdXR1cmUnXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbGlkYXRvciA/IHZhbGlkYXRvcih2YWx1ZSwgb3B0LCBvcHRzKSA6IHRydWU7XG4gIH07XG59O1xuXG4vKipcbiAqIEFzc2VydCBvYmplY3QncyBwcm9wZXJ0aWVzIHR5cGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge29iamVjdH0gc2NoZW1hXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSBhbGxvd1Vua25vd25cbiAqL1xuXG5mdW5jdGlvbiBhc3NlcnRPcHRpb25zKG9wdGlvbnMsIHNjaGVtYSwgYWxsb3dVbmtub3duKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgQXhpb3NFcnJvcignb3B0aW9ucyBtdXN0IGJlIGFuIG9iamVjdCcsIEF4aW9zRXJyb3IuRVJSX0JBRF9PUFRJT05fVkFMVUUpO1xuICB9XG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob3B0aW9ucyk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgdmFyIG9wdCA9IGtleXNbaV07XG4gICAgdmFyIHZhbGlkYXRvciA9IHNjaGVtYVtvcHRdO1xuICAgIGlmICh2YWxpZGF0b3IpIHtcbiAgICAgIHZhciB2YWx1ZSA9IG9wdGlvbnNbb3B0XTtcbiAgICAgIHZhciByZXN1bHQgPSB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbGlkYXRvcih2YWx1ZSwgb3B0LCBvcHRpb25zKTtcbiAgICAgIGlmIChyZXN1bHQgIT09IHRydWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEF4aW9zRXJyb3IoJ29wdGlvbiAnICsgb3B0ICsgJyBtdXN0IGJlICcgKyByZXN1bHQsIEF4aW9zRXJyb3IuRVJSX0JBRF9PUFRJT05fVkFMVUUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChhbGxvd1Vua25vd24gIT09IHRydWUpIHtcbiAgICAgIHRocm93IG5ldyBBeGlvc0Vycm9yKCdVbmtub3duIG9wdGlvbiAnICsgb3B0LCBBeGlvc0Vycm9yLkVSUl9CQURfT1BUSU9OKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFzc2VydE9wdGlvbnM6IGFzc2VydE9wdGlvbnMsXG4gIHZhbGlkYXRvcnM6IHZhbGlkYXRvcnNcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9ybURhdGE7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBBeGlvc1VSTFNlYXJjaFBhcmFtcyA9IHJlcXVpcmUoJy4uLy4uLy4uL2hlbHBlcnMvQXhpb3NVUkxTZWFyY2hQYXJhbXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB0eXBlb2YgVVJMU2VhcmNoUGFyYW1zICE9PSAndW5kZWZpbmVkJyA/IFVSTFNlYXJjaFBhcmFtcyA6IEF4aW9zVVJMU2VhcmNoUGFyYW1zO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaXNCcm93c2VyOiB0cnVlLFxuICBjbGFzc2VzOiB7XG4gICAgVVJMU2VhcmNoUGFyYW1zOiByZXF1aXJlKCcuL2NsYXNzZXMvVVJMU2VhcmNoUGFyYW1zJyksXG4gICAgRm9ybURhdGE6IHJlcXVpcmUoJy4vY2xhc3Nlcy9Gb3JtRGF0YScpLFxuICAgIEJsb2I6IEJsb2JcbiAgfSxcbiAgcHJvdG9jb2xzOiBbJ2h0dHAnLCAnaHR0cHMnLCAnZmlsZScsICdibG9iJywgJ3VybCcsICdkYXRhJ11cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9ub2RlLycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYmluZCA9IHJlcXVpcmUoJy4vaGVscGVycy9iaW5kJyk7XG5cbi8vIHV0aWxzIGlzIGEgbGlicmFyeSBvZiBnZW5lcmljIGhlbHBlciBmdW5jdGlvbnMgbm9uLXNwZWNpZmljIHRvIGF4aW9zXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG52YXIga2luZE9mID0gKGZ1bmN0aW9uKGNhY2hlKSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG4gIHJldHVybiBmdW5jdGlvbih0aGluZykge1xuICAgIHZhciBzdHIgPSB0b1N0cmluZy5jYWxsKHRoaW5nKTtcbiAgICByZXR1cm4gY2FjaGVbc3RyXSB8fCAoY2FjaGVbc3RyXSA9IHN0ci5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKSk7XG4gIH07XG59KShPYmplY3QuY3JlYXRlKG51bGwpKTtcblxuZnVuY3Rpb24ga2luZE9mVGVzdCh0eXBlKSB7XG4gIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBmdW5jdGlvbiBpc0tpbmRPZih0aGluZykge1xuICAgIHJldHVybiBraW5kT2YodGhpbmcpID09PSB0eXBlO1xuICB9O1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGFuIEFycmF5XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYW4gQXJyYXksIG90aGVyd2lzZSBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FycmF5KHZhbCkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWwpO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIHVuZGVmaW5lZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSB2YWx1ZSBpcyB1bmRlZmluZWQsIG90aGVyd2lzZSBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1VuZGVmaW5lZCh2YWwpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICd1bmRlZmluZWQnO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgQnVmZmVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYSBCdWZmZXIsIG90aGVyd2lzZSBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0J1ZmZlcih2YWwpIHtcbiAgcmV0dXJuIHZhbCAhPT0gbnVsbCAmJiAhaXNVbmRlZmluZWQodmFsKSAmJiB2YWwuY29uc3RydWN0b3IgIT09IG51bGwgJiYgIWlzVW5kZWZpbmVkKHZhbC5jb25zdHJ1Y3RvcilcbiAgICAmJiB0eXBlb2YgdmFsLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmIHZhbC5jb25zdHJ1Y3Rvci5pc0J1ZmZlcih2YWwpO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGFuIEFycmF5QnVmZmVyXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhbiBBcnJheUJ1ZmZlciwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbnZhciBpc0FycmF5QnVmZmVyID0ga2luZE9mVGVzdCgnQXJyYXlCdWZmZXInKTtcblxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgdmlldyBvbiBhbiBBcnJheUJ1ZmZlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGEgdmlldyBvbiBhbiBBcnJheUJ1ZmZlciwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlCdWZmZXJWaWV3KHZhbCkge1xuICB2YXIgcmVzdWx0O1xuICBpZiAoKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcpICYmIChBcnJheUJ1ZmZlci5pc1ZpZXcpKSB7XG4gICAgcmVzdWx0ID0gQXJyYXlCdWZmZXIuaXNWaWV3KHZhbCk7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ID0gKHZhbCkgJiYgKHZhbC5idWZmZXIpICYmIChpc0FycmF5QnVmZmVyKHZhbC5idWZmZXIpKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgU3RyaW5nXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYSBTdHJpbmcsIG90aGVyd2lzZSBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N0cmluZyh2YWwpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgTnVtYmVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYSBOdW1iZXIsIG90aGVyd2lzZSBmYWxzZVxuICovXG5mdW5jdGlvbiBpc051bWJlcih2YWwpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdudW1iZXInO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGFuIE9iamVjdFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGFuIE9iamVjdCwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbCkge1xuICByZXR1cm4gdmFsICE9PSBudWxsICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgcGxhaW4gT2JqZWN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIHBsYWluIE9iamVjdCwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsKSB7XG4gIGlmIChraW5kT2YodmFsKSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgcHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbCk7XG4gIHJldHVybiBwcm90b3R5cGUgPT09IG51bGwgfHwgcHJvdG90eXBlID09PSBPYmplY3QucHJvdG90eXBlO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgZW1wdHkgT2JqZWN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIGVtcHR5IE9iamVjdCwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRW1wdHlPYmplY3QodmFsKSB7XG4gIHJldHVybiB2YWwgJiYgT2JqZWN0LmtleXModmFsKS5sZW5ndGggPT09IDAgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbCkgPT09IE9iamVjdC5wcm90b3R5cGU7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBEYXRlXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIERhdGUsIG90aGVyd2lzZSBmYWxzZVxuICovXG52YXIgaXNEYXRlID0ga2luZE9mVGVzdCgnRGF0ZScpO1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgRmlsZVxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYSBGaWxlLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xudmFyIGlzRmlsZSA9IGtpbmRPZlRlc3QoJ0ZpbGUnKTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSB2YWx1ZSBpcyBhIEJsb2JcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGEgQmxvYiwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbnZhciBpc0Jsb2IgPSBraW5kT2ZUZXN0KCdCbG9iJyk7XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBGaWxlTGlzdFxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYSBGaWxlLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xudmFyIGlzRmlsZUxpc3QgPSBraW5kT2ZUZXN0KCdGaWxlTGlzdCcpO1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgRnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIEZ1bmN0aW9uLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWwpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwodmFsKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSB2YWx1ZSBpcyBhIFN0cmVhbVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGEgU3RyZWFtLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNTdHJlYW0odmFsKSB7XG4gIHJldHVybiBpc09iamVjdCh2YWwpICYmIGlzRnVuY3Rpb24odmFsLnBpcGUpO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgRm9ybURhdGFcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdGhpbmcgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGFuIEZvcm1EYXRhLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGb3JtRGF0YSh0aGluZykge1xuICB2YXIgcGF0dGVybiA9ICdbb2JqZWN0IEZvcm1EYXRhXSc7XG4gIHJldHVybiB0aGluZyAmJiAoXG4gICAgKHR5cGVvZiBGb3JtRGF0YSA9PT0gJ2Z1bmN0aW9uJyAmJiB0aGluZyBpbnN0YW5jZW9mIEZvcm1EYXRhKSB8fFxuICAgIHRvU3RyaW5nLmNhbGwodGhpbmcpID09PSBwYXR0ZXJuIHx8XG4gICAgKGlzRnVuY3Rpb24odGhpbmcudG9TdHJpbmcpICYmIHRoaW5nLnRvU3RyaW5nKCkgPT09IHBhdHRlcm4pXG4gICk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBVUkxTZWFyY2hQYXJhbXMgb2JqZWN0XG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGEgVVJMU2VhcmNoUGFyYW1zIG9iamVjdCwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbnZhciBpc1VSTFNlYXJjaFBhcmFtcyA9IGtpbmRPZlRlc3QoJ1VSTFNlYXJjaFBhcmFtcycpO1xuXG4vKipcbiAqIFRyaW0gZXhjZXNzIHdoaXRlc3BhY2Ugb2ZmIHRoZSBiZWdpbm5pbmcgYW5kIGVuZCBvZiBhIHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIFN0cmluZyB0byB0cmltXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgU3RyaW5nIGZyZWVkIG9mIGV4Y2VzcyB3aGl0ZXNwYWNlXG4gKi9cbmZ1bmN0aW9uIHRyaW0oc3RyKSB7XG4gIHJldHVybiBzdHIudHJpbSA/IHN0ci50cmltKCkgOiBzdHIucmVwbGFjZSgvXltcXHNcXHVGRUZGXFx4QTBdK3xbXFxzXFx1RkVGRlxceEEwXSskL2csICcnKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgd2UncmUgcnVubmluZyBpbiBhIHN0YW5kYXJkIGJyb3dzZXIgZW52aXJvbm1lbnRcbiAqXG4gKiBUaGlzIGFsbG93cyBheGlvcyB0byBydW4gaW4gYSB3ZWIgd29ya2VyLCBhbmQgcmVhY3QtbmF0aXZlLlxuICogQm90aCBlbnZpcm9ubWVudHMgc3VwcG9ydCBYTUxIdHRwUmVxdWVzdCwgYnV0IG5vdCBmdWxseSBzdGFuZGFyZCBnbG9iYWxzLlxuICpcbiAqIHdlYiB3b3JrZXJzOlxuICogIHR5cGVvZiB3aW5kb3cgLT4gdW5kZWZpbmVkXG4gKiAgdHlwZW9mIGRvY3VtZW50IC0+IHVuZGVmaW5lZFxuICpcbiAqIHJlYWN0LW5hdGl2ZTpcbiAqICBuYXZpZ2F0b3IucHJvZHVjdCAtPiAnUmVhY3ROYXRpdmUnXG4gKiBuYXRpdmVzY3JpcHRcbiAqICBuYXZpZ2F0b3IucHJvZHVjdCAtPiAnTmF0aXZlU2NyaXB0JyBvciAnTlMnXG4gKi9cbmZ1bmN0aW9uIGlzU3RhbmRhcmRCcm93c2VyRW52KCkge1xuICB2YXIgcHJvZHVjdDtcbiAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIChcbiAgICAocHJvZHVjdCA9IG5hdmlnYXRvci5wcm9kdWN0KSA9PT0gJ1JlYWN0TmF0aXZlJyB8fFxuICAgIHByb2R1Y3QgPT09ICdOYXRpdmVTY3JpcHQnIHx8XG4gICAgcHJvZHVjdCA9PT0gJ05TJylcbiAgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbi8qKlxuICogSXRlcmF0ZSBvdmVyIGFuIEFycmF5IG9yIGFuIE9iamVjdCBpbnZva2luZyBhIGZ1bmN0aW9uIGZvciBlYWNoIGl0ZW0uXG4gKlxuICogSWYgYG9iamAgaXMgYW4gQXJyYXkgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgcGFzc2luZ1xuICogdGhlIHZhbHVlLCBpbmRleCwgYW5kIGNvbXBsZXRlIGFycmF5IGZvciBlYWNoIGl0ZW0uXG4gKlxuICogSWYgJ29iaicgaXMgYW4gT2JqZWN0IGNhbGxiYWNrIHdpbGwgYmUgY2FsbGVkIHBhc3NpbmdcbiAqIHRoZSB2YWx1ZSwga2V5LCBhbmQgY29tcGxldGUgb2JqZWN0IGZvciBlYWNoIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSBvYmogVGhlIG9iamVjdCB0byBpdGVyYXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgY2FsbGJhY2sgdG8gaW52b2tlIGZvciBlYWNoIGl0ZW1cbiAqL1xuZnVuY3Rpb24gZm9yRWFjaChvYmosIGZuKSB7XG4gIC8vIERvbid0IGJvdGhlciBpZiBubyB2YWx1ZSBwcm92aWRlZFxuICBpZiAob2JqID09PSBudWxsIHx8IHR5cGVvZiBvYmogPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRm9yY2UgYW4gYXJyYXkgaWYgbm90IGFscmVhZHkgc29tZXRoaW5nIGl0ZXJhYmxlXG4gIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgIC8qZXNsaW50IG5vLXBhcmFtLXJlYXNzaWduOjAqL1xuICAgIG9iaiA9IFtvYmpdO1xuICB9XG5cbiAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhcnJheSB2YWx1ZXNcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9iai5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGZuLmNhbGwobnVsbCwgb2JqW2ldLCBpLCBvYmopO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBJdGVyYXRlIG92ZXIgb2JqZWN0IGtleXNcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICBmbi5jYWxsKG51bGwsIG9ialtrZXldLCBrZXksIG9iaik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQWNjZXB0cyB2YXJhcmdzIGV4cGVjdGluZyBlYWNoIGFyZ3VtZW50IHRvIGJlIGFuIG9iamVjdCwgdGhlblxuICogaW1tdXRhYmx5IG1lcmdlcyB0aGUgcHJvcGVydGllcyBvZiBlYWNoIG9iamVjdCBhbmQgcmV0dXJucyByZXN1bHQuXG4gKlxuICogV2hlbiBtdWx0aXBsZSBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUga2V5IHRoZSBsYXRlciBvYmplY3QgaW5cbiAqIHRoZSBhcmd1bWVudHMgbGlzdCB3aWxsIHRha2UgcHJlY2VkZW5jZS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiB2YXIgcmVzdWx0ID0gbWVyZ2Uoe2ZvbzogMTIzfSwge2ZvbzogNDU2fSk7XG4gKiBjb25zb2xlLmxvZyhyZXN1bHQuZm9vKTsgLy8gb3V0cHV0cyA0NTZcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmoxIE9iamVjdCB0byBtZXJnZVxuICogQHJldHVybnMge09iamVjdH0gUmVzdWx0IG9mIGFsbCBtZXJnZSBwcm9wZXJ0aWVzXG4gKi9cbmZ1bmN0aW9uIG1lcmdlKC8qIG9iajEsIG9iajIsIG9iajMsIC4uLiAqLykge1xuICB2YXIgcmVzdWx0ID0ge307XG4gIGZ1bmN0aW9uIGFzc2lnblZhbHVlKHZhbCwga2V5KSB7XG4gICAgaWYgKGlzUGxhaW5PYmplY3QocmVzdWx0W2tleV0pICYmIGlzUGxhaW5PYmplY3QodmFsKSkge1xuICAgICAgcmVzdWx0W2tleV0gPSBtZXJnZShyZXN1bHRba2V5XSwgdmFsKTtcbiAgICB9IGVsc2UgaWYgKGlzUGxhaW5PYmplY3QodmFsKSkge1xuICAgICAgcmVzdWx0W2tleV0gPSBtZXJnZSh7fSwgdmFsKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkodmFsKSkge1xuICAgICAgcmVzdWx0W2tleV0gPSB2YWwuc2xpY2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0W2tleV0gPSB2YWw7XG4gICAgfVxuICB9XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgZm9yRWFjaChhcmd1bWVudHNbaV0sIGFzc2lnblZhbHVlKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEV4dGVuZHMgb2JqZWN0IGEgYnkgbXV0YWJseSBhZGRpbmcgdG8gaXQgdGhlIHByb3BlcnRpZXMgb2Ygb2JqZWN0IGIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGEgVGhlIG9iamVjdCB0byBiZSBleHRlbmRlZFxuICogQHBhcmFtIHtPYmplY3R9IGIgVGhlIG9iamVjdCB0byBjb3B5IHByb3BlcnRpZXMgZnJvbVxuICogQHBhcmFtIHtPYmplY3R9IHRoaXNBcmcgVGhlIG9iamVjdCB0byBiaW5kIGZ1bmN0aW9uIHRvXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSByZXN1bHRpbmcgdmFsdWUgb2Ygb2JqZWN0IGFcbiAqL1xuZnVuY3Rpb24gZXh0ZW5kKGEsIGIsIHRoaXNBcmcpIHtcbiAgZm9yRWFjaChiLCBmdW5jdGlvbiBhc3NpZ25WYWx1ZSh2YWwsIGtleSkge1xuICAgIGlmICh0aGlzQXJnICYmIHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGFba2V5XSA9IGJpbmQodmFsLCB0aGlzQXJnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYVtrZXldID0gdmFsO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBhO1xufVxuXG4vKipcbiAqIFJlbW92ZSBieXRlIG9yZGVyIG1hcmtlci4gVGhpcyBjYXRjaGVzIEVGIEJCIEJGICh0aGUgVVRGLTggQk9NKVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb250ZW50IHdpdGggQk9NXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGNvbnRlbnQgdmFsdWUgd2l0aG91dCBCT01cbiAqL1xuZnVuY3Rpb24gc3RyaXBCT00oY29udGVudCkge1xuICBpZiAoY29udGVudC5jaGFyQ29kZUF0KDApID09PSAweEZFRkYpIHtcbiAgICBjb250ZW50ID0gY29udGVudC5zbGljZSgxKTtcbiAgfVxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge29iamVjdH0gW3Byb3BzXVxuICogQHBhcmFtIHtvYmplY3R9IFtkZXNjcmlwdG9yc11cbiAqL1xuXG5mdW5jdGlvbiBpbmhlcml0cyhjb25zdHJ1Y3Rvciwgc3VwZXJDb25zdHJ1Y3RvciwgcHJvcHMsIGRlc2NyaXB0b3JzKSB7XG4gIGNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIGRlc2NyaXB0b3JzKTtcbiAgY29uc3RydWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY29uc3RydWN0b3I7XG4gIHByb3BzICYmIE9iamVjdC5hc3NpZ24oY29uc3RydWN0b3IucHJvdG90eXBlLCBwcm9wcyk7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBvYmplY3Qgd2l0aCBkZWVwIHByb3RvdHlwZSBjaGFpbiB0byBhIGZsYXQgb2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlT2JqIHNvdXJjZSBvYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBbZGVzdE9ial1cbiAqIEBwYXJhbSB7RnVuY3Rpb258Qm9vbGVhbn0gW2ZpbHRlcl1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtwcm9wRmlsdGVyXVxuICogQHJldHVybnMge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiB0b0ZsYXRPYmplY3Qoc291cmNlT2JqLCBkZXN0T2JqLCBmaWx0ZXIsIHByb3BGaWx0ZXIpIHtcbiAgdmFyIHByb3BzO1xuICB2YXIgaTtcbiAgdmFyIHByb3A7XG4gIHZhciBtZXJnZWQgPSB7fTtcblxuICBkZXN0T2JqID0gZGVzdE9iaiB8fCB7fTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWVxLW51bGwsZXFlcWVxXG4gIGlmIChzb3VyY2VPYmogPT0gbnVsbCkgcmV0dXJuIGRlc3RPYmo7XG5cbiAgZG8ge1xuICAgIHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc291cmNlT2JqKTtcbiAgICBpID0gcHJvcHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgICBwcm9wID0gcHJvcHNbaV07XG4gICAgICBpZiAoKCFwcm9wRmlsdGVyIHx8IHByb3BGaWx0ZXIocHJvcCwgc291cmNlT2JqLCBkZXN0T2JqKSkgJiYgIW1lcmdlZFtwcm9wXSkge1xuICAgICAgICBkZXN0T2JqW3Byb3BdID0gc291cmNlT2JqW3Byb3BdO1xuICAgICAgICBtZXJnZWRbcHJvcF0gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBzb3VyY2VPYmogPSBmaWx0ZXIgIT09IGZhbHNlICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihzb3VyY2VPYmopO1xuICB9IHdoaWxlIChzb3VyY2VPYmogJiYgKCFmaWx0ZXIgfHwgZmlsdGVyKHNvdXJjZU9iaiwgZGVzdE9iaikpICYmIHNvdXJjZU9iaiAhPT0gT2JqZWN0LnByb3RvdHlwZSk7XG5cbiAgcmV0dXJuIGRlc3RPYmo7XG59XG5cbi8qXG4gKiBkZXRlcm1pbmVzIHdoZXRoZXIgYSBzdHJpbmcgZW5kcyB3aXRoIHRoZSBjaGFyYWN0ZXJzIG9mIGEgc3BlY2lmaWVkIHN0cmluZ1xuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtTdHJpbmd9IHNlYXJjaFN0cmluZ1xuICogQHBhcmFtIHtOdW1iZXJ9IFtwb3NpdGlvbj0gMF1cbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBlbmRzV2l0aChzdHIsIHNlYXJjaFN0cmluZywgcG9zaXRpb24pIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkIHx8IHBvc2l0aW9uID4gc3RyLmxlbmd0aCkge1xuICAgIHBvc2l0aW9uID0gc3RyLmxlbmd0aDtcbiAgfVxuICBwb3NpdGlvbiAtPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xuICB2YXIgbGFzdEluZGV4ID0gc3RyLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG4gIHJldHVybiBsYXN0SW5kZXggIT09IC0xICYmIGxhc3RJbmRleCA9PT0gcG9zaXRpb247XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIG5ldyBhcnJheSBmcm9tIGFycmF5IGxpa2Ugb2JqZWN0IG9yIG51bGwgaWYgZmFpbGVkXG4gKiBAcGFyYW0geyp9IFt0aGluZ11cbiAqIEByZXR1cm5zIHs/QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHRvQXJyYXkodGhpbmcpIHtcbiAgaWYgKCF0aGluZykgcmV0dXJuIG51bGw7XG4gIGlmIChpc0FycmF5KHRoaW5nKSkgcmV0dXJuIHRoaW5nO1xuICB2YXIgaSA9IHRoaW5nLmxlbmd0aDtcbiAgaWYgKCFpc051bWJlcihpKSkgcmV0dXJuIG51bGw7XG4gIHZhciBhcnIgPSBuZXcgQXJyYXkoaSk7XG4gIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgYXJyW2ldID0gdGhpbmdbaV07XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbnZhciBpc1R5cGVkQXJyYXkgPSAoZnVuY3Rpb24oVHlwZWRBcnJheSkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xuICByZXR1cm4gZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gVHlwZWRBcnJheSAmJiB0aGluZyBpbnN0YW5jZW9mIFR5cGVkQXJyYXk7XG4gIH07XG59KSh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKFVpbnQ4QXJyYXkpKTtcblxuZnVuY3Rpb24gZm9yRWFjaEVudHJ5KG9iaiwgZm4pIHtcbiAgdmFyIGdlbmVyYXRvciA9IG9iaiAmJiBvYmpbU3ltYm9sLml0ZXJhdG9yXTtcblxuICB2YXIgaXRlcmF0b3IgPSBnZW5lcmF0b3IuY2FsbChvYmopO1xuXG4gIHZhciByZXN1bHQ7XG5cbiAgd2hpbGUgKChyZXN1bHQgPSBpdGVyYXRvci5uZXh0KCkpICYmICFyZXN1bHQuZG9uZSkge1xuICAgIHZhciBwYWlyID0gcmVzdWx0LnZhbHVlO1xuICAgIGZuLmNhbGwob2JqLCBwYWlyWzBdLCBwYWlyWzFdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaEFsbChyZWdFeHAsIHN0cikge1xuICB2YXIgbWF0Y2hlcztcbiAgdmFyIGFyciA9IFtdO1xuXG4gIHdoaWxlICgobWF0Y2hlcyA9IHJlZ0V4cC5leGVjKHN0cikpICE9PSBudWxsKSB7XG4gICAgYXJyLnB1c2gobWF0Y2hlcyk7XG4gIH1cblxuICByZXR1cm4gYXJyO1xufVxuXG52YXIgaXNIVE1MRm9ybSA9IGtpbmRPZlRlc3QoJ0hUTUxGb3JtRWxlbWVudCcpO1xuXG52YXIgaGFzT3duUHJvcGVydHkgPSAoZnVuY3Rpb24gcmVzb2x2ZXIoX2hhc093blByb3BlcnR5KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmosIHByb3ApIHtcbiAgICByZXR1cm4gX2hhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbiAgfTtcbn0pKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaXNBcnJheTogaXNBcnJheSxcbiAgaXNBcnJheUJ1ZmZlcjogaXNBcnJheUJ1ZmZlcixcbiAgaXNCdWZmZXI6IGlzQnVmZmVyLFxuICBpc0Zvcm1EYXRhOiBpc0Zvcm1EYXRhLFxuICBpc0FycmF5QnVmZmVyVmlldzogaXNBcnJheUJ1ZmZlclZpZXcsXG4gIGlzU3RyaW5nOiBpc1N0cmluZyxcbiAgaXNOdW1iZXI6IGlzTnVtYmVyLFxuICBpc09iamVjdDogaXNPYmplY3QsXG4gIGlzUGxhaW5PYmplY3Q6IGlzUGxhaW5PYmplY3QsXG4gIGlzRW1wdHlPYmplY3Q6IGlzRW1wdHlPYmplY3QsXG4gIGlzVW5kZWZpbmVkOiBpc1VuZGVmaW5lZCxcbiAgaXNEYXRlOiBpc0RhdGUsXG4gIGlzRmlsZTogaXNGaWxlLFxuICBpc0Jsb2I6IGlzQmxvYixcbiAgaXNGdW5jdGlvbjogaXNGdW5jdGlvbixcbiAgaXNTdHJlYW06IGlzU3RyZWFtLFxuICBpc1VSTFNlYXJjaFBhcmFtczogaXNVUkxTZWFyY2hQYXJhbXMsXG4gIGlzU3RhbmRhcmRCcm93c2VyRW52OiBpc1N0YW5kYXJkQnJvd3NlckVudixcbiAgZm9yRWFjaDogZm9yRWFjaCxcbiAgbWVyZ2U6IG1lcmdlLFxuICBleHRlbmQ6IGV4dGVuZCxcbiAgdHJpbTogdHJpbSxcbiAgc3RyaXBCT006IHN0cmlwQk9NLFxuICBpbmhlcml0czogaW5oZXJpdHMsXG4gIHRvRmxhdE9iamVjdDogdG9GbGF0T2JqZWN0LFxuICBraW5kT2Y6IGtpbmRPZixcbiAga2luZE9mVGVzdDoga2luZE9mVGVzdCxcbiAgZW5kc1dpdGg6IGVuZHNXaXRoLFxuICB0b0FycmF5OiB0b0FycmF5LFxuICBpc1R5cGVkQXJyYXk6IGlzVHlwZWRBcnJheSxcbiAgaXNGaWxlTGlzdDogaXNGaWxlTGlzdCxcbiAgZm9yRWFjaEVudHJ5OiBmb3JFYWNoRW50cnksXG4gIG1hdGNoQWxsOiBtYXRjaEFsbCxcbiAgaXNIVE1MRm9ybTogaXNIVE1MRm9ybSxcbiAgaGFzT3duUHJvcGVydHk6IGhhc093blByb3BlcnR5XG59O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgdmFyIGlcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8XG4gICAgICByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPVxuICAgICAgKCh1aW50OFtpXSA8PCAxNikgJiAweEZGMDAwMCkgK1xuICAgICAgKCh1aW50OFtpICsgMV0gPDwgOCkgJiAweEZGMDApICtcbiAgICAgICh1aW50OFtpICsgMl0gJiAweEZGKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aCkpKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7IF9fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfSB9XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgICApXG4gIH1cblxuICBpZiAoaXNJbnN0YW5jZSh2YWx1ZSwgQXJyYXlCdWZmZXIpIHx8XG4gICAgICAodmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIEFycmF5QnVmZmVyKSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgKVxuICB9XG5cbiAgdmFyIHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKVxuICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIHZhciBiID0gZnJvbU9iamVjdCh2YWx1ZSlcbiAgaWYgKGIpIHJldHVybiBiXG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1ByaW1pdGl2ZSAhPSBudWxsICYmXG4gICAgICB0eXBlb2YgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0oJ3N0cmluZycpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGhcbiAgICApXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gIClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIHNpemUgKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICBidWYgPSBidWYuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlIChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgYnVmW2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcImxlbmd0aFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICB2YXIgYnVmXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICtcbiAgICAgICAgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpXG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KCc9JylbMF1cbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5tb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnID8gc2VsZi5Gb3JtRGF0YSA6IHdpbmRvdy5Gb3JtRGF0YTtcbiIsIi8qISBpZWVlNzU0LiBCU0QtMy1DbGF1c2UgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovXG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IChlICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IChtICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKCh2YWx1ZSAqIGMpIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgcnVudGltZSA9IChmdW5jdGlvbiAoZXhwb3J0cykge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgT3AgPSBPYmplY3QucHJvdG90eXBlO1xuICB2YXIgaGFzT3duID0gT3AuaGFzT3duUHJvcGVydHk7XG4gIHZhciBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSB8fCBmdW5jdGlvbiAob2JqLCBrZXksIGRlc2MpIHsgb2JqW2tleV0gPSBkZXNjLnZhbHVlOyB9O1xuICB2YXIgdW5kZWZpbmVkOyAvLyBNb3JlIGNvbXByZXNzaWJsZSB0aGFuIHZvaWQgMC5cbiAgdmFyICRTeW1ib2wgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgPyBTeW1ib2wgOiB7fTtcbiAgdmFyIGl0ZXJhdG9yU3ltYm9sID0gJFN5bWJvbC5pdGVyYXRvciB8fCBcIkBAaXRlcmF0b3JcIjtcbiAgdmFyIGFzeW5jSXRlcmF0b3JTeW1ib2wgPSAkU3ltYm9sLmFzeW5jSXRlcmF0b3IgfHwgXCJAQGFzeW5jSXRlcmF0b3JcIjtcbiAgdmFyIHRvU3RyaW5nVGFnU3ltYm9sID0gJFN5bWJvbC50b1N0cmluZ1RhZyB8fCBcIkBAdG9TdHJpbmdUYWdcIjtcblxuICBmdW5jdGlvbiBkZWZpbmUob2JqLCBrZXksIHZhbHVlKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gb2JqW2tleV07XG4gIH1cbiAgdHJ5IHtcbiAgICAvLyBJRSA4IGhhcyBhIGJyb2tlbiBPYmplY3QuZGVmaW5lUHJvcGVydHkgdGhhdCBvbmx5IHdvcmtzIG9uIERPTSBvYmplY3RzLlxuICAgIGRlZmluZSh7fSwgXCJcIik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGRlZmluZSA9IGZ1bmN0aW9uKG9iaiwga2V5LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIG9ialtrZXldID0gdmFsdWU7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyYXAoaW5uZXJGbiwgb3V0ZXJGbiwgc2VsZiwgdHJ5TG9jc0xpc3QpIHtcbiAgICAvLyBJZiBvdXRlckZuIHByb3ZpZGVkIGFuZCBvdXRlckZuLnByb3RvdHlwZSBpcyBhIEdlbmVyYXRvciwgdGhlbiBvdXRlckZuLnByb3RvdHlwZSBpbnN0YW5jZW9mIEdlbmVyYXRvci5cbiAgICB2YXIgcHJvdG9HZW5lcmF0b3IgPSBvdXRlckZuICYmIG91dGVyRm4ucHJvdG90eXBlIGluc3RhbmNlb2YgR2VuZXJhdG9yID8gb3V0ZXJGbiA6IEdlbmVyYXRvcjtcbiAgICB2YXIgZ2VuZXJhdG9yID0gT2JqZWN0LmNyZWF0ZShwcm90b0dlbmVyYXRvci5wcm90b3R5cGUpO1xuICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQodHJ5TG9jc0xpc3QgfHwgW10pO1xuXG4gICAgLy8gVGhlIC5faW52b2tlIG1ldGhvZCB1bmlmaWVzIHRoZSBpbXBsZW1lbnRhdGlvbnMgb2YgdGhlIC5uZXh0LFxuICAgIC8vIC50aHJvdywgYW5kIC5yZXR1cm4gbWV0aG9kcy5cbiAgICBkZWZpbmVQcm9wZXJ0eShnZW5lcmF0b3IsIFwiX2ludm9rZVwiLCB7IHZhbHVlOiBtYWtlSW52b2tlTWV0aG9kKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpIH0pO1xuXG4gICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgfVxuICBleHBvcnRzLndyYXAgPSB3cmFwO1xuXG4gIC8vIFRyeS9jYXRjaCBoZWxwZXIgdG8gbWluaW1pemUgZGVvcHRpbWl6YXRpb25zLiBSZXR1cm5zIGEgY29tcGxldGlvblxuICAvLyByZWNvcmQgbGlrZSBjb250ZXh0LnRyeUVudHJpZXNbaV0uY29tcGxldGlvbi4gVGhpcyBpbnRlcmZhY2UgY291bGRcbiAgLy8gaGF2ZSBiZWVuIChhbmQgd2FzIHByZXZpb3VzbHkpIGRlc2lnbmVkIHRvIHRha2UgYSBjbG9zdXJlIHRvIGJlXG4gIC8vIGludm9rZWQgd2l0aG91dCBhcmd1bWVudHMsIGJ1dCBpbiBhbGwgdGhlIGNhc2VzIHdlIGNhcmUgYWJvdXQgd2VcbiAgLy8gYWxyZWFkeSBoYXZlIGFuIGV4aXN0aW5nIG1ldGhvZCB3ZSB3YW50IHRvIGNhbGwsIHNvIHRoZXJlJ3Mgbm8gbmVlZFxuICAvLyB0byBjcmVhdGUgYSBuZXcgZnVuY3Rpb24gb2JqZWN0LiBXZSBjYW4gZXZlbiBnZXQgYXdheSB3aXRoIGFzc3VtaW5nXG4gIC8vIHRoZSBtZXRob2QgdGFrZXMgZXhhY3RseSBvbmUgYXJndW1lbnQsIHNpbmNlIHRoYXQgaGFwcGVucyB0byBiZSB0cnVlXG4gIC8vIGluIGV2ZXJ5IGNhc2UsIHNvIHdlIGRvbid0IGhhdmUgdG8gdG91Y2ggdGhlIGFyZ3VtZW50cyBvYmplY3QuIFRoZVxuICAvLyBvbmx5IGFkZGl0aW9uYWwgYWxsb2NhdGlvbiByZXF1aXJlZCBpcyB0aGUgY29tcGxldGlvbiByZWNvcmQsIHdoaWNoXG4gIC8vIGhhcyBhIHN0YWJsZSBzaGFwZSBhbmQgc28gaG9wZWZ1bGx5IHNob3VsZCBiZSBjaGVhcCB0byBhbGxvY2F0ZS5cbiAgZnVuY3Rpb24gdHJ5Q2F0Y2goZm4sIG9iaiwgYXJnKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwibm9ybWFsXCIsIGFyZzogZm4uY2FsbChvYmosIGFyZykgfTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwidGhyb3dcIiwgYXJnOiBlcnIgfTtcbiAgICB9XG4gIH1cblxuICB2YXIgR2VuU3RhdGVTdXNwZW5kZWRTdGFydCA9IFwic3VzcGVuZGVkU3RhcnRcIjtcbiAgdmFyIEdlblN0YXRlU3VzcGVuZGVkWWllbGQgPSBcInN1c3BlbmRlZFlpZWxkXCI7XG4gIHZhciBHZW5TdGF0ZUV4ZWN1dGluZyA9IFwiZXhlY3V0aW5nXCI7XG4gIHZhciBHZW5TdGF0ZUNvbXBsZXRlZCA9IFwiY29tcGxldGVkXCI7XG5cbiAgLy8gUmV0dXJuaW5nIHRoaXMgb2JqZWN0IGZyb20gdGhlIGlubmVyRm4gaGFzIHRoZSBzYW1lIGVmZmVjdCBhc1xuICAvLyBicmVha2luZyBvdXQgb2YgdGhlIGRpc3BhdGNoIHN3aXRjaCBzdGF0ZW1lbnQuXG4gIHZhciBDb250aW51ZVNlbnRpbmVsID0ge307XG5cbiAgLy8gRHVtbXkgY29uc3RydWN0b3IgZnVuY3Rpb25zIHRoYXQgd2UgdXNlIGFzIHRoZSAuY29uc3RydWN0b3IgYW5kXG4gIC8vIC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgcHJvcGVydGllcyBmb3IgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIEdlbmVyYXRvclxuICAvLyBvYmplY3RzLiBGb3IgZnVsbCBzcGVjIGNvbXBsaWFuY2UsIHlvdSBtYXkgd2lzaCB0byBjb25maWd1cmUgeW91clxuICAvLyBtaW5pZmllciBub3QgdG8gbWFuZ2xlIHRoZSBuYW1lcyBvZiB0aGVzZSB0d28gZnVuY3Rpb25zLlxuICBmdW5jdGlvbiBHZW5lcmF0b3IoKSB7fVxuICBmdW5jdGlvbiBHZW5lcmF0b3JGdW5jdGlvbigpIHt9XG4gIGZ1bmN0aW9uIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlKCkge31cblxuICAvLyBUaGlzIGlzIGEgcG9seWZpbGwgZm9yICVJdGVyYXRvclByb3RvdHlwZSUgZm9yIGVudmlyb25tZW50cyB0aGF0XG4gIC8vIGRvbid0IG5hdGl2ZWx5IHN1cHBvcnQgaXQuXG4gIHZhciBJdGVyYXRvclByb3RvdHlwZSA9IHt9O1xuICBkZWZpbmUoSXRlcmF0b3JQcm90b3R5cGUsIGl0ZXJhdG9yU3ltYm9sLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuXG4gIHZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZjtcbiAgdmFyIE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlID0gZ2V0UHJvdG8gJiYgZ2V0UHJvdG8oZ2V0UHJvdG8odmFsdWVzKFtdKSkpO1xuICBpZiAoTmF0aXZlSXRlcmF0b3JQcm90b3R5cGUgJiZcbiAgICAgIE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlICE9PSBPcCAmJlxuICAgICAgaGFzT3duLmNhbGwoTmF0aXZlSXRlcmF0b3JQcm90b3R5cGUsIGl0ZXJhdG9yU3ltYm9sKSkge1xuICAgIC8vIFRoaXMgZW52aXJvbm1lbnQgaGFzIGEgbmF0aXZlICVJdGVyYXRvclByb3RvdHlwZSU7IHVzZSBpdCBpbnN0ZWFkXG4gICAgLy8gb2YgdGhlIHBvbHlmaWxsLlxuICAgIEl0ZXJhdG9yUHJvdG90eXBlID0gTmF0aXZlSXRlcmF0b3JQcm90b3R5cGU7XG4gIH1cblxuICB2YXIgR3AgPSBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUgPVxuICAgIEdlbmVyYXRvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEl0ZXJhdG9yUHJvdG90eXBlKTtcbiAgR2VuZXJhdG9yRnVuY3Rpb24ucHJvdG90eXBlID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGU7XG4gIGRlZmluZVByb3BlcnR5KEdwLCBcImNvbnN0cnVjdG9yXCIsIHsgdmFsdWU6IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLCBjb25maWd1cmFibGU6IHRydWUgfSk7XG4gIGRlZmluZVByb3BlcnR5KFxuICAgIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLFxuICAgIFwiY29uc3RydWN0b3JcIixcbiAgICB7IHZhbHVlOiBHZW5lcmF0b3JGdW5jdGlvbiwgY29uZmlndXJhYmxlOiB0cnVlIH1cbiAgKTtcbiAgR2VuZXJhdG9yRnVuY3Rpb24uZGlzcGxheU5hbWUgPSBkZWZpbmUoXG4gICAgR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsXG4gICAgdG9TdHJpbmdUYWdTeW1ib2wsXG4gICAgXCJHZW5lcmF0b3JGdW5jdGlvblwiXG4gICk7XG5cbiAgLy8gSGVscGVyIGZvciBkZWZpbmluZyB0aGUgLm5leHQsIC50aHJvdywgYW5kIC5yZXR1cm4gbWV0aG9kcyBvZiB0aGVcbiAgLy8gSXRlcmF0b3IgaW50ZXJmYWNlIGluIHRlcm1zIG9mIGEgc2luZ2xlIC5faW52b2tlIG1ldGhvZC5cbiAgZnVuY3Rpb24gZGVmaW5lSXRlcmF0b3JNZXRob2RzKHByb3RvdHlwZSkge1xuICAgIFtcIm5leHRcIiwgXCJ0aHJvd1wiLCBcInJldHVyblwiXS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgZGVmaW5lKHByb3RvdHlwZSwgbWV0aG9kLCBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludm9rZShtZXRob2QsIGFyZyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGV4cG9ydHMuaXNHZW5lcmF0b3JGdW5jdGlvbiA9IGZ1bmN0aW9uKGdlbkZ1bikge1xuICAgIHZhciBjdG9yID0gdHlwZW9mIGdlbkZ1biA9PT0gXCJmdW5jdGlvblwiICYmIGdlbkZ1bi5jb25zdHJ1Y3RvcjtcbiAgICByZXR1cm4gY3RvclxuICAgICAgPyBjdG9yID09PSBHZW5lcmF0b3JGdW5jdGlvbiB8fFxuICAgICAgICAvLyBGb3IgdGhlIG5hdGl2ZSBHZW5lcmF0b3JGdW5jdGlvbiBjb25zdHJ1Y3RvciwgdGhlIGJlc3Qgd2UgY2FuXG4gICAgICAgIC8vIGRvIGlzIHRvIGNoZWNrIGl0cyAubmFtZSBwcm9wZXJ0eS5cbiAgICAgICAgKGN0b3IuZGlzcGxheU5hbWUgfHwgY3Rvci5uYW1lKSA9PT0gXCJHZW5lcmF0b3JGdW5jdGlvblwiXG4gICAgICA6IGZhbHNlO1xuICB9O1xuXG4gIGV4cG9ydHMubWFyayA9IGZ1bmN0aW9uKGdlbkZ1bikge1xuICAgIGlmIChPYmplY3Quc2V0UHJvdG90eXBlT2YpIHtcbiAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihnZW5GdW4sIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2VuRnVuLl9fcHJvdG9fXyA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICAgICAgZGVmaW5lKGdlbkZ1biwgdG9TdHJpbmdUYWdTeW1ib2wsIFwiR2VuZXJhdG9yRnVuY3Rpb25cIik7XG4gICAgfVxuICAgIGdlbkZ1bi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdwKTtcbiAgICByZXR1cm4gZ2VuRnVuO1xuICB9O1xuXG4gIC8vIFdpdGhpbiB0aGUgYm9keSBvZiBhbnkgYXN5bmMgZnVuY3Rpb24sIGBhd2FpdCB4YCBpcyB0cmFuc2Zvcm1lZCB0b1xuICAvLyBgeWllbGQgcmVnZW5lcmF0b3JSdW50aW1lLmF3cmFwKHgpYCwgc28gdGhhdCB0aGUgcnVudGltZSBjYW4gdGVzdFxuICAvLyBgaGFzT3duLmNhbGwodmFsdWUsIFwiX19hd2FpdFwiKWAgdG8gZGV0ZXJtaW5lIGlmIHRoZSB5aWVsZGVkIHZhbHVlIGlzXG4gIC8vIG1lYW50IHRvIGJlIGF3YWl0ZWQuXG4gIGV4cG9ydHMuYXdyYXAgPSBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4geyBfX2F3YWl0OiBhcmcgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBBc3luY0l0ZXJhdG9yKGdlbmVyYXRvciwgUHJvbWlzZUltcGwpIHtcbiAgICBmdW5jdGlvbiBpbnZva2UobWV0aG9kLCBhcmcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHJlY29yZCA9IHRyeUNhdGNoKGdlbmVyYXRvclttZXRob2RdLCBnZW5lcmF0b3IsIGFyZyk7XG4gICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICByZWplY3QocmVjb3JkLmFyZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcmVzdWx0ID0gcmVjb3JkLmFyZztcbiAgICAgICAgdmFyIHZhbHVlID0gcmVzdWx0LnZhbHVlO1xuICAgICAgICBpZiAodmFsdWUgJiZcbiAgICAgICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICAgaGFzT3duLmNhbGwodmFsdWUsIFwiX19hd2FpdFwiKSkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlSW1wbC5yZXNvbHZlKHZhbHVlLl9fYXdhaXQpLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGludm9rZShcIm5leHRcIiwgdmFsdWUsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBpbnZva2UoXCJ0aHJvd1wiLCBlcnIsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUHJvbWlzZUltcGwucmVzb2x2ZSh2YWx1ZSkudGhlbihmdW5jdGlvbih1bndyYXBwZWQpIHtcbiAgICAgICAgICAvLyBXaGVuIGEgeWllbGRlZCBQcm9taXNlIGlzIHJlc29sdmVkLCBpdHMgZmluYWwgdmFsdWUgYmVjb21lc1xuICAgICAgICAgIC8vIHRoZSAudmFsdWUgb2YgdGhlIFByb21pc2U8e3ZhbHVlLGRvbmV9PiByZXN1bHQgZm9yIHRoZVxuICAgICAgICAgIC8vIGN1cnJlbnQgaXRlcmF0aW9uLlxuICAgICAgICAgIHJlc3VsdC52YWx1ZSA9IHVud3JhcHBlZDtcbiAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgLy8gSWYgYSByZWplY3RlZCBQcm9taXNlIHdhcyB5aWVsZGVkLCB0aHJvdyB0aGUgcmVqZWN0aW9uIGJhY2tcbiAgICAgICAgICAvLyBpbnRvIHRoZSBhc3luYyBnZW5lcmF0b3IgZnVuY3Rpb24gc28gaXQgY2FuIGJlIGhhbmRsZWQgdGhlcmUuXG4gICAgICAgICAgcmV0dXJuIGludm9rZShcInRocm93XCIsIGVycm9yLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcHJldmlvdXNQcm9taXNlO1xuXG4gICAgZnVuY3Rpb24gZW5xdWV1ZShtZXRob2QsIGFyZykge1xuICAgICAgZnVuY3Rpb24gY2FsbEludm9rZVdpdGhNZXRob2RBbmRBcmcoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZUltcGwoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgaW52b2tlKG1ldGhvZCwgYXJnLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByZXZpb3VzUHJvbWlzZSA9XG4gICAgICAgIC8vIElmIGVucXVldWUgaGFzIGJlZW4gY2FsbGVkIGJlZm9yZSwgdGhlbiB3ZSB3YW50IHRvIHdhaXQgdW50aWxcbiAgICAgICAgLy8gYWxsIHByZXZpb3VzIFByb21pc2VzIGhhdmUgYmVlbiByZXNvbHZlZCBiZWZvcmUgY2FsbGluZyBpbnZva2UsXG4gICAgICAgIC8vIHNvIHRoYXQgcmVzdWx0cyBhcmUgYWx3YXlzIGRlbGl2ZXJlZCBpbiB0aGUgY29ycmVjdCBvcmRlci4gSWZcbiAgICAgICAgLy8gZW5xdWV1ZSBoYXMgbm90IGJlZW4gY2FsbGVkIGJlZm9yZSwgdGhlbiBpdCBpcyBpbXBvcnRhbnQgdG9cbiAgICAgICAgLy8gY2FsbCBpbnZva2UgaW1tZWRpYXRlbHksIHdpdGhvdXQgd2FpdGluZyBvbiBhIGNhbGxiYWNrIHRvIGZpcmUsXG4gICAgICAgIC8vIHNvIHRoYXQgdGhlIGFzeW5jIGdlbmVyYXRvciBmdW5jdGlvbiBoYXMgdGhlIG9wcG9ydHVuaXR5IHRvIGRvXG4gICAgICAgIC8vIGFueSBuZWNlc3Nhcnkgc2V0dXAgaW4gYSBwcmVkaWN0YWJsZSB3YXkuIFRoaXMgcHJlZGljdGFiaWxpdHlcbiAgICAgICAgLy8gaXMgd2h5IHRoZSBQcm9taXNlIGNvbnN0cnVjdG9yIHN5bmNocm9ub3VzbHkgaW52b2tlcyBpdHNcbiAgICAgICAgLy8gZXhlY3V0b3IgY2FsbGJhY2ssIGFuZCB3aHkgYXN5bmMgZnVuY3Rpb25zIHN5bmNocm9ub3VzbHlcbiAgICAgICAgLy8gZXhlY3V0ZSBjb2RlIGJlZm9yZSB0aGUgZmlyc3QgYXdhaXQuIFNpbmNlIHdlIGltcGxlbWVudCBzaW1wbGVcbiAgICAgICAgLy8gYXN5bmMgZnVuY3Rpb25zIGluIHRlcm1zIG9mIGFzeW5jIGdlbmVyYXRvcnMsIGl0IGlzIGVzcGVjaWFsbHlcbiAgICAgICAgLy8gaW1wb3J0YW50IHRvIGdldCB0aGlzIHJpZ2h0LCBldmVuIHRob3VnaCBpdCByZXF1aXJlcyBjYXJlLlxuICAgICAgICBwcmV2aW91c1Byb21pc2UgPyBwcmV2aW91c1Byb21pc2UudGhlbihcbiAgICAgICAgICBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZyxcbiAgICAgICAgICAvLyBBdm9pZCBwcm9wYWdhdGluZyBmYWlsdXJlcyB0byBQcm9taXNlcyByZXR1cm5lZCBieSBsYXRlclxuICAgICAgICAgIC8vIGludm9jYXRpb25zIG9mIHRoZSBpdGVyYXRvci5cbiAgICAgICAgICBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZ1xuICAgICAgICApIDogY2FsbEludm9rZVdpdGhNZXRob2RBbmRBcmcoKTtcbiAgICB9XG5cbiAgICAvLyBEZWZpbmUgdGhlIHVuaWZpZWQgaGVscGVyIG1ldGhvZCB0aGF0IGlzIHVzZWQgdG8gaW1wbGVtZW50IC5uZXh0LFxuICAgIC8vIC50aHJvdywgYW5kIC5yZXR1cm4gKHNlZSBkZWZpbmVJdGVyYXRvck1ldGhvZHMpLlxuICAgIGRlZmluZVByb3BlcnR5KHRoaXMsIFwiX2ludm9rZVwiLCB7IHZhbHVlOiBlbnF1ZXVlIH0pO1xuICB9XG5cbiAgZGVmaW5lSXRlcmF0b3JNZXRob2RzKEFzeW5jSXRlcmF0b3IucHJvdG90eXBlKTtcbiAgZGVmaW5lKEFzeW5jSXRlcmF0b3IucHJvdG90eXBlLCBhc3luY0l0ZXJhdG9yU3ltYm9sLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0pO1xuICBleHBvcnRzLkFzeW5jSXRlcmF0b3IgPSBBc3luY0l0ZXJhdG9yO1xuXG4gIC8vIE5vdGUgdGhhdCBzaW1wbGUgYXN5bmMgZnVuY3Rpb25zIGFyZSBpbXBsZW1lbnRlZCBvbiB0b3Agb2ZcbiAgLy8gQXN5bmNJdGVyYXRvciBvYmplY3RzOyB0aGV5IGp1c3QgcmV0dXJuIGEgUHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9mXG4gIC8vIHRoZSBmaW5hbCByZXN1bHQgcHJvZHVjZWQgYnkgdGhlIGl0ZXJhdG9yLlxuICBleHBvcnRzLmFzeW5jID0gZnVuY3Rpb24oaW5uZXJGbiwgb3V0ZXJGbiwgc2VsZiwgdHJ5TG9jc0xpc3QsIFByb21pc2VJbXBsKSB7XG4gICAgaWYgKFByb21pc2VJbXBsID09PSB2b2lkIDApIFByb21pc2VJbXBsID0gUHJvbWlzZTtcblxuICAgIHZhciBpdGVyID0gbmV3IEFzeW5jSXRlcmF0b3IoXG4gICAgICB3cmFwKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSxcbiAgICAgIFByb21pc2VJbXBsXG4gICAgKTtcblxuICAgIHJldHVybiBleHBvcnRzLmlzR2VuZXJhdG9yRnVuY3Rpb24ob3V0ZXJGbilcbiAgICAgID8gaXRlciAvLyBJZiBvdXRlckZuIGlzIGEgZ2VuZXJhdG9yLCByZXR1cm4gdGhlIGZ1bGwgaXRlcmF0b3IuXG4gICAgICA6IGl0ZXIubmV4dCgpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdC5kb25lID8gcmVzdWx0LnZhbHVlIDogaXRlci5uZXh0KCk7XG4gICAgICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG1ha2VJbnZva2VNZXRob2QoaW5uZXJGbiwgc2VsZiwgY29udGV4dCkge1xuICAgIHZhciBzdGF0ZSA9IEdlblN0YXRlU3VzcGVuZGVkU3RhcnQ7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gaW52b2tlKG1ldGhvZCwgYXJnKSB7XG4gICAgICBpZiAoc3RhdGUgPT09IEdlblN0YXRlRXhlY3V0aW5nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IHJ1bm5pbmdcIik7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0ZSA9PT0gR2VuU3RhdGVDb21wbGV0ZWQpIHtcbiAgICAgICAgaWYgKG1ldGhvZCA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgICAgdGhyb3cgYXJnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmUgZm9yZ2l2aW5nLCBwZXIgR2VuZXJhdG9yUmVzdW1lIGJlaGF2aW9yIHNwZWNpZmllZCBzaW5jZSBFUzIwMTU6XG4gICAgICAgIC8vIEVTMjAxNSBzcGVjLCBzdGVwIDM6IGh0dHBzOi8vMjYyLmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvNi4wLyNzZWMtZ2VuZXJhdG9ycmVzdW1lXG4gICAgICAgIC8vIExhdGVzdCBzcGVjLCBzdGVwIDI6IGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtZ2VuZXJhdG9ycmVzdW1lXG4gICAgICAgIHJldHVybiBkb25lUmVzdWx0KCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnRleHQubWV0aG9kID0gbWV0aG9kO1xuICAgICAgY29udGV4dC5hcmcgPSBhcmc7XG5cbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHZhciBkZWxlZ2F0ZSA9IGNvbnRleHQuZGVsZWdhdGU7XG4gICAgICAgIGlmIChkZWxlZ2F0ZSkge1xuICAgICAgICAgIHZhciBkZWxlZ2F0ZVJlc3VsdCA9IG1heWJlSW52b2tlRGVsZWdhdGUoZGVsZWdhdGUsIGNvbnRleHQpO1xuICAgICAgICAgIGlmIChkZWxlZ2F0ZVJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKGRlbGVnYXRlUmVzdWx0ID09PSBDb250aW51ZVNlbnRpbmVsKSBjb250aW51ZTtcbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZVJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29udGV4dC5tZXRob2QgPT09IFwibmV4dFwiKSB7XG4gICAgICAgICAgLy8gU2V0dGluZyBjb250ZXh0Ll9zZW50IGZvciBsZWdhY3kgc3VwcG9ydCBvZiBCYWJlbCdzXG4gICAgICAgICAgLy8gZnVuY3Rpb24uc2VudCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgICAgICBjb250ZXh0LnNlbnQgPSBjb250ZXh0Ll9zZW50ID0gY29udGV4dC5hcmc7XG5cbiAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0Lm1ldGhvZCA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgICAgaWYgKHN0YXRlID09PSBHZW5TdGF0ZVN1c3BlbmRlZFN0YXJ0KSB7XG4gICAgICAgICAgICBzdGF0ZSA9IEdlblN0YXRlQ29tcGxldGVkO1xuICAgICAgICAgICAgdGhyb3cgY29udGV4dC5hcmc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGV4dC5kaXNwYXRjaEV4Y2VwdGlvbihjb250ZXh0LmFyZyk7XG5cbiAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0Lm1ldGhvZCA9PT0gXCJyZXR1cm5cIikge1xuICAgICAgICAgIGNvbnRleHQuYWJydXB0KFwicmV0dXJuXCIsIGNvbnRleHQuYXJnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlID0gR2VuU3RhdGVFeGVjdXRpbmc7XG5cbiAgICAgICAgdmFyIHJlY29yZCA9IHRyeUNhdGNoKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpO1xuICAgICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwibm9ybWFsXCIpIHtcbiAgICAgICAgICAvLyBJZiBhbiBleGNlcHRpb24gaXMgdGhyb3duIGZyb20gaW5uZXJGbiwgd2UgbGVhdmUgc3RhdGUgPT09XG4gICAgICAgICAgLy8gR2VuU3RhdGVFeGVjdXRpbmcgYW5kIGxvb3AgYmFjayBmb3IgYW5vdGhlciBpbnZvY2F0aW9uLlxuICAgICAgICAgIHN0YXRlID0gY29udGV4dC5kb25lXG4gICAgICAgICAgICA/IEdlblN0YXRlQ29tcGxldGVkXG4gICAgICAgICAgICA6IEdlblN0YXRlU3VzcGVuZGVkWWllbGQ7XG5cbiAgICAgICAgICBpZiAocmVjb3JkLmFyZyA9PT0gQ29udGludWVTZW50aW5lbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbHVlOiByZWNvcmQuYXJnLFxuICAgICAgICAgICAgZG9uZTogY29udGV4dC5kb25lXG4gICAgICAgICAgfTtcblxuICAgICAgICB9IGVsc2UgaWYgKHJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgICBzdGF0ZSA9IEdlblN0YXRlQ29tcGxldGVkO1xuICAgICAgICAgIC8vIERpc3BhdGNoIHRoZSBleGNlcHRpb24gYnkgbG9vcGluZyBiYWNrIGFyb3VuZCB0byB0aGVcbiAgICAgICAgICAvLyBjb250ZXh0LmRpc3BhdGNoRXhjZXB0aW9uKGNvbnRleHQuYXJnKSBjYWxsIGFib3ZlLlxuICAgICAgICAgIGNvbnRleHQubWV0aG9kID0gXCJ0aHJvd1wiO1xuICAgICAgICAgIGNvbnRleHQuYXJnID0gcmVjb3JkLmFyZztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBDYWxsIGRlbGVnYXRlLml0ZXJhdG9yW2NvbnRleHQubWV0aG9kXShjb250ZXh0LmFyZykgYW5kIGhhbmRsZSB0aGVcbiAgLy8gcmVzdWx0LCBlaXRoZXIgYnkgcmV0dXJuaW5nIGEgeyB2YWx1ZSwgZG9uZSB9IHJlc3VsdCBmcm9tIHRoZVxuICAvLyBkZWxlZ2F0ZSBpdGVyYXRvciwgb3IgYnkgbW9kaWZ5aW5nIGNvbnRleHQubWV0aG9kIGFuZCBjb250ZXh0LmFyZyxcbiAgLy8gc2V0dGluZyBjb250ZXh0LmRlbGVnYXRlIHRvIG51bGwsIGFuZCByZXR1cm5pbmcgdGhlIENvbnRpbnVlU2VudGluZWwuXG4gIGZ1bmN0aW9uIG1heWJlSW52b2tlRGVsZWdhdGUoZGVsZWdhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIgbWV0aG9kTmFtZSA9IGNvbnRleHQubWV0aG9kO1xuICAgIHZhciBtZXRob2QgPSBkZWxlZ2F0ZS5pdGVyYXRvclttZXRob2ROYW1lXTtcbiAgICBpZiAobWV0aG9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIEEgLnRocm93IG9yIC5yZXR1cm4gd2hlbiB0aGUgZGVsZWdhdGUgaXRlcmF0b3IgaGFzIG5vIC50aHJvd1xuICAgICAgLy8gbWV0aG9kLCBvciBhIG1pc3NpbmcgLm5leHQgbWV0aG9kLCBhbHdheXMgdGVybWluYXRlIHRoZVxuICAgICAgLy8geWllbGQqIGxvb3AuXG4gICAgICBjb250ZXh0LmRlbGVnYXRlID0gbnVsbDtcblxuICAgICAgLy8gTm90ZTogW1wicmV0dXJuXCJdIG11c3QgYmUgdXNlZCBmb3IgRVMzIHBhcnNpbmcgY29tcGF0aWJpbGl0eS5cbiAgICAgIGlmIChtZXRob2ROYW1lID09PSBcInRocm93XCIgJiYgZGVsZWdhdGUuaXRlcmF0b3JbXCJyZXR1cm5cIl0pIHtcbiAgICAgICAgLy8gSWYgdGhlIGRlbGVnYXRlIGl0ZXJhdG9yIGhhcyBhIHJldHVybiBtZXRob2QsIGdpdmUgaXQgYVxuICAgICAgICAvLyBjaGFuY2UgdG8gY2xlYW4gdXAuXG4gICAgICAgIGNvbnRleHQubWV0aG9kID0gXCJyZXR1cm5cIjtcbiAgICAgICAgY29udGV4dC5hcmcgPSB1bmRlZmluZWQ7XG4gICAgICAgIG1heWJlSW52b2tlRGVsZWdhdGUoZGVsZWdhdGUsIGNvbnRleHQpO1xuXG4gICAgICAgIGlmIChjb250ZXh0Lm1ldGhvZCA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgICAgLy8gSWYgbWF5YmVJbnZva2VEZWxlZ2F0ZShjb250ZXh0KSBjaGFuZ2VkIGNvbnRleHQubWV0aG9kIGZyb21cbiAgICAgICAgICAvLyBcInJldHVyblwiIHRvIFwidGhyb3dcIiwgbGV0IHRoYXQgb3ZlcnJpZGUgdGhlIFR5cGVFcnJvciBiZWxvdy5cbiAgICAgICAgICByZXR1cm4gQ29udGludWVTZW50aW5lbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG1ldGhvZE5hbWUgIT09IFwicmV0dXJuXCIpIHtcbiAgICAgICAgY29udGV4dC5tZXRob2QgPSBcInRocm93XCI7XG4gICAgICAgIGNvbnRleHQuYXJnID0gbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICBcIlRoZSBpdGVyYXRvciBkb2VzIG5vdCBwcm92aWRlIGEgJ1wiICsgbWV0aG9kTmFtZSArIFwiJyBtZXRob2RcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH1cblxuICAgIHZhciByZWNvcmQgPSB0cnlDYXRjaChtZXRob2QsIGRlbGVnYXRlLml0ZXJhdG9yLCBjb250ZXh0LmFyZyk7XG5cbiAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgY29udGV4dC5tZXRob2QgPSBcInRocm93XCI7XG4gICAgICBjb250ZXh0LmFyZyA9IHJlY29yZC5hcmc7XG4gICAgICBjb250ZXh0LmRlbGVnYXRlID0gbnVsbDtcbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH1cblxuICAgIHZhciBpbmZvID0gcmVjb3JkLmFyZztcblxuICAgIGlmICghIGluZm8pIHtcbiAgICAgIGNvbnRleHQubWV0aG9kID0gXCJ0aHJvd1wiO1xuICAgICAgY29udGV4dC5hcmcgPSBuZXcgVHlwZUVycm9yKFwiaXRlcmF0b3IgcmVzdWx0IGlzIG5vdCBhbiBvYmplY3RcIik7XG4gICAgICBjb250ZXh0LmRlbGVnYXRlID0gbnVsbDtcbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH1cblxuICAgIGlmIChpbmZvLmRvbmUpIHtcbiAgICAgIC8vIEFzc2lnbiB0aGUgcmVzdWx0IG9mIHRoZSBmaW5pc2hlZCBkZWxlZ2F0ZSB0byB0aGUgdGVtcG9yYXJ5XG4gICAgICAvLyB2YXJpYWJsZSBzcGVjaWZpZWQgYnkgZGVsZWdhdGUucmVzdWx0TmFtZSAoc2VlIGRlbGVnYXRlWWllbGQpLlxuICAgICAgY29udGV4dFtkZWxlZ2F0ZS5yZXN1bHROYW1lXSA9IGluZm8udmFsdWU7XG5cbiAgICAgIC8vIFJlc3VtZSBleGVjdXRpb24gYXQgdGhlIGRlc2lyZWQgbG9jYXRpb24gKHNlZSBkZWxlZ2F0ZVlpZWxkKS5cbiAgICAgIGNvbnRleHQubmV4dCA9IGRlbGVnYXRlLm5leHRMb2M7XG5cbiAgICAgIC8vIElmIGNvbnRleHQubWV0aG9kIHdhcyBcInRocm93XCIgYnV0IHRoZSBkZWxlZ2F0ZSBoYW5kbGVkIHRoZVxuICAgICAgLy8gZXhjZXB0aW9uLCBsZXQgdGhlIG91dGVyIGdlbmVyYXRvciBwcm9jZWVkIG5vcm1hbGx5LiBJZlxuICAgICAgLy8gY29udGV4dC5tZXRob2Qgd2FzIFwibmV4dFwiLCBmb3JnZXQgY29udGV4dC5hcmcgc2luY2UgaXQgaGFzIGJlZW5cbiAgICAgIC8vIFwiY29uc3VtZWRcIiBieSB0aGUgZGVsZWdhdGUgaXRlcmF0b3IuIElmIGNvbnRleHQubWV0aG9kIHdhc1xuICAgICAgLy8gXCJyZXR1cm5cIiwgYWxsb3cgdGhlIG9yaWdpbmFsIC5yZXR1cm4gY2FsbCB0byBjb250aW51ZSBpbiB0aGVcbiAgICAgIC8vIG91dGVyIGdlbmVyYXRvci5cbiAgICAgIGlmIChjb250ZXh0Lm1ldGhvZCAhPT0gXCJyZXR1cm5cIikge1xuICAgICAgICBjb250ZXh0Lm1ldGhvZCA9IFwibmV4dFwiO1xuICAgICAgICBjb250ZXh0LmFyZyA9IHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZS15aWVsZCB0aGUgcmVzdWx0IHJldHVybmVkIGJ5IHRoZSBkZWxlZ2F0ZSBtZXRob2QuXG4gICAgICByZXR1cm4gaW5mbztcbiAgICB9XG5cbiAgICAvLyBUaGUgZGVsZWdhdGUgaXRlcmF0b3IgaXMgZmluaXNoZWQsIHNvIGZvcmdldCBpdCBhbmQgY29udGludWUgd2l0aFxuICAgIC8vIHRoZSBvdXRlciBnZW5lcmF0b3IuXG4gICAgY29udGV4dC5kZWxlZ2F0ZSA9IG51bGw7XG4gICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gIH1cblxuICAvLyBEZWZpbmUgR2VuZXJhdG9yLnByb3RvdHlwZS57bmV4dCx0aHJvdyxyZXR1cm59IGluIHRlcm1zIG9mIHRoZVxuICAvLyB1bmlmaWVkIC5faW52b2tlIGhlbHBlciBtZXRob2QuXG4gIGRlZmluZUl0ZXJhdG9yTWV0aG9kcyhHcCk7XG5cbiAgZGVmaW5lKEdwLCB0b1N0cmluZ1RhZ1N5bWJvbCwgXCJHZW5lcmF0b3JcIik7XG5cbiAgLy8gQSBHZW5lcmF0b3Igc2hvdWxkIGFsd2F5cyByZXR1cm4gaXRzZWxmIGFzIHRoZSBpdGVyYXRvciBvYmplY3Qgd2hlbiB0aGVcbiAgLy8gQEBpdGVyYXRvciBmdW5jdGlvbiBpcyBjYWxsZWQgb24gaXQuIFNvbWUgYnJvd3NlcnMnIGltcGxlbWVudGF0aW9ucyBvZiB0aGVcbiAgLy8gaXRlcmF0b3IgcHJvdG90eXBlIGNoYWluIGluY29ycmVjdGx5IGltcGxlbWVudCB0aGlzLCBjYXVzaW5nIHRoZSBHZW5lcmF0b3JcbiAgLy8gb2JqZWN0IHRvIG5vdCBiZSByZXR1cm5lZCBmcm9tIHRoaXMgY2FsbC4gVGhpcyBlbnN1cmVzIHRoYXQgZG9lc24ndCBoYXBwZW4uXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVnZW5lcmF0b3IvaXNzdWVzLzI3NCBmb3IgbW9yZSBkZXRhaWxzLlxuICBkZWZpbmUoR3AsIGl0ZXJhdG9yU3ltYm9sLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfSk7XG5cbiAgZGVmaW5lKEdwLCBcInRvU3RyaW5nXCIsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgR2VuZXJhdG9yXVwiO1xuICB9KTtcblxuICBmdW5jdGlvbiBwdXNoVHJ5RW50cnkobG9jcykge1xuICAgIHZhciBlbnRyeSA9IHsgdHJ5TG9jOiBsb2NzWzBdIH07XG5cbiAgICBpZiAoMSBpbiBsb2NzKSB7XG4gICAgICBlbnRyeS5jYXRjaExvYyA9IGxvY3NbMV07XG4gICAgfVxuXG4gICAgaWYgKDIgaW4gbG9jcykge1xuICAgICAgZW50cnkuZmluYWxseUxvYyA9IGxvY3NbMl07XG4gICAgICBlbnRyeS5hZnRlckxvYyA9IGxvY3NbM107XG4gICAgfVxuXG4gICAgdGhpcy50cnlFbnRyaWVzLnB1c2goZW50cnkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzZXRUcnlFbnRyeShlbnRyeSkge1xuICAgIHZhciByZWNvcmQgPSBlbnRyeS5jb21wbGV0aW9uIHx8IHt9O1xuICAgIHJlY29yZC50eXBlID0gXCJub3JtYWxcIjtcbiAgICBkZWxldGUgcmVjb3JkLmFyZztcbiAgICBlbnRyeS5jb21wbGV0aW9uID0gcmVjb3JkO1xuICB9XG5cbiAgZnVuY3Rpb24gQ29udGV4dCh0cnlMb2NzTGlzdCkge1xuICAgIC8vIFRoZSByb290IGVudHJ5IG9iamVjdCAoZWZmZWN0aXZlbHkgYSB0cnkgc3RhdGVtZW50IHdpdGhvdXQgYSBjYXRjaFxuICAgIC8vIG9yIGEgZmluYWxseSBibG9jaykgZ2l2ZXMgdXMgYSBwbGFjZSB0byBzdG9yZSB2YWx1ZXMgdGhyb3duIGZyb21cbiAgICAvLyBsb2NhdGlvbnMgd2hlcmUgdGhlcmUgaXMgbm8gZW5jbG9zaW5nIHRyeSBzdGF0ZW1lbnQuXG4gICAgdGhpcy50cnlFbnRyaWVzID0gW3sgdHJ5TG9jOiBcInJvb3RcIiB9XTtcbiAgICB0cnlMb2NzTGlzdC5mb3JFYWNoKHB1c2hUcnlFbnRyeSwgdGhpcyk7XG4gICAgdGhpcy5yZXNldCh0cnVlKTtcbiAgfVxuXG4gIGV4cG9ydHMua2V5cyA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIHZhciBvYmplY3QgPSBPYmplY3QodmFsKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGtleXMucHVzaChrZXkpO1xuICAgIH1cbiAgICBrZXlzLnJldmVyc2UoKTtcblxuICAgIC8vIFJhdGhlciB0aGFuIHJldHVybmluZyBhbiBvYmplY3Qgd2l0aCBhIG5leHQgbWV0aG9kLCB3ZSBrZWVwXG4gICAgLy8gdGhpbmdzIHNpbXBsZSBhbmQgcmV0dXJuIHRoZSBuZXh0IGZ1bmN0aW9uIGl0c2VsZi5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIHdoaWxlIChrZXlzLmxlbmd0aCkge1xuICAgICAgICB2YXIga2V5ID0ga2V5cy5wb3AoKTtcbiAgICAgICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICBuZXh0LnZhbHVlID0ga2V5O1xuICAgICAgICAgIG5leHQuZG9uZSA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRvIGF2b2lkIGNyZWF0aW5nIGFuIGFkZGl0aW9uYWwgb2JqZWN0LCB3ZSBqdXN0IGhhbmcgdGhlIC52YWx1ZVxuICAgICAgLy8gYW5kIC5kb25lIHByb3BlcnRpZXMgb2ZmIHRoZSBuZXh0IGZ1bmN0aW9uIG9iamVjdCBpdHNlbGYuIFRoaXNcbiAgICAgIC8vIGFsc28gZW5zdXJlcyB0aGF0IHRoZSBtaW5pZmllciB3aWxsIG5vdCBhbm9ueW1pemUgdGhlIGZ1bmN0aW9uLlxuICAgICAgbmV4dC5kb25lID0gdHJ1ZTtcbiAgICAgIHJldHVybiBuZXh0O1xuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gdmFsdWVzKGl0ZXJhYmxlKSB7XG4gICAgaWYgKGl0ZXJhYmxlICE9IG51bGwpIHtcbiAgICAgIHZhciBpdGVyYXRvck1ldGhvZCA9IGl0ZXJhYmxlW2l0ZXJhdG9yU3ltYm9sXTtcbiAgICAgIGlmIChpdGVyYXRvck1ldGhvZCkge1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JNZXRob2QuY2FsbChpdGVyYWJsZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgaXRlcmFibGUubmV4dCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBpdGVyYWJsZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc05hTihpdGVyYWJsZS5sZW5ndGgpKSB7XG4gICAgICAgIHZhciBpID0gLTEsIG5leHQgPSBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgIHdoaWxlICgrK2kgPCBpdGVyYWJsZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChpdGVyYWJsZSwgaSkpIHtcbiAgICAgICAgICAgICAgbmV4dC52YWx1ZSA9IGl0ZXJhYmxlW2ldO1xuICAgICAgICAgICAgICBuZXh0LmRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbmV4dC52YWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBuZXh0LmRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIG5leHQubmV4dCA9IG5leHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcih0eXBlb2YgaXRlcmFibGUgKyBcIiBpcyBub3QgaXRlcmFibGVcIik7XG4gIH1cbiAgZXhwb3J0cy52YWx1ZXMgPSB2YWx1ZXM7XG5cbiAgZnVuY3Rpb24gZG9uZVJlc3VsdCgpIHtcbiAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gIH1cblxuICBDb250ZXh0LnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogQ29udGV4dCxcblxuICAgIHJlc2V0OiBmdW5jdGlvbihza2lwVGVtcFJlc2V0KSB7XG4gICAgICB0aGlzLnByZXYgPSAwO1xuICAgICAgdGhpcy5uZXh0ID0gMDtcbiAgICAgIC8vIFJlc2V0dGluZyBjb250ZXh0Ll9zZW50IGZvciBsZWdhY3kgc3VwcG9ydCBvZiBCYWJlbCdzXG4gICAgICAvLyBmdW5jdGlvbi5zZW50IGltcGxlbWVudGF0aW9uLlxuICAgICAgdGhpcy5zZW50ID0gdGhpcy5fc2VudCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgdGhpcy5kZWxlZ2F0ZSA9IG51bGw7XG5cbiAgICAgIHRoaXMubWV0aG9kID0gXCJuZXh0XCI7XG4gICAgICB0aGlzLmFyZyA9IHVuZGVmaW5lZDtcblxuICAgICAgdGhpcy50cnlFbnRyaWVzLmZvckVhY2gocmVzZXRUcnlFbnRyeSk7XG5cbiAgICAgIGlmICghc2tpcFRlbXBSZXNldCkge1xuICAgICAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMpIHtcbiAgICAgICAgICAvLyBOb3Qgc3VyZSBhYm91dCB0aGUgb3B0aW1hbCBvcmRlciBvZiB0aGVzZSBjb25kaXRpb25zOlxuICAgICAgICAgIGlmIChuYW1lLmNoYXJBdCgwKSA9PT0gXCJ0XCIgJiZcbiAgICAgICAgICAgICAgaGFzT3duLmNhbGwodGhpcywgbmFtZSkgJiZcbiAgICAgICAgICAgICAgIWlzTmFOKCtuYW1lLnNsaWNlKDEpKSkge1xuICAgICAgICAgICAgdGhpc1tuYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmRvbmUgPSB0cnVlO1xuXG4gICAgICB2YXIgcm9vdEVudHJ5ID0gdGhpcy50cnlFbnRyaWVzWzBdO1xuICAgICAgdmFyIHJvb3RSZWNvcmQgPSByb290RW50cnkuY29tcGxldGlvbjtcbiAgICAgIGlmIChyb290UmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICB0aHJvdyByb290UmVjb3JkLmFyZztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMucnZhbDtcbiAgICB9LFxuXG4gICAgZGlzcGF0Y2hFeGNlcHRpb246IGZ1bmN0aW9uKGV4Y2VwdGlvbikge1xuICAgICAgaWYgKHRoaXMuZG9uZSkge1xuICAgICAgICB0aHJvdyBleGNlcHRpb247XG4gICAgICB9XG5cbiAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZShsb2MsIGNhdWdodCkge1xuICAgICAgICByZWNvcmQudHlwZSA9IFwidGhyb3dcIjtcbiAgICAgICAgcmVjb3JkLmFyZyA9IGV4Y2VwdGlvbjtcbiAgICAgICAgY29udGV4dC5uZXh0ID0gbG9jO1xuXG4gICAgICAgIGlmIChjYXVnaHQpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgZGlzcGF0Y2hlZCBleGNlcHRpb24gd2FzIGNhdWdodCBieSBhIGNhdGNoIGJsb2NrLFxuICAgICAgICAgIC8vIHRoZW4gbGV0IHRoYXQgY2F0Y2ggYmxvY2sgaGFuZGxlIHRoZSBleGNlcHRpb24gbm9ybWFsbHkuXG4gICAgICAgICAgY29udGV4dC5tZXRob2QgPSBcIm5leHRcIjtcbiAgICAgICAgICBjb250ZXh0LmFyZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhISBjYXVnaHQ7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldO1xuICAgICAgICB2YXIgcmVjb3JkID0gZW50cnkuY29tcGxldGlvbjtcblxuICAgICAgICBpZiAoZW50cnkudHJ5TG9jID09PSBcInJvb3RcIikge1xuICAgICAgICAgIC8vIEV4Y2VwdGlvbiB0aHJvd24gb3V0c2lkZSBvZiBhbnkgdHJ5IGJsb2NrIHRoYXQgY291bGQgaGFuZGxlXG4gICAgICAgICAgLy8gaXQsIHNvIHNldCB0aGUgY29tcGxldGlvbiB2YWx1ZSBvZiB0aGUgZW50aXJlIGZ1bmN0aW9uIHRvXG4gICAgICAgICAgLy8gdGhyb3cgdGhlIGV4Y2VwdGlvbi5cbiAgICAgICAgICByZXR1cm4gaGFuZGxlKFwiZW5kXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVudHJ5LnRyeUxvYyA8PSB0aGlzLnByZXYpIHtcbiAgICAgICAgICB2YXIgaGFzQ2F0Y2ggPSBoYXNPd24uY2FsbChlbnRyeSwgXCJjYXRjaExvY1wiKTtcbiAgICAgICAgICB2YXIgaGFzRmluYWxseSA9IGhhc093bi5jYWxsKGVudHJ5LCBcImZpbmFsbHlMb2NcIik7XG5cbiAgICAgICAgICBpZiAoaGFzQ2F0Y2ggJiYgaGFzRmluYWxseSkge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldiA8IGVudHJ5LmNhdGNoTG9jKSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYW5kbGUoZW50cnkuY2F0Y2hMb2MsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByZXYgPCBlbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYW5kbGUoZW50cnkuZmluYWxseUxvYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKGhhc0NhdGNoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2IDwgZW50cnkuY2F0Y2hMb2MpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZShlbnRyeS5jYXRjaExvYywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKGhhc0ZpbmFsbHkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYgPCBlbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYW5kbGUoZW50cnkuZmluYWxseUxvYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidHJ5IHN0YXRlbWVudCB3aXRob3V0IGNhdGNoIG9yIGZpbmFsbHlcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIGFicnVwdDogZnVuY3Rpb24odHlwZSwgYXJnKSB7XG4gICAgICBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXTtcbiAgICAgICAgaWYgKGVudHJ5LnRyeUxvYyA8PSB0aGlzLnByZXYgJiZcbiAgICAgICAgICAgIGhhc093bi5jYWxsKGVudHJ5LCBcImZpbmFsbHlMb2NcIikgJiZcbiAgICAgICAgICAgIHRoaXMucHJldiA8IGVudHJ5LmZpbmFsbHlMb2MpIHtcbiAgICAgICAgICB2YXIgZmluYWxseUVudHJ5ID0gZW50cnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZpbmFsbHlFbnRyeSAmJlxuICAgICAgICAgICh0eXBlID09PSBcImJyZWFrXCIgfHxcbiAgICAgICAgICAgdHlwZSA9PT0gXCJjb250aW51ZVwiKSAmJlxuICAgICAgICAgIGZpbmFsbHlFbnRyeS50cnlMb2MgPD0gYXJnICYmXG4gICAgICAgICAgYXJnIDw9IGZpbmFsbHlFbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgIC8vIElnbm9yZSB0aGUgZmluYWxseSBlbnRyeSBpZiBjb250cm9sIGlzIG5vdCBqdW1waW5nIHRvIGFcbiAgICAgICAgLy8gbG9jYXRpb24gb3V0c2lkZSB0aGUgdHJ5L2NhdGNoIGJsb2NrLlxuICAgICAgICBmaW5hbGx5RW50cnkgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVjb3JkID0gZmluYWxseUVudHJ5ID8gZmluYWxseUVudHJ5LmNvbXBsZXRpb24gOiB7fTtcbiAgICAgIHJlY29yZC50eXBlID0gdHlwZTtcbiAgICAgIHJlY29yZC5hcmcgPSBhcmc7XG5cbiAgICAgIGlmIChmaW5hbGx5RW50cnkpIHtcbiAgICAgICAgdGhpcy5tZXRob2QgPSBcIm5leHRcIjtcbiAgICAgICAgdGhpcy5uZXh0ID0gZmluYWxseUVudHJ5LmZpbmFsbHlMb2M7XG4gICAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5jb21wbGV0ZShyZWNvcmQpO1xuICAgIH0sXG5cbiAgICBjb21wbGV0ZTogZnVuY3Rpb24ocmVjb3JkLCBhZnRlckxvYykge1xuICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgdGhyb3cgcmVjb3JkLmFyZztcbiAgICAgIH1cblxuICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcImJyZWFrXCIgfHxcbiAgICAgICAgICByZWNvcmQudHlwZSA9PT0gXCJjb250aW51ZVwiKSB7XG4gICAgICAgIHRoaXMubmV4dCA9IHJlY29yZC5hcmc7XG4gICAgICB9IGVsc2UgaWYgKHJlY29yZC50eXBlID09PSBcInJldHVyblwiKSB7XG4gICAgICAgIHRoaXMucnZhbCA9IHRoaXMuYXJnID0gcmVjb3JkLmFyZztcbiAgICAgICAgdGhpcy5tZXRob2QgPSBcInJldHVyblwiO1xuICAgICAgICB0aGlzLm5leHQgPSBcImVuZFwiO1xuICAgICAgfSBlbHNlIGlmIChyZWNvcmQudHlwZSA9PT0gXCJub3JtYWxcIiAmJiBhZnRlckxvYykge1xuICAgICAgICB0aGlzLm5leHQgPSBhZnRlckxvYztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgfSxcblxuICAgIGZpbmlzaDogZnVuY3Rpb24oZmluYWxseUxvYykge1xuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJ5RW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgZW50cnkgPSB0aGlzLnRyeUVudHJpZXNbaV07XG4gICAgICAgIGlmIChlbnRyeS5maW5hbGx5TG9jID09PSBmaW5hbGx5TG9jKSB7XG4gICAgICAgICAgdGhpcy5jb21wbGV0ZShlbnRyeS5jb21wbGV0aW9uLCBlbnRyeS5hZnRlckxvYyk7XG4gICAgICAgICAgcmVzZXRUcnlFbnRyeShlbnRyeSk7XG4gICAgICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgXCJjYXRjaFwiOiBmdW5jdGlvbih0cnlMb2MpIHtcbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldO1xuICAgICAgICBpZiAoZW50cnkudHJ5TG9jID09PSB0cnlMb2MpIHtcbiAgICAgICAgICB2YXIgcmVjb3JkID0gZW50cnkuY29tcGxldGlvbjtcbiAgICAgICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgICAgdmFyIHRocm93biA9IHJlY29yZC5hcmc7XG4gICAgICAgICAgICByZXNldFRyeUVudHJ5KGVudHJ5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRocm93bjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUaGUgY29udGV4dC5jYXRjaCBtZXRob2QgbXVzdCBvbmx5IGJlIGNhbGxlZCB3aXRoIGEgbG9jYXRpb25cbiAgICAgIC8vIGFyZ3VtZW50IHRoYXQgY29ycmVzcG9uZHMgdG8gYSBrbm93biBjYXRjaCBibG9jay5cbiAgICAgIHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgY2F0Y2ggYXR0ZW1wdFwiKTtcbiAgICB9LFxuXG4gICAgZGVsZWdhdGVZaWVsZDogZnVuY3Rpb24oaXRlcmFibGUsIHJlc3VsdE5hbWUsIG5leHRMb2MpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSB7XG4gICAgICAgIGl0ZXJhdG9yOiB2YWx1ZXMoaXRlcmFibGUpLFxuICAgICAgICByZXN1bHROYW1lOiByZXN1bHROYW1lLFxuICAgICAgICBuZXh0TG9jOiBuZXh0TG9jXG4gICAgICB9O1xuXG4gICAgICBpZiAodGhpcy5tZXRob2QgPT09IFwibmV4dFwiKSB7XG4gICAgICAgIC8vIERlbGliZXJhdGVseSBmb3JnZXQgdGhlIGxhc3Qgc2VudCB2YWx1ZSBzbyB0aGF0IHdlIGRvbid0XG4gICAgICAgIC8vIGFjY2lkZW50YWxseSBwYXNzIGl0IG9uIHRvIHRoZSBkZWxlZ2F0ZS5cbiAgICAgICAgdGhpcy5hcmcgPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhpcyBzY3JpcHQgaXMgZXhlY3V0aW5nIGFzIGEgQ29tbW9uSlMgbW9kdWxlXG4gIC8vIG9yIG5vdCwgcmV0dXJuIHRoZSBydW50aW1lIG9iamVjdCBzbyB0aGF0IHdlIGNhbiBkZWNsYXJlIHRoZSB2YXJpYWJsZVxuICAvLyByZWdlbmVyYXRvclJ1bnRpbWUgaW4gdGhlIG91dGVyIHNjb3BlLCB3aGljaCBhbGxvd3MgdGhpcyBtb2R1bGUgdG8gYmVcbiAgLy8gaW5qZWN0ZWQgZWFzaWx5IGJ5IGBiaW4vcmVnZW5lcmF0b3IgLS1pbmNsdWRlLXJ1bnRpbWUgc2NyaXB0LmpzYC5cbiAgcmV0dXJuIGV4cG9ydHM7XG5cbn0oXG4gIC8vIElmIHRoaXMgc2NyaXB0IGlzIGV4ZWN1dGluZyBhcyBhIENvbW1vbkpTIG1vZHVsZSwgdXNlIG1vZHVsZS5leHBvcnRzXG4gIC8vIGFzIHRoZSByZWdlbmVyYXRvclJ1bnRpbWUgbmFtZXNwYWNlLiBPdGhlcndpc2UgY3JlYXRlIGEgbmV3IGVtcHR5XG4gIC8vIG9iamVjdC4gRWl0aGVyIHdheSwgdGhlIHJlc3VsdGluZyBvYmplY3Qgd2lsbCBiZSB1c2VkIHRvIGluaXRpYWxpemVcbiAgLy8gdGhlIHJlZ2VuZXJhdG9yUnVudGltZSB2YXJpYWJsZSBhdCB0aGUgdG9wIG9mIHRoaXMgZmlsZS5cbiAgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiA/IG1vZHVsZS5leHBvcnRzIDoge31cbikpO1xuXG50cnkge1xuICByZWdlbmVyYXRvclJ1bnRpbWUgPSBydW50aW1lO1xufSBjYXRjaCAoYWNjaWRlbnRhbFN0cmljdE1vZGUpIHtcbiAgLy8gVGhpcyBtb2R1bGUgc2hvdWxkIG5vdCBiZSBydW5uaW5nIGluIHN0cmljdCBtb2RlLCBzbyB0aGUgYWJvdmVcbiAgLy8gYXNzaWdubWVudCBzaG91bGQgYWx3YXlzIHdvcmsgdW5sZXNzIHNvbWV0aGluZyBpcyBtaXNjb25maWd1cmVkLiBKdXN0XG4gIC8vIGluIGNhc2UgcnVudGltZS5qcyBhY2NpZGVudGFsbHkgcnVucyBpbiBzdHJpY3QgbW9kZSwgaW4gbW9kZXJuIGVuZ2luZXNcbiAgLy8gd2UgY2FuIGV4cGxpY2l0bHkgYWNjZXNzIGdsb2JhbFRoaXMuIEluIG9sZGVyIGVuZ2luZXMgd2UgY2FuIGVzY2FwZVxuICAvLyBzdHJpY3QgbW9kZSB1c2luZyBhIGdsb2JhbCBGdW5jdGlvbiBjYWxsLiBUaGlzIGNvdWxkIGNvbmNlaXZhYmx5IGZhaWxcbiAgLy8gaWYgYSBDb250ZW50IFNlY3VyaXR5IFBvbGljeSBmb3JiaWRzIHVzaW5nIEZ1bmN0aW9uLCBidXQgaW4gdGhhdCBjYXNlXG4gIC8vIHRoZSBwcm9wZXIgc29sdXRpb24gaXMgdG8gZml4IHRoZSBhY2NpZGVudGFsIHN0cmljdCBtb2RlIHByb2JsZW0uIElmXG4gIC8vIHlvdSd2ZSBtaXNjb25maWd1cmVkIHlvdXIgYnVuZGxlciB0byBmb3JjZSBzdHJpY3QgbW9kZSBhbmQgYXBwbGllZCBhXG4gIC8vIENTUCB0byBmb3JiaWQgRnVuY3Rpb24sIGFuZCB5b3UncmUgbm90IHdpbGxpbmcgdG8gZml4IGVpdGhlciBvZiB0aG9zZVxuICAvLyBwcm9ibGVtcywgcGxlYXNlIGRldGFpbCB5b3VyIHVuaXF1ZSBwcmVkaWNhbWVudCBpbiBhIEdpdEh1YiBpc3N1ZS5cbiAgaWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSBcIm9iamVjdFwiKSB7XG4gICAgZ2xvYmFsVGhpcy5yZWdlbmVyYXRvclJ1bnRpbWUgPSBydW50aW1lO1xuICB9IGVsc2Uge1xuICAgIEZ1bmN0aW9uKFwiclwiLCBcInJlZ2VuZXJhdG9yUnVudGltZSA9IHJcIikocnVudGltZSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG4vLyBUaGUgcmVnZW5lcmF0b3IgcnVudGltZSBpcyBuZWVkZWQgc2luY2UgdGhlIHRlc3QgdXNlIGZ1bmN0aW9uc1xuLy8gd2l0aCB0aGUgYXN5bmMvYXdhaXQga2V5d29yZHMuIFNlZVxuLy8gaHR0cHM6Ly9iYWJlbGpzLmlvL2RvY3MvZW4vYmFiZWwtcGx1Z2luLXRyYW5zZm9ybS1yZWdlbmVyYXRvclxucmVxdWlyZSgncmVnZW5lcmF0b3ItcnVudGltZS9ydW50aW1lJylcblxuYmVmb3JlRWFjaCgoKSA9PiB7XG4gIC8vIENsZWFyIGxvY2FsU3RvcmFnZSBiZWZvcmUgZXZlcnkgdGVzdCB0byBwcmV2ZW50IHN0b3JlZCBVUkxzIHRvXG4gIC8vIGludGVyZmVyZSB3aXRoIG91ciBzZXR1cC5cbiAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbn0pXG5cbnJlcXVpcmUoJy4vdGVzdC1jb21tb24nKVxucmVxdWlyZSgnLi90ZXN0LWJyb3dzZXItc3BlY2lmaWMnKVxucmVxdWlyZSgnLi90ZXN0LXBhcmFsbGVsLXVwbG9hZHMnKVxucmVxdWlyZSgnLi90ZXN0LXRlcm1pbmF0ZScpXG5yZXF1aXJlKCcuL3Rlc3QtZW5kLXRvLWVuZCcpXG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBhc3NlcnRVcmxTdG9yYWdlKHVybFN0b3JhZ2UpIHtcbiAgLy8gSW4gdGhlIGJlZ2lubmluZyBvZiB0aGUgdGVzdCwgdGhlIHN0b3JhZ2Ugc2hvdWxkIGJlIGVtcHR5LlxuICBsZXQgcmVzdWx0ID0gYXdhaXQgdXJsU3RvcmFnZS5maW5kQWxsVXBsb2FkcygpXG4gIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoW10pXG5cbiAgLy8gQWRkIGEgZmV3IHVwbG9hZHMgaW50byB0aGUgc3RvcmFnZVxuICBjb25zdCBrZXkxID0gYXdhaXQgdXJsU3RvcmFnZS5hZGRVcGxvYWQoJ2ZpbmdlcnByaW50QScsIHsgaWQ6IDEgfSlcbiAgY29uc3Qga2V5MiA9IGF3YWl0IHVybFN0b3JhZ2UuYWRkVXBsb2FkKCdmaW5nZXJwcmludEEnLCB7IGlkOiAyIH0pXG4gIGNvbnN0IGtleTMgPSBhd2FpdCB1cmxTdG9yYWdlLmFkZFVwbG9hZCgnZmluZ2VycHJpbnRCJywgeyBpZDogMyB9KVxuXG4gIGV4cGVjdCgvXnR1czo6ZmluZ2VycHJpbnRBOjovLnRlc3Qoa2V5MSkpLnRvQmUodHJ1ZSlcbiAgZXhwZWN0KC9edHVzOjpmaW5nZXJwcmludEE6Oi8udGVzdChrZXkyKSkudG9CZSh0cnVlKVxuICBleHBlY3QoL150dXM6OmZpbmdlcnByaW50Qjo6Ly50ZXN0KGtleTMpKS50b0JlKHRydWUpXG5cbiAgLy8gUXVlcnkgdGhlIGp1c3Qgc3RvcmVkIHVwbG9hZHMgaW5kaXZpZHVhbGx5XG4gIHJlc3VsdCA9IGF3YWl0IHVybFN0b3JhZ2UuZmluZFVwbG9hZHNCeUZpbmdlcnByaW50KCdmaW5nZXJwcmludEEnKVxuICBzb3J0KHJlc3VsdClcbiAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbChbXG4gICAgeyBpZDogMSwgdXJsU3RvcmFnZUtleToga2V5MSB9LFxuICAgIHsgaWQ6IDIsIHVybFN0b3JhZ2VLZXk6IGtleTIgfSxcbiAgXSlcblxuICByZXN1bHQgPSBhd2FpdCB1cmxTdG9yYWdlLmZpbmRVcGxvYWRzQnlGaW5nZXJwcmludCgnZmluZ2VycHJpbnRCJylcbiAgc29ydChyZXN1bHQpXG4gIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoW3sgaWQ6IDMsIHVybFN0b3JhZ2VLZXk6IGtleTMgfV0pXG5cbiAgLy8gQ2hlY2sgdGhhdCB3ZSBjYW4gcmV0cmlldmUgYWxsIHN0b3JlZCB1cGxvYWRzXG4gIHJlc3VsdCA9IGF3YWl0IHVybFN0b3JhZ2UuZmluZEFsbFVwbG9hZHMoKVxuICBzb3J0KHJlc3VsdClcbiAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbChbXG4gICAgeyBpZDogMSwgdXJsU3RvcmFnZUtleToga2V5MSB9LFxuICAgIHsgaWQ6IDIsIHVybFN0b3JhZ2VLZXk6IGtleTIgfSxcbiAgICB7IGlkOiAzLCB1cmxTdG9yYWdlS2V5OiBrZXkzIH0sXG4gIF0pXG5cbiAgLy8gQ2hlY2sgdGhhdCBpdCBjYW4gcmVtb3ZlIGFuIHVwbG9hZCBhbmQgd2lsbCBub3QgcmV0dXJuIGl0IGJhY2tcbiAgYXdhaXQgdXJsU3RvcmFnZS5yZW1vdmVVcGxvYWQoa2V5MilcbiAgYXdhaXQgdXJsU3RvcmFnZS5yZW1vdmVVcGxvYWQoa2V5MylcblxuICByZXN1bHQgPSBhd2FpdCB1cmxTdG9yYWdlLmZpbmRVcGxvYWRzQnlGaW5nZXJwcmludCgnZmluZ2VycHJpbnRBJylcbiAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbChbeyBpZDogMSwgdXJsU3RvcmFnZUtleToga2V5MSB9XSlcblxuICByZXN1bHQgPSBhd2FpdCB1cmxTdG9yYWdlLmZpbmRVcGxvYWRzQnlGaW5nZXJwcmludCgnZmluZ2VycHJpbnRCJylcbiAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbChbXSlcbn1cblxuLy8gU29ydCB0aGUgcmVzdWx0cyBmcm9tIHRoZSBVUkwgc3RvcmFnZSBzaW5jZSB0aGUgb3JkZXIgaW4gbm90IGRldGVybWluaXN0aWMuXG5mdW5jdGlvbiBzb3J0KHJlc3VsdCkge1xuICByZXN1bHQuc29ydCgoYSwgYikgPT4gYS5pZCAtIGIuaWQpXG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBtYXgtY2xhc3Nlcy1wZXItZmlsZSAqL1xuXG4ndXNlIHN0cmljdCdcblxuY29uc3QgaXNCcm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbmNvbnN0IGlzTm9kZSA9ICFpc0Jyb3dzZXJcblxuLyoqXG4gKiBPYnRhaW4gYSBwbGF0Zm9ybSBzcGVjaWZpYyBidWZmZXIgb2JqZWN0LCB3aGljaCBjYW4gYmVcbiAqIGhhbmRsZWQgYnkgdHVzLWpzLWNsaWVudC5cbiAqL1xuZnVuY3Rpb24gZ2V0QmxvYihzdHIpIHtcbiAgaWYgKGlzTm9kZSkge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShzdHIpXG4gIH1cbiAgcmV0dXJuIG5ldyBCbG9iKHN0ci5zcGxpdCgnJykpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcHJvbWlzZSBhbmQgb2J0YWluIHRoZSByZXNvbHZlL3JlamVjdCBmdW5jdGlvbnNcbiAqIG91dHNpZGUgb2YgdGhlIFByb21pc2UgY2FsbGJhY2suXG4gKi9cbmZ1bmN0aW9uIGZsYXRQcm9taXNlKCkge1xuICBsZXQgcmVzb2x2ZUZuXG4gIGxldCByZWplY3RGblxuICBjb25zdCBwID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHJlc29sdmVGbiA9IHJlc29sdmVcbiAgICByZWplY3RGbiA9IHJlamVjdFxuICB9KVxuXG4gIHJldHVybiBbcCwgcmVzb2x2ZUZuLCByZWplY3RGbl1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBzcHktYWJsZSBmdW5jdGlvbiB3aGljaCByZXNvbHZlcyBhIFByb21pc2VcbiAqIG9uY2UgaXQgaXMgY2FsbGVkLlxuICovXG5mdW5jdGlvbiB3YWl0YWJsZUZ1bmN0aW9uKG5hbWUgPSAnZnVuYycpIHtcbiAgY29uc3QgW3Byb21pc2UsIHJlc29sdmVdID0gZmxhdFByb21pc2UoKVxuICBjb25zdCBmbiA9IGphc21pbmUuY3JlYXRlU3B5KG5hbWUsIHJlc29sdmUpLmFuZC5jYWxsVGhyb3VnaCgpXG5cbiAgZm4udG9CZUNhbGxlZCA9IHByb21pc2VcbiAgcmV0dXJuIGZuXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIGFmdGVyIHRoZSBzcGVjaWZpZWQgZHVyYXRpb24uXG4gKi9cbmZ1bmN0aW9uIHdhaXQoZGVsYXkpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGRlbGF5LCAndGltZWQgb3V0JykpXG59XG5cbi8qKlxuICogVGVzdEh0dHBTdGFjayBpbXBsZW1lbnRzIHRoZSBIVFRQIHN0YWNrIGludGVyZmFjZSBmb3IgdHVzLWpzLWNsaWVudFxuICogYW5kIGNhbiBiZSB1c2VkIHRvIGFzc2VydCBvdXRnb2luZyByZXF1ZXN0cyBhbmQgcmVzcG9uZCB3aXRoIG1vY2sgZGF0YS5cbiAqL1xuY2xhc3MgVGVzdEh0dHBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3BlbmRpbmdSZXF1ZXN0cyA9IFtdXG4gICAgdGhpcy5fcGVuZGluZ1dhaXRzID0gW11cbiAgfVxuXG4gIGNyZWF0ZVJlcXVlc3QobWV0aG9kLCB1cmwpIHtcbiAgICByZXR1cm4gbmV3IFRlc3RSZXF1ZXN0KG1ldGhvZCwgdXJsLCAocmVxKSA9PiB7XG4gICAgICBpZiAodGhpcy5fcGVuZGluZ1dhaXRzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLl9wZW5kaW5nV2FpdHMuc2hpZnQoKVxuICAgICAgICBoYW5kbGVyKHJlcSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BlbmRpbmdSZXF1ZXN0cy5wdXNoKHJlcSlcbiAgICB9KVxuICB9XG5cbiAgbmV4dFJlcXVlc3QoKSB7XG4gICAgaWYgKHRoaXMuX3BlbmRpbmdSZXF1ZXN0cy5sZW5ndGggPj0gMSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9wZW5kaW5nUmVxdWVzdHMuc2hpZnQoKSlcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMuX3BlbmRpbmdXYWl0cy5wdXNoKHJlc29sdmUpXG4gICAgfSlcbiAgfVxufVxuXG5jbGFzcyBUZXN0UmVxdWVzdCB7XG4gIGNvbnN0cnVjdG9yKG1ldGhvZCwgdXJsLCBvblJlcXVlc3RTZW5kKSB7XG4gICAgdGhpcy5tZXRob2QgPSBtZXRob2RcbiAgICB0aGlzLnVybCA9IHVybFxuICAgIHRoaXMucmVxdWVzdEhlYWRlcnMgPSB7fVxuICAgIHRoaXMuYm9keSA9IG51bGxcblxuICAgIHRoaXMuX29uUmVxdWVzdFNlbmQgPSBvblJlcXVlc3RTZW5kXG4gICAgdGhpcy5fb25Qcm9ncmVzcyA9ICgpID0+IHt9XG4gICAgO1t0aGlzLl9yZXF1ZXN0UHJvbWlzZSwgdGhpcy5fcmVzb2x2ZVJlcXVlc3QsIHRoaXMuX3JlamVjdFJlcXVlc3RdID0gZmxhdFByb21pc2UoKVxuICB9XG5cbiAgZ2V0TWV0aG9kKCkge1xuICAgIHJldHVybiB0aGlzLm1ldGhvZFxuICB9XG5cbiAgZ2V0VVJMKCkge1xuICAgIHJldHVybiB0aGlzLnVybFxuICB9XG5cbiAgc2V0SGVhZGVyKGhlYWRlciwgdmFsdWUpIHtcbiAgICB0aGlzLnJlcXVlc3RIZWFkZXJzW2hlYWRlcl0gPSB2YWx1ZVxuICB9XG5cbiAgZ2V0SGVhZGVyKGhlYWRlcikge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3RIZWFkZXJzW2hlYWRlcl0gfHwgbnVsbFxuICB9XG5cbiAgc2V0UHJvZ3Jlc3NIYW5kbGVyKHByb2dyZXNzSGFuZGxlcikge1xuICAgIHRoaXMuX29uUHJvZ3Jlc3MgPSBwcm9ncmVzc0hhbmRsZXJcbiAgfVxuXG4gIHNlbmQoYm9keSA9IG51bGwpIHtcbiAgICB0aGlzLmJvZHkgPSBib2R5XG5cbiAgICBpZiAoYm9keSkge1xuICAgICAgdGhpcy5fb25Qcm9ncmVzcygwKVxuICAgICAgdGhpcy5fb25Qcm9ncmVzcyhib2R5Lmxlbmd0aCB8fCBib2R5LnNpemUgfHwgMClcbiAgICB9XG5cbiAgICB0aGlzLl9vblJlcXVlc3RTZW5kKHRoaXMpXG4gICAgcmV0dXJuIHRoaXMuX3JlcXVlc3RQcm9taXNlXG4gIH1cblxuICBhYm9ydCgpIHtcbiAgICB0aGlzLl9yZWplY3RSZXF1ZXN0KG5ldyBFcnJvcigncmVxdWVzdCBhYm9ydGVkJykpXG4gIH1cblxuICBnZXRVbmRlcmx5aW5nT2JqZWN0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJylcbiAgfVxuXG4gIHJlc3BvbmRXaXRoKHJlc0RhdGEpIHtcbiAgICByZXNEYXRhLnJlc3BvbnNlSGVhZGVycyA9IHJlc0RhdGEucmVzcG9uc2VIZWFkZXJzIHx8IHt9XG5cbiAgICBjb25zdCByZXMgPSBuZXcgVGVzdFJlc3BvbnNlKHJlc0RhdGEpXG4gICAgdGhpcy5fcmVzb2x2ZVJlcXVlc3QocmVzKVxuICB9XG5cbiAgcmVzcG9uc2VFcnJvcihlcnIpIHtcbiAgICB0aGlzLl9yZWplY3RSZXF1ZXN0KGVycilcbiAgfVxufVxuXG5jbGFzcyBUZXN0UmVzcG9uc2Uge1xuICBjb25zdHJ1Y3RvcihyZXMpIHtcbiAgICB0aGlzLl9yZXNwb25zZSA9IHJlc1xuICB9XG5cbiAgZ2V0U3RhdHVzKCkge1xuICAgIHJldHVybiB0aGlzLl9yZXNwb25zZS5zdGF0dXNcbiAgfVxuXG4gIGdldEhlYWRlcihoZWFkZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVzcG9uc2UucmVzcG9uc2VIZWFkZXJzW2hlYWRlcl1cbiAgfVxuXG4gIGdldEJvZHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jlc3BvbnNlLnJlc3BvbnNlVGV4dFxuICB9XG5cbiAgZ2V0VW5kZXJseWluZ09iamVjdCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCcpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFRlc3RIdHRwU3RhY2ssXG4gIHdhaXRhYmxlRnVuY3Rpb24sXG4gIHdhaXQsXG4gIGdldEJsb2IsXG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgYXNzZXJ0VXJsU3RvcmFnZSA9IHJlcXVpcmUoJy4vaGVscGVycy9hc3NlcnRVcmxTdG9yYWdlJylcbmNvbnN0IHsgVGVzdEh0dHBTdGFjaywgd2FpdGFibGVGdW5jdGlvbiwgd2FpdCB9ID0gcmVxdWlyZSgnLi9oZWxwZXJzL3V0aWxzJylcbmNvbnN0IHR1cyA9IHJlcXVpcmUoJy4uLy4uJylcblxuZGVzY3JpYmUoJ3R1cycsICgpID0+IHtcbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbiAgfSlcblxuICBkZXNjcmliZSgnI1VwbG9hZCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJlc3VtZSBhbiB1cGxvYWQgZnJvbSBhIHN0b3JlZCB1cmwnLCBhc3luYyAoKSA9PiB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcbiAgICAgICAgJ3R1czo6ZmluZ2VycHJpbnRlZDo6MTMzNycsXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB1cGxvYWRVcmw6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMvcmVzdW1pbmcnLFxuICAgICAgICB9KSxcbiAgICAgIClcblxuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IG5ldyBCbG9iKCdoZWxsbyB3b3JsZCcuc3BsaXQoJycpKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIGVuZHBvaW50OiAnaHR0cDovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgb25Qcm9ncmVzcygpIHt9LFxuICAgICAgICBmaW5nZXJwcmludCgpIHt9LFxuICAgICAgfVxuICAgICAgc3B5T24ob3B0aW9ucywgJ2ZpbmdlcnByaW50JykuYW5kLnJlc29sdmVUbygnZmluZ2VycHJpbnRlZCcpXG4gICAgICBzcHlPbihvcHRpb25zLCAnb25Qcm9ncmVzcycpXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG5cbiAgICAgIGNvbnN0IHByZXZpb3VzVXBsb2FkcyA9IGF3YWl0IHVwbG9hZC5maW5kUHJldmlvdXNVcGxvYWRzKClcbiAgICAgIGV4cGVjdChwcmV2aW91c1VwbG9hZHMpLnRvRXF1YWwoW1xuICAgICAgICB7XG4gICAgICAgICAgdXBsb2FkVXJsOiAnaHR0cDovL3R1cy5pby91cGxvYWRzL3Jlc3VtaW5nJyxcbiAgICAgICAgICB1cmxTdG9yYWdlS2V5OiAndHVzOjpmaW5nZXJwcmludGVkOjoxMzM3JyxcbiAgICAgICAgfSxcbiAgICAgIF0pXG4gICAgICB1cGxvYWQucmVzdW1lRnJvbVByZXZpb3VzVXBsb2FkKHByZXZpb3VzVXBsb2Fkc1swXSlcblxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgZXhwZWN0KG9wdGlvbnMuZmluZ2VycHJpbnQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKGZpbGUsIHVwbG9hZC5vcHRpb25zKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvcmVzdW1pbmcnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLUxlbmd0aCc6IDExLFxuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL3Jlc3VtaW5nJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1PZmZzZXQnXSkudG9CZSgzKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL29mZnNldCtvY3RldC1zdHJlYW0nKVxuICAgICAgZXhwZWN0KHJlcS5ib2R5LnNpemUpLnRvQmUoMTEgLSAzKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAxMSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdCh1cGxvYWQudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvcmVzdW1pbmcnKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25Qcm9ncmVzcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoMTEsIDExKVxuICAgIH0pXG5cbiAgICBkZXNjcmliZSgnc3RvcmluZyBvZiB1cGxvYWQgdXJscycsICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIGZpbmdlcnByaW50KCkge30sXG4gICAgICB9XG5cbiAgICAgIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0VXBsb2FkKCkge1xuICAgICAgICBjb25zdCBmaWxlID0gbmV3IEJsb2IoJ2hlbGxvIHdvcmxkJy5zcGxpdCgnJykpXG4gICAgICAgIHNweU9uKG9wdGlvbnMsICdmaW5nZXJwcmludCcpLmFuZC5yZXNvbHZlVG8oJ2ZpbmdlcnByaW50ZWQnKVxuICAgICAgICBvcHRpb25zLm9uU3VjY2VzcyA9IHdhaXRhYmxlRnVuY3Rpb24oJ29uU3VjY2VzcycpXG5cbiAgICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgICBleHBlY3Qob3B0aW9ucy5maW5nZXJwcmludCkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgICAgY29uc3QgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgTG9jYXRpb246ICcvdXBsb2Fkcy9ibGFyZ2gnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gV2FpdCBhIHNob3J0IGRlbGF5IHRvIGFsbG93IHRoZSBQcm9taXNlcyB0byBzZXR0bGVcbiAgICAgICAgYXdhaXQgd2FpdCgxMClcbiAgICAgIH1cblxuICAgICAgYXN5bmMgZnVuY3Rpb24gZmluaXNoVXBsb2FkKCkge1xuICAgICAgICBjb25zdCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCBvcHRpb25zLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG4gICAgICB9XG5cbiAgICAgIGl0KCdzaG91bGQgc3RvcmUgYW5kIHJldGFpbiB3aXRoIGRlZmF1bHQgb3B0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgb3B0aW9ucy5yZW1vdmVGaW5nZXJwcmludE9uU3VjY2VzcyA9IGZhbHNlXG4gICAgICAgIGF3YWl0IHN0YXJ0VXBsb2FkKClcblxuICAgICAgICBjb25zdCBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KDApXG4gICAgICAgIGV4cGVjdChrZXkuaW5kZXhPZigndHVzOjpmaW5nZXJwcmludGVkOjonKSkudG9CZSgwKVxuXG4gICAgICAgIGNvbnN0IHN0b3JlZFVwbG9hZCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSlcbiAgICAgICAgZXhwZWN0KHN0b3JlZFVwbG9hZC51cGxvYWRVcmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9ibGFyZ2gnKVxuICAgICAgICBleHBlY3Qoc3RvcmVkVXBsb2FkLnNpemUpLnRvQmUoMTEpXG5cbiAgICAgICAgYXdhaXQgZmluaXNoVXBsb2FkKClcblxuICAgICAgICBleHBlY3QobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSkudG9CZShKU09OLnN0cmluZ2lmeShzdG9yZWRVcGxvYWQpKVxuICAgICAgfSlcblxuICAgICAgaXQoJ3Nob3VsZCBzdG9yZSBhbmQgcmVtb3ZlIHdpdGggb3B0aW9uIHJlbW92ZUZpbmdlcnByaW50T25TdWNjZXNzIHNldCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgb3B0aW9ucy5yZW1vdmVGaW5nZXJwcmludE9uU3VjY2VzcyA9IHRydWVcbiAgICAgICAgYXdhaXQgc3RhcnRVcGxvYWQoKVxuXG4gICAgICAgIGNvbnN0IGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoMClcbiAgICAgICAgZXhwZWN0KGtleS5pbmRleE9mKCd0dXM6OmZpbmdlcnByaW50ZWQ6OicpKS50b0JlKDApXG5cbiAgICAgICAgY29uc3Qgc3RvcmVkVXBsb2FkID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKVxuICAgICAgICBleHBlY3Qoc3RvcmVkVXBsb2FkLnVwbG9hZFVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChzdG9yZWRVcGxvYWQuc2l6ZSkudG9CZSgxMSlcblxuICAgICAgICBhd2FpdCBmaW5pc2hVcGxvYWQoKVxuICAgICAgICBleHBlY3QobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSkudG9CZShudWxsKVxuICAgICAgfSlcblxuICAgICAgaXQoJ3Nob3VsZCBzdG9yZSBVUkxzIHBhc3NlZCBpbiB1c2luZyB0aGUgdXBsb2FkVXJsIG9wdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IG5ldyBCbG9iKCdoZWxsbyB3b3JsZCcuc3BsaXQoJycpKVxuICAgICAgICBjb25zdCBvcHRpb25zMiA9IHtcbiAgICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgICB1cGxvYWRVcmw6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMvc3RvcmVkVXJsJyxcbiAgICAgICAgICBmaW5nZXJwcmludCgpIHt9LFxuICAgICAgICAgIG9uU3VjY2Vzczogd2FpdGFibGVGdW5jdGlvbignb25TdWNjZXNzJyksXG4gICAgICAgICAgcmVtb3ZlRmluZ2VycHJpbnRPblN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIH1cbiAgICAgICAgc3B5T24ob3B0aW9uczIsICdmaW5nZXJwcmludCcpLmFuZC5yZXNvbHZlVG8oJ2ZpbmdlcnByaW50ZWQnKVxuXG4gICAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMyKVxuICAgICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICAgIGV4cGVjdChvcHRpb25zMi5maW5nZXJwcmludCkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvc3RvcmVkVXJsJylcbiAgICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgJ1VwbG9hZC1MZW5ndGgnOiAxMSxcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIFdhaXQgYSBzaG9ydCBkZWxheSB0byBhbGxvdyB0aGUgUHJvbWlzZXMgdG8gc2V0dGxlXG4gICAgICAgIGF3YWl0IHdhaXQoMTApXG5cbiAgICAgICAgY29uc3Qga2V5ID0gbG9jYWxTdG9yYWdlLmtleSgwKVxuICAgICAgICBleHBlY3Qoa2V5LmluZGV4T2YoJ3R1czo6ZmluZ2VycHJpbnRlZDo6JykpLnRvQmUoMClcblxuICAgICAgICBjb25zdCBzdG9yZWRVcGxvYWQgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpXG4gICAgICAgIGV4cGVjdChzdG9yZWRVcGxvYWQudXBsb2FkVXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvc3RvcmVkVXJsJylcbiAgICAgICAgZXhwZWN0KHN0b3JlZFVwbG9hZC5zaXplKS50b0JlKDExKVxuXG4gICAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvc3RvcmVkVXJsJylcbiAgICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1PZmZzZXQnXSkudG9CZSgzKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICAgIGV4cGVjdChyZXEuYm9keS5zaXplKS50b0JlKDExIC0gMylcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAxMSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IG9wdGlvbnMyLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG5cbiAgICAgICAgLy8gRW50cnkgaW4gbG9jYWxTdG9yYWdlIHNob3VsZCBiZSByZW1vdmVkIGFmdGVyIHN1Y2Nlc3NmdWwgdXBsb2FkXG4gICAgICAgIGV4cGVjdChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKS50b0JlKG51bGwpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGRlbGV0ZSB1cGxvYWQgdXJscyBvbiBhIDRYWCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBuZXcgQmxvYignaGVsbG8gd29ybGQnLnNwbGl0KCcnKSlcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIGZpbmdlcnByaW50KCkge30sXG4gICAgICB9XG4gICAgICBzcHlPbihvcHRpb25zLCAnZmluZ2VycHJpbnQnKS5hbmQucmVzb2x2ZVRvKCdmaW5nZXJwcmludGVkJylcblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcblxuICAgICAgdXBsb2FkLnJlc3VtZUZyb21QcmV2aW91c1VwbG9hZCh7XG4gICAgICAgIHVwbG9hZFVybDogJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9yZXN1bWluZycsXG4gICAgICAgIHVybFN0b3JhZ2VLZXk6ICd0dXM6OmZpbmdlcnByaW50ZWQ6OjEzMzcnLFxuICAgICAgfSlcblxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgY29uc3QgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvcmVzdW1pbmcnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgIH0pXG5cbiAgICAgIGF3YWl0IHdhaXQoMTApXG5cbiAgICAgIGV4cGVjdChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndHVzOjpmaW5nZXJwcmludGVkOjoxMzM3JykpLnRvQmUobnVsbClcbiAgICB9KVxuXG4gICAgZGVzY3JpYmUoJ3VwbG9hZGluZyBkYXRhIGZyb20gYSBSZWFkZXInLCAoKSA9PiB7XG4gICAgICBmdW5jdGlvbiBtYWtlUmVhZGVyKGNvbnRlbnQsIHJlYWRTaXplID0gY29udGVudC5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgcmVhZGVyID0ge1xuICAgICAgICAgIHZhbHVlOiBjb250ZW50LnNwbGl0KCcnKSxcbiAgICAgICAgICByZWFkKCkge1xuICAgICAgICAgICAgbGV0IHZhbHVlXG4gICAgICAgICAgICBsZXQgZG9uZSA9IGZhbHNlXG4gICAgICAgICAgICBpZiAodGhpcy52YWx1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gdGhpcy52YWx1ZS5zbGljZSgwLCByZWFkU2l6ZSlcbiAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUuc2xpY2UocmVhZFNpemUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkb25lID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHZhbHVlLCBkb25lIH0pXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjYW5jZWw6IHdhaXRhYmxlRnVuY3Rpb24oJ2NhbmNlbCcpLFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlYWRlclxuICAgICAgfVxuXG4gICAgICBhc3luYyBmdW5jdGlvbiBhc3NlcnRSZWFkZXJVcGxvYWQoeyByZWFkU2l6ZSwgY2h1bmtTaXplIH0pIHtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gbWFrZVJlYWRlcignaGVsbG8gd29ybGQnLCByZWFkU2l6ZSlcblxuICAgICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICAgIGNodW5rU2l6ZSxcbiAgICAgICAgICBvblByb2dyZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblByb2dyZXNzJyksXG4gICAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblN1Y2Nlc3MnKSxcbiAgICAgICAgICBmaW5nZXJwcmludCgpIHt9LFxuICAgICAgICAgIHVwbG9hZExlbmd0aERlZmVycmVkOiB0cnVlLFxuICAgICAgICB9XG4gICAgICAgIHNweU9uKG9wdGlvbnMsICdmaW5nZXJwcmludCcpLmFuZC5yZXNvbHZlVG8oJ2ZpbmdlcnByaW50ZWQnKVxuXG4gICAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKHJlYWRlciwgb3B0aW9ucylcbiAgICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgICBleHBlY3Qob3B0aW9ucy5maW5nZXJwcmludCkudG9IYXZlQmVlbkNhbGxlZFdpdGgocmVhZGVyLCB1cGxvYWQub3B0aW9ucylcblxuICAgICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKHVuZGVmaW5lZClcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLURlZmVyLUxlbmd0aCddKS50b0JlKDEpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgIExvY2F0aW9uOiAnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1PZmZzZXQnXSkudG9CZSgwKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICAgIGV4cGVjdChyZXEuYm9keS5sZW5ndGgpLnRvQmUoMTEpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCBvcHRpb25zLm9uUHJvZ3Jlc3MudG9CZUNhbGxlZFxuICAgICAgICBleHBlY3Qob3B0aW9ucy5vblByb2dyZXNzKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgxMSwgbnVsbClcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1PZmZzZXQnXSkudG9CZSgxMSlcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDExKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICAgIGV4cGVjdChyZXEuYm9keSkudG9CZShudWxsKVxuXG4gICAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDExLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuICAgICAgICBleHBlY3QodXBsb2FkLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSlcbiAgICAgIH1cblxuICAgICAgaXQoJ3Nob3VsZCB1cGxvYWQgZGF0YScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgYXNzZXJ0UmVhZGVyVXBsb2FkKHsgY2h1bmtTaXplOiAxMDAsIHJlYWRTaXplOiAxMDAgfSlcbiAgICAgIH0pXG5cbiAgICAgIGl0KCdzaG91bGQgcmVhZCBtdWx0aXBsZSB0aW1lcyBmcm9tIHRoZSByZWFkZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGFzc2VydFJlYWRlclVwbG9hZCh7IGNodW5rU2l6ZTogMTAwLCByZWFkU2l6ZTogNiB9KVxuICAgICAgfSlcblxuICAgICAgaXQoJ3Nob3VsZCB1c2UgbXVsdGlwbGUgUEFUQ0ggcmVxdWVzdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG1ha2VSZWFkZXIoJ2hlbGxvIHdvcmxkJywgMSlcblxuICAgICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICAgIGNodW5rU2l6ZTogNixcbiAgICAgICAgICBvblByb2dyZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblByb2dyZXNzJyksXG4gICAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblN1Y2Nlc3MnKSxcbiAgICAgICAgICBmaW5nZXJwcmludCgpIHt9LFxuICAgICAgICAgIHVwbG9hZExlbmd0aERlZmVycmVkOiB0cnVlLFxuICAgICAgICB9XG4gICAgICAgIHNweU9uKG9wdGlvbnMsICdmaW5nZXJwcmludCcpLmFuZC5yZXNvbHZlVG8oJ2ZpbmdlcnByaW50ZWQnKVxuXG4gICAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKHJlYWRlciwgb3B0aW9ucylcbiAgICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgICBleHBlY3Qob3B0aW9ucy5maW5nZXJwcmludCkudG9IYXZlQmVlbkNhbGxlZFdpdGgocmVhZGVyLCB1cGxvYWQub3B0aW9ucylcblxuICAgICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKHVuZGVmaW5lZClcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLURlZmVyLUxlbmd0aCddKS50b0JlKDEpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgIExvY2F0aW9uOiAnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1PZmZzZXQnXSkudG9CZSgwKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICAgIGV4cGVjdChyZXEuYm9keS5sZW5ndGgpLnRvQmUoNilcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA2LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgb3B0aW9ucy5vblByb2dyZXNzLnRvQmVDYWxsZWRcbiAgICAgICAgZXhwZWN0KG9wdGlvbnMub25Qcm9ncmVzcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoNiwgbnVsbClcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtT2Zmc2V0J10pLnRvQmUoNilcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL29mZnNldCtvY3RldC1zdHJlYW0nKVxuICAgICAgICBleHBlY3QocmVxLmJvZHkubGVuZ3RoKS50b0JlKDUpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1PZmZzZXQnXSkudG9CZSgxMSlcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDExKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICAgIGV4cGVjdChyZXEuYm9keSkudG9CZShudWxsKVxuXG4gICAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDExLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuICAgICAgICBleHBlY3QodXBsb2FkLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSlcbiAgICAgIH0pXG5cbiAgICAgIGl0KCdzaG91bGQgcmV0cnkgdGhlIFBPU1QgcmVxdWVzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gbWFrZVJlYWRlcignaGVsbG8gd29ybGQnLCAxKVxuXG4gICAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJyxcbiAgICAgICAgICBjaHVua1NpemU6IDExLFxuICAgICAgICAgIHJldHJ5RGVsYXlzOiBbMTAsIDEwLCAxMF0sXG4gICAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblN1Y2Nlc3MnKSxcbiAgICAgICAgICB1cGxvYWRMZW5ndGhEZWZlcnJlZDogdHJ1ZSxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKHJlYWRlciwgb3B0aW9ucylcbiAgICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJylcbiAgICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJylcbiAgICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgICBMb2NhdGlvbjogJy9maWxlcy9mb28nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAxMSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1MZW5ndGgnXSkudG9CZSgxMSlcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAxMSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IG9wdGlvbnMub25TdWNjZXNzLnRvQmVDYWxsZWRcbiAgICAgIH0pXG5cbiAgICAgIGl0KCdzaG91bGQgcmV0cnkgdGhlIGZpcnN0IFBBVENIIHJlcXVlc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG1ha2VSZWFkZXIoJ2hlbGxvIHdvcmxkJywgMSlcblxuICAgICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL2ZpbGVzLycsXG4gICAgICAgICAgY2h1bmtTaXplOiAxMSxcbiAgICAgICAgICByZXRyeURlbGF5czogWzEwLCAxMCwgMTBdLFxuICAgICAgICAgIG9uU3VjY2Vzczogd2FpdGFibGVGdW5jdGlvbignb25TdWNjZXNzJyksXG4gICAgICAgICAgdXBsb2FkTGVuZ3RoRGVmZXJyZWQ6IHRydWUsXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChyZWFkZXIsIG9wdGlvbnMpXG4gICAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzLycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgTG9jYXRpb246ICcvZmlsZXMvZm9vJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnSEVBRCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTGVuZ3RoJ10pLnRvQmUoMTEpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCBvcHRpb25zLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG4gICAgICB9KVxuXG4gICAgICBpdCgnc2hvdWxkIHJldHJ5IGZvbGxvd2luZyBQQVRDSCByZXF1ZXN0cycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gbWFrZVJlYWRlcignaGVsbG8gd29ybGQgdGhlcmUhJylcblxuICAgICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL2ZpbGVzLycsXG4gICAgICAgICAgY2h1bmtTaXplOiA2LFxuICAgICAgICAgIHJldHJ5RGVsYXlzOiBbMTAsIDEwLCAxMF0sXG4gICAgICAgICAgb25TdWNjZXNzKCkge30sXG4gICAgICAgICAgdXBsb2FkTGVuZ3RoRGVmZXJyZWQ6IHRydWUsXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChyZWFkZXIsIG9wdGlvbnMpXG4gICAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzLycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgTG9jYXRpb246ICcvZmlsZXMvZm9vJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogNixcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnSEVBRCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogNixcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuXG4gICAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDE4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDE4KVxuXG4gICAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDE4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuICAgICAgfSlcblxuICAgICAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgc291cmNlIHByb3ZpZGVzIGxlc3MgZGF0YSB0aGFuIHVwbG9hZFNpemUnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG1ha2VSZWFkZXIoJ2hlbGxvIHdvcmxkJylcblxuICAgICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgICAgdXBsb2FkU2l6ZTogMTAwLFxuICAgICAgICAgIGNodW5rU2l6ZTogMTAwLFxuICAgICAgICAgIGVuZHBvaW50OiAnaHR0cDovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgICByZXRyeURlbGF5czogW10sXG4gICAgICAgICAgb25FcnJvcjogd2FpdGFibGVGdW5jdGlvbignb25FcnJvcicpLFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQocmVhZGVyLCBvcHRpb25zKVxuICAgICAgICB1cGxvYWQuc3RhcnQoKVxuICAgICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgIExvY2F0aW9uOiAnaHR0cDovL3R1cy5pby91cGxvYWRzL2ZvbycsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2ZvbycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBlcnIgPSBhd2FpdCBvcHRpb25zLm9uRXJyb3IudG9CZUNhbGxlZFxuXG4gICAgICAgIGV4cGVjdChlcnIubWVzc2FnZSkudG9CZShcbiAgICAgICAgICAndHVzOiBmYWlsZWQgdG8gdXBsb2FkIGNodW5rIGF0IG9mZnNldCAxMSwgY2F1c2VkIGJ5IEVycm9yOiB1cGxvYWQgd2FzIGNvbmZpZ3VyZWQgd2l0aCBhIHNpemUgb2YgMTAwIGJ5dGVzLCBidXQgdGhlIHNvdXJjZSBpcyBkb25lIGFmdGVyIDExIGJ5dGVzLCBvcmlnaW5hdGVkIGZyb20gcmVxdWVzdCAobWV0aG9kOiBQQVRDSCwgdXJsOiBodHRwOi8vdHVzLmlvL3VwbG9hZHMvZm9vLCByZXNwb25zZSBjb2RlOiBuL2EsIHJlc3BvbnNlIHRleHQ6IG4vYSwgcmVxdWVzdCBpZDogbi9hKScsXG4gICAgICAgIClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGRlc2NyaWJlKCdyZXNvbHZpbmcgb2YgVVJJcycsICgpID0+IHtcbiAgICAgIC8vIERpc2FibGUgdGhlc2UgdGVzdHMgZm9yIElFIDEwIGFuZCAxMSBiZWNhdXNlIGl0J3Mgbm90IHBvc3NpYmxlIHRvIG92ZXJ3cml0ZVxuICAgICAgLy8gdGhlIG5hdmlnYXRvci5wcm9kdWN0IHByb3BlcnR5LlxuICAgICAgY29uc3QgaXNJRSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignVHJpZGVudC8nKSA+IDBcbiAgICAgIGlmIChpc0lFKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTa2lwcGluZyB0ZXN0cyBmb3IgUmVhY3QgTmF0aXZlIGluIEludGVybmV0IEV4cGxvcmVyJykgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCBvcmlnaW5hbFByb2R1Y3QgPSBuYXZpZ2F0b3IucHJvZHVjdFxuXG4gICAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgICAgamFzbWluZS5BamF4Lmluc3RhbGwoKVxuICAgICAgICAvLyBTaW11bGF0ZSBSZWFjdCBOYXRpdmUgZW52aXJvbm1lbnQgdG8gZW5hYmxlIFVSSXMgYXMgaW5wdXQgb2JqZWN0cy5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG5hdmlnYXRvciwgJ3Byb2R1Y3QnLCB7XG4gICAgICAgICAgdmFsdWU6ICdSZWFjdE5hdGl2ZScsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgICAgamFzbWluZS5BamF4LnVuaW5zdGFsbCgpXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShuYXZpZ2F0b3IsICdwcm9kdWN0Jywge1xuICAgICAgICAgIHZhbHVlOiBvcmlnaW5hbFByb2R1Y3QsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgaXQoJ3Nob3VsZCB1cGxvYWQgYSBmaWxlIGZyb20gYW4gVVJJJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0ge1xuICAgICAgICAgIHVyaTogJ2ZpbGU6Ly8vbXkvZmlsZS5kYXQnLFxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblN1Y2Nlc3MnKSxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgICAgLy8gV2FpdCBhIHNob3J0IGludGVydmFsIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBYSFIgaGFzIGJlZW4gc2VudC5cbiAgICAgICAgYXdhaXQgd2FpdCgwKVxuXG4gICAgICAgIGxldCByZXEgPSBqYXNtaW5lLkFqYXgucmVxdWVzdHMubW9zdFJlY2VudCgpXG4gICAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdmaWxlOi8vL215L2ZpbGUuZGF0JylcbiAgICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0dFVCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVzcG9uc2VUeXBlKS50b0JlKCdibG9iJylcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgJ1VwbG9hZC1MZW5ndGgnOiAxMSxcbiAgICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc3BvbnNlOiBuZXcgQmxvYignaGVsbG8gd29ybGQnLnNwbGl0KCcnKSksXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDExKVxuXG4gICAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgICBMb2NhdGlvbjogJy91cGxvYWRzL2JsYXJnaCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcblxuICAgICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtT2Zmc2V0J10pLnRvQmUoMClcbiAgICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL29mZnNldCtvY3RldC1zdHJlYW0nKVxuICAgICAgICBleHBlY3QocmVxLmJvZHkuc2l6ZSkudG9CZSgxMSlcblxuICAgICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAxMSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IG9wdGlvbnMub25TdWNjZXNzLnRvQmVDYWxsZWRcbiAgICAgICAgZXhwZWN0KHVwbG9hZC51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9ibGFyZ2gnKVxuICAgICAgfSlcblxuICAgICAgaXQoXCJzaG91bGQgZW1pdCBhbiBlcnJvciBpZiBpdCBjYW4ndCByZXNvbHZlIHRoZSBVUklcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0ge1xuICAgICAgICAgIHVyaTogJ2ZpbGU6Ly8vbXkvZmlsZS5kYXQnLFxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICAgIG9uRXJyb3I6IHdhaXRhYmxlRnVuY3Rpb24oJ29uRXJyb3InKSxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgICAgLy8gV2FpdCBhIHNob3J0IGludGVydmFsIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBYSFIgaGFzIGJlZW4gc2VudC5cbiAgICAgICAgYXdhaXQgd2FpdCgwKVxuXG4gICAgICAgIGNvbnN0IHJlcSA9IGphc21pbmUuQWpheC5yZXF1ZXN0cy5tb3N0UmVjZW50KClcbiAgICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2ZpbGU6Ly8vbXkvZmlsZS5kYXQnKVxuICAgICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnR0VUJylcbiAgICAgICAgZXhwZWN0KHJlcS5yZXNwb25zZVR5cGUpLnRvQmUoJ2Jsb2InKVxuXG4gICAgICAgIHJlcS5yZXNwb25zZUVycm9yKClcblxuICAgICAgICBhd2FpdCBvcHRpb25zLm9uRXJyb3IudG9CZUNhbGxlZFxuICAgICAgICBleHBlY3Qob3B0aW9ucy5vbkVycm9yKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgICBuZXcgRXJyb3IoXG4gICAgICAgICAgICAndHVzOiBjYW5ub3QgZmV0Y2ggYGZpbGUudXJpYCBhcyBCbG9iLCBtYWtlIHN1cmUgdGhlIHVyaSBpcyBjb3JyZWN0IGFuZCBhY2Nlc3NpYmxlLiBbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgICAgICksXG4gICAgICAgIClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI0xvY2FsU3RvcmFnZVVybFN0b3JhZ2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBzdG9yaW5nIGFuZCByZXRyaWV2aW5nIHVwbG9hZHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBhc3NlcnRVcmxTdG9yYWdlKHR1cy5kZWZhdWx0T3B0aW9ucy51cmxTdG9yYWdlKVxuICAgIH0pXG4gIH0pXG59KVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgVGVzdEh0dHBTdGFjaywgd2FpdGFibGVGdW5jdGlvbiwgd2FpdCwgZ2V0QmxvYiB9ID0gcmVxdWlyZSgnLi9oZWxwZXJzL3V0aWxzJylcbmNvbnN0IHR1cyA9IHJlcXVpcmUoJy4uLy4uJylcblxuLy8gVW5jb21tZW50IHRvIGVuYWJsZSBkZWJ1ZyBsb2cgZnJvbSB0dXMtanMtY2xpZW50XG4vLyB0dXMuZW5hYmxlRGVidWdMb2coKTtcblxuZGVzY3JpYmUoJ3R1cycsICgpID0+IHtcbiAgZGVzY3JpYmUoJyNpc1N1cHBvcnRlZCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGJlIHRydWUnLCAoKSA9PiB7XG4gICAgICBleHBlY3QodHVzLmlzU3VwcG9ydGVkKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI1VwbG9hZCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHRocm93IGlmIG5vIGVycm9yIGhhbmRsZXIgaXMgYXZhaWxhYmxlJywgKCkgPT4ge1xuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQobnVsbClcbiAgICAgIGV4cGVjdCh1cGxvYWQuc3RhcnQuYmluZCh1cGxvYWQpKS50b1Rocm93RXJyb3IoJ3R1czogbm8gZmlsZSBvciBzdHJlYW0gdG8gdXBsb2FkIHByb3ZpZGVkJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBpZiBubyBlbmRwb2ludCBhbmQgdXBsb2FkIFVSTCBpcyBwcm92aWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlKVxuICAgICAgZXhwZWN0KHVwbG9hZC5zdGFydC5iaW5kKHVwbG9hZCkpLnRvVGhyb3dFcnJvcihcbiAgICAgICAgJ3R1czogbmVpdGhlciBhbiBlbmRwb2ludCBvciBhbiB1cGxvYWQgVVJMIGlzIHByb3ZpZGVkJyxcbiAgICAgIClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB1cGxvYWQgYSBmaWxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQ3VzdG9tOiAnYmxhcmdoJyxcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBmb286ICdoZWxsbycsXG4gICAgICAgICAgYmFyOiAnd29ybGQnLFxuICAgICAgICAgIG5vbmxhdGluOiAnc8WCb8WEY2UnLFxuICAgICAgICAgIG51bWJlcjogMTAwLFxuICAgICAgICB9LFxuICAgICAgICBvblByb2dyZXNzKCkge30sXG4gICAgICAgIG9uVXBsb2FkVXJsQXZhaWxhYmxlOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblVwbG9hZFVybEF2YWlsYWJsZScpLFxuICAgICAgICBvblN1Y2Nlc3M6IHdhaXRhYmxlRnVuY3Rpb24oJ29uU3VjY2VzcycpLFxuICAgICAgfVxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uUHJvZ3Jlc3MnKVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG5cbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnMuQ3VzdG9tKS50b0JlKCdibGFyZ2gnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTGVuZ3RoJ10pLnRvQmUoMTEpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTWV0YWRhdGEnXSkudG9CZShcbiAgICAgICAgJ2ZvbyBhR1ZzYkc4PSxiYXIgZDI5eWJHUT0sbm9ubGF0aW4gYzhXQ2I4V0VZMlU9LG51bWJlciBNVEF3JyxcbiAgICAgIClcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy9ibGFyZ2gnLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcblxuICAgICAgZXhwZWN0KG9wdGlvbnMub25VcGxvYWRVcmxBdmFpbGFibGUpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy9ibGFyZ2gnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnMuQ3VzdG9tKS50b0JlKCdibGFyZ2gnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtT2Zmc2V0J10pLnRvQmUoMClcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddKS50b0JlKCdhcHBsaWNhdGlvbi9vZmZzZXQrb2N0ZXQtc3RyZWFtJylcbiAgICAgIGV4cGVjdChyZXEuYm9keS5zaXplKS50b0JlKDExKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAxMSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIGF3YWl0IG9wdGlvbnMub25TdWNjZXNzLnRvQmVDYWxsZWRcblxuICAgICAgZXhwZWN0KHVwbG9hZC51cmwpLnRvQmUoJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvYmxhcmdoJylcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYW4gdXBsb2FkIGlmIHJlc3VtaW5nIGZhaWxzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIHVwbG9hZFVybDogJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9yZXN1bWluZycsXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvcmVzdW1pbmcnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogNDA0LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTGVuZ3RoJ10pLnRvQmUoMTEpXG5cbiAgICAgIC8vIFRoZSB1cGxvYWQgVVJMIHNob3VsZCBiZSBjbGVhcmVkIHdoZW4gdHVzLWpzLmNsaWVudCB0cmllcyB0byBjcmVhdGUgYSBuZXcgdXBsb2FkLlxuICAgICAgZXhwZWN0KHVwbG9hZC51cmwpLnRvQmUobnVsbClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYW4gdXBsb2FkIHVzaW5nIHRoZSBjcmVhdGlvbi13aXRoLWRhdGEgZXh0ZW5zaW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIHVwbG9hZERhdGFEdXJpbmdDcmVhdGlvbjogdHJ1ZSxcbiAgICAgICAgb25Qcm9ncmVzcygpIHt9LFxuICAgICAgICBvbkNodW5rQ29tcGxldGUoKSB7fSxcbiAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblN1Y2Nlc3MnKSxcbiAgICAgIH1cblxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uUHJvZ3Jlc3MnKVxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uQ2h1bmtDb21wbGV0ZScpXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBjb25zdCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1MZW5ndGgnXSkudG9CZSgxMSlcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddKS50b0JlKCdhcHBsaWNhdGlvbi9vZmZzZXQrb2N0ZXQtc3RyZWFtJylcbiAgICAgIGV4cGVjdChyZXEuYm9keS5zaXplKS50b0JlKDExKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMvYmxhcmdoJyxcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDExLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuXG4gICAgICBleHBlY3Qob3B0aW9ucy5vblByb2dyZXNzKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgxMSwgMTEpXG4gICAgICBleHBlY3Qob3B0aW9ucy5vbkNodW5rQ29tcGxldGUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSwgMTEpXG4gICAgICBleHBlY3Qob3B0aW9ucy5vblN1Y2Nlc3MpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgICBleHBlY3QodXBsb2FkLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGFuIHVwbG9hZCB3aXRoIHBhcnRpYWwgZGF0YSBhbmQgY29udGludWUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIGVuZHBvaW50OiAnaHR0cDovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgdXBsb2FkRGF0YUR1cmluZ0NyZWF0aW9uOiB0cnVlLFxuICAgICAgICBjaHVua1NpemU6IDYsXG4gICAgICAgIG9uUHJvZ3Jlc3MoKSB7fSxcbiAgICAgICAgb25DaHVua0NvbXBsZXRlKCkge30sXG4gICAgICAgIG9uU3VjY2Vzczogd2FpdGFibGVGdW5jdGlvbignb25TdWNjZXNzJyksXG4gICAgICB9XG5cbiAgICAgIHNweU9uKG9wdGlvbnMsICdvblByb2dyZXNzJylcbiAgICAgIHNweU9uKG9wdGlvbnMsICdvbkNodW5rQ29tcGxldGUnKVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDExKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL29mZnNldCtvY3RldC1zdHJlYW0nKVxuICAgICAgZXhwZWN0KHJlcS5ib2R5LnNpemUpLnRvQmUoNilcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcsXG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA2LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcblxuICAgICAgLy8gT25jZSB0aGUgc2Vjb25kIHJlcXVlc3QgaGFzIGJlZW4gc2VudCwgdGhlIHByb2dyZXNzIGhhbmRsZXIgbXVzdCBoYXZlIGJlZW4gaW52b2tlZC5cbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDYsIDExKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25DaHVua0NvbXBsZXRlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCg2LCA2LCAxMSlcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uU3VjY2Vzcykubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgZXhwZWN0KHVwbG9hZC51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9ibGFyZ2gnKVxuXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtT2Zmc2V0J10pLnRvQmUoNilcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddKS50b0JlKCdhcHBsaWNhdGlvbi9vZmZzZXQrb2N0ZXQtc3RyZWFtJylcbiAgICAgIGV4cGVjdChyZXEuYm9keS5zaXplKS50b0JlKDUpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICBMb2NhdGlvbjogJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9ibGFyZ2gnLFxuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICBhd2FpdCBvcHRpb25zLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG5cbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSlcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uQ2h1bmtDb21wbGV0ZSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoNSwgMTEsIDExKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25TdWNjZXNzKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICB9KVxuXG4gICAgaXQoXCJzaG91bGQgYWRkIHRoZSByZXF1ZXN0J3MgYm9keSBhbmQgSUQgdG8gZXJyb3JzXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICBhZGRSZXF1ZXN0SWQ6IHRydWUsXG4gICAgICAgIHJldHJ5RGVsYXlzOiBudWxsLFxuICAgICAgICBvbkVycm9yOiB3YWl0YWJsZUZ1bmN0aW9uKCdvbkVycm9yJyksXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBjb25zdCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG5cbiAgICAgIGNvbnN0IHJlcUlkID0gcmVxLnJlcXVlc3RIZWFkZXJzWydYLVJlcXVlc3QtSUQnXVxuICAgICAgZXhwZWN0KHR5cGVvZiByZXFJZCkudG9CZSgnc3RyaW5nJylcbiAgICAgIGV4cGVjdChyZXFJZC5sZW5ndGgpLnRvQmUoMzYpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogNTAwLFxuICAgICAgICByZXNwb25zZVRleHQ6ICdzZXJ2ZXJfZXJyb3InLFxuICAgICAgfSlcblxuICAgICAgY29uc3QgZXJyID0gYXdhaXQgb3B0aW9ucy5vbkVycm9yLnRvQmVDYWxsZWRcblxuICAgICAgZXhwZWN0KGVyci5tZXNzYWdlKS50b0JlKFxuICAgICAgICBgdHVzOiB1bmV4cGVjdGVkIHJlc3BvbnNlIHdoaWxlIGNyZWF0aW5nIHVwbG9hZCwgb3JpZ2luYXRlZCBmcm9tIHJlcXVlc3QgKG1ldGhvZDogUE9TVCwgdXJsOiBodHRwOi8vdHVzLmlvL3VwbG9hZHMsIHJlc3BvbnNlIGNvZGU6IDUwMCwgcmVzcG9uc2UgdGV4dDogc2VydmVyX2Vycm9yLCByZXF1ZXN0IGlkOiAke3JlcUlkfSlgLFxuICAgICAgKVxuICAgICAgZXhwZWN0KGVyci5vcmlnaW5hbFJlcXVlc3QpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChlcnIub3JpZ2luYWxSZXNwb25zZSkudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGludm9rZSB0aGUgcmVxdWVzdCBhbmQgcmVzcG9uc2UgY2FsbGJhY2tzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICB1cGxvYWRVcmw6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMvZm9vJyxcbiAgICAgICAgb25CZWZvcmVSZXF1ZXN0KHJlcSkge1xuICAgICAgICAgIGV4cGVjdChyZXEuZ2V0VVJMKCkpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9mb28nKVxuICAgICAgICAgIGV4cGVjdChyZXEuZ2V0TWV0aG9kKCkpLnRvQmUoJ0hFQUQnKVxuICAgICAgICB9LFxuICAgICAgICBvbkFmdGVyUmVzcG9uc2UocmVxLCByZXMpIHtcbiAgICAgICAgICBleHBlY3QocmVxLmdldFVSTCgpKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvZm9vJylcbiAgICAgICAgICBleHBlY3QocmVxLmdldE1ldGhvZCgpKS50b0JlKCdIRUFEJylcbiAgICAgICAgICBleHBlY3QocmVzLmdldFN0YXR1cygpKS50b0JlKDIwNClcbiAgICAgICAgICBleHBlY3QocmVzLmdldEhlYWRlcignVXBsb2FkLU9mZnNldCcpKS50b0JlKDExKVxuICAgICAgICB9LFxuICAgICAgICBvblN1Y2Nlc3M6IHdhaXRhYmxlRnVuY3Rpb24oJ29uU3VjY2VzcycpLFxuICAgICAgfVxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uQmVmb3JlUmVxdWVzdCcpXG4gICAgICBzcHlPbihvcHRpb25zLCAnb25BZnRlclJlc3BvbnNlJylcblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnSEVBRCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDExLFxuICAgICAgICAgICdVcGxvYWQtTGVuZ3RoJzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICBhd2FpdCBvcHRpb25zLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG4gICAgICBleHBlY3Qob3B0aW9ucy5vbkJlZm9yZVJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25BZnRlclJlc3BvbnNlKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciBpZiByZXN1bWluZyBmYWlscyBhbmQgbm8gZW5kcG9pbnQgaXMgcHJvdmlkZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIHVwbG9hZFVybDogJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9yZXN1bWluZycsXG4gICAgICAgIG9uRXJyb3I6IHdhaXRhYmxlRnVuY3Rpb24oJ29uRXJyb3InKSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL3Jlc3VtaW5nJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdIRUFEJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDQwNCxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGVyciA9IGF3YWl0IG9wdGlvbnMub25FcnJvci50b0JlQ2FsbGVkXG4gICAgICBleHBlY3QoZXJyLm1lc3NhZ2UpLnRvQmUoXG4gICAgICAgICd0dXM6IHVuYWJsZSB0byByZXN1bWUgdXBsb2FkIChuZXcgdXBsb2FkIGNhbm5vdCBiZSBjcmVhdGVkIHdpdGhvdXQgYW4gZW5kcG9pbnQpLCBvcmlnaW5hdGVkIGZyb20gcmVxdWVzdCAobWV0aG9kOiBIRUFELCB1cmw6IGh0dHA6Ly90dXMuaW8vdXBsb2Fkcy9yZXN1bWluZywgcmVzcG9uc2UgY29kZTogNDA0LCByZXNwb25zZSB0ZXh0OiAsIHJlcXVlc3QgaWQ6IG4vYSknLFxuICAgICAgKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlc29sdmUgcmVsYXRpdmUgVVJMcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvOjEwODAvZmlsZXMvJyxcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGxldCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW86MTA4MC9maWxlcy8nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICcvL2xvY2FsaG9zdC91cGxvYWRzL2ZvbycsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly9sb2NhbGhvc3QvdXBsb2Fkcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QodXBsb2FkLnVybCkudG9CZSgnaHR0cDovL2xvY2FsaG9zdC91cGxvYWRzL2ZvbycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdXBsb2FkIGEgZmlsZSBpbiBjaHVua3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIGVuZHBvaW50OiAnaHR0cDovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgY2h1bmtTaXplOiA3LFxuICAgICAgICBvblN1Y2Nlc3M6IHdhaXRhYmxlRnVuY3Rpb24oJ29uU3VjY2VzcycpLFxuICAgICAgICBvblByb2dyZXNzKCkge30sXG4gICAgICAgIG9uQ2h1bmtDb21wbGV0ZSgpIHt9LFxuICAgICAgfVxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uUHJvZ3Jlc3MnKVxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uQ2h1bmtDb21wbGV0ZScpXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTGVuZ3RoJ10pLnRvQmUoMTEpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICBMb2NhdGlvbjogJy91cGxvYWRzL2JsYXJnaCcsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9ibGFyZ2gnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDApXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICBleHBlY3QocmVxLmJvZHkuc2l6ZSkudG9CZSg3KVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA3LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvYmxhcmdoJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1PZmZzZXQnXSkudG9CZSg3KVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL29mZnNldCtvY3RldC1zdHJlYW0nKVxuICAgICAgZXhwZWN0KHJlcS5ib2R5LnNpemUpLnRvQmUoNClcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICBhd2FpdCBvcHRpb25zLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG5cbiAgICAgIGV4cGVjdCh1cGxvYWQudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvYmxhcmdoJylcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSlcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uQ2h1bmtDb21wbGV0ZSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoNywgNywgMTEpXG4gICAgICBleHBlY3Qob3B0aW9ucy5vbkNodW5rQ29tcGxldGUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDQsIDExLCAxMSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBhZGQgdGhlIG9yaWdpbmFsIHJlcXVlc3QgdG8gZXJyb3JzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIHJldHJ5RGVsYXlzOiBudWxsLFxuICAgICAgICBvbkVycm9yOiB3YWl0YWJsZUZ1bmN0aW9uKCdvbkVycm9yJyksXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBjb25zdCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogNTAwLFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICBDdXN0b206ICdibGFyZ2gnLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgY29uc3QgZXJyID0gYXdhaXQgb3B0aW9ucy5vbkVycm9yLnRvQmVDYWxsZWRcblxuICAgICAgZXhwZWN0KHVwbG9hZC51cmwpLnRvQmUobnVsbClcbiAgICAgIGV4cGVjdChlcnIubWVzc2FnZSkudG9CZShcbiAgICAgICAgJ3R1czogdW5leHBlY3RlZCByZXNwb25zZSB3aGlsZSBjcmVhdGluZyB1cGxvYWQsIG9yaWdpbmF0ZWQgZnJvbSByZXF1ZXN0IChtZXRob2Q6IFBPU1QsIHVybDogaHR0cDovL3R1cy5pby91cGxvYWRzLCByZXNwb25zZSBjb2RlOiA1MDAsIHJlc3BvbnNlIHRleHQ6ICwgcmVxdWVzdCBpZDogbi9hKScsXG4gICAgICApXG4gICAgICBleHBlY3QoZXJyLm9yaWdpbmFsUmVxdWVzdCkudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KGVyci5vcmlnaW5hbFJlc3BvbnNlKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoZXJyLm9yaWdpbmFsUmVzcG9uc2UuZ2V0SGVhZGVyKCdDdXN0b20nKSkudG9CZSgnYmxhcmdoJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBvbmx5IGNyZWF0ZSBhbiB1cGxvYWQgZm9yIGVtcHR5IGZpbGVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJycpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICBvblN1Y2Nlc3M6IHdhaXRhYmxlRnVuY3Rpb24oJ29uU3VjY2VzcycpLFxuICAgICAgfVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgY29uc3QgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTGVuZ3RoJ10pLnRvQmUoMClcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnaHR0cDovL3R1cy5pby91cGxvYWRzL2VtcHR5JyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIGF3YWl0IG9wdGlvbnMub25TdWNjZXNzLnRvQmVDYWxsZWRcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uU3VjY2VzcykudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbm90IHJlc3VtZSBhIGZpbmlzaGVkIHVwbG9hZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICBvblByb2dyZXNzKCkge30sXG4gICAgICAgIG9uU3VjY2Vzczogd2FpdGFibGVGdW5jdGlvbignb25TdWNjZXNzJyksXG4gICAgICAgIHVwbG9hZFVybDogJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9yZXN1bWluZycsXG4gICAgICB9XG4gICAgICBzcHlPbihvcHRpb25zLCAnb25Qcm9ncmVzcycpXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBjb25zdCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9yZXN1bWluZycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnSEVBRCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtTGVuZ3RoJzogJzExJyxcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6ICcxMScsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICBhd2FpdCBvcHRpb25zLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG5cbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSlcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uU3VjY2VzcykudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVzdW1lIGFuIHVwbG9hZCBmcm9tIGEgc3BlY2lmaWVkIHVybCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICB1cGxvYWRVcmw6ICdodHRwOi8vdHVzLmlvL2ZpbGVzL3VwbG9hZCcsXG4gICAgICAgIG9uUHJvZ3Jlc3MoKSB7fSxcbiAgICAgICAgb25VcGxvYWRVcmxBdmFpbGFibGU6IHdhaXRhYmxlRnVuY3Rpb24oJ29uVXBsb2FkVXJsQXZhaWxhYmxlJyksXG4gICAgICAgIG9uU3VjY2Vzczogd2FpdGFibGVGdW5jdGlvbignb25TdWNjZXNzJyksXG4gICAgICAgIGZpbmdlcnByaW50KCkge30sXG4gICAgICB9XG4gICAgICBzcHlPbihvcHRpb25zLCAnZmluZ2VycHJpbnQnKS5hbmQucmVzb2x2ZVRvKCdmaW5nZXJwcmludGVkJylcbiAgICAgIHNweU9uKG9wdGlvbnMsICdvblByb2dyZXNzJylcblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGV4cGVjdChvcHRpb25zLmZpbmdlcnByaW50KS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy91cGxvYWQnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLUxlbmd0aCc6IDExLFxuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG5cbiAgICAgIGV4cGVjdChvcHRpb25zLm9uVXBsb2FkVXJsQXZhaWxhYmxlKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvdXBsb2FkJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1PZmZzZXQnXSkudG9CZSgzKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL29mZnNldCtvY3RldC1zdHJlYW0nKVxuICAgICAgZXhwZWN0KHJlcS5ib2R5LnNpemUpLnRvQmUoMTEgLSAzKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAxMSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIGF3YWl0IG9wdGlvbnMub25TdWNjZXNzLnRvQmVDYWxsZWRcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSlcbiAgICAgIGV4cGVjdCh1cGxvYWQudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL3VwbG9hZCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVzdW1lIGEgcHJldmlvdXNseSBzdGFydGVkIHVwbG9hZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICBvblN1Y2Nlc3M6IHdhaXRhYmxlRnVuY3Rpb24oJ29uU3VjY2VzcycpLFxuICAgICAgICBvbkVycm9yKCkge30sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMvYmxhcmdoJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2JsYXJnaCcpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuXG4gICAgICB1cGxvYWQuYWJvcnQoKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA1LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvYmxhcmdoJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdIRUFEJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogNSxcbiAgICAgICAgICAnVXBsb2FkLUxlbmd0aCc6IDExLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvYmxhcmdoJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDExLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuICAgICAgZXhwZWN0KG9wdGlvbnMub25TdWNjZXNzKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBvdmVycmlkZSB0aGUgUEFUQ0ggbWV0aG9kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIHVwbG9hZFVybDogJ2h0dHA6Ly90dXMuaW8vZmlsZXMvdXBsb2FkJyxcbiAgICAgICAgb3ZlcnJpZGVQYXRjaE1ldGhvZDogdHJ1ZSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGxldCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvdXBsb2FkJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdIRUFEJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1MZW5ndGgnOiAxMSxcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDMsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvdXBsb2FkJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDMpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydYLUhUVFAtTWV0aG9kLU92ZXJyaWRlJ10pLnRvQmUoJ1BBVENIJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGVtaXQgYW4gZXJyb3IgaWYgYW4gdXBsb2FkIGlzIGxvY2tlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICB1cGxvYWRVcmw6ICdodHRwOi8vdHVzLmlvL2ZpbGVzL3VwbG9hZCcsXG4gICAgICAgIG9uRXJyb3I6IHdhaXRhYmxlRnVuY3Rpb24oJ29uRXJyb3InKSxcbiAgICAgICAgcmV0cnlEZWxheXM6IG51bGwsXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBjb25zdCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvdXBsb2FkJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdIRUFEJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiA0MjMsIC8vIExvY2tlZFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vbkVycm9yLnRvQmVDYWxsZWRcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uRXJyb3IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBuZXcgRXJyb3IoXG4gICAgICAgICAgJ3R1czogdXBsb2FkIGlzIGN1cnJlbnRseSBsb2NrZWQ7IHJldHJ5IGxhdGVyLCBvcmlnaW5hdGVkIGZyb20gcmVxdWVzdCAobWV0aG9kOiBIRUFELCB1cmw6IGh0dHA6Ly90dXMuaW8vZmlsZXMvdXBsb2FkLCByZXNwb25zZSBjb2RlOiA0MjMsIHJlc3BvbnNlIHRleHQ6ICwgcmVxdWVzdCBpZDogbi9hKScsXG4gICAgICAgICksXG4gICAgICApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZW1pdCBhbiBlcnJvciBpZiBubyBMb2NhdGlvbiBoZWFkZXIgaXMgcHJlc2VudGVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIG9uRXJyb3I6IHdhaXRhYmxlRnVuY3Rpb24oJ29uRXJyb3InKSxcbiAgICAgICAgcmV0cnlEZWxheXM6IG51bGwsXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBjb25zdCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG5cbiAgICAgIC8vIFRoZSBMb2NhdGlvbiBoZWFkZXIgaXMgb21pdHRlZCBvbiBwdXJwb3NlIGhlcmVcbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vbkVycm9yLnRvQmVDYWxsZWRcblxuICAgICAgZXhwZWN0KG9wdGlvbnMub25FcnJvcikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIG5ldyBFcnJvcihcbiAgICAgICAgICAndHVzOiBpbnZhbGlkIG9yIG1pc3NpbmcgTG9jYXRpb24gaGVhZGVyLCBvcmlnaW5hdGVkIGZyb20gcmVxdWVzdCAobWV0aG9kOiBQT1NULCB1cmw6IGh0dHA6Ly90dXMuaW8vdXBsb2FkcywgcmVzcG9uc2UgY29kZTogMjAxLCByZXNwb25zZSB0ZXh0OiAsIHJlcXVlc3QgaWQ6IG4vYSknLFxuICAgICAgICApLFxuICAgICAgKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIGlmIHRoZSBzb3VyY2UgcHJvdmlkZXMgbGVzcyBkYXRhIHRoYW4gdXBsb2FkU2l6ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgdXBsb2FkU2l6ZTogMTAwLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIHJldHJ5RGVsYXlzOiBbXSxcbiAgICAgICAgb25FcnJvcjogd2FpdGFibGVGdW5jdGlvbignb25FcnJvcicpLFxuICAgICAgfVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgY29uc3QgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICBMb2NhdGlvbjogJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9mb28nLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgY29uc3QgZXJyID0gYXdhaXQgb3B0aW9ucy5vbkVycm9yLnRvQmVDYWxsZWRcbiAgICAgIGV4cGVjdChlcnIubWVzc2FnZSkudG9CZShcbiAgICAgICAgJ3R1czogZmFpbGVkIHRvIHVwbG9hZCBjaHVuayBhdCBvZmZzZXQgMCwgY2F1c2VkIGJ5IEVycm9yOiB1cGxvYWQgd2FzIGNvbmZpZ3VyZWQgd2l0aCBhIHNpemUgb2YgMTAwIGJ5dGVzLCBidXQgdGhlIHNvdXJjZSBpcyBkb25lIGFmdGVyIDExIGJ5dGVzLCBvcmlnaW5hdGVkIGZyb20gcmVxdWVzdCAobWV0aG9kOiBQQVRDSCwgdXJsOiBodHRwOi8vdHVzLmlvL3VwbG9hZHMvZm9vLCByZXNwb25zZSBjb2RlOiBuL2EsIHJlc3BvbnNlIHRleHQ6IG4vYSwgcmVxdWVzdCBpZDogbi9hKScsXG4gICAgICApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgaWYgcmV0cnlEZWxheXMgaXMgbm90IGFuIGFycmF5JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIHtcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vZW5kcG9pbnQvJyxcbiAgICAgICAgcmV0cnlEZWxheXM6IDQ0LFxuICAgICAgfSlcbiAgICAgIGV4cGVjdCh1cGxvYWQuc3RhcnQuYmluZCh1cGxvYWQpKS50b1Rocm93RXJyb3IoXG4gICAgICAgICd0dXM6IHRoZSBgcmV0cnlEZWxheXNgIG9wdGlvbiBtdXN0IGVpdGhlciBiZSBhbiBhcnJheSBvciBudWxsJyxcbiAgICAgIClcbiAgICB9KVxuXG4gICAgLy8gVGhpcyB0ZXN0cyBlbnN1cmVzIHRoYXQgdHVzLWpzLWNsaWVudCBjb3JyZWN0bHkgcmV0cmllcyBpZiB0aGVcbiAgICAvLyByZXNwb25zZSBoYXMgdGhlIGNvZGUgNTAwIEludGVybmFsIEVycm9yLCA0MjMgTG9ja2VkIG9yIDQwOSBDb25mbGljdC5cbiAgICBpdCgnc2hvdWxkIHJldHJ5IHRoZSB1cGxvYWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIGVuZHBvaW50OiAnaHR0cDovL3R1cy5pby9maWxlcy8nLFxuICAgICAgICByZXRyeURlbGF5czogWzEwLCAxMCwgMTBdLFxuICAgICAgICBvblN1Y2Nlc3M6IHdhaXRhYmxlRnVuY3Rpb24oJ29uU3VjY2VzcycpLFxuICAgICAgfVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy8nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy8nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICcvZmlsZXMvZm9vJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiA0MjMsXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdIRUFEJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMCxcbiAgICAgICAgICAnVXBsb2FkLUxlbmd0aCc6IDExLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDQwOSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAwLFxuICAgICAgICAgICdVcGxvYWQtTGVuZ3RoJzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDExLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuICAgICAgZXhwZWN0KG9wdGlvbnMub25TdWNjZXNzKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICB9KVxuXG4gICAgLy8gVGhpcyB0ZXN0cyBlbnN1cmVzIHRoYXQgdHVzLWpzLWNsaWVudCBjb3JyZWN0bHkgcmV0cmllcyBpZiB0aGVcbiAgICAvLyByZXR1cm4gdmFsdWUgb2Ygb25TaG91bGRSZXRyeSBpcyB0cnVlLlxuICAgIGl0KCdzaG91bGQgcmV0cnkgdGhlIHVwbG9hZCB3aGVuIG9uU2hvdWxkUmV0cnkgc3BlY2lmaWVkIGFuZCByZXR1cm5zIHRydWUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIGVuZHBvaW50OiAnaHR0cDovL3R1cy5pby9maWxlcy8nLFxuICAgICAgICByZXRyeURlbGF5czogWzEwLCAxMCwgMTBdLFxuICAgICAgICBvblN1Y2Nlc3M6IHdhaXRhYmxlRnVuY3Rpb24oJ29uU3VjY2VzcycpLFxuICAgICAgICBvblNob3VsZFJldHJ5OiAoKSA9PiB0cnVlLFxuICAgICAgfVxuXG4gICAgICBzcHlPbihvcHRpb25zLCAnb25TaG91bGRSZXRyeScpLmFuZC5jYWxsVGhyb3VnaCgpXG4gICAgICBzcHlPbih0dXMuVXBsb2FkLnByb3RvdHlwZSwgJ19lbWl0RXJyb3InKS5hbmQuY2FsbFRocm91Z2goKVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy8nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy8nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICcvZmlsZXMvZm9vJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiA0MjMsXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdIRUFEJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMCxcbiAgICAgICAgICAnVXBsb2FkLUxlbmd0aCc6IDExLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDQwOSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAwLFxuICAgICAgICAgICdVcGxvYWQtTGVuZ3RoJzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDExLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuICAgICAgZXhwZWN0KG9wdGlvbnMub25TdWNjZXNzKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgY29uc3QgW2Vycm9yMV0gPSB1cGxvYWQuX2VtaXRFcnJvci5jYWxscy5hcmdzRm9yKDApXG4gICAgICBleHBlY3Qob3B0aW9ucy5vblNob3VsZFJldHJ5KS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uU2hvdWxkUmV0cnkuY2FsbHMuYXJnc0ZvcigwKSkudG9FcXVhbChbZXJyb3IxLCAwLCB1cGxvYWQub3B0aW9uc10pXG4gICAgICBjb25zdCBbZXJyb3IyXSA9IHVwbG9hZC5fZW1pdEVycm9yLmNhbGxzLmFyZ3NGb3IoMSlcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uU2hvdWxkUmV0cnkuY2FsbHMuYXJnc0ZvcigxKSkudG9FcXVhbChbZXJyb3IyLCAxLCB1cGxvYWQub3B0aW9uc10pXG4gICAgfSlcblxuICAgIC8vIFRoaXMgdGVzdHMgZW5zdXJlcyB0aGF0IHR1cy1qcy1jbGllbnQgY29ycmVjdGx5IGFib3J0cyBpZiB0aGVcbiAgICAvLyByZXR1cm4gdmFsdWUgb2Ygb25TaG91bGRSZXRyeSBpcyBmYWxzZS5cbiAgICBpdCgnc2hvdWxkIG5vdCByZXRyeSB0aGUgdXBsb2FkIHdoZW4gY2FsbGJhY2sgc3BlY2lmaWVkIGFuZCByZXR1cm5zIGZhbHNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJyxcbiAgICAgICAgcmV0cnlEZWxheXM6IFsxMCwgMTAsIDEwXSxcbiAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCdvblN1Y2Nlc3MnKSxcbiAgICAgICAgb25FcnJvcjogd2FpdGFibGVGdW5jdGlvbignb25FcnJvcicpLFxuICAgICAgICBvblNob3VsZFJldHJ5OiAoKSA9PiBmYWxzZSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy8nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICAvLyBUaGUgZXJyb3IgY2FsbGJhY2sgc2hvdWxkIG5vdCBiZSBpbnZva2VkIGZvciB0aGUgZmlyc3QgZXJyb3IgcmVzcG9uc2UuXG4gICAgICBleHBlY3Qob3B0aW9ucy5vbkVycm9yKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogNTAwLFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vbkVycm9yLnRvQmVDYWxsZWRcblxuICAgICAgZXhwZWN0KG9wdGlvbnMub25TdWNjZXNzKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICBleHBlY3Qob3B0aW9ucy5vbkVycm9yKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBub3QgcmV0cnkgaWYgdGhlIGVycm9yIGhhcyBub3QgYmVlbiBjYXVzZWQgYnkgYSByZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogbmV3IFRlc3RIdHRwU3RhY2soKSxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL2ZpbGVzLycsXG4gICAgICAgIHJldHJ5RGVsYXlzOiBbMTAsIDEwLCAxMF0sXG4gICAgICAgIG9uU3VjY2VzcygpIHt9LFxuICAgICAgICBvbkVycm9yKCkge30sXG4gICAgICB9XG5cbiAgICAgIHNweU9uKG9wdGlvbnMsICdvblN1Y2Nlc3MnKVxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uRXJyb3InKVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgc3B5T24odXBsb2FkLCAnX2NyZWF0ZVVwbG9hZCcpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBhd2FpdCB3YWl0KDIwMClcblxuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ2N1c3RvbSBlcnJvcicpXG4gICAgICB1cGxvYWQuX2VtaXRFcnJvcihlcnJvcilcblxuICAgICAgZXhwZWN0KHVwbG9hZC5fY3JlYXRlVXBsb2FkKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSlcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uRXJyb3IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKGVycm9yKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25TdWNjZXNzKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3RvcCByZXRyeWluZyBhZnRlciBhbGwgZGVsYXlzIGhhdmUgYmVlbiB1c2VkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJyxcbiAgICAgICAgcmV0cnlEZWxheXM6IFsxMF0sXG4gICAgICAgIG9uU3VjY2VzcygpIHt9LFxuICAgICAgICBvbkVycm9yOiB3YWl0YWJsZUZ1bmN0aW9uKCdvbkVycm9yJyksXG4gICAgICB9XG4gICAgICBzcHlPbihvcHRpb25zLCAnb25TdWNjZXNzJylcblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGxldCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcblxuICAgICAgLy8gVGhlIGVycm9yIGNhbGxiYWNrIHNob3VsZCBub3QgYmUgaW52b2tlZCBmb3IgdGhlIGZpcnN0IGVycm9yIHJlc3BvbnNlLlxuICAgICAgZXhwZWN0KG9wdGlvbnMub25FcnJvcikubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgIH0pXG5cbiAgICAgIGF3YWl0IG9wdGlvbnMub25FcnJvci50b0JlQ2FsbGVkXG5cbiAgICAgIGV4cGVjdChvcHRpb25zLm9uU3VjY2Vzcykubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25FcnJvcikudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3RvcCByZXRyeWluZyB3aGVuIHRoZSBhYm9ydCBmdW5jdGlvbiBpcyBjYWxsZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIGVuZHBvaW50OiAnaHR0cDovL3R1cy5pby9maWxlcy8nLFxuICAgICAgICByZXRyeURlbGF5czogWzEwXSxcbiAgICAgICAgb25FcnJvcigpIHt9LFxuICAgICAgfVxuXG4gICAgICBzcHlPbihvcHRpb25zLCAnb25FcnJvcicpXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBjb25zdCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcblxuICAgICAgc3B5T24odXBsb2FkLCAnc3RhcnQnKS5hbmQuY2FsbFRocm91Z2goKVxuXG4gICAgICB1cGxvYWQuYWJvcnQoKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbdGVzdFN0YWNrLm5leHRSZXF1ZXN0KCksIHdhaXQoMTAwKV0pXG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoJ3RpbWVkIG91dCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3RvcCB1cGxvYWQgd2hlbiB0aGUgYWJvcnQgZnVuY3Rpb24gaXMgY2FsbGVkIGR1cmluZyBhIGNhbGxiYWNrJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJyxcbiAgICAgICAgY2h1bmtTaXplOiA1LFxuICAgICAgICBvbkNodW5rQ29tcGxldGUoKSB7XG4gICAgICAgICAgdXBsb2FkLmFib3J0KClcbiAgICAgICAgfSxcbiAgICAgIH1cblxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uQ2h1bmtDb21wbGV0ZScpLmFuZC5jYWxsVGhyb3VnaCgpXG5cbiAgICAgIGxldCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy8nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICcvZmlsZXMvZm9vJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogNSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbdGVzdFN0YWNrLm5leHRSZXF1ZXN0KCksIHdhaXQoMjAwKV0pXG5cbiAgICAgIGV4cGVjdChvcHRpb25zLm9uQ2h1bmtDb21wbGV0ZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKCd0aW1lZCBvdXQnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHN0b3AgdXBsb2FkIHdoZW4gdGhlIGFib3J0IGZ1bmN0aW9uIGlzIGNhbGxlZCBkdXJpbmcgdGhlIFBPU1QgcmVxdWVzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL2ZpbGVzLycsXG4gICAgICAgIG9uRXJyb3IoKSB7fSxcbiAgICAgIH1cblxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uRXJyb3InKS5hbmQuY2FsbFRocm91Z2goKVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgY29uc3QgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzLycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG5cbiAgICAgIHVwbG9hZC5hYm9ydCgpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICBMb2NhdGlvbjogJy9maWxlcy9mb28nLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFt0ZXN0U3RhY2submV4dFJlcXVlc3QoKSwgd2FpdCgyMDApXSlcblxuICAgICAgZXhwZWN0KG9wdGlvbnMub25FcnJvcikubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZSgndGltZWQgb3V0JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXNldCB0aGUgYXR0ZW1wdCBjb3VudGVyIGlmIGFuIHVwbG9hZCBwcm9jZWVkcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL2ZpbGVzLycsXG4gICAgICAgIHJldHJ5RGVsYXlzOiBbMTBdLFxuICAgICAgICBvbkVycm9yKCkge30sXG4gICAgICAgIG9uU3VjY2Vzczogd2FpdGFibGVGdW5jdGlvbignb25TdWNjZXNzJyksXG4gICAgICB9XG4gICAgICBzcHlPbihvcHRpb25zLCAnb25FcnJvcicpXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzLycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICBMb2NhdGlvbjogJy9maWxlcy9mb28nLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAwLFxuICAgICAgICAgICdVcGxvYWQtTGVuZ3RoJzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDUsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogNTAwLFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnSEVBRCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDUsXG4gICAgICAgICAgJ1VwbG9hZC1MZW5ndGgnOiAxMSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTEsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICBhd2FpdCBvcHRpb25zLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG4gICAgICBleHBlY3Qob3B0aW9ucy5vbkVycm9yKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICBleHBlY3Qob3B0aW9ucy5vblN1Y2Nlc3MpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgIH0pXG4gIH0pXG59KVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGF4aW9zID0gcmVxdWlyZSgnYXhpb3MnKVxuY29uc3QgeyBnZXRCbG9iIH0gPSByZXF1aXJlKCcuL2hlbHBlcnMvdXRpbHMnKVxuY29uc3QgdHVzID0gcmVxdWlyZSgnLi4vLi4nKVxuXG4vLyBUZXN0IHRpbWVvdXQgZm9yIGVuZC10by1lbmQgdGVzdHMgd2hlbiB1cGxvYWRpbmcgdG8gcmVhbCBzZXJ2ZXIuXG5jb25zdCBFTkRfVE9fRU5EX1RJTUVPVVQgPSAyMCAqIDEwMDBcblxuZGVzY3JpYmUoJ3R1cycsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2VuZC10by1lbmQnLCAoKSA9PiB7XG4gICAgaXQoXG4gICAgICAnc2hvdWxkIHVwbG9hZCB0byBhIHJlYWwgdHVzIHNlcnZlcicsXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgZW5kcG9pbnQ6ICdodHRwczovL3R1c2QudHVzZGVtby5uZXQvZmlsZXMvJyxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgIG5vbmxhdGluOiAnc8WCb8WEY2UnLFxuICAgICAgICAgICAgICBudW1iZXI6IDEwMCxcbiAgICAgICAgICAgICAgZmlsZW5hbWU6ICdoZWxsby50eHQnLFxuICAgICAgICAgICAgICBmaWxldHlwZTogJ3RleHQvcGxhaW4nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uU3VjY2VzcygpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHVwbG9hZC51cmwpLnRvTWF0Y2goL15odHRwczpcXC9cXC90dXNkXFwudHVzZGVtb1xcLm5ldFxcL2ZpbGVzXFwvLylcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1VwbG9hZCBVUkw6JywgdXBsb2FkLnVybCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG5cbiAgICAgICAgICAgICAgcmVzb2x2ZSh1cGxvYWQpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25FcnJvcihlcnIpIHtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgICAgICB1cGxvYWQuc3RhcnQoKVxuICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKHZhbGlkYXRlVXBsb2FkQ29udGVudClcbiAgICAgICAgICAudGhlbigodXBsb2FkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkLmFib3J0KHRydWUpLnRoZW4oKCkgPT4gdXBsb2FkKVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4odmFsaWRhdGVVcGxvYWREZWxldGlvbilcbiAgICAgIH0sXG4gICAgICBFTkRfVE9fRU5EX1RJTUVPVVQsXG4gICAgKVxuXG4gICAgaXQoXG4gICAgICAnc2hvdWxkIHVwbG9hZCB0byBhIHJlYWwgdHVzIHNlcnZlciB3aXRoIGNyZWF0aW9uLXdpdGgtdXBsb2FkJyxcbiAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBlbmRwb2ludDogJ2h0dHBzOi8vdHVzZC50dXNkZW1vLm5ldC9maWxlcy8nLFxuICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgbm9ubGF0aW46ICdzxYJvxYRjZScsXG4gICAgICAgICAgICAgIG51bWJlcjogMTAwLFxuICAgICAgICAgICAgICBmaWxlbmFtZTogJ2hlbGxvLnR4dCcsXG4gICAgICAgICAgICAgIGZpbGV0eXBlOiAndGV4dC9wbGFpbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25TdWNjZXNzKCkge1xuICAgICAgICAgICAgICBleHBlY3QodXBsb2FkLnVybCkudG9NYXRjaCgvXmh0dHBzOlxcL1xcL3R1c2RcXC50dXNkZW1vXFwubmV0XFwvZmlsZXNcXC8vKVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXBsb2FkIFVSTDonLCB1cGxvYWQudXJsKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcblxuICAgICAgICAgICAgICByZXNvbHZlKHVwbG9hZClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkVycm9yKGVycikge1xuICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgICAgIHVwbG9hZC5zdGFydCgpXG4gICAgICAgIH0pLnRoZW4odmFsaWRhdGVVcGxvYWRDb250ZW50KVxuICAgICAgfSxcbiAgICAgIEVORF9UT19FTkRfVElNRU9VVCxcbiAgICApXG4gIH0pXG59KVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVVwbG9hZENvbnRlbnQodXBsb2FkKSB7XG4gIHJldHVybiBheGlvcy5nZXQodXBsb2FkLnVybCkudGhlbigocmVzKSA9PiB7XG4gICAgZXhwZWN0KHJlcy5zdGF0dXMpLnRvQmUoMjAwKVxuICAgIGV4cGVjdChyZXMuZGF0YSkudG9CZSgnaGVsbG8gd29ybGQnKVxuXG4gICAgcmV0dXJuIHZhbGlkYXRlVXBsb2FkTWV0YWRhdGEodXBsb2FkKVxuICB9KVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVVwbG9hZE1ldGFkYXRhKHVwbG9hZCkge1xuICByZXR1cm4gYXhpb3NcbiAgICAuaGVhZCh1cGxvYWQudXJsLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdUdXMtUmVzdW1hYmxlJzogJzEuMC4wJyxcbiAgICAgIH0sXG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSgyMDApXG4gICAgICBleHBlY3QocmVzLmRhdGEpLnRvQmUoJycpXG4gICAgICBleHBlY3QocmVzLmhlYWRlcnNbJ3R1cy1yZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcy5oZWFkZXJzWyd1cGxvYWQtb2Zmc2V0J10pLnRvQmUoJzExJylcbiAgICAgIGV4cGVjdChyZXMuaGVhZGVyc1sndXBsb2FkLWxlbmd0aCddKS50b0JlKCcxMScpXG5cbiAgICAgIC8vIFRoZSB2YWx1ZXMgaW4gdGhlIFVwbG9hZC1NZXRhZGF0YSBoZWFkZXIgbWF5IG5vdCBiZSBpbiB0aGUgc2FtZVxuICAgICAgLy8gb3JkZXIgYXMgd2Ugc3VibWl0dGVkIHRoZW0gKHRoZSBzcGVjaWZpY2F0aW9uIGRvZXMgbm90IHJlcXVpcmVcbiAgICAgIC8vIHRoYXQpLiBUaGVyZWZvcmUsIHdlIHNwbGl0IHRoZSB2YWx1ZXMgYW5kIHZlcmlmeSB0aGF0IGVhY2ggb25lXG4gICAgICAvLyBpcyBwcmVzZW50LlxuICAgICAgY29uc3QgbWV0YWRhdGFTdHIgPSByZXMuaGVhZGVyc1sndXBsb2FkLW1ldGFkYXRhJ11cbiAgICAgIGV4cGVjdChtZXRhZGF0YVN0cikudG9CZVRydXRoeSgpXG4gICAgICBjb25zdCBtZXRhZGF0YSA9IG1ldGFkYXRhU3RyLnNwbGl0KCcsJylcbiAgICAgIGV4cGVjdChtZXRhZGF0YSkudG9Db250YWluKCdmaWxlbmFtZSBhR1ZzYkc4dWRIaDAnKVxuICAgICAgZXhwZWN0KG1ldGFkYXRhKS50b0NvbnRhaW4oJ2ZpbGV0eXBlIGRHVjRkQzl3YkdGcGJnPT0nKVxuICAgICAgZXhwZWN0KG1ldGFkYXRhKS50b0NvbnRhaW4oJ25vbmxhdGluIGM4V0NiOFdFWTJVPScpXG4gICAgICBleHBlY3QobWV0YWRhdGEpLnRvQ29udGFpbignbnVtYmVyIE1UQXcnKVxuICAgICAgZXhwZWN0KG1ldGFkYXRhLmxlbmd0aCkudG9CZSg0KVxuXG4gICAgICByZXR1cm4gdXBsb2FkXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVVcGxvYWREZWxldGlvbih1cGxvYWQpIHtcbiAgcmV0dXJuIGF4aW9zXG4gICAgLmdldCh1cGxvYWQudXJsLCB7XG4gICAgICB2YWxpZGF0ZVN0YXR1czogKHN0YXR1cykgPT4gc3RhdHVzID09PSA0MDQsXG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICBleHBlY3QocmVzLnN0YXR1cykudG9CZSg0MDQpXG5cbiAgICAgIHJldHVybiB1cGxvYWRcbiAgICB9KVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgVGVzdEh0dHBTdGFjaywgd2FpdGFibGVGdW5jdGlvbiwgd2FpdCwgZ2V0QmxvYiB9ID0gcmVxdWlyZSgnLi9oZWxwZXJzL3V0aWxzJylcbmNvbnN0IHR1cyA9IHJlcXVpcmUoJy4uLy4uJylcblxuZGVzY3JpYmUoJ3R1cycsICgpID0+IHtcbiAgZGVzY3JpYmUoJ3BhcmFsbGVsIHVwbG9hZGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHRocm93IGlmIGluY29tcGF0aWJsZSBvcHRpb25zIGFyZSB1c2VkJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIHtcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwczovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgcGFyYWxsZWxVcGxvYWRzOiAyLFxuICAgICAgICB1cGxvYWRVcmw6ICdmb28nLFxuICAgICAgfSlcbiAgICAgIGV4cGVjdCh1cGxvYWQuc3RhcnQuYmluZCh1cGxvYWQpKS50b1Rocm93RXJyb3IoXG4gICAgICAgICd0dXM6IGNhbm5vdCB1c2UgdGhlIHVwbG9hZFVybCBvcHRpb24gd2hlbiBwYXJhbGxlbFVwbG9hZHMgaXMgZW5hYmxlZCcsXG4gICAgICApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgaWYgYHBhcmFsbGVsVXBsb2FkQm91bmRhcmllc2AgaXMgcGFzc2VkIHdpdGhvdXQgYHBhcmFsbGVsVXBsb2Fkc2AnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwge1xuICAgICAgICBlbmRwb2ludDogJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICBwYXJhbGxlbFVwbG9hZEJvdW5kYXJpZXM6IFt7IHN0YXJ0OiAwLCBlbmQ6IDIgfV0sXG4gICAgICB9KVxuICAgICAgZXhwZWN0KHVwbG9hZC5zdGFydC5iaW5kKHVwbG9hZCkpLnRvVGhyb3dFcnJvcihcbiAgICAgICAgJ3R1czogY2Fubm90IHVzZSB0aGUgYHBhcmFsbGVsVXBsb2FkQm91bmRhcmllc2Agb3B0aW9uIHdoZW4gYHBhcmFsbGVsVXBsb2Fkc2AgaXMgZGlzYWJsZWQnLFxuICAgICAgKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGlmIGBwYXJhbGxlbFVwbG9hZEJvdW5kYXJpZXNgIGlzIG5vdCB0aGUgc2FtZSBsZW5ndGggYXMgdGhlIHZhbHVlIG9mIGBwYXJhbGxlbFVwbG9hZHNgJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIHtcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwczovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgcGFyYWxsZWxVcGxvYWRzOiAzLFxuICAgICAgICBwYXJhbGxlbFVwbG9hZEJvdW5kYXJpZXM6IFt7IHN0YXJ0OiAwLCBlbmQ6IDIgfV0sXG4gICAgICB9KVxuICAgICAgZXhwZWN0KHVwbG9hZC5zdGFydC5iaW5kKHVwbG9hZCkpLnRvVGhyb3dFcnJvcihcbiAgICAgICAgJ3R1czogdGhlIGBwYXJhbGxlbFVwbG9hZEJvdW5kYXJpZXNgIG11c3QgaGF2ZSB0aGUgc2FtZSBsZW5ndGggYXMgdGhlIHZhbHVlIG9mIGBwYXJhbGxlbFVwbG9hZHNgJyxcbiAgICAgIClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzcGxpdCBhIGZpbGUgaW50byBtdWx0aXBsZSBwYXJ0cyBhbmQgY3JlYXRlIGFuIHVwbG9hZCBmb3IgZWFjaCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcblxuICAgICAgY29uc3QgdGVzdFVybFN0b3JhZ2UgPSB7XG4gICAgICAgIGFkZFVwbG9hZDogKGZpbmdlcnByaW50LCB1cGxvYWQpID0+IHtcbiAgICAgICAgICBleHBlY3QoZmluZ2VycHJpbnQpLnRvQmUoJ2ZpbmdlcnByaW50ZWQnKVxuICAgICAgICAgIGV4cGVjdCh1cGxvYWQudXBsb2FkVXJsKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QodXBsb2FkLnNpemUpLnRvQmUoMTEpXG4gICAgICAgICAgZXhwZWN0KHVwbG9hZC5wYXJhbGxlbFVwbG9hZFVybHMpLnRvRXF1YWwoW1xuICAgICAgICAgICAgJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMScsXG4gICAgICAgICAgICAnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQyJyxcbiAgICAgICAgICBdKVxuXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgndHVzOjpmaW5nZXJwcmludGVkOjoxMzM3JylcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlVXBsb2FkOiAodXJsU3RvcmFnZUtleSkgPT4ge1xuICAgICAgICAgIGV4cGVjdCh1cmxTdG9yYWdlS2V5KS50b0JlKCd0dXM6OmZpbmdlcnByaW50ZWQ6OjEzMzcnKVxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9LFxuICAgICAgfVxuICAgICAgc3B5T24odGVzdFVybFN0b3JhZ2UsICdyZW1vdmVVcGxvYWQnKS5hbmQuY2FsbFRocm91Z2goKVxuICAgICAgc3B5T24odGVzdFVybFN0b3JhZ2UsICdhZGRVcGxvYWQnKS5hbmQuY2FsbFRocm91Z2goKVxuXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIHVybFN0b3JhZ2U6IHRlc3RVcmxTdG9yYWdlLFxuICAgICAgICBzdG9yZUZpbmdlcnByaW50Rm9yUmVzdW1pbmc6IHRydWUsXG4gICAgICAgIHJlbW92ZUZpbmdlcnByaW50T25TdWNjZXNzOiB0cnVlLFxuICAgICAgICBwYXJhbGxlbFVwbG9hZHM6IDIsXG4gICAgICAgIHJldHJ5RGVsYXlzOiBbMTBdLFxuICAgICAgICBlbmRwb2ludDogJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQ3VzdG9tOiAnYmxhcmdoJyxcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBmb286ICdoZWxsbycsXG4gICAgICAgIH0sXG4gICAgICAgIG9uUHJvZ3Jlc3MoKSB7fSxcbiAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCksXG4gICAgICAgIGZpbmdlcnByaW50OiAoKSA9PiBQcm9taXNlLnJlc29sdmUoJ2ZpbmdlcnByaW50ZWQnKSxcbiAgICAgIH1cbiAgICAgIHNweU9uKG9wdGlvbnMsICdvblByb2dyZXNzJylcblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGxldCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVycy5DdXN0b20pLnRvQmUoJ2JsYXJnaCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1MZW5ndGgnXSkudG9CZSg1KVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUNvbmNhdCddKS50b0JlKCdwYXJ0aWFsJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1NZXRhZGF0YSddKS50b0JlVW5kZWZpbmVkKClcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQxJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzLkN1c3RvbSkudG9CZSgnYmxhcmdoJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDYpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtQ29uY2F0J10pLnRvQmUoJ3BhcnRpYWwnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU1ldGFkYXRhJ10pLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDInLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcblxuICAgICAgLy8gQXNzZXJ0IHRoYXQgdGhlIFVSTHMgaGF2ZSBiZWVuIHN0b3JlZC5cbiAgICAgIGV4cGVjdCh0ZXN0VXJsU3RvcmFnZS5hZGRVcGxvYWQpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQxJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzLkN1c3RvbSkudG9CZSgnYmxhcmdoJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDApXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICBleHBlY3QocmVxLmJvZHkuc2l6ZSkudG9CZSg1KVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA1LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDInKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnMuQ3VzdG9tKS50b0JlKCdibGFyZ2gnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtT2Zmc2V0J10pLnRvQmUoMClcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddKS50b0JlKCdhcHBsaWNhdGlvbi9vZmZzZXQrb2N0ZXQtc3RyZWFtJylcbiAgICAgIGV4cGVjdChyZXEuYm9keS5zaXplKS50b0JlKDYpXG5cbiAgICAgIC8vIFJldHVybiBhbiBlcnJvciB0byBlbnN1cmUgdGhhdCB0aGUgaW5kaXZpZHVhbCBwYXJ0aWFsIHVwbG9hZCBpcyBwcm9wZXJseSByZXRyaWVkLlxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMicpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnSEVBRCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLUxlbmd0aCc6IDExLFxuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMCxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQyJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzLkN1c3RvbSkudG9CZSgnYmxhcmdoJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDApXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICBleHBlY3QocmVxLmJvZHkuc2l6ZSkudG9CZSg2KVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA2LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnMuQ3VzdG9tKS50b0JlKCdibGFyZ2gnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTGVuZ3RoJ10pLnRvQmVVbmRlZmluZWQoKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUNvbmNhdCddKS50b0JlKFxuICAgICAgICAnZmluYWw7aHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQxIGh0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMicsXG4gICAgICApXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTWV0YWRhdGEnXSkudG9CZSgnZm9vIGFHVnNiRzg9JylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQzJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIGF3YWl0IG9wdGlvbnMub25TdWNjZXNzLnRvQmVDYWxsZWRcblxuICAgICAgZXhwZWN0KHVwbG9hZC51cmwpLnRvQmUoJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMycpXG4gICAgICBleHBlY3Qob3B0aW9ucy5vblByb2dyZXNzKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCg1LCAxMSlcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDExLCAxMSlcbiAgICAgIGV4cGVjdCh0ZXN0VXJsU3RvcmFnZS5yZW1vdmVVcGxvYWQpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNwbGl0IGEgZmlsZSBpbnRvIG11bHRpcGxlIHBhcnRzIGJhc2VkIG9uIGN1c3RvbSBgcGFyYWxsZWxVcGxvYWRCb3VuZGFyaWVzYCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcblxuICAgICAgY29uc3QgcGFyYWxsZWxVcGxvYWRCb3VuZGFyaWVzID0gW1xuICAgICAgICB7IHN0YXJ0OiAwLCBlbmQ6IDEgfSxcbiAgICAgICAgeyBzdGFydDogMSwgZW5kOiAxMSB9LFxuICAgICAgXVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBwYXJhbGxlbFVwbG9hZHM6IDIsXG4gICAgICAgIHBhcmFsbGVsVXBsb2FkQm91bmRhcmllcyxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwczovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCksXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDEpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtQ29uY2F0J10pLnRvQmUoJ3BhcnRpYWwnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDEnLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDEwKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUNvbmNhdCddKS50b0JlKCdwYXJ0aWFsJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQyJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG5cbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDEnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDApXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICBleHBlY3QocmVxLmJvZHkuc2l6ZSkudG9CZSgxKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAxLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDInKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDApXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICBleHBlY3QocmVxLmJvZHkuc2l6ZSkudG9CZSgxMClcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtTGVuZ3RoJzogMTEsXG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiAwLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDInKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BBVENIJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDApXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgnYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbScpXG4gICAgICBleHBlY3QocmVxLmJvZHkuc2l6ZSkudG9CZSgxMClcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMTAsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ1BPU1QnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydVcGxvYWQtTGVuZ3RoJ10pLnRvQmVVbmRlZmluZWQoKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUNvbmNhdCddKS50b0JlKFxuICAgICAgICAnZmluYWw7aHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQxIGh0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMicsXG4gICAgICApXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICBMb2NhdGlvbjogJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMycsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICBhd2FpdCBvcHRpb25zLm9uU3VjY2Vzcy50b0JlQ2FsbGVkXG4gICAgICBleHBlY3QodXBsb2FkLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQzJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBlbWl0IGVycm9yIGZyb20gYSBwYXJ0aWFsIHVwbG9hZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgcGFyYWxsZWxVcGxvYWRzOiAyLFxuICAgICAgICByZXRyeURlbGF5czogbnVsbCxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwczovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgb25FcnJvcjogd2FpdGFibGVGdW5jdGlvbignb25FcnJvcicpLFxuICAgICAgfVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgY29uc3QgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlKDUpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogNTAwLFxuICAgICAgfSlcblxuICAgICAgY29uc3QgZXJyID0gYXdhaXQgb3B0aW9ucy5vbkVycm9yLnRvQmVDYWxsZWRcbiAgICAgIGV4cGVjdChlcnIubWVzc2FnZSkudG9CZShcbiAgICAgICAgJ3R1czogdW5leHBlY3RlZCByZXNwb25zZSB3aGlsZSBjcmVhdGluZyB1cGxvYWQsIG9yaWdpbmF0ZWQgZnJvbSByZXF1ZXN0IChtZXRob2Q6IFBPU1QsIHVybDogaHR0cHM6Ly90dXMuaW8vdXBsb2FkcywgcmVzcG9uc2UgY29kZTogNTAwLCByZXNwb25zZSB0ZXh0OiAsIHJlcXVlc3QgaWQ6IG4vYSknLFxuICAgICAgKVxuICAgICAgZXhwZWN0KGVyci5vcmlnaW5hbFJlcXVlc3QpLnRvQmUocmVxKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlc3VtZSB0aGUgcGFydGlhbCB1cGxvYWRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRlc3RIdHRwU3RhY2soKVxuICAgICAgY29uc3QgZmlsZSA9IGdldEJsb2IoJ2hlbGxvIHdvcmxkJylcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICAvLyBUaGUgY2xpZW50IHNob3VsZCByZXN1bWUgdGhlIHBhcmFsbGVsIHVwbG9hZHMsIGV2ZW4gaWYgaXQgaXMgbm90XG4gICAgICAgIC8vIGNvbmZpZ3VyZWQgZm9yIG5ldyB1cGxvYWRzLlxuICAgICAgICBwYXJhbGxlbFVwbG9hZHM6IDEsXG4gICAgICAgIGVuZHBvaW50OiAnaHR0cHM6Ly90dXMuaW8vdXBsb2FkcycsXG4gICAgICAgIG9uUHJvZ3Jlc3MoKSB7fSxcbiAgICAgICAgb25TdWNjZXNzOiB3YWl0YWJsZUZ1bmN0aW9uKCksXG4gICAgICB9XG4gICAgICBzcHlPbihvcHRpb25zLCAnb25Qcm9ncmVzcycpXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG5cbiAgICAgIHVwbG9hZC5yZXN1bWVGcm9tUHJldmlvdXNVcGxvYWQoe1xuICAgICAgICB1cmxTdG9yYWdlS2V5OiAndHVzOjpmaW5nZXJwcmludDo6MTMzNycsXG4gICAgICAgIHBhcmFsbGVsVXBsb2FkVXJsczogWydodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDEnLCAnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQyJ10sXG4gICAgICB9KVxuXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDEnKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0hFQUQnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1MZW5ndGgnOiA1LFxuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogMixcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQyJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdIRUFEJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtTGVuZ3RoJzogNixcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDAsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMScpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuICAgICAgZXhwZWN0KHJlcS5ib2R5LnNpemUpLnRvQmUoMylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtT2Zmc2V0JzogNSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQyJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICBleHBlY3QocmVxLmJvZHkuc2l6ZSkudG9CZSg2KVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA2LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1Db25jYXQnXSkudG9CZShcbiAgICAgICAgJ2ZpbmFsO2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMSBodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDInLFxuICAgICAgKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDMnLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuXG4gICAgICBleHBlY3QodXBsb2FkLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQzJylcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDUsIDExKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25Qcm9ncmVzcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoMTEsIDExKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGFib3J0IGFsbCBwYXJ0aWFsIHVwbG9hZHMgYW5kIHJlc3VtZSBmcm9tIHRoZW0nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIHBhcmFsbGVsVXBsb2FkczogMixcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwczovL3R1cy5pby91cGxvYWRzJyxcbiAgICAgICAgb25Qcm9ncmVzcygpIHt9LFxuICAgICAgICBvblN1Y2Nlc3M6IHdhaXRhYmxlRnVuY3Rpb24oKSxcbiAgICAgICAgZmluZ2VycHJpbnQ6ICgpID0+IFByb21pc2UucmVzb2x2ZSgnZmluZ2VycHJpbnRlZCcpLFxuICAgICAgfVxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uUHJvZ3Jlc3MnKVxuXG4gICAgICBjb25zdCB1cGxvYWQgPSBuZXcgdHVzLlVwbG9hZChmaWxlLCBvcHRpb25zKVxuICAgICAgdXBsb2FkLnN0YXJ0KClcblxuICAgICAgbGV0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1MZW5ndGgnXSkudG9CZSg1KVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUNvbmNhdCddKS50b0JlKCdwYXJ0aWFsJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1NZXRhZGF0YSddKS50b0JlVW5kZWZpbmVkKClcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQxJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2FkcycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG4gICAgICBleHBlY3QocmVxLnJlcXVlc3RIZWFkZXJzWydUdXMtUmVzdW1hYmxlJ10pLnRvQmUoJzEuMC4wJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1MZW5ndGgnXSkudG9CZSg2KVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUNvbmNhdCddKS50b0JlKCdwYXJ0aWFsJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1NZXRhZGF0YSddKS50b0JlVW5kZWZpbmVkKClcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQyJyxcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IHJlcTEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcTEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDEnKVxuICAgICAgZXhwZWN0KHJlcTEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICBleHBlY3QocmVxMS5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxMS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDApXG4gICAgICBleHBlY3QocmVxMS5yZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL29mZnNldCtvY3RldC1zdHJlYW0nKVxuICAgICAgZXhwZWN0KHJlcTEuYm9keS5zaXplKS50b0JlKDUpXG5cbiAgICAgIGNvbnN0IHJlcTIgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcTIudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDInKVxuICAgICAgZXhwZWN0KHJlcTIubWV0aG9kKS50b0JlKCdQQVRDSCcpXG4gICAgICBleHBlY3QocmVxMi5yZXF1ZXN0SGVhZGVyc1snVHVzLVJlc3VtYWJsZSddKS50b0JlKCcxLjAuMCcpXG4gICAgICBleHBlY3QocmVxMi5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLU9mZnNldCddKS50b0JlKDApXG4gICAgICBleHBlY3QocmVxMi5yZXF1ZXN0SGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL29mZnNldCtvY3RldC1zdHJlYW0nKVxuICAgICAgZXhwZWN0KHJlcTIuYm9keS5zaXplKS50b0JlKDYpXG5cbiAgICAgIHVwbG9hZC5hYm9ydCgpXG5cbiAgICAgIHJlcTEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA1LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxMi5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDYsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICAvLyBObyBmdXJ0aGVyIHJlcXVlc3RzIHNob3VsZCBiZSBzZW50LlxuICAgICAgY29uc3QgcmVxUHJvbWlzZSA9IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW3JlcVByb21pc2UsIHdhaXQoMTAwKV0pXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKCd0aW1lZCBvdXQnKVxuXG4gICAgICAvLyBSZXN0YXJ0IHRoZSB1cGxvYWRcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIC8vIFJldXNlIHRoZSBwcm9taXNlIGZyb20gYmVmb3JlIGFzIGl0IGlzIG5vdCBjYW5jZWxsZWQuXG4gICAgICByZXEgPSBhd2FpdCByZXFQcm9taXNlXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQxJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdIRUFEJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICdVcGxvYWQtTGVuZ3RoJzogNSxcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDUsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMicpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnSEVBRCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLUxlbmd0aCc6IDYsXG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA2LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwczovL3R1cy5pby91cGxvYWRzJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1R1cy1SZXN1bWFibGUnXSkudG9CZSgnMS4wLjAnKVxuICAgICAgZXhwZWN0KHJlcS5yZXF1ZXN0SGVhZGVyc1snVXBsb2FkLUxlbmd0aCddKS50b0JlVW5kZWZpbmVkKClcbiAgICAgIGV4cGVjdChyZXEucmVxdWVzdEhlYWRlcnNbJ1VwbG9hZC1Db25jYXQnXSkudG9CZShcbiAgICAgICAgJ2ZpbmFsO2h0dHBzOi8vdHVzLmlvL3VwbG9hZHMvdXBsb2FkMSBodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDInLFxuICAgICAgKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwMSxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgTG9jYXRpb246ICdodHRwczovL3R1cy5pby91cGxvYWRzL3VwbG9hZDMnLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgb3B0aW9ucy5vblN1Y2Nlc3MudG9CZUNhbGxlZFxuXG4gICAgICBleHBlY3QodXBsb2FkLnVybCkudG9CZSgnaHR0cHM6Ly90dXMuaW8vdXBsb2Fkcy91cGxvYWQzJylcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uUHJvZ3Jlc3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDUsIDExKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25Qcm9ncmVzcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoMTEsIDExKVxuICAgIH0pXG4gIH0pXG59KVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgVGVzdEh0dHBTdGFjaywgZ2V0QmxvYiB9ID0gcmVxdWlyZSgnLi9oZWxwZXJzL3V0aWxzJylcbmNvbnN0IHR1cyA9IHJlcXVpcmUoJy4uLy4uJylcblxuZGVzY3JpYmUoJ3R1cycsICgpID0+IHtcbiAgZGVzY3JpYmUoJ3Rlcm1pbmF0ZSB1cGxvYWQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCB0ZXJtaW5hdGUgdXBsb2FkIHdoZW4gYWJvcnQgaXMgY2FsbGVkIHdpdGggdHJ1ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGxldCBhYm9ydFByb21pc2VcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IGZpbGUgPSBnZXRCbG9iKCdoZWxsbyB3b3JsZCcpXG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBodHRwU3RhY2s6IHRlc3RTdGFjayxcbiAgICAgICAgZW5kcG9pbnQ6ICdodHRwOi8vdHVzLmlvL2ZpbGVzLycsXG4gICAgICAgIGNodW5rU2l6ZTogNSxcbiAgICAgICAgb25DaHVua0NvbXBsZXRlKCkge1xuICAgICAgICAgIGFib3J0UHJvbWlzZSA9IHVwbG9hZC5hYm9ydCh0cnVlKVxuICAgICAgICB9LFxuICAgICAgfVxuXG4gICAgICBzcHlPbihvcHRpb25zLCAnb25DaHVua0NvbXBsZXRlJykuYW5kLmNhbGxUaHJvdWdoKClcblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZSwgb3B0aW9ucylcbiAgICAgIHVwbG9hZC5zdGFydCgpXG5cbiAgICAgIGxldCByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQT1NUJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDEsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgIExvY2F0aW9uOiAnL2ZpbGVzL2ZvbycsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdQQVRDSCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAnVXBsb2FkLU9mZnNldCc6IDUsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdERUxFVEUnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdChvcHRpb25zLm9uQ2h1bmtDb21wbGV0ZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICBhd2FpdCBhYm9ydFByb21pc2VcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXRyeSB0ZXJtaW5hdGUgd2hlbiBhbiBlcnJvciBpcyByZXR1cm5lZCBvbiBmaXJzdCB0cnknLCBhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgYWJvcnRQcm9taXNlXG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGVzdEh0dHBTdGFjaygpXG4gICAgICBjb25zdCBmaWxlID0gZ2V0QmxvYignaGVsbG8gd29ybGQnKVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaHR0cFN0YWNrOiB0ZXN0U3RhY2ssXG4gICAgICAgIGVuZHBvaW50OiAnaHR0cDovL3R1cy5pby9maWxlcy8nLFxuICAgICAgICBjaHVua1NpemU6IDUsXG4gICAgICAgIHJldHJ5RGVsYXlzOiBbMTAsIDEwLCAxMF0sXG4gICAgICAgIG9uQ2h1bmtDb21wbGV0ZSgpIHtcbiAgICAgICAgICBhYm9ydFByb21pc2UgPSB1cGxvYWQuYWJvcnQodHJ1ZSlcbiAgICAgICAgfSxcbiAgICAgIH1cblxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uQ2h1bmtDb21wbGV0ZScpLmFuZC5jYWxsVGhyb3VnaCgpXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUsIG9wdGlvbnMpXG4gICAgICB1cGxvYWQuc3RhcnQoKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzLycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUE9TVCcpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogMjAxLFxuICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICBMb2NhdGlvbjogJy9maWxlcy9mb28nLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnUEFUQ0gnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICAgJ1VwbG9hZC1PZmZzZXQnOiA1LFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnREVMRVRFJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiA0MjMsXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdERUxFVEUnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgIH0pXG5cbiAgICAgIGF3YWl0IGFib3J0UHJvbWlzZVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25DaHVua0NvbXBsZXRlKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzdG9wIHJldHJ5aW5nIHdoZW4gYWxsIGRlbGF5cyBhcmUgdXNlZCB1cCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICByZXRyeURlbGF5czogWzEwLCAxMF0sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlcm1pbmF0ZVByb21pc2UgPSB0dXMuVXBsb2FkLnRlcm1pbmF0ZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nLCBvcHRpb25zKVxuXG4gICAgICBsZXQgcmVxID0gYXdhaXQgdGVzdFN0YWNrLm5leHRSZXF1ZXN0KClcbiAgICAgIGV4cGVjdChyZXEudXJsKS50b0JlKCdodHRwOi8vdHVzLmlvL2ZpbGVzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnREVMRVRFJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICB9KVxuXG4gICAgICByZXEgPSBhd2FpdCB0ZXN0U3RhY2submV4dFJlcXVlc3QoKVxuICAgICAgZXhwZWN0KHJlcS51cmwpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vZmlsZXMvZm9vJylcbiAgICAgIGV4cGVjdChyZXEubWV0aG9kKS50b0JlKCdERUxFVEUnKVxuXG4gICAgICByZXEucmVzcG9uZFdpdGgoe1xuICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgIH0pXG5cbiAgICAgIHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby9maWxlcy9mb28nKVxuICAgICAgZXhwZWN0KHJlcS5tZXRob2QpLnRvQmUoJ0RFTEVURScpXG5cbiAgICAgIHJlcS5yZXNwb25kV2l0aCh7XG4gICAgICAgIHN0YXR1czogNTAwLFxuICAgICAgfSlcblxuICAgICAgYXdhaXQgZXhwZWN0QXN5bmModGVybWluYXRlUHJvbWlzZSkudG9CZVJlamVjdGVkV2l0aEVycm9yKFxuICAgICAgICAvdHVzOiB1bmV4cGVjdGVkIHJlc3BvbnNlIHdoaWxlIHRlcm1pbmF0aW5nIHVwbG9hZC8sXG4gICAgICApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW52b2tlIHRoZSByZXF1ZXN0IGFuZCByZXNwb25zZSBQcm9taXNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUZXN0SHR0cFN0YWNrKClcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGh0dHBTdGFjazogdGVzdFN0YWNrLFxuICAgICAgICBvbkJlZm9yZVJlcXVlc3QocmVxKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QocmVxLmdldFVSTCgpKS50b0JlKCdodHRwOi8vdHVzLmlvL3VwbG9hZHMvZm9vJylcbiAgICAgICAgICAgIGV4cGVjdChyZXEuZ2V0TWV0aG9kKCkpLnRvQmUoJ0RFTEVURScpXG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICBvbkFmdGVyUmVzcG9uc2UocmVxLCByZXMpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGV4cGVjdChyZXEuZ2V0VVJMKCkpLnRvQmUoJ2h0dHA6Ly90dXMuaW8vdXBsb2Fkcy9mb28nKVxuICAgICAgICAgICAgZXhwZWN0KHJlcS5nZXRNZXRob2QoKSkudG9CZSgnREVMRVRFJylcbiAgICAgICAgICAgIGV4cGVjdChyZXMuZ2V0U3RhdHVzKCkpLnRvQmUoMjA0KVxuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICAgIHNweU9uKG9wdGlvbnMsICdvbkJlZm9yZVJlcXVlc3QnKVxuICAgICAgc3B5T24ob3B0aW9ucywgJ29uQWZ0ZXJSZXNwb25zZScpXG5cbiAgICAgIGNvbnN0IHRlcm1pbmF0ZVByb21pc2UgPSB0dXMuVXBsb2FkLnRlcm1pbmF0ZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2ZvbycsIG9wdGlvbnMpXG5cbiAgICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRlc3RTdGFjay5uZXh0UmVxdWVzdCgpXG4gICAgICBleHBlY3QocmVxLnVybCkudG9CZSgnaHR0cDovL3R1cy5pby91cGxvYWRzL2ZvbycpXG4gICAgICBleHBlY3QocmVxLm1ldGhvZCkudG9CZSgnREVMRVRFJylcblxuICAgICAgcmVxLnJlc3BvbmRXaXRoKHtcbiAgICAgICAgc3RhdHVzOiAyMDQsXG4gICAgICB9KVxuXG4gICAgICBhd2FpdCBleHBlY3RBc3luYyh0ZXJtaW5hdGVQcm9taXNlKS50b0JlUmVzb2x2ZWQoKVxuICAgICAgZXhwZWN0KG9wdGlvbnMub25CZWZvcmVSZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgIGV4cGVjdChvcHRpb25zLm9uQWZ0ZXJSZXNwb25zZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=
