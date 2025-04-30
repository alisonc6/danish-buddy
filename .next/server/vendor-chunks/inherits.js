/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/inherits";
exports.ids = ["vendor-chunks/inherits"];
exports.modules = {

/***/ "(rsc)/./node_modules/inherits/inherits.js":
/*!*******************************************!*\
  !*** ./node_modules/inherits/inherits.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("try {\r\n  var util = __webpack_require__(/*! util */ \"util\");\r\n  /* istanbul ignore next */\r\n  if (typeof util.inherits !== 'function') throw '';\r\n  module.exports = util.inherits;\r\n} catch (e) {\r\n  /* istanbul ignore next */\r\n  module.exports = __webpack_require__(/*! ./inherits_browser.js */ \"(rsc)/./node_modules/inherits/inherits_browser.js\");\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHMuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQSxhQUFhLG1CQUFPLENBQUMsa0JBQU07QUFDM0I7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0EsRUFBRSxzSEFBaUQ7QUFDbkQiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9kYW5pc2gtYnVkZHkvLi9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHMuanM/NjE2OSJdLCJzb3VyY2VzQ29udGVudCI6WyJ0cnkge1xyXG4gIHZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgaWYgKHR5cGVvZiB1dGlsLmluaGVyaXRzICE9PSAnZnVuY3Rpb24nKSB0aHJvdyAnJztcclxuICBtb2R1bGUuZXhwb3J0cyA9IHV0aWwuaW5oZXJpdHM7XHJcbn0gY2F0Y2ggKGUpIHtcclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9pbmhlcml0c19icm93c2VyLmpzJyk7XHJcbn1cclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/inherits/inherits.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/inherits/inherits_browser.js":
/*!***************************************************!*\
  !*** ./node_modules/inherits/inherits_browser.js ***!
  \***************************************************/
/***/ ((module) => {

eval("if (typeof Object.create === 'function') {\r\n  // implementation from standard node.js 'util' module\r\n  module.exports = function inherits(ctor, superCtor) {\r\n    if (superCtor) {\r\n      ctor.super_ = superCtor\r\n      ctor.prototype = Object.create(superCtor.prototype, {\r\n        constructor: {\r\n          value: ctor,\r\n          enumerable: false,\r\n          writable: true,\r\n          configurable: true\r\n        }\r\n      })\r\n    }\r\n  };\r\n} else {\r\n  // old school shim for old browsers\r\n  module.exports = function inherits(ctor, superCtor) {\r\n    if (superCtor) {\r\n      ctor.super_ = superCtor\r\n      var TempCtor = function () {}\r\n      TempCtor.prototype = superCtor.prototype\r\n      ctor.prototype = new TempCtor()\r\n      ctor.prototype.constructor = ctor\r\n    }\r\n  }\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGFuaXNoLWJ1ZGR5Ly4vbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanM/ZjFkOCJdLCJzb3VyY2VzQ29udGVudCI6WyJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxyXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XHJcbiAgICBpZiAoc3VwZXJDdG9yKSB7XHJcbiAgICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXHJcbiAgICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XHJcbiAgICAgICAgY29uc3RydWN0b3I6IHtcclxuICAgICAgICAgIHZhbHVlOiBjdG9yLFxyXG4gICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcclxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH1cclxuICB9O1xyXG59IGVsc2Uge1xyXG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcclxuICAgIGlmIChzdXBlckN0b3IpIHtcclxuICAgICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcclxuICAgICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cclxuICAgICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxyXG4gICAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXHJcbiAgICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/inherits/inherits_browser.js\n");

/***/ })

};
;