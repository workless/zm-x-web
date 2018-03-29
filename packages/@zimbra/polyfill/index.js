/* eslint-disable */
var g = typeof global==='undefined' ? window : global;
if (!g.Promise) g.Promise = require('promise-polyfill');
if (!g.fetch) g.fetch = require('unfetch').default;

// `pretty-bytes` depends on `Number.isFinite`.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite#Polyfill
if (typeof Number.isFinite !== 'function') {
	Number.isFinite = function(n) {
		return typeof n === 'number' && isFinite(n);
	};
}

// `react-big-calendar` depends on `Object.assign`.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign !== 'function') {
	Object.assign = function(target, varArgs) { // .length of function is 2
		'use strict';
		if (target == null) { // TypeError if undefined or null
			throw new TypeError('Cannot convert undefined or null to object');
		}

		var to = Object(target);

		for (var index = 1; index < arguments.length; index++) {
			var nextSource = arguments[index];

			if (nextSource != null) { // Skip over if undefined or null
				for (var nextKey in nextSource) {
					// Avoid bugs when hasOwnProperty is shadowed
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}
		return to;
	};
}

// `react-big-calendar` depends on `Array.findIndex`.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Polyfill
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    }
  });
}

var includesDescriptor = {
  value: function(searchElement, fromIndex) {
    return this.indexOf(searchElement, fromIndex)!==-1;
  }
};

if (!Array.prototype.includes) {
	Object.defineProperty(Array.prototype, 'includes', includesDescriptor);
}

if (!String.prototype.includes) {
	Object.defineProperty(String.prototype, 'includes', includesDescriptor);
}

// Trick recompose into identifying preact components like they are react components.
// Follow `acdlite/recompose#458` for `recompose` + `preact` compatibility.
// var Component = require('preact').Component;
// Component.prototype.isReactComponent = {};
