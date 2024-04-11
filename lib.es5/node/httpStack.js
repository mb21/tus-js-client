"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var http = _interopRequireWildcard(require("http"));
var https = _interopRequireWildcard(require("https"));
var _url = require("url");
var _stream = require("stream");
var _lodash = _interopRequireDefault(require("lodash.throttle"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable max-classes-per-file, node/no-deprecated-api */
// The url.parse method is superseeded by the url.URL constructor,
// but it is still included in Node.js

class NodeHttpStack {
  constructor() {
    let requestOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this._requestOptions = requestOptions;
  }
  createRequest(method, url) {
    return new Request(method, url, this._requestOptions);
  }
  getName() {
    return 'NodeHttpStack';
  }
}
exports.default = NodeHttpStack;
class Request {
  constructor(method, url, options) {
    this._method = method;
    this._url = url;
    this._headers = {};
    this._request = null;
    this._progressHandler = () => {};
    this._requestOptions = options || {};
  }
  getMethod() {
    return this._method;
  }
  getURL() {
    return this._url;
  }
  setHeader(header, value) {
    this._headers[header] = value;
  }
  getHeader(header) {
    return this._headers[header];
  }
  setProgressHandler(progressHandler) {
    this._progressHandler = progressHandler;
  }
  send() {
    let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    return new Promise((resolve, reject) => {
      const options = {
        ...(0, _url.parse)(this._url),
        ...this._requestOptions,
        method: this._method,
        headers: {
          ...(this._requestOptions.headers || {}),
          ...this._headers
        }
      };
      if (body && body.size) {
        options.headers['Content-Length'] = body.size;
      }
      const httpModule = options.protocol === 'https:' ? https : http;
      this._request = httpModule.request(options);
      const req = this._request;
      req.on('response', res => {
        const resChunks = [];
        res.on('data', data => {
          resChunks.push(data);
        });
        res.on('end', () => {
          const responseText = Buffer.concat(resChunks).toString('utf8');
          resolve(new Response(res, responseText));
        });
      });
      req.on('error', err => {
        reject(err);
      });
      if (body instanceof _stream.Readable) {
        // Readable stream are piped through a PassThrough instance, which
        // counts the number of bytes passed through. This is used, for example,
        // when an fs.ReadStream is provided to tus-js-client.
        body.pipe(new ProgressEmitter(this._progressHandler)).pipe(req);
      } else if (body instanceof Uint8Array) {
        // For Buffers and Uint8Arrays (in Node.js all buffers are instances of Uint8Array),
        // we write chunks of the buffer to the stream and use that to track the progress.
        // This is used when either a Buffer or a normal readable stream is provided
        // to tus-js-client.
        writeBufferToStreamWithProgress(req, body, this._progressHandler);
      } else {
        req.end(body);
      }
    });
  }
  abort() {
    if (this._request !== null) this._request.abort();
    return Promise.resolve();
  }
  getUnderlyingObject() {
    return this._request;
  }
}
class Response {
  constructor(res, body) {
    this._response = res;
    this._body = body;
  }
  getStatus() {
    return this._response.statusCode;
  }
  getHeader(header) {
    return this._response.headers[header.toLowerCase()];
  }
  getBody() {
    return this._body;
  }
  getUnderlyingObject() {
    return this._response;
  }
}

// ProgressEmitter is a simple PassThrough-style transform stream which keeps
// track of the number of bytes which have been piped through it and will
// invoke the `onprogress` function whenever new number are available.
class ProgressEmitter extends _stream.Transform {
  constructor(onprogress) {
    super();

    // The _onprogress property will be invoked, whenever a chunk is piped
    // through this transformer. Since chunks are usually quite small (64kb),
    // these calls can occur frequently, especially when you have a good
    // connection to the remote server. Therefore, we are throtteling them to
    // prevent accessive function calls.
    this._onprogress = (0, _lodash.default)(onprogress, 100, {
      leading: true,
      trailing: false
    });
    this._position = 0;
  }
  _transform(chunk, encoding, callback) {
    this._position += chunk.length;
    this._onprogress(this._position);
    callback(null, chunk);
  }
}

// writeBufferToStreamWithProgress writes chunks from `source` (either a
// Buffer or Uint8Array) to the readable stream `stream`.
// The size of the chunk depends on the stream's highWaterMark to fill the
// stream's internal buffer as best as possible.
// If the internal buffer is full, the callback `onprogress` will be invoked
// to notify about the write progress. Writing will be resumed once the internal
// buffer is empty, as indicated by the emitted `drain` event.
// See https://nodejs.org/docs/latest/api/stream.html#buffering for more details
// on the buffering behavior of streams.
const writeBufferToStreamWithProgress = (stream, source, onprogress) => {
  onprogress = (0, _lodash.default)(onprogress, 100, {
    leading: true,
    trailing: false
  });
  let offset = 0;
  function writeNextChunk() {
    // Take at most the amount of bytes from highWaterMark. This should fill the streams
    // internal buffer already.
    const chunkSize = Math.min(stream.writableHighWaterMark, source.length - offset);

    // Note: We use subarray instead of slice because it works without copying data for
    // Buffers and Uint8Arrays.
    const chunk = source.subarray(offset, offset + chunkSize);
    offset += chunk.length;

    // `write` returns true if the internal buffer is not full and we should write more.
    // If the stream is destroyed because the request is aborted, it will return false
    // and no 'drain' event is emitted, so won't continue writing data.
    const canContinue = stream.write(chunk);
    if (!canContinue) {
      // If the buffer is full, wait for the 'drain' event to write more data.
      stream.once('drain', writeNextChunk);
      onprogress(offset);
    } else if (offset < source.length) {
      // If there's still data to write and the buffer is not full, write next chunk.
      writeNextChunk();
    } else {
      // If all data has been written, close the stream if needed, and emit a 'finish' event.
      stream.end();
    }
  }

  // Start writing the first chunk.
  writeNextChunk();
};