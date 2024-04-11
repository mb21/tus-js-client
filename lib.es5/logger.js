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