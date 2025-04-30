"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/buffer-equal-constant-time";
exports.ids = ["vendor-chunks/buffer-equal-constant-time"];
exports.modules = {

/***/ "(rsc)/./node_modules/buffer-equal-constant-time/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/buffer-equal-constant-time/index.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("/*jshint node:true */\r\n\r\nvar Buffer = (__webpack_require__(/*! buffer */ \"buffer\").Buffer); // browserify\r\nvar SlowBuffer = (__webpack_require__(/*! buffer */ \"buffer\").SlowBuffer);\r\n\r\nmodule.exports = bufferEq;\r\n\r\nfunction bufferEq(a, b) {\r\n\r\n  // shortcutting on type is necessary for correctness\r\n  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {\r\n    return false;\r\n  }\r\n\r\n  // buffer sizes should be well-known information, so despite this\r\n  // shortcutting, it doesn't leak any information about the *contents* of the\r\n  // buffers.\r\n  if (a.length !== b.length) {\r\n    return false;\r\n  }\r\n\r\n  var c = 0;\r\n  for (var i = 0; i < a.length; i++) {\r\n    /*jshint bitwise:false */\r\n    c |= a[i] ^ b[i]; // XOR\r\n  }\r\n  return c === 0;\r\n}\r\n\r\nbufferEq.install = function() {\r\n  Buffer.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {\r\n    return bufferEq(this, that);\r\n  };\r\n};\r\n\r\nvar origBufEqual = Buffer.prototype.equal;\r\nvar origSlowBufEqual = SlowBuffer.prototype.equal;\r\nbufferEq.restore = function() {\r\n  Buffer.prototype.equal = origBufEqual;\r\n  SlowBuffer.prototype.equal = origSlowBufEqual;\r\n};\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvYnVmZmVyLWVxdWFsLWNvbnN0YW50LXRpbWUvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDYTtBQUNiLGFBQWEsb0RBQXdCLEVBQUU7QUFDdkMsaUJBQWlCLHdEQUE0QjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsY0FBYztBQUNoQztBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2RhbmlzaC1idWRkeS8uL25vZGVfbW9kdWxlcy9idWZmZXItZXF1YWwtY29uc3RhbnQtdGltZS9pbmRleC5qcz9lYWVhIl0sInNvdXJjZXNDb250ZW50IjpbIi8qanNoaW50IG5vZGU6dHJ1ZSAqL1xyXG4ndXNlIHN0cmljdCc7XHJcbnZhciBCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5CdWZmZXI7IC8vIGJyb3dzZXJpZnlcclxudmFyIFNsb3dCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5TbG93QnVmZmVyO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBidWZmZXJFcTtcclxuXHJcbmZ1bmN0aW9uIGJ1ZmZlckVxKGEsIGIpIHtcclxuXHJcbiAgLy8gc2hvcnRjdXR0aW5nIG9uIHR5cGUgaXMgbmVjZXNzYXJ5IGZvciBjb3JyZWN0bmVzc1xyXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8vIGJ1ZmZlciBzaXplcyBzaG91bGQgYmUgd2VsbC1rbm93biBpbmZvcm1hdGlvbiwgc28gZGVzcGl0ZSB0aGlzXHJcbiAgLy8gc2hvcnRjdXR0aW5nLCBpdCBkb2Vzbid0IGxlYWsgYW55IGluZm9ybWF0aW9uIGFib3V0IHRoZSAqY29udGVudHMqIG9mIHRoZVxyXG4gIC8vIGJ1ZmZlcnMuXHJcbiAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgdmFyIGMgPSAwO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgLypqc2hpbnQgYml0d2lzZTpmYWxzZSAqL1xyXG4gICAgYyB8PSBhW2ldIF4gYltpXTsgLy8gWE9SXHJcbiAgfVxyXG4gIHJldHVybiBjID09PSAwO1xyXG59XHJcblxyXG5idWZmZXJFcS5pbnN0YWxsID0gZnVuY3Rpb24oKSB7XHJcbiAgQnVmZmVyLnByb3RvdHlwZS5lcXVhbCA9IFNsb3dCdWZmZXIucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24gZXF1YWwodGhhdCkge1xyXG4gICAgcmV0dXJuIGJ1ZmZlckVxKHRoaXMsIHRoYXQpO1xyXG4gIH07XHJcbn07XHJcblxyXG52YXIgb3JpZ0J1ZkVxdWFsID0gQnVmZmVyLnByb3RvdHlwZS5lcXVhbDtcclxudmFyIG9yaWdTbG93QnVmRXF1YWwgPSBTbG93QnVmZmVyLnByb3RvdHlwZS5lcXVhbDtcclxuYnVmZmVyRXEucmVzdG9yZSA9IGZ1bmN0aW9uKCkge1xyXG4gIEJ1ZmZlci5wcm90b3R5cGUuZXF1YWwgPSBvcmlnQnVmRXF1YWw7XHJcbiAgU2xvd0J1ZmZlci5wcm90b3R5cGUuZXF1YWwgPSBvcmlnU2xvd0J1ZkVxdWFsO1xyXG59O1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/buffer-equal-constant-time/index.js\n");

/***/ })

};
;