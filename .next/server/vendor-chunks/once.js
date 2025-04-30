/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/once";
exports.ids = ["vendor-chunks/once"];
exports.modules = {

/***/ "(rsc)/./node_modules/once/once.js":
/*!***********************************!*\
  !*** ./node_modules/once/once.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("var wrappy = __webpack_require__(/*! wrappy */ \"(rsc)/./node_modules/wrappy/wrappy.js\")\r\nmodule.exports = wrappy(once)\r\nmodule.exports.strict = wrappy(onceStrict)\r\n\r\nonce.proto = once(function () {\r\n  Object.defineProperty(Function.prototype, 'once', {\r\n    value: function () {\r\n      return once(this)\r\n    },\r\n    configurable: true\r\n  })\r\n\r\n  Object.defineProperty(Function.prototype, 'onceStrict', {\r\n    value: function () {\r\n      return onceStrict(this)\r\n    },\r\n    configurable: true\r\n  })\r\n})\r\n\r\nfunction once (fn) {\r\n  var f = function () {\r\n    if (f.called) return f.value\r\n    f.called = true\r\n    return f.value = fn.apply(this, arguments)\r\n  }\r\n  f.called = false\r\n  return f\r\n}\r\n\r\nfunction onceStrict (fn) {\r\n  var f = function () {\r\n    if (f.called)\r\n      throw new Error(f.onceError)\r\n    f.called = true\r\n    return f.value = fn.apply(this, arguments)\r\n  }\r\n  var name = fn.name || 'Function wrapped with `once`'\r\n  f.onceError = name + \" shouldn't be called more than once\"\r\n  f.called = false\r\n  return f\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvb25jZS9vbmNlLmpzIiwibWFwcGluZ3MiOiJBQUFBLGFBQWEsbUJBQU8sQ0FBQyxxREFBUTtBQUM3QjtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsR0FBRztBQUNILENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGFuaXNoLWJ1ZGR5Ly4vbm9kZV9tb2R1bGVzL29uY2Uvb25jZS5qcz9hNDJhIl0sInNvdXJjZXNDb250ZW50IjpbInZhciB3cmFwcHkgPSByZXF1aXJlKCd3cmFwcHknKVxyXG5tb2R1bGUuZXhwb3J0cyA9IHdyYXBweShvbmNlKVxyXG5tb2R1bGUuZXhwb3J0cy5zdHJpY3QgPSB3cmFwcHkob25jZVN0cmljdClcclxuXHJcbm9uY2UucHJvdG8gPSBvbmNlKGZ1bmN0aW9uICgpIHtcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRnVuY3Rpb24ucHJvdG90eXBlLCAnb25jZScsIHtcclxuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBvbmNlKHRoaXMpXHJcbiAgICB9LFxyXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgfSlcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEZ1bmN0aW9uLnByb3RvdHlwZSwgJ29uY2VTdHJpY3QnLCB7XHJcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gb25jZVN0cmljdCh0aGlzKVxyXG4gICAgfSxcclxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gIH0pXHJcbn0pXHJcblxyXG5mdW5jdGlvbiBvbmNlIChmbikge1xyXG4gIHZhciBmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKGYuY2FsbGVkKSByZXR1cm4gZi52YWx1ZVxyXG4gICAgZi5jYWxsZWQgPSB0cnVlXHJcbiAgICByZXR1cm4gZi52YWx1ZSA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcclxuICB9XHJcbiAgZi5jYWxsZWQgPSBmYWxzZVxyXG4gIHJldHVybiBmXHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uY2VTdHJpY3QgKGZuKSB7XHJcbiAgdmFyIGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoZi5jYWxsZWQpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihmLm9uY2VFcnJvcilcclxuICAgIGYuY2FsbGVkID0gdHJ1ZVxyXG4gICAgcmV0dXJuIGYudmFsdWUgPSBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXHJcbiAgfVxyXG4gIHZhciBuYW1lID0gZm4ubmFtZSB8fCAnRnVuY3Rpb24gd3JhcHBlZCB3aXRoIGBvbmNlYCdcclxuICBmLm9uY2VFcnJvciA9IG5hbWUgKyBcIiBzaG91bGRuJ3QgYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlXCJcclxuICBmLmNhbGxlZCA9IGZhbHNlXHJcbiAgcmV0dXJuIGZcclxufVxyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/once/once.js\n");

/***/ })

};
;