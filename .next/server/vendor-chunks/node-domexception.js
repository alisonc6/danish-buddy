/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/node-domexception";
exports.ids = ["vendor-chunks/node-domexception"];
exports.modules = {

/***/ "(rsc)/./node_modules/node-domexception/index.js":
/*!*************************************************!*\
  !*** ./node_modules/node-domexception/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("/*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */\r\n\r\nif (!globalThis.DOMException) {\r\n  try {\r\n    const { MessageChannel } = __webpack_require__(/*! worker_threads */ \"worker_threads\"),\r\n    port = new MessageChannel().port1,\r\n    ab = new ArrayBuffer()\r\n    port.postMessage(ab, [ab, ab])\r\n  } catch (err) {\r\n    err.constructor.name === 'DOMException' && (\r\n      globalThis.DOMException = err.constructor\r\n    )\r\n  }\r\n}\r\n\r\nmodule.exports = globalThis.DOMException\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbm9kZS1kb21leGNlcHRpb24vaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLGlCQUFpQixFQUFFLG1CQUFPLENBQUMsc0NBQWdCO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2RhbmlzaC1idWRkeS8uL25vZGVfbW9kdWxlcy9ub2RlLWRvbWV4Y2VwdGlvbi9pbmRleC5qcz9lOWIwIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISBub2RlLWRvbWV4Y2VwdGlvbi4gTUlUIExpY2Vuc2UuIEppbW15IFfDpHJ0aW5nIDxodHRwczovL2ppbW15LndhcnRpbmcuc2Uvb3BlbnNvdXJjZT4gKi9cclxuXHJcbmlmICghZ2xvYmFsVGhpcy5ET01FeGNlcHRpb24pIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBNZXNzYWdlQ2hhbm5lbCB9ID0gcmVxdWlyZSgnd29ya2VyX3RocmVhZHMnKSxcclxuICAgIHBvcnQgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKS5wb3J0MSxcclxuICAgIGFiID0gbmV3IEFycmF5QnVmZmVyKClcclxuICAgIHBvcnQucG9zdE1lc3NhZ2UoYWIsIFthYiwgYWJdKVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgZXJyLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdET01FeGNlcHRpb24nICYmIChcclxuICAgICAgZ2xvYmFsVGhpcy5ET01FeGNlcHRpb24gPSBlcnIuY29uc3RydWN0b3JcclxuICAgIClcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsVGhpcy5ET01FeGNlcHRpb25cclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/node-domexception/index.js\n");

/***/ })

};
;