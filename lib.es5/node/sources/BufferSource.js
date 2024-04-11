"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class BufferSource {
  constructor(buffer) {
    this._buffer = buffer;
    this.size = buffer.length;
  }
  slice(start, end) {
    const value = this._buffer.slice(start, end);
    value.size = value.length;
    const done = end >= this.size;
    return Promise.resolve({
      value,
      done
    });
  }
  close() {}
}
exports.default = BufferSource;