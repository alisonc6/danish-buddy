/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/wrappy";
exports.ids = ["vendor-chunks/wrappy"];
exports.modules = {

/***/ "(rsc)/./node_modules/wrappy/wrappy.js":
/*!***************************************!*\
  !*** ./node_modules/wrappy/wrappy.js ***!
  \***************************************/
/***/ ((module) => {

eval("// Returns a wrapper function that returns a wrapped callback\r\n// The wrapper function should do some stuff, and return a\r\n// presumably different callback function.\r\n// This makes sure that own properties are retained, so that\r\n// decorations and such are not lost along the way.\r\nmodule.exports = wrappy\r\nfunction wrappy (fn, cb) {\r\n  if (fn && cb) return wrappy(fn)(cb)\r\n\r\n  if (typeof fn !== 'function')\r\n    throw new TypeError('need wrapper function')\r\n\r\n  Object.keys(fn).forEach(function (k) {\r\n    wrapper[k] = fn[k]\r\n  })\r\n\r\n  return wrapper\r\n\r\n  function wrapper() {\r\n    var args = new Array(arguments.length)\r\n    for (var i = 0; i < args.length; i++) {\r\n      args[i] = arguments[i]\r\n    }\r\n    var ret = fn.apply(this, args)\r\n    var cb = args[args.length-1]\r\n    if (typeof ret === 'function' && ret !== cb) {\r\n      Object.keys(cb).forEach(function (k) {\r\n        ret[k] = cb[k]\r\n      })\r\n    }\r\n    return ret\r\n  }\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvd3JhcHB5L3dyYXBweS5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsaUJBQWlCO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGFuaXNoLWJ1ZGR5Ly4vbm9kZV9tb2R1bGVzL3dyYXBweS93cmFwcHkuanM/MzI4NCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBSZXR1cm5zIGEgd3JhcHBlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSB3cmFwcGVkIGNhbGxiYWNrXHJcbi8vIFRoZSB3cmFwcGVyIGZ1bmN0aW9uIHNob3VsZCBkbyBzb21lIHN0dWZmLCBhbmQgcmV0dXJuIGFcclxuLy8gcHJlc3VtYWJseSBkaWZmZXJlbnQgY2FsbGJhY2sgZnVuY3Rpb24uXHJcbi8vIFRoaXMgbWFrZXMgc3VyZSB0aGF0IG93biBwcm9wZXJ0aWVzIGFyZSByZXRhaW5lZCwgc28gdGhhdFxyXG4vLyBkZWNvcmF0aW9ucyBhbmQgc3VjaCBhcmUgbm90IGxvc3QgYWxvbmcgdGhlIHdheS5cclxubW9kdWxlLmV4cG9ydHMgPSB3cmFwcHlcclxuZnVuY3Rpb24gd3JhcHB5IChmbiwgY2IpIHtcclxuICBpZiAoZm4gJiYgY2IpIHJldHVybiB3cmFwcHkoZm4pKGNiKVxyXG5cclxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKVxyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbmVlZCB3cmFwcGVyIGZ1bmN0aW9uJylcclxuXHJcbiAgT2JqZWN0LmtleXMoZm4pLmZvckVhY2goZnVuY3Rpb24gKGspIHtcclxuICAgIHdyYXBwZXJba10gPSBmbltrXVxyXG4gIH0pXHJcblxyXG4gIHJldHVybiB3cmFwcGVyXHJcblxyXG4gIGZ1bmN0aW9uIHdyYXBwZXIoKSB7XHJcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV1cclxuICAgIH1cclxuICAgIHZhciByZXQgPSBmbi5hcHBseSh0aGlzLCBhcmdzKVxyXG4gICAgdmFyIGNiID0gYXJnc1thcmdzLmxlbmd0aC0xXVxyXG4gICAgaWYgKHR5cGVvZiByZXQgPT09ICdmdW5jdGlvbicgJiYgcmV0ICE9PSBjYikge1xyXG4gICAgICBPYmplY3Qua2V5cyhjYikuZm9yRWFjaChmdW5jdGlvbiAoaykge1xyXG4gICAgICAgIHJldFtrXSA9IGNiW2tdXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0XHJcbiAgfVxyXG59XHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/wrappy/wrappy.js\n");

/***/ })

};
;