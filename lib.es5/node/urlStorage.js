"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canStoreURLs = exports.FileUrlStorage = void 0;
var _fs = require("fs");
var lockfile = _interopRequireWildcard(require("proper-lockfile"));
var _combineErrors = _interopRequireDefault(require("combine-errors"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint no-unused-vars: 0 */

const canStoreURLs = exports.canStoreURLs = true;
class FileUrlStorage {
  constructor(filePath) {
    this.path = filePath;
  }
  findAllUploads() {
    return new Promise((resolve, reject) => {
      this._getItems('tus::', (err, results) => {
        if (err) reject(err);else resolve(results);
      });
    });
  }
  findUploadsByFingerprint(fingerprint) {
    return new Promise((resolve, reject) => {
      this._getItems(`tus::${fingerprint}`, (err, results) => {
        if (err) reject(err);else resolve(results);
      });
    });
  }
  removeUpload(urlStorageKey) {
    return new Promise((resolve, reject) => {
      this._removeItem(urlStorageKey, err => {
        if (err) reject(err);else resolve();
      });
    });
  }
  addUpload(fingerprint, upload) {
    const id = Math.round(Math.random() * 1e12);
    const key = `tus::${fingerprint}::${id}`;
    return new Promise((resolve, reject) => {
      this._setItem(key, upload, err => {
        if (err) reject(err);else resolve(key);
      });
    });
  }
  _setItem(key, value, cb) {
    lockfile.lock(this.path, this._lockfileOptions()).then(release => {
      cb = this._releaseAndCb(release, cb);
      this._getData((err, data) => {
        if (err) {
          cb(err);
          return;
        }
        data[key] = value;
        this._writeData(data, err2 => cb(err2));
      });
    }).catch(cb);
  }
  _getItems(prefix, cb) {
    this._getData((err, data) => {
      if (err) {
        cb(err);
        return;
      }
      const results = Object.keys(data).filter(key => key.startsWith(prefix)).map(key => {
        const obj = data[key];
        obj.urlStorageKey = key;
        return obj;
      });
      cb(null, results);
    });
  }
  _removeItem(key, cb) {
    lockfile.lock(this.path, this._lockfileOptions()).then(release => {
      cb = this._releaseAndCb(release, cb);
      this._getData((err, data) => {
        if (err) {
          cb(err);
          return;
        }
        delete data[key];
        this._writeData(data, err2 => cb(err2));
      });
    }).catch(cb);
  }
  _lockfileOptions() {
    return {
      realpath: false,
      retries: {
        retries: 5,
        minTimeout: 20
      }
    };
  }
  _releaseAndCb(release, cb) {
    return err => {
      if (err) {
        release().then(() => cb(err)).catch(releaseErr => cb((0, _combineErrors.default)([err, releaseErr])));
        return;
      }
      release().then(cb).catch(cb);
    };
  }
  _writeData(data, cb) {
    const opts = {
      encoding: 'utf8',
      mode: 0o660,
      flag: 'w'
    };
    (0, _fs.writeFile)(this.path, JSON.stringify(data), opts, err => cb(err));
  }
  _getData(cb) {
    (0, _fs.readFile)(this.path, 'utf8', (err, data) => {
      if (err) {
        // return empty data if file does not exist
        if (err.code === 'ENOENT') cb(null, {});else cb(err);
        return;
      }
      try {
        data = !data.trim().length ? {} : JSON.parse(data);
      } catch (error) {
        cb(error);
        return;
      }
      cb(null, data);
    });
  }
}
exports.FileUrlStorage = FileUrlStorage;