/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/stream-shift";
exports.ids = ["vendor-chunks/stream-shift"];
exports.modules = {

/***/ "(rsc)/./node_modules/stream-shift/index.js":
/*!********************************************!*\
  !*** ./node_modules/stream-shift/index.js ***!
  \********************************************/
/***/ ((module) => {

eval("module.exports = shift\r\n\r\nfunction shift (stream) {\r\n  var rs = stream._readableState\r\n  if (!rs) return null\r\n  return (rs.objectMode || typeof stream._duplexState === 'number') ? stream.read() : stream.read(getStateLength(rs))\r\n}\r\n\r\nfunction getStateLength (state) {\r\n  if (state.buffer.length) {\r\n    var idx = state.bufferIndex || 0\r\n    // Since node 6.3.0 state.buffer is a BufferList not an array\r\n    if (state.buffer.head) {\r\n      return state.buffer.head.data.length\r\n    } else if (state.buffer.length - idx > 0 && state.buffer[idx]) {\r\n      return state.buffer[idx].length\r\n    }\r\n  }\r\n\r\n  return state.length\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvc3RyZWFtLXNoaWZ0L2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGFuaXNoLWJ1ZGR5Ly4vbm9kZV9tb2R1bGVzL3N0cmVhbS1zaGlmdC9pbmRleC5qcz85MTkwIl0sInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gc2hpZnRcclxuXHJcbmZ1bmN0aW9uIHNoaWZ0IChzdHJlYW0pIHtcclxuICB2YXIgcnMgPSBzdHJlYW0uX3JlYWRhYmxlU3RhdGVcclxuICBpZiAoIXJzKSByZXR1cm4gbnVsbFxyXG4gIHJldHVybiAocnMub2JqZWN0TW9kZSB8fCB0eXBlb2Ygc3RyZWFtLl9kdXBsZXhTdGF0ZSA9PT0gJ251bWJlcicpID8gc3RyZWFtLnJlYWQoKSA6IHN0cmVhbS5yZWFkKGdldFN0YXRlTGVuZ3RoKHJzKSlcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVMZW5ndGggKHN0YXRlKSB7XHJcbiAgaWYgKHN0YXRlLmJ1ZmZlci5sZW5ndGgpIHtcclxuICAgIHZhciBpZHggPSBzdGF0ZS5idWZmZXJJbmRleCB8fCAwXHJcbiAgICAvLyBTaW5jZSBub2RlIDYuMy4wIHN0YXRlLmJ1ZmZlciBpcyBhIEJ1ZmZlckxpc3Qgbm90IGFuIGFycmF5XHJcbiAgICBpZiAoc3RhdGUuYnVmZmVyLmhlYWQpIHtcclxuICAgICAgcmV0dXJuIHN0YXRlLmJ1ZmZlci5oZWFkLmRhdGEubGVuZ3RoXHJcbiAgICB9IGVsc2UgaWYgKHN0YXRlLmJ1ZmZlci5sZW5ndGggLSBpZHggPiAwICYmIHN0YXRlLmJ1ZmZlcltpZHhdKSB7XHJcbiAgICAgIHJldHVybiBzdGF0ZS5idWZmZXJbaWR4XS5sZW5ndGhcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBzdGF0ZS5sZW5ndGhcclxufVxyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/stream-shift/index.js\n");

/***/ })

};
;