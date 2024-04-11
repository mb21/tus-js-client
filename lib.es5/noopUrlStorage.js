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