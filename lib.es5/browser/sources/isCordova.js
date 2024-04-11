"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const isCordova = () => typeof window !== 'undefined' && (typeof window.PhoneGap !== 'undefined' || typeof window.Cordova !== 'undefined' || typeof window.cordova !== 'undefined');
var _default = exports.default = isCordova;