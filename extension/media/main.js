/* Graphide Review desk — React 18 chrome + vanilla graph. npm run build:webview */
"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/react/cjs/react.production.min.js
  var require_react_production_min = __commonJS({
    "node_modules/react/cjs/react.production.min.js"(exports) {
      "use strict";
      var l = Symbol.for("react.element");
      var n = Symbol.for("react.portal");
      var p = Symbol.for("react.fragment");
      var q = Symbol.for("react.strict_mode");
      var r = Symbol.for("react.profiler");
      var t = Symbol.for("react.provider");
      var u = Symbol.for("react.context");
      var v = Symbol.for("react.forward_ref");
      var w = Symbol.for("react.suspense");
      var x = Symbol.for("react.memo");
      var y = Symbol.for("react.lazy");
      var z = Symbol.iterator;
      function A(a) {
        if (null === a || "object" !== typeof a) return null;
        a = z && a[z] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var B = { isMounted: function() {
        return false;
      }, enqueueForceUpdate: function() {
      }, enqueueReplaceState: function() {
      }, enqueueSetState: function() {
      } };
      var C = Object.assign;
      var D = {};
      function E(a, b, e) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e || B;
      }
      E.prototype.isReactComponent = {};
      E.prototype.setState = function(a, b) {
        if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, a, b, "setState");
      };
      E.prototype.forceUpdate = function(a) {
        this.updater.enqueueForceUpdate(this, a, "forceUpdate");
      };
      function F() {
      }
      F.prototype = E.prototype;
      function G(a, b, e) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e || B;
      }
      var H = G.prototype = new F();
      H.constructor = G;
      C(H, E.prototype);
      H.isPureReactComponent = true;
      var I = Array.isArray;
      var J = Object.prototype.hasOwnProperty;
      var K = { current: null };
      var L = { key: true, ref: true, __self: true, __source: true };
      function M(a, b, e) {
        var d, c = {}, k = null, h = null;
        if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
        var g = arguments.length - 2;
        if (1 === g) c.children = e;
        else if (1 < g) {
          for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
          c.children = f;
        }
        if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
        return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
      }
      function N(a, b) {
        return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
      }
      function O(a) {
        return "object" === typeof a && null !== a && a.$$typeof === l;
      }
      function escape(a) {
        var b = { "=": "=0", ":": "=2" };
        return "$" + a.replace(/[=:]/g, function(a2) {
          return b[a2];
        });
      }
      var P = /\/+/g;
      function Q(a, b) {
        return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
      }
      function R(a, b, e, d, c) {
        var k = typeof a;
        if ("undefined" === k || "boolean" === k) a = null;
        var h = false;
        if (null === a) h = true;
        else switch (k) {
          case "string":
          case "number":
            h = true;
            break;
          case "object":
            switch (a.$$typeof) {
              case l:
              case n:
                h = true;
            }
        }
        if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
          return a2;
        })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
        h = 0;
        d = "" === d ? "." : d + ":";
        if (I(a)) for (var g = 0; g < a.length; g++) {
          k = a[g];
          var f = d + Q(k, g);
          h += R(k, b, e, f, c);
        }
        else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
        else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
        return h;
      }
      function S(a, b, e) {
        if (null == a) return a;
        var d = [], c = 0;
        R(a, d, "", "", function(a2) {
          return b.call(e, a2, c++);
        });
        return d;
      }
      function T(a) {
        if (-1 === a._status) {
          var b = a._result;
          b = b();
          b.then(function(b2) {
            if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
          }, function(b2) {
            if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
          });
          -1 === a._status && (a._status = 0, a._result = b);
        }
        if (1 === a._status) return a._result.default;
        throw a._result;
      }
      var U = { current: null };
      var V = { transition: null };
      var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
      function X() {
        throw Error("act(...) is not supported in production builds of React.");
      }
      exports.Children = { map: S, forEach: function(a, b, e) {
        S(a, function() {
          b.apply(this, arguments);
        }, e);
      }, count: function(a) {
        var b = 0;
        S(a, function() {
          b++;
        });
        return b;
      }, toArray: function(a) {
        return S(a, function(a2) {
          return a2;
        }) || [];
      }, only: function(a) {
        if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
        return a;
      } };
      exports.Component = E;
      exports.Fragment = p;
      exports.Profiler = r;
      exports.PureComponent = G;
      exports.StrictMode = q;
      exports.Suspense = w;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
      exports.act = X;
      exports.cloneElement = function(a, b, e) {
        if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
        var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
        if (null != b) {
          void 0 !== b.ref && (k = b.ref, h = K.current);
          void 0 !== b.key && (c = "" + b.key);
          if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
          for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
        }
        var f = arguments.length - 2;
        if (1 === f) d.children = e;
        else if (1 < f) {
          g = Array(f);
          for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
          d.children = g;
        }
        return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
      };
      exports.createContext = function(a) {
        a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
        a.Provider = { $$typeof: t, _context: a };
        return a.Consumer = a;
      };
      exports.createElement = M;
      exports.createFactory = function(a) {
        var b = M.bind(null, a);
        b.type = a;
        return b;
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(a) {
        return { $$typeof: v, render: a };
      };
      exports.isValidElement = O;
      exports.lazy = function(a) {
        return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
      };
      exports.memo = function(a, b) {
        return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
      };
      exports.startTransition = function(a) {
        var b = V.transition;
        V.transition = {};
        try {
          a();
        } finally {
          V.transition = b;
        }
      };
      exports.unstable_act = X;
      exports.useCallback = function(a, b) {
        return U.current.useCallback(a, b);
      };
      exports.useContext = function(a) {
        return U.current.useContext(a);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(a) {
        return U.current.useDeferredValue(a);
      };
      exports.useEffect = function(a, b) {
        return U.current.useEffect(a, b);
      };
      exports.useId = function() {
        return U.current.useId();
      };
      exports.useImperativeHandle = function(a, b, e) {
        return U.current.useImperativeHandle(a, b, e);
      };
      exports.useInsertionEffect = function(a, b) {
        return U.current.useInsertionEffect(a, b);
      };
      exports.useLayoutEffect = function(a, b) {
        return U.current.useLayoutEffect(a, b);
      };
      exports.useMemo = function(a, b) {
        return U.current.useMemo(a, b);
      };
      exports.useReducer = function(a, b, e) {
        return U.current.useReducer(a, b, e);
      };
      exports.useRef = function(a) {
        return U.current.useRef(a);
      };
      exports.useState = function(a) {
        return U.current.useState(a);
      };
      exports.useSyncExternalStore = function(a, b, e) {
        return U.current.useSyncExternalStore(a, b, e);
      };
      exports.useTransition = function() {
        return U.current.useTransition();
      };
      exports.version = "18.3.1";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.min.js
  var require_scheduler_production_min = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.min.js"(exports) {
      "use strict";
      function f(a, b) {
        var c = a.length;
        a.push(b);
        a: for (; 0 < c; ) {
          var d = c - 1 >>> 1, e = a[d];
          if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
          else break a;
        }
      }
      function h(a) {
        return 0 === a.length ? null : a[0];
      }
      function k(a) {
        if (0 === a.length) return null;
        var b = a[0], c = a.pop();
        if (c !== b) {
          a[0] = c;
          a: for (var d = 0, e = a.length, w = e >>> 1; d < w; ) {
            var m = 2 * (d + 1) - 1, C = a[m], n = m + 1, x = a[n];
            if (0 > g(C, c)) n < e && 0 > g(x, C) ? (a[d] = x, a[n] = c, d = n) : (a[d] = C, a[m] = c, d = m);
            else if (n < e && 0 > g(x, c)) a[d] = x, a[n] = c, d = n;
            else break a;
          }
        }
        return b;
      }
      function g(a, b) {
        var c = a.sortIndex - b.sortIndex;
        return 0 !== c ? c : a.id - b.id;
      }
      if ("object" === typeof performance && "function" === typeof performance.now) {
        l = performance;
        exports.unstable_now = function() {
          return l.now();
        };
      } else {
        p = Date, q = p.now();
        exports.unstable_now = function() {
          return p.now() - q;
        };
      }
      var l;
      var p;
      var q;
      var r = [];
      var t = [];
      var u = 1;
      var v = null;
      var y = 3;
      var z = false;
      var A = false;
      var B = false;
      var D = "function" === typeof setTimeout ? setTimeout : null;
      var E = "function" === typeof clearTimeout ? clearTimeout : null;
      var F = "undefined" !== typeof setImmediate ? setImmediate : null;
      "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
      function G(a) {
        for (var b = h(t); null !== b; ) {
          if (null === b.callback) k(t);
          else if (b.startTime <= a) k(t), b.sortIndex = b.expirationTime, f(r, b);
          else break;
          b = h(t);
        }
      }
      function H(a) {
        B = false;
        G(a);
        if (!A) if (null !== h(r)) A = true, I(J);
        else {
          var b = h(t);
          null !== b && K(H, b.startTime - a);
        }
      }
      function J(a, b) {
        A = false;
        B && (B = false, E(L), L = -1);
        z = true;
        var c = y;
        try {
          G(b);
          for (v = h(r); null !== v && (!(v.expirationTime > b) || a && !M()); ) {
            var d = v.callback;
            if ("function" === typeof d) {
              v.callback = null;
              y = v.priorityLevel;
              var e = d(v.expirationTime <= b);
              b = exports.unstable_now();
              "function" === typeof e ? v.callback = e : v === h(r) && k(r);
              G(b);
            } else k(r);
            v = h(r);
          }
          if (null !== v) var w = true;
          else {
            var m = h(t);
            null !== m && K(H, m.startTime - b);
            w = false;
          }
          return w;
        } finally {
          v = null, y = c, z = false;
        }
      }
      var N = false;
      var O = null;
      var L = -1;
      var P = 5;
      var Q = -1;
      function M() {
        return exports.unstable_now() - Q < P ? false : true;
      }
      function R() {
        if (null !== O) {
          var a = exports.unstable_now();
          Q = a;
          var b = true;
          try {
            b = O(true, a);
          } finally {
            b ? S() : (N = false, O = null);
          }
        } else N = false;
      }
      var S;
      if ("function" === typeof F) S = function() {
        F(R);
      };
      else if ("undefined" !== typeof MessageChannel) {
        T = new MessageChannel(), U = T.port2;
        T.port1.onmessage = R;
        S = function() {
          U.postMessage(null);
        };
      } else S = function() {
        D(R, 0);
      };
      var T;
      var U;
      function I(a) {
        O = a;
        N || (N = true, S());
      }
      function K(a, b) {
        L = D(function() {
          a(exports.unstable_now());
        }, b);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(a) {
        a.callback = null;
      };
      exports.unstable_continueExecution = function() {
        A || z || (A = true, I(J));
      };
      exports.unstable_forceFrameRate = function(a) {
        0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a ? Math.floor(1e3 / a) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return y;
      };
      exports.unstable_getFirstCallbackNode = function() {
        return h(r);
      };
      exports.unstable_next = function(a) {
        switch (y) {
          case 1:
          case 2:
          case 3:
            var b = 3;
            break;
          default:
            b = y;
        }
        var c = y;
        y = b;
        try {
          return a();
        } finally {
          y = c;
        }
      };
      exports.unstable_pauseExecution = function() {
      };
      exports.unstable_requestPaint = function() {
      };
      exports.unstable_runWithPriority = function(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            a = 3;
        }
        var c = y;
        y = a;
        try {
          return b();
        } finally {
          y = c;
        }
      };
      exports.unstable_scheduleCallback = function(a, b, c) {
        var d = exports.unstable_now();
        "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
        switch (a) {
          case 1:
            var e = -1;
            break;
          case 2:
            e = 250;
            break;
          case 5:
            e = 1073741823;
            break;
          case 4:
            e = 1e4;
            break;
          default:
            e = 5e3;
        }
        e = c + e;
        a = { id: u++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
        c > d ? (a.sortIndex = c, f(t, a), null === h(r) && a === h(t) && (B ? (E(L), L = -1) : B = true, K(H, c - d))) : (a.sortIndex = e, f(r, a), A || z || (A = true, I(J)));
        return a;
      };
      exports.unstable_shouldYield = M;
      exports.unstable_wrapCallback = function(a) {
        var b = y;
        return function() {
          var c = y;
          y = b;
          try {
            return a.apply(this, arguments);
          } finally {
            y = c;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_scheduler_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.min.js
  var require_react_dom_production_min = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.min.js"(exports) {
      "use strict";
      var aa = require_react();
      var ca = require_scheduler();
      function p(a) {
        for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
        return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      var da = /* @__PURE__ */ new Set();
      var ea = {};
      function fa(a, b) {
        ha(a, b);
        ha(a + "Capture", b);
      }
      function ha(a, b) {
        ea[a] = b;
        for (a = 0; a < b.length; a++) da.add(b[a]);
      }
      var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var ja = Object.prototype.hasOwnProperty;
      var ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
      var la = {};
      var ma = {};
      function oa(a) {
        if (ja.call(ma, a)) return true;
        if (ja.call(la, a)) return false;
        if (ka.test(a)) return ma[a] = true;
        la[a] = true;
        return false;
      }
      function pa(a, b, c, d) {
        if (null !== c && 0 === c.type) return false;
        switch (typeof b) {
          case "function":
          case "symbol":
            return true;
          case "boolean":
            if (d) return false;
            if (null !== c) return !c.acceptsBooleans;
            a = a.toLowerCase().slice(0, 5);
            return "data-" !== a && "aria-" !== a;
          default:
            return false;
        }
      }
      function qa(a, b, c, d) {
        if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
        if (d) return false;
        if (null !== c) switch (c.type) {
          case 3:
            return !b;
          case 4:
            return false === b;
          case 5:
            return isNaN(b);
          case 6:
            return isNaN(b) || 1 > b;
        }
        return false;
      }
      function v(a, b, c, d, e, f, g) {
        this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
        this.attributeName = d;
        this.attributeNamespace = e;
        this.mustUseProperty = c;
        this.propertyName = a;
        this.type = b;
        this.sanitizeURL = f;
        this.removeEmptyString = g;
      }
      var z = {};
      "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
        z[a] = new v(a, 0, false, a, null, false, false);
      });
      [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
        var b = a[0];
        z[b] = new v(b, 1, false, a[1], null, false, false);
      });
      ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
        z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
      });
      ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
        z[a] = new v(a, 2, false, a, null, false, false);
      });
      "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
        z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
      });
      ["checked", "multiple", "muted", "selected"].forEach(function(a) {
        z[a] = new v(a, 3, true, a, null, false, false);
      });
      ["capture", "download"].forEach(function(a) {
        z[a] = new v(a, 4, false, a, null, false, false);
      });
      ["cols", "rows", "size", "span"].forEach(function(a) {
        z[a] = new v(a, 6, false, a, null, false, false);
      });
      ["rowSpan", "start"].forEach(function(a) {
        z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
      });
      var ra = /[\-:]([a-z])/g;
      function sa(a) {
        return a[1].toUpperCase();
      }
      "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
        var b = a.replace(
          ra,
          sa
        );
        z[b] = new v(b, 1, false, a, null, false, false);
      });
      "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
      });
      ["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
      });
      ["tabIndex", "crossOrigin"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
      });
      z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
      ["src", "href", "action", "formAction"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
      });
      function ta(a, b, c, d) {
        var e = z.hasOwnProperty(b) ? z[b] : null;
        if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
      }
      var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      var va = Symbol.for("react.element");
      var wa = Symbol.for("react.portal");
      var ya = Symbol.for("react.fragment");
      var za = Symbol.for("react.strict_mode");
      var Aa = Symbol.for("react.profiler");
      var Ba = Symbol.for("react.provider");
      var Ca = Symbol.for("react.context");
      var Da = Symbol.for("react.forward_ref");
      var Ea = Symbol.for("react.suspense");
      var Fa = Symbol.for("react.suspense_list");
      var Ga = Symbol.for("react.memo");
      var Ha = Symbol.for("react.lazy");
      Symbol.for("react.scope");
      Symbol.for("react.debug_trace_mode");
      var Ia = Symbol.for("react.offscreen");
      Symbol.for("react.legacy_hidden");
      Symbol.for("react.cache");
      Symbol.for("react.tracing_marker");
      var Ja = Symbol.iterator;
      function Ka(a) {
        if (null === a || "object" !== typeof a) return null;
        a = Ja && a[Ja] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var A = Object.assign;
      var La;
      function Ma(a) {
        if (void 0 === La) try {
          throw Error();
        } catch (c) {
          var b = c.stack.trim().match(/\n( *(at )?)/);
          La = b && b[1] || "";
        }
        return "\n" + La + a;
      }
      var Na = false;
      function Oa(a, b) {
        if (!a || Na) return "";
        Na = true;
        var c = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          if (b) if (b = function() {
            throw Error();
          }, Object.defineProperty(b.prototype, "props", { set: function() {
            throw Error();
          } }), "object" === typeof Reflect && Reflect.construct) {
            try {
              Reflect.construct(b, []);
            } catch (l) {
              var d = l;
            }
            Reflect.construct(a, [], b);
          } else {
            try {
              b.call();
            } catch (l) {
              d = l;
            }
            a.call(b.prototype);
          }
          else {
            try {
              throw Error();
            } catch (l) {
              d = l;
            }
            a();
          }
        } catch (l) {
          if (l && d && "string" === typeof l.stack) {
            for (var e = l.stack.split("\n"), f = d.stack.split("\n"), g = e.length - 1, h = f.length - 1; 1 <= g && 0 <= h && e[g] !== f[h]; ) h--;
            for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f[h]) {
              if (1 !== g || 1 !== h) {
                do
                  if (g--, h--, 0 > h || e[g] !== f[h]) {
                    var k = "\n" + e[g].replace(" at new ", " at ");
                    a.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a.displayName));
                    return k;
                  }
                while (1 <= g && 0 <= h);
              }
              break;
            }
          }
        } finally {
          Na = false, Error.prepareStackTrace = c;
        }
        return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
      }
      function Pa(a) {
        switch (a.tag) {
          case 5:
            return Ma(a.type);
          case 16:
            return Ma("Lazy");
          case 13:
            return Ma("Suspense");
          case 19:
            return Ma("SuspenseList");
          case 0:
          case 2:
          case 15:
            return a = Oa(a.type, false), a;
          case 11:
            return a = Oa(a.type.render, false), a;
          case 1:
            return a = Oa(a.type, true), a;
          default:
            return "";
        }
      }
      function Qa(a) {
        if (null == a) return null;
        if ("function" === typeof a) return a.displayName || a.name || null;
        if ("string" === typeof a) return a;
        switch (a) {
          case ya:
            return "Fragment";
          case wa:
            return "Portal";
          case Aa:
            return "Profiler";
          case za:
            return "StrictMode";
          case Ea:
            return "Suspense";
          case Fa:
            return "SuspenseList";
        }
        if ("object" === typeof a) switch (a.$$typeof) {
          case Ca:
            return (a.displayName || "Context") + ".Consumer";
          case Ba:
            return (a._context.displayName || "Context") + ".Provider";
          case Da:
            var b = a.render;
            a = a.displayName;
            a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
            return a;
          case Ga:
            return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
          case Ha:
            b = a._payload;
            a = a._init;
            try {
              return Qa(a(b));
            } catch (c) {
            }
        }
        return null;
      }
      function Ra(a) {
        var b = a.type;
        switch (a.tag) {
          case 24:
            return "Cache";
          case 9:
            return (b.displayName || "Context") + ".Consumer";
          case 10:
            return (b._context.displayName || "Context") + ".Provider";
          case 18:
            return "DehydratedFragment";
          case 11:
            return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
          case 7:
            return "Fragment";
          case 5:
            return b;
          case 4:
            return "Portal";
          case 3:
            return "Root";
          case 6:
            return "Text";
          case 16:
            return Qa(b);
          case 8:
            return b === za ? "StrictMode" : "Mode";
          case 22:
            return "Offscreen";
          case 12:
            return "Profiler";
          case 21:
            return "Scope";
          case 13:
            return "Suspense";
          case 19:
            return "SuspenseList";
          case 25:
            return "TracingMarker";
          case 1:
          case 0:
          case 17:
          case 2:
          case 14:
          case 15:
            if ("function" === typeof b) return b.displayName || b.name || null;
            if ("string" === typeof b) return b;
        }
        return null;
      }
      function Sa(a) {
        switch (typeof a) {
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return a;
          case "object":
            return a;
          default:
            return "";
        }
      }
      function Ta(a) {
        var b = a.type;
        return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
      }
      function Ua(a) {
        var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
        if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
          var e = c.get, f = c.set;
          Object.defineProperty(a, b, { configurable: true, get: function() {
            return e.call(this);
          }, set: function(a2) {
            d = "" + a2;
            f.call(this, a2);
          } });
          Object.defineProperty(a, b, { enumerable: c.enumerable });
          return { getValue: function() {
            return d;
          }, setValue: function(a2) {
            d = "" + a2;
          }, stopTracking: function() {
            a._valueTracker = null;
            delete a[b];
          } };
        }
      }
      function Va(a) {
        a._valueTracker || (a._valueTracker = Ua(a));
      }
      function Wa(a) {
        if (!a) return false;
        var b = a._valueTracker;
        if (!b) return true;
        var c = b.getValue();
        var d = "";
        a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
        a = d;
        return a !== c ? (b.setValue(a), true) : false;
      }
      function Xa(a) {
        a = a || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof a) return null;
        try {
          return a.activeElement || a.body;
        } catch (b) {
          return a.body;
        }
      }
      function Ya(a, b) {
        var c = b.checked;
        return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
      }
      function Za(a, b) {
        var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
        c = Sa(null != b.value ? b.value : c);
        a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
      }
      function ab(a, b) {
        b = b.checked;
        null != b && ta(a, "checked", b, false);
      }
      function bb(a, b) {
        ab(a, b);
        var c = Sa(b.value), d = b.type;
        if (null != c) if ("number" === d) {
          if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
        } else a.value !== "" + c && (a.value = "" + c);
        else if ("submit" === d || "reset" === d) {
          a.removeAttribute("value");
          return;
        }
        b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
        null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
      }
      function db(a, b, c) {
        if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
          var d = b.type;
          if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
          b = "" + a._wrapperState.initialValue;
          c || b === a.value || (a.value = b);
          a.defaultValue = b;
        }
        c = a.name;
        "" !== c && (a.name = "");
        a.defaultChecked = !!a._wrapperState.initialChecked;
        "" !== c && (a.name = c);
      }
      function cb(a, b, c) {
        if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
      }
      var eb = Array.isArray;
      function fb(a, b, c, d) {
        a = a.options;
        if (b) {
          b = {};
          for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
          for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
        } else {
          c = "" + Sa(c);
          b = null;
          for (e = 0; e < a.length; e++) {
            if (a[e].value === c) {
              a[e].selected = true;
              d && (a[e].defaultSelected = true);
              return;
            }
            null !== b || a[e].disabled || (b = a[e]);
          }
          null !== b && (b.selected = true);
        }
      }
      function gb(a, b) {
        if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
        return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
      }
      function hb(a, b) {
        var c = b.value;
        if (null == c) {
          c = b.children;
          b = b.defaultValue;
          if (null != c) {
            if (null != b) throw Error(p(92));
            if (eb(c)) {
              if (1 < c.length) throw Error(p(93));
              c = c[0];
            }
            b = c;
          }
          null == b && (b = "");
          c = b;
        }
        a._wrapperState = { initialValue: Sa(c) };
      }
      function ib(a, b) {
        var c = Sa(b.value), d = Sa(b.defaultValue);
        null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
        null != d && (a.defaultValue = "" + d);
      }
      function jb(a) {
        var b = a.textContent;
        b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
      }
      function kb(a) {
        switch (a) {
          case "svg":
            return "http://www.w3.org/2000/svg";
          case "math":
            return "http://www.w3.org/1998/Math/MathML";
          default:
            return "http://www.w3.org/1999/xhtml";
        }
      }
      function lb(a, b) {
        return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
      }
      var mb;
      var nb = (function(a) {
        return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
          MSApp.execUnsafeLocalFunction(function() {
            return a(b, c, d, e);
          });
        } : a;
      })(function(a, b) {
        if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
        else {
          mb = mb || document.createElement("div");
          mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
          for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
          for (; b.firstChild; ) a.appendChild(b.firstChild);
        }
      });
      function ob(a, b) {
        if (b) {
          var c = a.firstChild;
          if (c && c === a.lastChild && 3 === c.nodeType) {
            c.nodeValue = b;
            return;
          }
        }
        a.textContent = b;
      }
      var pb = {
        animationIterationCount: true,
        aspectRatio: true,
        borderImageOutset: true,
        borderImageSlice: true,
        borderImageWidth: true,
        boxFlex: true,
        boxFlexGroup: true,
        boxOrdinalGroup: true,
        columnCount: true,
        columns: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        flexOrder: true,
        gridArea: true,
        gridRow: true,
        gridRowEnd: true,
        gridRowSpan: true,
        gridRowStart: true,
        gridColumn: true,
        gridColumnEnd: true,
        gridColumnSpan: true,
        gridColumnStart: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        tabSize: true,
        widows: true,
        zIndex: true,
        zoom: true,
        fillOpacity: true,
        floodOpacity: true,
        stopOpacity: true,
        strokeDasharray: true,
        strokeDashoffset: true,
        strokeMiterlimit: true,
        strokeOpacity: true,
        strokeWidth: true
      };
      var qb = ["Webkit", "ms", "Moz", "O"];
      Object.keys(pb).forEach(function(a) {
        qb.forEach(function(b) {
          b = b + a.charAt(0).toUpperCase() + a.substring(1);
          pb[b] = pb[a];
        });
      });
      function rb(a, b, c) {
        return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
      }
      function sb(a, b) {
        a = a.style;
        for (var c in b) if (b.hasOwnProperty(c)) {
          var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
          "float" === c && (c = "cssFloat");
          d ? a.setProperty(c, e) : a[c] = e;
        }
      }
      var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
      function ub(a, b) {
        if (b) {
          if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
          if (null != b.dangerouslySetInnerHTML) {
            if (null != b.children) throw Error(p(60));
            if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
          }
          if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
        }
      }
      function vb(a, b) {
        if (-1 === a.indexOf("-")) return "string" === typeof b.is;
        switch (a) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      var wb = null;
      function xb(a) {
        a = a.target || a.srcElement || window;
        a.correspondingUseElement && (a = a.correspondingUseElement);
        return 3 === a.nodeType ? a.parentNode : a;
      }
      var yb = null;
      var zb = null;
      var Ab = null;
      function Bb(a) {
        if (a = Cb(a)) {
          if ("function" !== typeof yb) throw Error(p(280));
          var b = a.stateNode;
          b && (b = Db(b), yb(a.stateNode, a.type, b));
        }
      }
      function Eb(a) {
        zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
      }
      function Fb() {
        if (zb) {
          var a = zb, b = Ab;
          Ab = zb = null;
          Bb(a);
          if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
        }
      }
      function Gb(a, b) {
        return a(b);
      }
      function Hb() {
      }
      var Ib = false;
      function Jb(a, b, c) {
        if (Ib) return a(b, c);
        Ib = true;
        try {
          return Gb(a, b, c);
        } finally {
          if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
        }
      }
      function Kb(a, b) {
        var c = a.stateNode;
        if (null === c) return null;
        var d = Db(c);
        if (null === d) return null;
        c = d[b];
        a: switch (b) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
            a = !d;
            break a;
          default:
            a = false;
        }
        if (a) return null;
        if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
        return c;
      }
      var Lb = false;
      if (ia) try {
        Mb = {};
        Object.defineProperty(Mb, "passive", { get: function() {
          Lb = true;
        } });
        window.addEventListener("test", Mb, Mb);
        window.removeEventListener("test", Mb, Mb);
      } catch (a) {
        Lb = false;
      }
      var Mb;
      function Nb(a, b, c, d, e, f, g, h, k) {
        var l = Array.prototype.slice.call(arguments, 3);
        try {
          b.apply(c, l);
        } catch (m) {
          this.onError(m);
        }
      }
      var Ob = false;
      var Pb = null;
      var Qb = false;
      var Rb = null;
      var Sb = { onError: function(a) {
        Ob = true;
        Pb = a;
      } };
      function Tb(a, b, c, d, e, f, g, h, k) {
        Ob = false;
        Pb = null;
        Nb.apply(Sb, arguments);
      }
      function Ub(a, b, c, d, e, f, g, h, k) {
        Tb.apply(this, arguments);
        if (Ob) {
          if (Ob) {
            var l = Pb;
            Ob = false;
            Pb = null;
          } else throw Error(p(198));
          Qb || (Qb = true, Rb = l);
        }
      }
      function Vb(a) {
        var b = a, c = a;
        if (a.alternate) for (; b.return; ) b = b.return;
        else {
          a = b;
          do
            b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
          while (a);
        }
        return 3 === b.tag ? c : null;
      }
      function Wb(a) {
        if (13 === a.tag) {
          var b = a.memoizedState;
          null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
          if (null !== b) return b.dehydrated;
        }
        return null;
      }
      function Xb(a) {
        if (Vb(a) !== a) throw Error(p(188));
      }
      function Yb(a) {
        var b = a.alternate;
        if (!b) {
          b = Vb(a);
          if (null === b) throw Error(p(188));
          return b !== a ? null : a;
        }
        for (var c = a, d = b; ; ) {
          var e = c.return;
          if (null === e) break;
          var f = e.alternate;
          if (null === f) {
            d = e.return;
            if (null !== d) {
              c = d;
              continue;
            }
            break;
          }
          if (e.child === f.child) {
            for (f = e.child; f; ) {
              if (f === c) return Xb(e), a;
              if (f === d) return Xb(e), b;
              f = f.sibling;
            }
            throw Error(p(188));
          }
          if (c.return !== d.return) c = e, d = f;
          else {
            for (var g = false, h = e.child; h; ) {
              if (h === c) {
                g = true;
                c = e;
                d = f;
                break;
              }
              if (h === d) {
                g = true;
                d = e;
                c = f;
                break;
              }
              h = h.sibling;
            }
            if (!g) {
              for (h = f.child; h; ) {
                if (h === c) {
                  g = true;
                  c = f;
                  d = e;
                  break;
                }
                if (h === d) {
                  g = true;
                  d = f;
                  c = e;
                  break;
                }
                h = h.sibling;
              }
              if (!g) throw Error(p(189));
            }
          }
          if (c.alternate !== d) throw Error(p(190));
        }
        if (3 !== c.tag) throw Error(p(188));
        return c.stateNode.current === c ? a : b;
      }
      function Zb(a) {
        a = Yb(a);
        return null !== a ? $b(a) : null;
      }
      function $b(a) {
        if (5 === a.tag || 6 === a.tag) return a;
        for (a = a.child; null !== a; ) {
          var b = $b(a);
          if (null !== b) return b;
          a = a.sibling;
        }
        return null;
      }
      var ac = ca.unstable_scheduleCallback;
      var bc = ca.unstable_cancelCallback;
      var cc = ca.unstable_shouldYield;
      var dc = ca.unstable_requestPaint;
      var B = ca.unstable_now;
      var ec = ca.unstable_getCurrentPriorityLevel;
      var fc = ca.unstable_ImmediatePriority;
      var gc = ca.unstable_UserBlockingPriority;
      var hc = ca.unstable_NormalPriority;
      var ic = ca.unstable_LowPriority;
      var jc = ca.unstable_IdlePriority;
      var kc = null;
      var lc = null;
      function mc(a) {
        if (lc && "function" === typeof lc.onCommitFiberRoot) try {
          lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
        } catch (b) {
        }
      }
      var oc = Math.clz32 ? Math.clz32 : nc;
      var pc = Math.log;
      var qc = Math.LN2;
      function nc(a) {
        a >>>= 0;
        return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
      }
      var rc = 64;
      var sc = 4194304;
      function tc(a) {
        switch (a & -a) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return a & 4194240;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return a & 130023424;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 1073741824;
          default:
            return a;
        }
      }
      function uc(a, b) {
        var c = a.pendingLanes;
        if (0 === c) return 0;
        var d = 0, e = a.suspendedLanes, f = a.pingedLanes, g = c & 268435455;
        if (0 !== g) {
          var h = g & ~e;
          0 !== h ? d = tc(h) : (f &= g, 0 !== f && (d = tc(f)));
        } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f && (d = tc(f));
        if (0 === d) return 0;
        if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f = b & -b, e >= f || 16 === e && 0 !== (f & 4194240))) return b;
        0 !== (d & 4) && (d |= c & 16);
        b = a.entangledLanes;
        if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
        return d;
      }
      function vc(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 4:
            return b + 250;
          case 8:
          case 16:
          case 32:
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return b + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return -1;
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function wc(a, b) {
        for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f = a.pendingLanes; 0 < f; ) {
          var g = 31 - oc(f), h = 1 << g, k = e[g];
          if (-1 === k) {
            if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
          } else k <= b && (a.expiredLanes |= h);
          f &= ~h;
        }
      }
      function xc(a) {
        a = a.pendingLanes & -1073741825;
        return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
      }
      function yc() {
        var a = rc;
        rc <<= 1;
        0 === (rc & 4194240) && (rc = 64);
        return a;
      }
      function zc(a) {
        for (var b = [], c = 0; 31 > c; c++) b.push(a);
        return b;
      }
      function Ac(a, b, c) {
        a.pendingLanes |= b;
        536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
        a = a.eventTimes;
        b = 31 - oc(b);
        a[b] = c;
      }
      function Bc(a, b) {
        var c = a.pendingLanes & ~b;
        a.pendingLanes = b;
        a.suspendedLanes = 0;
        a.pingedLanes = 0;
        a.expiredLanes &= b;
        a.mutableReadLanes &= b;
        a.entangledLanes &= b;
        b = a.entanglements;
        var d = a.eventTimes;
        for (a = a.expirationTimes; 0 < c; ) {
          var e = 31 - oc(c), f = 1 << e;
          b[e] = 0;
          d[e] = -1;
          a[e] = -1;
          c &= ~f;
        }
      }
      function Cc(a, b) {
        var c = a.entangledLanes |= b;
        for (a = a.entanglements; c; ) {
          var d = 31 - oc(c), e = 1 << d;
          e & b | a[d] & b && (a[d] |= b);
          c &= ~e;
        }
      }
      var C = 0;
      function Dc(a) {
        a &= -a;
        return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
      }
      var Ec;
      var Fc;
      var Gc;
      var Hc;
      var Ic;
      var Jc = false;
      var Kc = [];
      var Lc = null;
      var Mc = null;
      var Nc = null;
      var Oc = /* @__PURE__ */ new Map();
      var Pc = /* @__PURE__ */ new Map();
      var Qc = [];
      var Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
      function Sc(a, b) {
        switch (a) {
          case "focusin":
          case "focusout":
            Lc = null;
            break;
          case "dragenter":
          case "dragleave":
            Mc = null;
            break;
          case "mouseover":
          case "mouseout":
            Nc = null;
            break;
          case "pointerover":
          case "pointerout":
            Oc.delete(b.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            Pc.delete(b.pointerId);
        }
      }
      function Tc(a, b, c, d, e, f) {
        if (null === a || a.nativeEvent !== f) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
        a.eventSystemFlags |= d;
        b = a.targetContainers;
        null !== e && -1 === b.indexOf(e) && b.push(e);
        return a;
      }
      function Uc(a, b, c, d, e) {
        switch (b) {
          case "focusin":
            return Lc = Tc(Lc, a, b, c, d, e), true;
          case "dragenter":
            return Mc = Tc(Mc, a, b, c, d, e), true;
          case "mouseover":
            return Nc = Tc(Nc, a, b, c, d, e), true;
          case "pointerover":
            var f = e.pointerId;
            Oc.set(f, Tc(Oc.get(f) || null, a, b, c, d, e));
            return true;
          case "gotpointercapture":
            return f = e.pointerId, Pc.set(f, Tc(Pc.get(f) || null, a, b, c, d, e)), true;
        }
        return false;
      }
      function Vc(a) {
        var b = Wc(a.target);
        if (null !== b) {
          var c = Vb(b);
          if (null !== c) {
            if (b = c.tag, 13 === b) {
              if (b = Wb(c), null !== b) {
                a.blockedOn = b;
                Ic(a.priority, function() {
                  Gc(c);
                });
                return;
              }
            } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
              a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
              return;
            }
          }
        }
        a.blockedOn = null;
      }
      function Xc(a) {
        if (null !== a.blockedOn) return false;
        for (var b = a.targetContainers; 0 < b.length; ) {
          var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
          if (null === c) {
            c = a.nativeEvent;
            var d = new c.constructor(c.type, c);
            wb = d;
            c.target.dispatchEvent(d);
            wb = null;
          } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
          b.shift();
        }
        return true;
      }
      function Zc(a, b, c) {
        Xc(a) && c.delete(b);
      }
      function $c() {
        Jc = false;
        null !== Lc && Xc(Lc) && (Lc = null);
        null !== Mc && Xc(Mc) && (Mc = null);
        null !== Nc && Xc(Nc) && (Nc = null);
        Oc.forEach(Zc);
        Pc.forEach(Zc);
      }
      function ad(a, b) {
        a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
      }
      function bd(a) {
        function b(b2) {
          return ad(b2, a);
        }
        if (0 < Kc.length) {
          ad(Kc[0], a);
          for (var c = 1; c < Kc.length; c++) {
            var d = Kc[c];
            d.blockedOn === a && (d.blockedOn = null);
          }
        }
        null !== Lc && ad(Lc, a);
        null !== Mc && ad(Mc, a);
        null !== Nc && ad(Nc, a);
        Oc.forEach(b);
        Pc.forEach(b);
        for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
        for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
      }
      var cd = ua.ReactCurrentBatchConfig;
      var dd = true;
      function ed(a, b, c, d) {
        var e = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 1, fd(a, b, c, d);
        } finally {
          C = e, cd.transition = f;
        }
      }
      function gd(a, b, c, d) {
        var e = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 4, fd(a, b, c, d);
        } finally {
          C = e, cd.transition = f;
        }
      }
      function fd(a, b, c, d) {
        if (dd) {
          var e = Yc(a, b, c, d);
          if (null === e) hd(a, b, d, id, c), Sc(a, d);
          else if (Uc(e, a, b, c, d)) d.stopPropagation();
          else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
            for (; null !== e; ) {
              var f = Cb(e);
              null !== f && Ec(f);
              f = Yc(a, b, c, d);
              null === f && hd(a, b, d, id, c);
              if (f === e) break;
              e = f;
            }
            null !== e && d.stopPropagation();
          } else hd(a, b, d, null, c);
        }
      }
      var id = null;
      function Yc(a, b, c, d) {
        id = null;
        a = xb(d);
        a = Wc(a);
        if (null !== a) if (b = Vb(a), null === b) a = null;
        else if (c = b.tag, 13 === c) {
          a = Wb(b);
          if (null !== a) return a;
          a = null;
        } else if (3 === c) {
          if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
          a = null;
        } else b !== a && (a = null);
        id = a;
        return null;
      }
      function jd(a) {
        switch (a) {
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "resize":
          case "seeked":
          case "submit":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 1;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "scroll":
          case "toggle":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 4;
          case "message":
            switch (ec()) {
              case fc:
                return 1;
              case gc:
                return 4;
              case hc:
              case ic:
                return 16;
              case jc:
                return 536870912;
              default:
                return 16;
            }
          default:
            return 16;
        }
      }
      var kd = null;
      var ld = null;
      var md = null;
      function nd() {
        if (md) return md;
        var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f = e.length;
        for (a = 0; a < c && b[a] === e[a]; a++) ;
        var g = c - a;
        for (d = 1; d <= g && b[c - d] === e[f - d]; d++) ;
        return md = e.slice(a, 1 < d ? 1 - d : void 0);
      }
      function od(a) {
        var b = a.keyCode;
        "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
        10 === a && (a = 13);
        return 32 <= a || 13 === a ? a : 0;
      }
      function pd() {
        return true;
      }
      function qd() {
        return false;
      }
      function rd(a) {
        function b(b2, d, e, f, g) {
          this._reactName = b2;
          this._targetInst = e;
          this.type = d;
          this.nativeEvent = f;
          this.target = g;
          this.currentTarget = null;
          for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f) : f[c]);
          this.isDefaultPrevented = (null != f.defaultPrevented ? f.defaultPrevented : false === f.returnValue) ? pd : qd;
          this.isPropagationStopped = qd;
          return this;
        }
        A(b.prototype, { preventDefault: function() {
          this.defaultPrevented = true;
          var a2 = this.nativeEvent;
          a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
        }, stopPropagation: function() {
          var a2 = this.nativeEvent;
          a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
        }, persist: function() {
        }, isPersistent: pd });
        return b;
      }
      var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
        return a.timeStamp || Date.now();
      }, defaultPrevented: 0, isTrusted: 0 };
      var td = rd(sd);
      var ud = A({}, sd, { view: 0, detail: 0 });
      var vd = rd(ud);
      var wd;
      var xd;
      var yd;
      var Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
        return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
      }, movementX: function(a) {
        if ("movementX" in a) return a.movementX;
        a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
        return wd;
      }, movementY: function(a) {
        return "movementY" in a ? a.movementY : xd;
      } });
      var Bd = rd(Ad);
      var Cd = A({}, Ad, { dataTransfer: 0 });
      var Dd = rd(Cd);
      var Ed = A({}, ud, { relatedTarget: 0 });
      var Fd = rd(Ed);
      var Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Hd = rd(Gd);
      var Id = A({}, sd, { clipboardData: function(a) {
        return "clipboardData" in a ? a.clipboardData : window.clipboardData;
      } });
      var Jd = rd(Id);
      var Kd = A({}, sd, { data: 0 });
      var Ld = rd(Kd);
      var Md = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      };
      var Nd = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
      function Pd(a) {
        var b = this.nativeEvent;
        return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
      }
      function zd() {
        return Pd;
      }
      var Qd = A({}, ud, { key: function(a) {
        if (a.key) {
          var b = Md[a.key] || a.key;
          if ("Unidentified" !== b) return b;
        }
        return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
      }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
        return "keypress" === a.type ? od(a) : 0;
      }, keyCode: function(a) {
        return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      }, which: function(a) {
        return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      } });
      var Rd = rd(Qd);
      var Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 });
      var Td = rd(Sd);
      var Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd });
      var Vd = rd(Ud);
      var Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Xd = rd(Wd);
      var Yd = A({}, Ad, {
        deltaX: function(a) {
          return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
        },
        deltaY: function(a) {
          return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      });
      var Zd = rd(Yd);
      var $d = [9, 13, 27, 32];
      var ae = ia && "CompositionEvent" in window;
      var be = null;
      ia && "documentMode" in document && (be = document.documentMode);
      var ce = ia && "TextEvent" in window && !be;
      var de = ia && (!ae || be && 8 < be && 11 >= be);
      var ee = String.fromCharCode(32);
      var fe = false;
      function ge(a, b) {
        switch (a) {
          case "keyup":
            return -1 !== $d.indexOf(b.keyCode);
          case "keydown":
            return 229 !== b.keyCode;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function he(a) {
        a = a.detail;
        return "object" === typeof a && "data" in a ? a.data : null;
      }
      var ie = false;
      function je(a, b) {
        switch (a) {
          case "compositionend":
            return he(b);
          case "keypress":
            if (32 !== b.which) return null;
            fe = true;
            return ee;
          case "textInput":
            return a = b.data, a === ee && fe ? null : a;
          default:
            return null;
        }
      }
      function ke(a, b) {
        if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
        switch (a) {
          case "paste":
            return null;
          case "keypress":
            if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
              if (b.char && 1 < b.char.length) return b.char;
              if (b.which) return String.fromCharCode(b.which);
            }
            return null;
          case "compositionend":
            return de && "ko" !== b.locale ? null : b.data;
          default:
            return null;
        }
      }
      var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
      function me(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
      }
      function ne(a, b, c, d) {
        Eb(d);
        b = oe(b, "onChange");
        0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
      }
      var pe = null;
      var qe = null;
      function re(a) {
        se(a, 0);
      }
      function te(a) {
        var b = ue(a);
        if (Wa(b)) return a;
      }
      function ve(a, b) {
        if ("change" === a) return b;
      }
      var we = false;
      if (ia) {
        if (ia) {
          ye = "oninput" in document;
          if (!ye) {
            ze = document.createElement("div");
            ze.setAttribute("oninput", "return;");
            ye = "function" === typeof ze.oninput;
          }
          xe = ye;
        } else xe = false;
        we = xe && (!document.documentMode || 9 < document.documentMode);
      }
      var xe;
      var ye;
      var ze;
      function Ae() {
        pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
      }
      function Be(a) {
        if ("value" === a.propertyName && te(qe)) {
          var b = [];
          ne(b, qe, a, xb(a));
          Jb(re, b);
        }
      }
      function Ce(a, b, c) {
        "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
      }
      function De(a) {
        if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
      }
      function Ee(a, b) {
        if ("click" === a) return te(b);
      }
      function Fe(a, b) {
        if ("input" === a || "change" === a) return te(b);
      }
      function Ge(a, b) {
        return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
      }
      var He = "function" === typeof Object.is ? Object.is : Ge;
      function Ie(a, b) {
        if (He(a, b)) return true;
        if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
        var c = Object.keys(a), d = Object.keys(b);
        if (c.length !== d.length) return false;
        for (d = 0; d < c.length; d++) {
          var e = c[d];
          if (!ja.call(b, e) || !He(a[e], b[e])) return false;
        }
        return true;
      }
      function Je(a) {
        for (; a && a.firstChild; ) a = a.firstChild;
        return a;
      }
      function Ke(a, b) {
        var c = Je(a);
        a = 0;
        for (var d; c; ) {
          if (3 === c.nodeType) {
            d = a + c.textContent.length;
            if (a <= b && d >= b) return { node: c, offset: b - a };
            a = d;
          }
          a: {
            for (; c; ) {
              if (c.nextSibling) {
                c = c.nextSibling;
                break a;
              }
              c = c.parentNode;
            }
            c = void 0;
          }
          c = Je(c);
        }
      }
      function Le(a, b) {
        return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
      }
      function Me() {
        for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
          try {
            var c = "string" === typeof b.contentWindow.location.href;
          } catch (d) {
            c = false;
          }
          if (c) a = b.contentWindow;
          else break;
          b = Xa(a.document);
        }
        return b;
      }
      function Ne(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
      }
      function Oe(a) {
        var b = Me(), c = a.focusedElem, d = a.selectionRange;
        if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
          if (null !== d && Ne(c)) {
            if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
            else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
              a = a.getSelection();
              var e = c.textContent.length, f = Math.min(d.start, e);
              d = void 0 === d.end ? f : Math.min(d.end, e);
              !a.extend && f > d && (e = d, d = f, f = e);
              e = Ke(c, f);
              var g = Ke(
                c,
                d
              );
              e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
            }
          }
          b = [];
          for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
          "function" === typeof c.focus && c.focus();
          for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
        }
      }
      var Pe = ia && "documentMode" in document && 11 >= document.documentMode;
      var Qe = null;
      var Re = null;
      var Se = null;
      var Te = false;
      function Ue(a, b, c) {
        var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
        Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
      }
      function Ve(a, b) {
        var c = {};
        c[a.toLowerCase()] = b.toLowerCase();
        c["Webkit" + a] = "webkit" + b;
        c["Moz" + a] = "moz" + b;
        return c;
      }
      var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") };
      var Xe = {};
      var Ye = {};
      ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
      function Ze(a) {
        if (Xe[a]) return Xe[a];
        if (!We[a]) return a;
        var b = We[a], c;
        for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
        return a;
      }
      var $e = Ze("animationend");
      var af = Ze("animationiteration");
      var bf = Ze("animationstart");
      var cf = Ze("transitionend");
      var df = /* @__PURE__ */ new Map();
      var ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
      function ff(a, b) {
        df.set(a, b);
        fa(b, [a]);
      }
      for (gf = 0; gf < ef.length; gf++) {
        hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
        ff(jf, "on" + kf);
      }
      var hf;
      var jf;
      var kf;
      var gf;
      ff($e, "onAnimationEnd");
      ff(af, "onAnimationIteration");
      ff(bf, "onAnimationStart");
      ff("dblclick", "onDoubleClick");
      ff("focusin", "onFocus");
      ff("focusout", "onBlur");
      ff(cf, "onTransitionEnd");
      ha("onMouseEnter", ["mouseout", "mouseover"]);
      ha("onMouseLeave", ["mouseout", "mouseover"]);
      ha("onPointerEnter", ["pointerout", "pointerover"]);
      ha("onPointerLeave", ["pointerout", "pointerover"]);
      fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
      fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
      fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
      fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
      var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
      var mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
      function nf(a, b, c) {
        var d = a.type || "unknown-event";
        a.currentTarget = c;
        Ub(d, b, void 0, a);
        a.currentTarget = null;
      }
      function se(a, b) {
        b = 0 !== (b & 4);
        for (var c = 0; c < a.length; c++) {
          var d = a[c], e = d.event;
          d = d.listeners;
          a: {
            var f = void 0;
            if (b) for (var g = d.length - 1; 0 <= g; g--) {
              var h = d[g], k = h.instance, l = h.currentTarget;
              h = h.listener;
              if (k !== f && e.isPropagationStopped()) break a;
              nf(e, h, l);
              f = k;
            }
            else for (g = 0; g < d.length; g++) {
              h = d[g];
              k = h.instance;
              l = h.currentTarget;
              h = h.listener;
              if (k !== f && e.isPropagationStopped()) break a;
              nf(e, h, l);
              f = k;
            }
          }
        }
        if (Qb) throw a = Rb, Qb = false, Rb = null, a;
      }
      function D(a, b) {
        var c = b[of];
        void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
        var d = a + "__bubble";
        c.has(d) || (pf(b, a, 2, false), c.add(d));
      }
      function qf(a, b, c) {
        var d = 0;
        b && (d |= 4);
        pf(c, a, d, b);
      }
      var rf = "_reactListening" + Math.random().toString(36).slice(2);
      function sf(a) {
        if (!a[rf]) {
          a[rf] = true;
          da.forEach(function(b2) {
            "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
          });
          var b = 9 === a.nodeType ? a : a.ownerDocument;
          null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
        }
      }
      function pf(a, b, c, d) {
        switch (jd(b)) {
          case 1:
            var e = ed;
            break;
          case 4:
            e = gd;
            break;
          default:
            e = fd;
        }
        c = e.bind(null, b, c, a);
        e = void 0;
        !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
        d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
      }
      function hd(a, b, c, d, e) {
        var f = d;
        if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
          if (null === d) return;
          var g = d.tag;
          if (3 === g || 4 === g) {
            var h = d.stateNode.containerInfo;
            if (h === e || 8 === h.nodeType && h.parentNode === e) break;
            if (4 === g) for (g = d.return; null !== g; ) {
              var k = g.tag;
              if (3 === k || 4 === k) {
                if (k = g.stateNode.containerInfo, k === e || 8 === k.nodeType && k.parentNode === e) return;
              }
              g = g.return;
            }
            for (; null !== h; ) {
              g = Wc(h);
              if (null === g) return;
              k = g.tag;
              if (5 === k || 6 === k) {
                d = f = g;
                continue a;
              }
              h = h.parentNode;
            }
          }
          d = d.return;
        }
        Jb(function() {
          var d2 = f, e2 = xb(c), g2 = [];
          a: {
            var h2 = df.get(a);
            if (void 0 !== h2) {
              var k2 = td, n = a;
              switch (a) {
                case "keypress":
                  if (0 === od(c)) break a;
                case "keydown":
                case "keyup":
                  k2 = Rd;
                  break;
                case "focusin":
                  n = "focus";
                  k2 = Fd;
                  break;
                case "focusout":
                  n = "blur";
                  k2 = Fd;
                  break;
                case "beforeblur":
                case "afterblur":
                  k2 = Fd;
                  break;
                case "click":
                  if (2 === c.button) break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  k2 = Bd;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  k2 = Dd;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  k2 = Vd;
                  break;
                case $e:
                case af:
                case bf:
                  k2 = Hd;
                  break;
                case cf:
                  k2 = Xd;
                  break;
                case "scroll":
                  k2 = vd;
                  break;
                case "wheel":
                  k2 = Zd;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  k2 = Jd;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  k2 = Td;
              }
              var t = 0 !== (b & 4), J = !t && "scroll" === a, x = t ? null !== h2 ? h2 + "Capture" : null : h2;
              t = [];
              for (var w = d2, u; null !== w; ) {
                u = w;
                var F = u.stateNode;
                5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t.push(tf(w, F, u))));
                if (J) break;
                w = w.return;
              }
              0 < t.length && (h2 = new k2(h2, n, null, c, e2), g2.push({ event: h2, listeners: t }));
            }
          }
          if (0 === (b & 7)) {
            a: {
              h2 = "mouseover" === a || "pointerover" === a;
              k2 = "mouseout" === a || "pointerout" === a;
              if (h2 && c !== wb && (n = c.relatedTarget || c.fromElement) && (Wc(n) || n[uf])) break a;
              if (k2 || h2) {
                h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
                if (k2) {
                  if (n = c.relatedTarget || c.toElement, k2 = d2, n = n ? Wc(n) : null, null !== n && (J = Vb(n), n !== J || 5 !== n.tag && 6 !== n.tag)) n = null;
                } else k2 = null, n = d2;
                if (k2 !== n) {
                  t = Bd;
                  F = "onMouseLeave";
                  x = "onMouseEnter";
                  w = "mouse";
                  if ("pointerout" === a || "pointerover" === a) t = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
                  J = null == k2 ? h2 : ue(k2);
                  u = null == n ? h2 : ue(n);
                  h2 = new t(F, w + "leave", k2, c, e2);
                  h2.target = J;
                  h2.relatedTarget = u;
                  F = null;
                  Wc(e2) === d2 && (t = new t(x, w + "enter", n, c, e2), t.target = u, t.relatedTarget = J, F = t);
                  J = F;
                  if (k2 && n) b: {
                    t = k2;
                    x = n;
                    w = 0;
                    for (u = t; u; u = vf(u)) w++;
                    u = 0;
                    for (F = x; F; F = vf(F)) u++;
                    for (; 0 < w - u; ) t = vf(t), w--;
                    for (; 0 < u - w; ) x = vf(x), u--;
                    for (; w--; ) {
                      if (t === x || null !== x && t === x.alternate) break b;
                      t = vf(t);
                      x = vf(x);
                    }
                    t = null;
                  }
                  else t = null;
                  null !== k2 && wf(g2, h2, k2, t, false);
                  null !== n && null !== J && wf(g2, J, n, t, true);
                }
              }
            }
            a: {
              h2 = d2 ? ue(d2) : window;
              k2 = h2.nodeName && h2.nodeName.toLowerCase();
              if ("select" === k2 || "input" === k2 && "file" === h2.type) var na = ve;
              else if (me(h2)) if (we) na = Fe;
              else {
                na = De;
                var xa = Ce;
              }
              else (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
              if (na && (na = na(a, d2))) {
                ne(g2, na, c, e2);
                break a;
              }
              xa && xa(a, h2, d2);
              "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
            }
            xa = d2 ? ue(d2) : window;
            switch (a) {
              case "focusin":
                if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
                break;
              case "focusout":
                Se = Re = Qe = null;
                break;
              case "mousedown":
                Te = true;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                Te = false;
                Ue(g2, c, e2);
                break;
              case "selectionchange":
                if (Pe) break;
              case "keydown":
              case "keyup":
                Ue(g2, c, e2);
            }
            var $a;
            if (ae) b: {
              switch (a) {
                case "compositionstart":
                  var ba = "onCompositionStart";
                  break b;
                case "compositionend":
                  ba = "onCompositionEnd";
                  break b;
                case "compositionupdate":
                  ba = "onCompositionUpdate";
                  break b;
              }
              ba = void 0;
            }
            else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
            ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
            if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
          }
          se(g2, b);
        });
      }
      function tf(a, b, c) {
        return { instance: a, listener: b, currentTarget: c };
      }
      function oe(a, b) {
        for (var c = b + "Capture", d = []; null !== a; ) {
          var e = a, f = e.stateNode;
          5 === e.tag && null !== f && (e = f, f = Kb(a, c), null != f && d.unshift(tf(a, f, e)), f = Kb(a, b), null != f && d.push(tf(a, f, e)));
          a = a.return;
        }
        return d;
      }
      function vf(a) {
        if (null === a) return null;
        do
          a = a.return;
        while (a && 5 !== a.tag);
        return a ? a : null;
      }
      function wf(a, b, c, d, e) {
        for (var f = b._reactName, g = []; null !== c && c !== d; ) {
          var h = c, k = h.alternate, l = h.stateNode;
          if (null !== k && k === d) break;
          5 === h.tag && null !== l && (h = l, e ? (k = Kb(c, f), null != k && g.unshift(tf(c, k, h))) : e || (k = Kb(c, f), null != k && g.push(tf(c, k, h))));
          c = c.return;
        }
        0 !== g.length && a.push({ event: b, listeners: g });
      }
      var xf = /\r\n?/g;
      var yf = /\u0000|\uFFFD/g;
      function zf(a) {
        return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
      }
      function Af(a, b, c) {
        b = zf(b);
        if (zf(a) !== b && c) throw Error(p(425));
      }
      function Bf() {
      }
      var Cf = null;
      var Df = null;
      function Ef(a, b) {
        return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
      }
      var Ff = "function" === typeof setTimeout ? setTimeout : void 0;
      var Gf = "function" === typeof clearTimeout ? clearTimeout : void 0;
      var Hf = "function" === typeof Promise ? Promise : void 0;
      var Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
        return Hf.resolve(null).then(a).catch(If);
      } : Ff;
      function If(a) {
        setTimeout(function() {
          throw a;
        });
      }
      function Kf(a, b) {
        var c = b, d = 0;
        do {
          var e = c.nextSibling;
          a.removeChild(c);
          if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
            if (0 === d) {
              a.removeChild(e);
              bd(b);
              return;
            }
            d--;
          } else "$" !== c && "$?" !== c && "$!" !== c || d++;
          c = e;
        } while (c);
        bd(b);
      }
      function Lf(a) {
        for (; null != a; a = a.nextSibling) {
          var b = a.nodeType;
          if (1 === b || 3 === b) break;
          if (8 === b) {
            b = a.data;
            if ("$" === b || "$!" === b || "$?" === b) break;
            if ("/$" === b) return null;
          }
        }
        return a;
      }
      function Mf(a) {
        a = a.previousSibling;
        for (var b = 0; a; ) {
          if (8 === a.nodeType) {
            var c = a.data;
            if ("$" === c || "$!" === c || "$?" === c) {
              if (0 === b) return a;
              b--;
            } else "/$" === c && b++;
          }
          a = a.previousSibling;
        }
        return null;
      }
      var Nf = Math.random().toString(36).slice(2);
      var Of = "__reactFiber$" + Nf;
      var Pf = "__reactProps$" + Nf;
      var uf = "__reactContainer$" + Nf;
      var of = "__reactEvents$" + Nf;
      var Qf = "__reactListeners$" + Nf;
      var Rf = "__reactHandles$" + Nf;
      function Wc(a) {
        var b = a[Of];
        if (b) return b;
        for (var c = a.parentNode; c; ) {
          if (b = c[uf] || c[Of]) {
            c = b.alternate;
            if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
              if (c = a[Of]) return c;
              a = Mf(a);
            }
            return b;
          }
          a = c;
          c = a.parentNode;
        }
        return null;
      }
      function Cb(a) {
        a = a[Of] || a[uf];
        return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
      }
      function ue(a) {
        if (5 === a.tag || 6 === a.tag) return a.stateNode;
        throw Error(p(33));
      }
      function Db(a) {
        return a[Pf] || null;
      }
      var Sf = [];
      var Tf = -1;
      function Uf(a) {
        return { current: a };
      }
      function E(a) {
        0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
      }
      function G(a, b) {
        Tf++;
        Sf[Tf] = a.current;
        a.current = b;
      }
      var Vf = {};
      var H = Uf(Vf);
      var Wf = Uf(false);
      var Xf = Vf;
      function Yf(a, b) {
        var c = a.type.contextTypes;
        if (!c) return Vf;
        var d = a.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
        var e = {}, f;
        for (f in c) e[f] = b[f];
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
        return e;
      }
      function Zf(a) {
        a = a.childContextTypes;
        return null !== a && void 0 !== a;
      }
      function $f() {
        E(Wf);
        E(H);
      }
      function ag(a, b, c) {
        if (H.current !== Vf) throw Error(p(168));
        G(H, b);
        G(Wf, c);
      }
      function bg(a, b, c) {
        var d = a.stateNode;
        b = b.childContextTypes;
        if ("function" !== typeof d.getChildContext) return c;
        d = d.getChildContext();
        for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
        return A({}, c, d);
      }
      function cg(a) {
        a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
        Xf = H.current;
        G(H, a);
        G(Wf, Wf.current);
        return true;
      }
      function dg(a, b, c) {
        var d = a.stateNode;
        if (!d) throw Error(p(169));
        c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
        G(Wf, c);
      }
      var eg = null;
      var fg = false;
      var gg = false;
      function hg(a) {
        null === eg ? eg = [a] : eg.push(a);
      }
      function ig(a) {
        fg = true;
        hg(a);
      }
      function jg() {
        if (!gg && null !== eg) {
          gg = true;
          var a = 0, b = C;
          try {
            var c = eg;
            for (C = 1; a < c.length; a++) {
              var d = c[a];
              do
                d = d(true);
              while (null !== d);
            }
            eg = null;
            fg = false;
          } catch (e) {
            throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
          } finally {
            C = b, gg = false;
          }
        }
        return null;
      }
      var kg = [];
      var lg = 0;
      var mg = null;
      var ng = 0;
      var og = [];
      var pg = 0;
      var qg = null;
      var rg = 1;
      var sg = "";
      function tg(a, b) {
        kg[lg++] = ng;
        kg[lg++] = mg;
        mg = a;
        ng = b;
      }
      function ug(a, b, c) {
        og[pg++] = rg;
        og[pg++] = sg;
        og[pg++] = qg;
        qg = a;
        var d = rg;
        a = sg;
        var e = 32 - oc(d) - 1;
        d &= ~(1 << e);
        c += 1;
        var f = 32 - oc(b) + e;
        if (30 < f) {
          var g = e - e % 5;
          f = (d & (1 << g) - 1).toString(32);
          d >>= g;
          e -= g;
          rg = 1 << 32 - oc(b) + e | c << e | d;
          sg = f + a;
        } else rg = 1 << f | c << e | d, sg = a;
      }
      function vg(a) {
        null !== a.return && (tg(a, 1), ug(a, 1, 0));
      }
      function wg(a) {
        for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
        for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
      }
      var xg = null;
      var yg = null;
      var I = false;
      var zg = null;
      function Ag(a, b) {
        var c = Bg(5, null, null, 0);
        c.elementType = "DELETED";
        c.stateNode = b;
        c.return = a;
        b = a.deletions;
        null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
      }
      function Cg(a, b) {
        switch (a.tag) {
          case 5:
            var c = a.type;
            b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
            return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
          case 6:
            return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
          case 13:
            return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
          default:
            return false;
        }
      }
      function Dg(a) {
        return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
      }
      function Eg(a) {
        if (I) {
          var b = yg;
          if (b) {
            var c = b;
            if (!Cg(a, b)) {
              if (Dg(a)) throw Error(p(418));
              b = Lf(c.nextSibling);
              var d = xg;
              b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
            }
          } else {
            if (Dg(a)) throw Error(p(418));
            a.flags = a.flags & -4097 | 2;
            I = false;
            xg = a;
          }
        }
      }
      function Fg(a) {
        for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
        xg = a;
      }
      function Gg(a) {
        if (a !== xg) return false;
        if (!I) return Fg(a), I = true, false;
        var b;
        (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
        if (b && (b = yg)) {
          if (Dg(a)) throw Hg(), Error(p(418));
          for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
        }
        Fg(a);
        if (13 === a.tag) {
          a = a.memoizedState;
          a = null !== a ? a.dehydrated : null;
          if (!a) throw Error(p(317));
          a: {
            a = a.nextSibling;
            for (b = 0; a; ) {
              if (8 === a.nodeType) {
                var c = a.data;
                if ("/$" === c) {
                  if (0 === b) {
                    yg = Lf(a.nextSibling);
                    break a;
                  }
                  b--;
                } else "$" !== c && "$!" !== c && "$?" !== c || b++;
              }
              a = a.nextSibling;
            }
            yg = null;
          }
        } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
        return true;
      }
      function Hg() {
        for (var a = yg; a; ) a = Lf(a.nextSibling);
      }
      function Ig() {
        yg = xg = null;
        I = false;
      }
      function Jg(a) {
        null === zg ? zg = [a] : zg.push(a);
      }
      var Kg = ua.ReactCurrentBatchConfig;
      function Lg(a, b, c) {
        a = c.ref;
        if (null !== a && "function" !== typeof a && "object" !== typeof a) {
          if (c._owner) {
            c = c._owner;
            if (c) {
              if (1 !== c.tag) throw Error(p(309));
              var d = c.stateNode;
            }
            if (!d) throw Error(p(147, a));
            var e = d, f = "" + a;
            if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f) return b.ref;
            b = function(a2) {
              var b2 = e.refs;
              null === a2 ? delete b2[f] : b2[f] = a2;
            };
            b._stringRef = f;
            return b;
          }
          if ("string" !== typeof a) throw Error(p(284));
          if (!c._owner) throw Error(p(290, a));
        }
        return a;
      }
      function Mg(a, b) {
        a = Object.prototype.toString.call(b);
        throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
      }
      function Ng(a) {
        var b = a._init;
        return b(a._payload);
      }
      function Og(a) {
        function b(b2, c2) {
          if (a) {
            var d2 = b2.deletions;
            null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
          }
        }
        function c(c2, d2) {
          if (!a) return null;
          for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
          return null;
        }
        function d(a2, b2) {
          for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
          return a2;
        }
        function e(a2, b2) {
          a2 = Pg(a2, b2);
          a2.index = 0;
          a2.sibling = null;
          return a2;
        }
        function f(b2, c2, d2) {
          b2.index = d2;
          if (!a) return b2.flags |= 1048576, c2;
          d2 = b2.alternate;
          if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
          b2.flags |= 2;
          return c2;
        }
        function g(b2) {
          a && null === b2.alternate && (b2.flags |= 2);
          return b2;
        }
        function h(a2, b2, c2, d2) {
          if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2);
          b2.return = a2;
          return b2;
        }
        function k(a2, b2, c2, d2) {
          var f2 = c2.type;
          if (f2 === ya) return m(a2, b2, c2.props.children, d2, c2.key);
          if (null !== b2 && (b2.elementType === f2 || "object" === typeof f2 && null !== f2 && f2.$$typeof === Ha && Ng(f2) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
          d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
          d2.ref = Lg(a2, b2, c2);
          d2.return = a2;
          return d2;
        }
        function l(a2, b2, c2, d2) {
          if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2.children || []);
          b2.return = a2;
          return b2;
        }
        function m(a2, b2, c2, d2, f2) {
          if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f2), b2.return = a2, b2;
          b2 = e(b2, c2);
          b2.return = a2;
          return b2;
        }
        function q(a2, b2, c2) {
          if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
          if ("object" === typeof b2 && null !== b2) {
            switch (b2.$$typeof) {
              case va:
                return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
              case wa:
                return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
              case Ha:
                var d2 = b2._init;
                return q(a2, d2(b2._payload), c2);
            }
            if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
            Mg(a2, b2);
          }
          return null;
        }
        function r(a2, b2, c2, d2) {
          var e2 = null !== b2 ? b2.key : null;
          if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
          if ("object" === typeof c2 && null !== c2) {
            switch (c2.$$typeof) {
              case va:
                return c2.key === e2 ? k(a2, b2, c2, d2) : null;
              case wa:
                return c2.key === e2 ? l(a2, b2, c2, d2) : null;
              case Ha:
                return e2 = c2._init, r(
                  a2,
                  b2,
                  e2(c2._payload),
                  d2
                );
            }
            if (eb(c2) || Ka(c2)) return null !== e2 ? null : m(a2, b2, c2, d2, null);
            Mg(a2, c2);
          }
          return null;
        }
        function y(a2, b2, c2, d2, e2) {
          if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
          if ("object" === typeof d2 && null !== d2) {
            switch (d2.$$typeof) {
              case va:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k(b2, a2, d2, e2);
              case wa:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l(b2, a2, d2, e2);
              case Ha:
                var f2 = d2._init;
                return y(a2, b2, c2, f2(d2._payload), e2);
            }
            if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m(b2, a2, d2, e2, null);
            Mg(b2, d2);
          }
          return null;
        }
        function n(e2, g2, h2, k2) {
          for (var l2 = null, m2 = null, u = g2, w = g2 = 0, x = null; null !== u && w < h2.length; w++) {
            u.index > w ? (x = u, u = null) : x = u.sibling;
            var n2 = r(e2, u, h2[w], k2);
            if (null === n2) {
              null === u && (u = x);
              break;
            }
            a && u && null === n2.alternate && b(e2, u);
            g2 = f(n2, g2, w);
            null === m2 ? l2 = n2 : m2.sibling = n2;
            m2 = n2;
            u = x;
          }
          if (w === h2.length) return c(e2, u), I && tg(e2, w), l2;
          if (null === u) {
            for (; w < h2.length; w++) u = q(e2, h2[w], k2), null !== u && (g2 = f(u, g2, w), null === m2 ? l2 = u : m2.sibling = u, m2 = u);
            I && tg(e2, w);
            return l2;
          }
          for (u = d(e2, u); w < h2.length; w++) x = y(u, e2, w, h2[w], k2), null !== x && (a && null !== x.alternate && u.delete(null === x.key ? w : x.key), g2 = f(x, g2, w), null === m2 ? l2 = x : m2.sibling = x, m2 = x);
          a && u.forEach(function(a2) {
            return b(e2, a2);
          });
          I && tg(e2, w);
          return l2;
        }
        function t(e2, g2, h2, k2) {
          var l2 = Ka(h2);
          if ("function" !== typeof l2) throw Error(p(150));
          h2 = l2.call(h2);
          if (null == h2) throw Error(p(151));
          for (var u = l2 = null, m2 = g2, w = g2 = 0, x = null, n2 = h2.next(); null !== m2 && !n2.done; w++, n2 = h2.next()) {
            m2.index > w ? (x = m2, m2 = null) : x = m2.sibling;
            var t2 = r(e2, m2, n2.value, k2);
            if (null === t2) {
              null === m2 && (m2 = x);
              break;
            }
            a && m2 && null === t2.alternate && b(e2, m2);
            g2 = f(t2, g2, w);
            null === u ? l2 = t2 : u.sibling = t2;
            u = t2;
            m2 = x;
          }
          if (n2.done) return c(
            e2,
            m2
          ), I && tg(e2, w), l2;
          if (null === m2) {
            for (; !n2.done; w++, n2 = h2.next()) n2 = q(e2, n2.value, k2), null !== n2 && (g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
            I && tg(e2, w);
            return l2;
          }
          for (m2 = d(e2, m2); !n2.done; w++, n2 = h2.next()) n2 = y(m2, e2, w, n2.value, k2), null !== n2 && (a && null !== n2.alternate && m2.delete(null === n2.key ? w : n2.key), g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
          a && m2.forEach(function(a2) {
            return b(e2, a2);
          });
          I && tg(e2, w);
          return l2;
        }
        function J(a2, d2, f2, h2) {
          "object" === typeof f2 && null !== f2 && f2.type === ya && null === f2.key && (f2 = f2.props.children);
          if ("object" === typeof f2 && null !== f2) {
            switch (f2.$$typeof) {
              case va:
                a: {
                  for (var k2 = f2.key, l2 = d2; null !== l2; ) {
                    if (l2.key === k2) {
                      k2 = f2.type;
                      if (k2 === ya) {
                        if (7 === l2.tag) {
                          c(a2, l2.sibling);
                          d2 = e(l2, f2.props.children);
                          d2.return = a2;
                          a2 = d2;
                          break a;
                        }
                      } else if (l2.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && Ng(k2) === l2.type) {
                        c(a2, l2.sibling);
                        d2 = e(l2, f2.props);
                        d2.ref = Lg(a2, l2, f2);
                        d2.return = a2;
                        a2 = d2;
                        break a;
                      }
                      c(a2, l2);
                      break;
                    } else b(a2, l2);
                    l2 = l2.sibling;
                  }
                  f2.type === ya ? (d2 = Tg(f2.props.children, a2.mode, h2, f2.key), d2.return = a2, a2 = d2) : (h2 = Rg(f2.type, f2.key, f2.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f2), h2.return = a2, a2 = h2);
                }
                return g(a2);
              case wa:
                a: {
                  for (l2 = f2.key; null !== d2; ) {
                    if (d2.key === l2) if (4 === d2.tag && d2.stateNode.containerInfo === f2.containerInfo && d2.stateNode.implementation === f2.implementation) {
                      c(a2, d2.sibling);
                      d2 = e(d2, f2.children || []);
                      d2.return = a2;
                      a2 = d2;
                      break a;
                    } else {
                      c(a2, d2);
                      break;
                    }
                    else b(a2, d2);
                    d2 = d2.sibling;
                  }
                  d2 = Sg(f2, a2.mode, h2);
                  d2.return = a2;
                  a2 = d2;
                }
                return g(a2);
              case Ha:
                return l2 = f2._init, J(a2, d2, l2(f2._payload), h2);
            }
            if (eb(f2)) return n(a2, d2, f2, h2);
            if (Ka(f2)) return t(a2, d2, f2, h2);
            Mg(a2, f2);
          }
          return "string" === typeof f2 && "" !== f2 || "number" === typeof f2 ? (f2 = "" + f2, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f2), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f2, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
        }
        return J;
      }
      var Ug = Og(true);
      var Vg = Og(false);
      var Wg = Uf(null);
      var Xg = null;
      var Yg = null;
      var Zg = null;
      function $g() {
        Zg = Yg = Xg = null;
      }
      function ah(a) {
        var b = Wg.current;
        E(Wg);
        a._currentValue = b;
      }
      function bh(a, b, c) {
        for (; null !== a; ) {
          var d = a.alternate;
          (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
          if (a === c) break;
          a = a.return;
        }
      }
      function ch(a, b) {
        Xg = a;
        Zg = Yg = null;
        a = a.dependencies;
        null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
      }
      function eh(a) {
        var b = a._currentValue;
        if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
          if (null === Xg) throw Error(p(308));
          Yg = a;
          Xg.dependencies = { lanes: 0, firstContext: a };
        } else Yg = Yg.next = a;
        return b;
      }
      var fh = null;
      function gh(a) {
        null === fh ? fh = [a] : fh.push(a);
      }
      function hh(a, b, c, d) {
        var e = b.interleaved;
        null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
        b.interleaved = c;
        return ih(a, d);
      }
      function ih(a, b) {
        a.lanes |= b;
        var c = a.alternate;
        null !== c && (c.lanes |= b);
        c = a;
        for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
        return 3 === c.tag ? c.stateNode : null;
      }
      var jh = false;
      function kh(a) {
        a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
      }
      function lh(a, b) {
        a = a.updateQueue;
        b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
      }
      function mh(a, b) {
        return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
      }
      function nh(a, b, c) {
        var d = a.updateQueue;
        if (null === d) return null;
        d = d.shared;
        if (0 !== (K & 2)) {
          var e = d.pending;
          null === e ? b.next = b : (b.next = e.next, e.next = b);
          d.pending = b;
          return ih(a, c);
        }
        e = d.interleaved;
        null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
        d.interleaved = b;
        return ih(a, c);
      }
      function oh(a, b, c) {
        b = b.updateQueue;
        if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      function ph(a, b) {
        var c = a.updateQueue, d = a.alternate;
        if (null !== d && (d = d.updateQueue, c === d)) {
          var e = null, f = null;
          c = c.firstBaseUpdate;
          if (null !== c) {
            do {
              var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
              null === f ? e = f = g : f = f.next = g;
              c = c.next;
            } while (null !== c);
            null === f ? e = f = b : f = f.next = b;
          } else e = f = b;
          c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f, shared: d.shared, effects: d.effects };
          a.updateQueue = c;
          return;
        }
        a = c.lastBaseUpdate;
        null === a ? c.firstBaseUpdate = b : a.next = b;
        c.lastBaseUpdate = b;
      }
      function qh(a, b, c, d) {
        var e = a.updateQueue;
        jh = false;
        var f = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
        if (null !== h) {
          e.shared.pending = null;
          var k = h, l = k.next;
          k.next = null;
          null === g ? f = l : g.next = l;
          g = k;
          var m = a.alternate;
          null !== m && (m = m.updateQueue, h = m.lastBaseUpdate, h !== g && (null === h ? m.firstBaseUpdate = l : h.next = l, m.lastBaseUpdate = k));
        }
        if (null !== f) {
          var q = e.baseState;
          g = 0;
          m = l = k = null;
          h = f;
          do {
            var r = h.lane, y = h.eventTime;
            if ((d & r) === r) {
              null !== m && (m = m.next = {
                eventTime: y,
                lane: 0,
                tag: h.tag,
                payload: h.payload,
                callback: h.callback,
                next: null
              });
              a: {
                var n = a, t = h;
                r = b;
                y = c;
                switch (t.tag) {
                  case 1:
                    n = t.payload;
                    if ("function" === typeof n) {
                      q = n.call(y, q, r);
                      break a;
                    }
                    q = n;
                    break a;
                  case 3:
                    n.flags = n.flags & -65537 | 128;
                  case 0:
                    n = t.payload;
                    r = "function" === typeof n ? n.call(y, q, r) : n;
                    if (null === r || void 0 === r) break a;
                    q = A({}, q, r);
                    break a;
                  case 2:
                    jh = true;
                }
              }
              null !== h.callback && 0 !== h.lane && (a.flags |= 64, r = e.effects, null === r ? e.effects = [h] : r.push(h));
            } else y = { eventTime: y, lane: r, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m ? (l = m = y, k = q) : m = m.next = y, g |= r;
            h = h.next;
            if (null === h) if (h = e.shared.pending, null === h) break;
            else r = h, h = r.next, r.next = null, e.lastBaseUpdate = r, e.shared.pending = null;
          } while (1);
          null === m && (k = q);
          e.baseState = k;
          e.firstBaseUpdate = l;
          e.lastBaseUpdate = m;
          b = e.shared.interleaved;
          if (null !== b) {
            e = b;
            do
              g |= e.lane, e = e.next;
            while (e !== b);
          } else null === f && (e.shared.lanes = 0);
          rh |= g;
          a.lanes = g;
          a.memoizedState = q;
        }
      }
      function sh(a, b, c) {
        a = b.effects;
        b.effects = null;
        if (null !== a) for (b = 0; b < a.length; b++) {
          var d = a[b], e = d.callback;
          if (null !== e) {
            d.callback = null;
            d = c;
            if ("function" !== typeof e) throw Error(p(191, e));
            e.call(d);
          }
        }
      }
      var th = {};
      var uh = Uf(th);
      var vh = Uf(th);
      var wh = Uf(th);
      function xh(a) {
        if (a === th) throw Error(p(174));
        return a;
      }
      function yh(a, b) {
        G(wh, b);
        G(vh, a);
        G(uh, th);
        a = b.nodeType;
        switch (a) {
          case 9:
          case 11:
            b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
            break;
          default:
            a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
        }
        E(uh);
        G(uh, b);
      }
      function zh() {
        E(uh);
        E(vh);
        E(wh);
      }
      function Ah(a) {
        xh(wh.current);
        var b = xh(uh.current);
        var c = lb(b, a.type);
        b !== c && (G(vh, a), G(uh, c));
      }
      function Bh(a) {
        vh.current === a && (E(uh), E(vh));
      }
      var L = Uf(0);
      function Ch(a) {
        for (var b = a; null !== b; ) {
          if (13 === b.tag) {
            var c = b.memoizedState;
            if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
          } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
            if (0 !== (b.flags & 128)) return b;
          } else if (null !== b.child) {
            b.child.return = b;
            b = b.child;
            continue;
          }
          if (b === a) break;
          for (; null === b.sibling; ) {
            if (null === b.return || b.return === a) return null;
            b = b.return;
          }
          b.sibling.return = b.return;
          b = b.sibling;
        }
        return null;
      }
      var Dh = [];
      function Eh() {
        for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
        Dh.length = 0;
      }
      var Fh = ua.ReactCurrentDispatcher;
      var Gh = ua.ReactCurrentBatchConfig;
      var Hh = 0;
      var M = null;
      var N = null;
      var O = null;
      var Ih = false;
      var Jh = false;
      var Kh = 0;
      var Lh = 0;
      function P() {
        throw Error(p(321));
      }
      function Mh(a, b) {
        if (null === b) return false;
        for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
        return true;
      }
      function Nh(a, b, c, d, e, f) {
        Hh = f;
        M = b;
        b.memoizedState = null;
        b.updateQueue = null;
        b.lanes = 0;
        Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
        a = c(d, e);
        if (Jh) {
          f = 0;
          do {
            Jh = false;
            Kh = 0;
            if (25 <= f) throw Error(p(301));
            f += 1;
            O = N = null;
            b.updateQueue = null;
            Fh.current = Qh;
            a = c(d, e);
          } while (Jh);
        }
        Fh.current = Rh;
        b = null !== N && null !== N.next;
        Hh = 0;
        O = N = M = null;
        Ih = false;
        if (b) throw Error(p(300));
        return a;
      }
      function Sh() {
        var a = 0 !== Kh;
        Kh = 0;
        return a;
      }
      function Th() {
        var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
        null === O ? M.memoizedState = O = a : O = O.next = a;
        return O;
      }
      function Uh() {
        if (null === N) {
          var a = M.alternate;
          a = null !== a ? a.memoizedState : null;
        } else a = N.next;
        var b = null === O ? M.memoizedState : O.next;
        if (null !== b) O = b, N = a;
        else {
          if (null === a) throw Error(p(310));
          N = a;
          a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
          null === O ? M.memoizedState = O = a : O = O.next = a;
        }
        return O;
      }
      function Vh(a, b) {
        return "function" === typeof b ? b(a) : b;
      }
      function Wh(a) {
        var b = Uh(), c = b.queue;
        if (null === c) throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = N, e = d.baseQueue, f = c.pending;
        if (null !== f) {
          if (null !== e) {
            var g = e.next;
            e.next = f.next;
            f.next = g;
          }
          d.baseQueue = e = f;
          c.pending = null;
        }
        if (null !== e) {
          f = e.next;
          d = d.baseState;
          var h = g = null, k = null, l = f;
          do {
            var m = l.lane;
            if ((Hh & m) === m) null !== k && (k = k.next = { lane: 0, action: l.action, hasEagerState: l.hasEagerState, eagerState: l.eagerState, next: null }), d = l.hasEagerState ? l.eagerState : a(d, l.action);
            else {
              var q = {
                lane: m,
                action: l.action,
                hasEagerState: l.hasEagerState,
                eagerState: l.eagerState,
                next: null
              };
              null === k ? (h = k = q, g = d) : k = k.next = q;
              M.lanes |= m;
              rh |= m;
            }
            l = l.next;
          } while (null !== l && l !== f);
          null === k ? g = d : k.next = h;
          He(d, b.memoizedState) || (dh = true);
          b.memoizedState = d;
          b.baseState = g;
          b.baseQueue = k;
          c.lastRenderedState = d;
        }
        a = c.interleaved;
        if (null !== a) {
          e = a;
          do
            f = e.lane, M.lanes |= f, rh |= f, e = e.next;
          while (e !== a);
        } else null === e && (c.lanes = 0);
        return [b.memoizedState, c.dispatch];
      }
      function Xh(a) {
        var b = Uh(), c = b.queue;
        if (null === c) throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = c.dispatch, e = c.pending, f = b.memoizedState;
        if (null !== e) {
          c.pending = null;
          var g = e = e.next;
          do
            f = a(f, g.action), g = g.next;
          while (g !== e);
          He(f, b.memoizedState) || (dh = true);
          b.memoizedState = f;
          null === b.baseQueue && (b.baseState = f);
          c.lastRenderedState = f;
        }
        return [f, d];
      }
      function Yh() {
      }
      function Zh(a, b) {
        var c = M, d = Uh(), e = b(), f = !He(d.memoizedState, e);
        f && (d.memoizedState = e, dh = true);
        d = d.queue;
        $h(ai.bind(null, c, d, a), [a]);
        if (d.getSnapshot !== b || f || null !== O && O.memoizedState.tag & 1) {
          c.flags |= 2048;
          bi(9, ci.bind(null, c, d, e, b), void 0, null);
          if (null === Q) throw Error(p(349));
          0 !== (Hh & 30) || di(c, b, e);
        }
        return e;
      }
      function di(a, b, c) {
        a.flags |= 16384;
        a = { getSnapshot: b, value: c };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
      }
      function ci(a, b, c, d) {
        b.value = c;
        b.getSnapshot = d;
        ei(b) && fi(a);
      }
      function ai(a, b, c) {
        return c(function() {
          ei(b) && fi(a);
        });
      }
      function ei(a) {
        var b = a.getSnapshot;
        a = a.value;
        try {
          var c = b();
          return !He(a, c);
        } catch (d) {
          return true;
        }
      }
      function fi(a) {
        var b = ih(a, 1);
        null !== b && gi(b, a, 1, -1);
      }
      function hi(a) {
        var b = Th();
        "function" === typeof a && (a = a());
        b.memoizedState = b.baseState = a;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
        b.queue = a;
        a = a.dispatch = ii.bind(null, M, a);
        return [b.memoizedState, a];
      }
      function bi(a, b, c, d) {
        a = { tag: a, create: b, destroy: c, deps: d, next: null };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
        return a;
      }
      function ji() {
        return Uh().memoizedState;
      }
      function ki(a, b, c, d) {
        var e = Th();
        M.flags |= a;
        e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
      }
      function li(a, b, c, d) {
        var e = Uh();
        d = void 0 === d ? null : d;
        var f = void 0;
        if (null !== N) {
          var g = N.memoizedState;
          f = g.destroy;
          if (null !== d && Mh(d, g.deps)) {
            e.memoizedState = bi(b, c, f, d);
            return;
          }
        }
        M.flags |= a;
        e.memoizedState = bi(1 | b, c, f, d);
      }
      function mi(a, b) {
        return ki(8390656, 8, a, b);
      }
      function $h(a, b) {
        return li(2048, 8, a, b);
      }
      function ni(a, b) {
        return li(4, 2, a, b);
      }
      function oi(a, b) {
        return li(4, 4, a, b);
      }
      function pi(a, b) {
        if ("function" === typeof b) return a = a(), b(a), function() {
          b(null);
        };
        if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
          b.current = null;
        };
      }
      function qi(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return li(4, 4, pi.bind(null, b, a), c);
      }
      function ri() {
      }
      function si(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1])) return d[0];
        c.memoizedState = [a, b];
        return a;
      }
      function ti(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1])) return d[0];
        a = a();
        c.memoizedState = [a, b];
        return a;
      }
      function ui(a, b, c) {
        if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
        He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
        return b;
      }
      function vi(a, b) {
        var c = C;
        C = 0 !== c && 4 > c ? c : 4;
        a(true);
        var d = Gh.transition;
        Gh.transition = {};
        try {
          a(false), b();
        } finally {
          C = c, Gh.transition = d;
        }
      }
      function wi() {
        return Uh().memoizedState;
      }
      function xi(a, b, c) {
        var d = yi(a);
        c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a)) Ai(b, c);
        else if (c = hh(a, b, c, d), null !== c) {
          var e = R();
          gi(c, a, d, e);
          Bi(c, b, d);
        }
      }
      function ii(a, b, c) {
        var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a)) Ai(b, e);
        else {
          var f = a.alternate;
          if (0 === a.lanes && (null === f || 0 === f.lanes) && (f = b.lastRenderedReducer, null !== f)) try {
            var g = b.lastRenderedState, h = f(g, c);
            e.hasEagerState = true;
            e.eagerState = h;
            if (He(h, g)) {
              var k = b.interleaved;
              null === k ? (e.next = e, gh(b)) : (e.next = k.next, k.next = e);
              b.interleaved = e;
              return;
            }
          } catch (l) {
          } finally {
          }
          c = hh(a, b, e, d);
          null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
        }
      }
      function zi(a) {
        var b = a.alternate;
        return a === M || null !== b && b === M;
      }
      function Ai(a, b) {
        Jh = Ih = true;
        var c = a.pending;
        null === c ? b.next = b : (b.next = c.next, c.next = b);
        a.pending = b;
      }
      function Bi(a, b, c) {
        if (0 !== (c & 4194240)) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false };
      var Oh = { readContext: eh, useCallback: function(a, b) {
        Th().memoizedState = [a, void 0 === b ? null : b];
        return a;
      }, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return ki(
          4194308,
          4,
          pi.bind(null, b, a),
          c
        );
      }, useLayoutEffect: function(a, b) {
        return ki(4194308, 4, a, b);
      }, useInsertionEffect: function(a, b) {
        return ki(4, 2, a, b);
      }, useMemo: function(a, b) {
        var c = Th();
        b = void 0 === b ? null : b;
        a = a();
        c.memoizedState = [a, b];
        return a;
      }, useReducer: function(a, b, c) {
        var d = Th();
        b = void 0 !== c ? c(b) : b;
        d.memoizedState = d.baseState = b;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
        d.queue = a;
        a = a.dispatch = xi.bind(null, M, a);
        return [d.memoizedState, a];
      }, useRef: function(a) {
        var b = Th();
        a = { current: a };
        return b.memoizedState = a;
      }, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
        return Th().memoizedState = a;
      }, useTransition: function() {
        var a = hi(false), b = a[0];
        a = vi.bind(null, a[1]);
        Th().memoizedState = a;
        return [b, a];
      }, useMutableSource: function() {
      }, useSyncExternalStore: function(a, b, c) {
        var d = M, e = Th();
        if (I) {
          if (void 0 === c) throw Error(p(407));
          c = c();
        } else {
          c = b();
          if (null === Q) throw Error(p(349));
          0 !== (Hh & 30) || di(d, b, c);
        }
        e.memoizedState = c;
        var f = { value: c, getSnapshot: b };
        e.queue = f;
        mi(ai.bind(
          null,
          d,
          f,
          a
        ), [a]);
        d.flags |= 2048;
        bi(9, ci.bind(null, d, f, c, b), void 0, null);
        return c;
      }, useId: function() {
        var a = Th(), b = Q.identifierPrefix;
        if (I) {
          var c = sg;
          var d = rg;
          c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
          b = ":" + b + "R" + c;
          c = Kh++;
          0 < c && (b += "H" + c.toString(32));
          b += ":";
        } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
        return a.memoizedState = b;
      }, unstable_isNewReconciler: false };
      var Ph = {
        readContext: eh,
        useCallback: si,
        useContext: eh,
        useEffect: $h,
        useImperativeHandle: qi,
        useInsertionEffect: ni,
        useLayoutEffect: oi,
        useMemo: ti,
        useReducer: Wh,
        useRef: ji,
        useState: function() {
          return Wh(Vh);
        },
        useDebugValue: ri,
        useDeferredValue: function(a) {
          var b = Uh();
          return ui(b, N.memoizedState, a);
        },
        useTransition: function() {
          var a = Wh(Vh)[0], b = Uh().memoizedState;
          return [a, b];
        },
        useMutableSource: Yh,
        useSyncExternalStore: Zh,
        useId: wi,
        unstable_isNewReconciler: false
      };
      var Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
        return Xh(Vh);
      }, useDebugValue: ri, useDeferredValue: function(a) {
        var b = Uh();
        return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
      }, useTransition: function() {
        var a = Xh(Vh)[0], b = Uh().memoizedState;
        return [a, b];
      }, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
      function Ci(a, b) {
        if (a && a.defaultProps) {
          b = A({}, b);
          a = a.defaultProps;
          for (var c in a) void 0 === b[c] && (b[c] = a[c]);
          return b;
        }
        return b;
      }
      function Di(a, b, c, d) {
        b = a.memoizedState;
        c = c(d, b);
        c = null === c || void 0 === c ? b : A({}, b, c);
        a.memoizedState = c;
        0 === a.lanes && (a.updateQueue.baseState = c);
      }
      var Ei = { isMounted: function(a) {
        return (a = a._reactInternals) ? Vb(a) === a : false;
      }, enqueueSetState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
      }, enqueueReplaceState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.tag = 1;
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
      }, enqueueForceUpdate: function(a, b) {
        a = a._reactInternals;
        var c = R(), d = yi(a), e = mh(c, d);
        e.tag = 2;
        void 0 !== b && null !== b && (e.callback = b);
        b = nh(a, e, d);
        null !== b && (gi(b, a, d, c), oh(b, a, d));
      } };
      function Fi(a, b, c, d, e, f, g) {
        a = a.stateNode;
        return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f) : true;
      }
      function Gi(a, b, c) {
        var d = false, e = Vf;
        var f = b.contextType;
        "object" === typeof f && null !== f ? f = eh(f) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
        b = new b(c, f);
        a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
        b.updater = Ei;
        a.stateNode = b;
        b._reactInternals = a;
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f);
        return b;
      }
      function Hi(a, b, c, d) {
        a = b.state;
        "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
        "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
        b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
      }
      function Ii(a, b, c, d) {
        var e = a.stateNode;
        e.props = c;
        e.state = a.memoizedState;
        e.refs = {};
        kh(a);
        var f = b.contextType;
        "object" === typeof f && null !== f ? e.context = eh(f) : (f = Zf(b) ? Xf : H.current, e.context = Yf(a, f));
        e.state = a.memoizedState;
        f = b.getDerivedStateFromProps;
        "function" === typeof f && (Di(a, b, f, c), e.state = a.memoizedState);
        "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
        "function" === typeof e.componentDidMount && (a.flags |= 4194308);
      }
      function Ji(a, b) {
        try {
          var c = "", d = b;
          do
            c += Pa(d), d = d.return;
          while (d);
          var e = c;
        } catch (f) {
          e = "\nError generating stack: " + f.message + "\n" + f.stack;
        }
        return { value: a, source: b, stack: e, digest: null };
      }
      function Ki(a, b, c) {
        return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
      }
      function Li(a, b) {
        try {
          console.error(b.value);
        } catch (c) {
          setTimeout(function() {
            throw c;
          });
        }
      }
      var Mi = "function" === typeof WeakMap ? WeakMap : Map;
      function Ni(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        c.payload = { element: null };
        var d = b.value;
        c.callback = function() {
          Oi || (Oi = true, Pi = d);
          Li(a, b);
        };
        return c;
      }
      function Qi(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        var d = a.type.getDerivedStateFromError;
        if ("function" === typeof d) {
          var e = b.value;
          c.payload = function() {
            return d(e);
          };
          c.callback = function() {
            Li(a, b);
          };
        }
        var f = a.stateNode;
        null !== f && "function" === typeof f.componentDidCatch && (c.callback = function() {
          Li(a, b);
          "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
          var c2 = b.stack;
          this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
        });
        return c;
      }
      function Si(a, b, c) {
        var d = a.pingCache;
        if (null === d) {
          d = a.pingCache = new Mi();
          var e = /* @__PURE__ */ new Set();
          d.set(b, e);
        } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
        e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
      }
      function Ui(a) {
        do {
          var b;
          if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
          if (b) return a;
          a = a.return;
        } while (null !== a);
        return null;
      }
      function Vi(a, b, c, d, e) {
        if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
        a.flags |= 65536;
        a.lanes = e;
        return a;
      }
      var Wi = ua.ReactCurrentOwner;
      var dh = false;
      function Xi(a, b, c, d) {
        b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
      }
      function Yi(a, b, c, d, e) {
        c = c.render;
        var f = b.ref;
        ch(b, e);
        d = Nh(a, b, c, d, f, e);
        c = Sh();
        if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
        I && c && vg(b);
        b.flags |= 1;
        Xi(a, b, d, e);
        return b.child;
      }
      function $i(a, b, c, d, e) {
        if (null === a) {
          var f = c.type;
          if ("function" === typeof f && !aj(f) && void 0 === f.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f, bj(a, b, f, d, e);
          a = Rg(c.type, null, d, b, b.mode, e);
          a.ref = b.ref;
          a.return = b;
          return b.child = a;
        }
        f = a.child;
        if (0 === (a.lanes & e)) {
          var g = f.memoizedProps;
          c = c.compare;
          c = null !== c ? c : Ie;
          if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
        }
        b.flags |= 1;
        a = Pg(f, d);
        a.ref = b.ref;
        a.return = b;
        return b.child = a;
      }
      function bj(a, b, c, d, e) {
        if (null !== a) {
          var f = a.memoizedProps;
          if (Ie(f, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
          else return b.lanes = a.lanes, Zi(a, b, e);
        }
        return cj(a, b, c, d, e);
      }
      function dj(a, b, c) {
        var d = b.pendingProps, e = d.children, f = null !== a ? a.memoizedState : null;
        if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
        else {
          if (0 === (c & 1073741824)) return a = null !== f ? f.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
          b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
          d = null !== f ? f.baseLanes : c;
          G(ej, fj);
          fj |= d;
        }
        else null !== f ? (d = f.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
        Xi(a, b, e, c);
        return b.child;
      }
      function gj(a, b) {
        var c = b.ref;
        if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
      }
      function cj(a, b, c, d, e) {
        var f = Zf(c) ? Xf : H.current;
        f = Yf(b, f);
        ch(b, e);
        c = Nh(a, b, c, d, f, e);
        d = Sh();
        if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
        I && d && vg(b);
        b.flags |= 1;
        Xi(a, b, c, e);
        return b.child;
      }
      function hj(a, b, c, d, e) {
        if (Zf(c)) {
          var f = true;
          cg(b);
        } else f = false;
        ch(b, e);
        if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
        else if (null === a) {
          var g = b.stateNode, h = b.memoizedProps;
          g.props = h;
          var k = g.context, l = c.contextType;
          "object" === typeof l && null !== l ? l = eh(l) : (l = Zf(c) ? Xf : H.current, l = Yf(b, l));
          var m = c.getDerivedStateFromProps, q = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
          q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Hi(b, g, d, l);
          jh = false;
          var r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e);
          k = b.memoizedState;
          h !== d || r !== k || Wf.current || jh ? ("function" === typeof m && (Di(b, c, m, d), k = b.memoizedState), (h = jh || Fi(b, c, h, d, r, k, l)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
        } else {
          g = b.stateNode;
          lh(a, b);
          h = b.memoizedProps;
          l = b.type === b.elementType ? h : Ci(b.type, h);
          g.props = l;
          q = b.pendingProps;
          r = g.context;
          k = c.contextType;
          "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
          var y = c.getDerivedStateFromProps;
          (m = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r !== k) && Hi(b, g, d, k);
          jh = false;
          r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e);
          var n = b.memoizedState;
          h !== q || r !== n || Wf.current || jh ? ("function" === typeof y && (Di(b, c, y, d), n = b.memoizedState), (l = jh || Fi(b, c, l, d, r, n, k) || false) ? (m || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n), g.props = d, g.state = n, g.context = k, d = l) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), d = false);
        }
        return jj(a, b, c, d, f, e);
      }
      function jj(a, b, c, d, e, f) {
        gj(a, b);
        var g = 0 !== (b.flags & 128);
        if (!d && !g) return e && dg(b, c, false), Zi(a, b, f);
        d = b.stateNode;
        Wi.current = b;
        var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
        b.flags |= 1;
        null !== a && g ? (b.child = Ug(b, a.child, null, f), b.child = Ug(b, null, h, f)) : Xi(a, b, h, f);
        b.memoizedState = d.state;
        e && dg(b, c, true);
        return b.child;
      }
      function kj(a) {
        var b = a.stateNode;
        b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
        yh(a, b.containerInfo);
      }
      function lj(a, b, c, d, e) {
        Ig();
        Jg(e);
        b.flags |= 256;
        Xi(a, b, c, d);
        return b.child;
      }
      var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
      function nj(a) {
        return { baseLanes: a, cachePool: null, transitions: null };
      }
      function oj(a, b, c) {
        var d = b.pendingProps, e = L.current, f = false, g = 0 !== (b.flags & 128), h;
        (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
        if (h) f = true, b.flags &= -129;
        else if (null === a || null !== a.memoizedState) e |= 1;
        G(L, e & 1);
        if (null === a) {
          Eg(b);
          a = b.memoizedState;
          if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
          g = d.children;
          a = d.fallback;
          return f ? (d = b.mode, f = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f ? (f.childLanes = 0, f.pendingProps = g) : f = pj(g, d, 0, null), a = Tg(a, d, c, null), f.return = b, a.return = b, f.sibling = a, b.child = f, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
        }
        e = a.memoizedState;
        if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
        if (f) {
          f = d.fallback;
          g = b.mode;
          e = a.child;
          h = e.sibling;
          var k = { mode: "hidden", children: d.children };
          0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e, k), d.subtreeFlags = e.subtreeFlags & 14680064);
          null !== h ? f = Pg(h, f) : (f = Tg(f, g, c, null), f.flags |= 2);
          f.return = b;
          d.return = b;
          d.sibling = f;
          b.child = d;
          d = f;
          f = b.child;
          g = a.child.memoizedState;
          g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
          f.memoizedState = g;
          f.childLanes = a.childLanes & ~c;
          b.memoizedState = mj;
          return d;
        }
        f = a.child;
        a = f.sibling;
        d = Pg(f, { mode: "visible", children: d.children });
        0 === (b.mode & 1) && (d.lanes = c);
        d.return = b;
        d.sibling = null;
        null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
        b.child = d;
        b.memoizedState = null;
        return d;
      }
      function qj(a, b) {
        b = pj({ mode: "visible", children: b }, a.mode, 0, null);
        b.return = a;
        return a.child = b;
      }
      function sj(a, b, c, d) {
        null !== d && Jg(d);
        Ug(b, a.child, null, c);
        a = qj(b, b.pendingProps.children);
        a.flags |= 2;
        b.memoizedState = null;
        return a;
      }
      function rj(a, b, c, d, e, f, g) {
        if (c) {
          if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
          if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
          f = d.fallback;
          e = b.mode;
          d = pj({ mode: "visible", children: d.children }, e, 0, null);
          f = Tg(f, e, g, null);
          f.flags |= 2;
          d.return = b;
          f.return = b;
          d.sibling = f;
          b.child = d;
          0 !== (b.mode & 1) && Ug(b, a.child, null, g);
          b.child.memoizedState = nj(g);
          b.memoizedState = mj;
          return f;
        }
        if (0 === (b.mode & 1)) return sj(a, b, g, null);
        if ("$!" === e.data) {
          d = e.nextSibling && e.nextSibling.dataset;
          if (d) var h = d.dgst;
          d = h;
          f = Error(p(419));
          d = Ki(f, d, void 0);
          return sj(a, b, g, d);
        }
        h = 0 !== (g & a.childLanes);
        if (dh || h) {
          d = Q;
          if (null !== d) {
            switch (g & -g) {
              case 4:
                e = 2;
                break;
              case 16:
                e = 8;
                break;
              case 64:
              case 128:
              case 256:
              case 512:
              case 1024:
              case 2048:
              case 4096:
              case 8192:
              case 16384:
              case 32768:
              case 65536:
              case 131072:
              case 262144:
              case 524288:
              case 1048576:
              case 2097152:
              case 4194304:
              case 8388608:
              case 16777216:
              case 33554432:
              case 67108864:
                e = 32;
                break;
              case 536870912:
                e = 268435456;
                break;
              default:
                e = 0;
            }
            e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
            0 !== e && e !== f.retryLane && (f.retryLane = e, ih(a, e), gi(d, a, e, -1));
          }
          tj();
          d = Ki(Error(p(421)));
          return sj(a, b, g, d);
        }
        if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
        a = f.treeContext;
        yg = Lf(e.nextSibling);
        xg = b;
        I = true;
        zg = null;
        null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
        b = qj(b, d.children);
        b.flags |= 4096;
        return b;
      }
      function vj(a, b, c) {
        a.lanes |= b;
        var d = a.alternate;
        null !== d && (d.lanes |= b);
        bh(a.return, b, c);
      }
      function wj(a, b, c, d, e) {
        var f = a.memoizedState;
        null === f ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f.isBackwards = b, f.rendering = null, f.renderingStartTime = 0, f.last = d, f.tail = c, f.tailMode = e);
      }
      function xj(a, b, c) {
        var d = b.pendingProps, e = d.revealOrder, f = d.tail;
        Xi(a, b, d.children, c);
        d = L.current;
        if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
        else {
          if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
            if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
            else if (19 === a.tag) vj(a, c, b);
            else if (null !== a.child) {
              a.child.return = a;
              a = a.child;
              continue;
            }
            if (a === b) break a;
            for (; null === a.sibling; ) {
              if (null === a.return || a.return === b) break a;
              a = a.return;
            }
            a.sibling.return = a.return;
            a = a.sibling;
          }
          d &= 1;
        }
        G(L, d);
        if (0 === (b.mode & 1)) b.memoizedState = null;
        else switch (e) {
          case "forwards":
            c = b.child;
            for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
            c = e;
            null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
            wj(b, false, e, c, f);
            break;
          case "backwards":
            c = null;
            e = b.child;
            for (b.child = null; null !== e; ) {
              a = e.alternate;
              if (null !== a && null === Ch(a)) {
                b.child = e;
                break;
              }
              a = e.sibling;
              e.sibling = c;
              c = e;
              e = a;
            }
            wj(b, true, c, null, f);
            break;
          case "together":
            wj(b, false, null, null, void 0);
            break;
          default:
            b.memoizedState = null;
        }
        return b.child;
      }
      function ij(a, b) {
        0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
      }
      function Zi(a, b, c) {
        null !== a && (b.dependencies = a.dependencies);
        rh |= b.lanes;
        if (0 === (c & b.childLanes)) return null;
        if (null !== a && b.child !== a.child) throw Error(p(153));
        if (null !== b.child) {
          a = b.child;
          c = Pg(a, a.pendingProps);
          b.child = c;
          for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
          c.sibling = null;
        }
        return b.child;
      }
      function yj(a, b, c) {
        switch (b.tag) {
          case 3:
            kj(b);
            Ig();
            break;
          case 5:
            Ah(b);
            break;
          case 1:
            Zf(b.type) && cg(b);
            break;
          case 4:
            yh(b, b.stateNode.containerInfo);
            break;
          case 10:
            var d = b.type._context, e = b.memoizedProps.value;
            G(Wg, d._currentValue);
            d._currentValue = e;
            break;
          case 13:
            d = b.memoizedState;
            if (null !== d) {
              if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
              if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
              G(L, L.current & 1);
              a = Zi(a, b, c);
              return null !== a ? a.sibling : null;
            }
            G(L, L.current & 1);
            break;
          case 19:
            d = 0 !== (c & b.childLanes);
            if (0 !== (a.flags & 128)) {
              if (d) return xj(a, b, c);
              b.flags |= 128;
            }
            e = b.memoizedState;
            null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
            G(L, L.current);
            if (d) break;
            else return null;
          case 22:
          case 23:
            return b.lanes = 0, dj(a, b, c);
        }
        return Zi(a, b, c);
      }
      var zj;
      var Aj;
      var Bj;
      var Cj;
      zj = function(a, b) {
        for (var c = b.child; null !== c; ) {
          if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
          else if (4 !== c.tag && null !== c.child) {
            c.child.return = c;
            c = c.child;
            continue;
          }
          if (c === b) break;
          for (; null === c.sibling; ) {
            if (null === c.return || c.return === b) return;
            c = c.return;
          }
          c.sibling.return = c.return;
          c = c.sibling;
        }
      };
      Aj = function() {
      };
      Bj = function(a, b, c, d) {
        var e = a.memoizedProps;
        if (e !== d) {
          a = b.stateNode;
          xh(uh.current);
          var f = null;
          switch (c) {
            case "input":
              e = Ya(a, e);
              d = Ya(a, d);
              f = [];
              break;
            case "select":
              e = A({}, e, { value: void 0 });
              d = A({}, d, { value: void 0 });
              f = [];
              break;
            case "textarea":
              e = gb(a, e);
              d = gb(a, d);
              f = [];
              break;
            default:
              "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
          }
          ub(c, d);
          var g;
          c = null;
          for (l in e) if (!d.hasOwnProperty(l) && e.hasOwnProperty(l) && null != e[l]) if ("style" === l) {
            var h = e[l];
            for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
          } else "dangerouslySetInnerHTML" !== l && "children" !== l && "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && "autoFocus" !== l && (ea.hasOwnProperty(l) ? f || (f = []) : (f = f || []).push(l, null));
          for (l in d) {
            var k = d[l];
            h = null != e ? e[l] : void 0;
            if (d.hasOwnProperty(l) && k !== h && (null != k || null != h)) if ("style" === l) if (h) {
              for (g in h) !h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
              for (g in k) k.hasOwnProperty(g) && h[g] !== k[g] && (c || (c = {}), c[g] = k[g]);
            } else c || (f || (f = []), f.push(
              l,
              c
            )), c = k;
            else "dangerouslySetInnerHTML" === l ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f = f || []).push(l, k)) : "children" === l ? "string" !== typeof k && "number" !== typeof k || (f = f || []).push(l, "" + k) : "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && (ea.hasOwnProperty(l) ? (null != k && "onScroll" === l && D("scroll", a), f || h === k || (f = [])) : (f = f || []).push(l, k));
          }
          c && (f = f || []).push("style", c);
          var l = f;
          if (b.updateQueue = l) b.flags |= 4;
        }
      };
      Cj = function(a, b, c, d) {
        c !== d && (b.flags |= 4);
      };
      function Dj(a, b) {
        if (!I) switch (a.tailMode) {
          case "hidden":
            b = a.tail;
            for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
            null === c ? a.tail = null : c.sibling = null;
            break;
          case "collapsed":
            c = a.tail;
            for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
            null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
        }
      }
      function S(a) {
        var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
        if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
        else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
        a.subtreeFlags |= d;
        a.childLanes = c;
        return b;
      }
      function Ej(a, b, c) {
        var d = b.pendingProps;
        wg(b);
        switch (b.tag) {
          case 2:
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return S(b), null;
          case 1:
            return Zf(b.type) && $f(), S(b), null;
          case 3:
            d = b.stateNode;
            zh();
            E(Wf);
            E(H);
            Eh();
            d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
            if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
            Aj(a, b);
            S(b);
            return null;
          case 5:
            Bh(b);
            var e = xh(wh.current);
            c = b.type;
            if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            else {
              if (!d) {
                if (null === b.stateNode) throw Error(p(166));
                S(b);
                return null;
              }
              a = xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.type;
                var f = b.memoizedProps;
                d[Of] = b;
                d[Pf] = f;
                a = 0 !== (b.mode & 1);
                switch (c) {
                  case "dialog":
                    D("cancel", d);
                    D("close", d);
                    break;
                  case "iframe":
                  case "object":
                  case "embed":
                    D("load", d);
                    break;
                  case "video":
                  case "audio":
                    for (e = 0; e < lf.length; e++) D(lf[e], d);
                    break;
                  case "source":
                    D("error", d);
                    break;
                  case "img":
                  case "image":
                  case "link":
                    D(
                      "error",
                      d
                    );
                    D("load", d);
                    break;
                  case "details":
                    D("toggle", d);
                    break;
                  case "input":
                    Za(d, f);
                    D("invalid", d);
                    break;
                  case "select":
                    d._wrapperState = { wasMultiple: !!f.multiple };
                    D("invalid", d);
                    break;
                  case "textarea":
                    hb(d, f), D("invalid", d);
                }
                ub(c, f);
                e = null;
                for (var g in f) if (f.hasOwnProperty(g)) {
                  var h = f[g];
                  "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f.suppressHydrationWarning && Af(
                    d.textContent,
                    h,
                    a
                  ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
                }
                switch (c) {
                  case "input":
                    Va(d);
                    db(d, f, true);
                    break;
                  case "textarea":
                    Va(d);
                    jb(d);
                    break;
                  case "select":
                  case "option":
                    break;
                  default:
                    "function" === typeof f.onClick && (d.onclick = Bf);
                }
                d = e;
                b.updateQueue = d;
                null !== d && (b.flags |= 4);
              } else {
                g = 9 === e.nodeType ? e : e.ownerDocument;
                "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
                "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
                a[Of] = b;
                a[Pf] = d;
                zj(a, b, false, false);
                b.stateNode = a;
                a: {
                  g = vb(c, d);
                  switch (c) {
                    case "dialog":
                      D("cancel", a);
                      D("close", a);
                      e = d;
                      break;
                    case "iframe":
                    case "object":
                    case "embed":
                      D("load", a);
                      e = d;
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < lf.length; e++) D(lf[e], a);
                      e = d;
                      break;
                    case "source":
                      D("error", a);
                      e = d;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      D(
                        "error",
                        a
                      );
                      D("load", a);
                      e = d;
                      break;
                    case "details":
                      D("toggle", a);
                      e = d;
                      break;
                    case "input":
                      Za(a, d);
                      e = Ya(a, d);
                      D("invalid", a);
                      break;
                    case "option":
                      e = d;
                      break;
                    case "select":
                      a._wrapperState = { wasMultiple: !!d.multiple };
                      e = A({}, d, { value: void 0 });
                      D("invalid", a);
                      break;
                    case "textarea":
                      hb(a, d);
                      e = gb(a, d);
                      D("invalid", a);
                      break;
                    default:
                      e = d;
                  }
                  ub(c, e);
                  h = e;
                  for (f in h) if (h.hasOwnProperty(f)) {
                    var k = h[f];
                    "style" === f ? sb(a, k) : "dangerouslySetInnerHTML" === f ? (k = k ? k.__html : void 0, null != k && nb(a, k)) : "children" === f ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a, k) : "number" === typeof k && ob(a, "" + k) : "suppressContentEditableWarning" !== f && "suppressHydrationWarning" !== f && "autoFocus" !== f && (ea.hasOwnProperty(f) ? null != k && "onScroll" === f && D("scroll", a) : null != k && ta(a, f, k, g));
                  }
                  switch (c) {
                    case "input":
                      Va(a);
                      db(a, d, false);
                      break;
                    case "textarea":
                      Va(a);
                      jb(a);
                      break;
                    case "option":
                      null != d.value && a.setAttribute("value", "" + Sa(d.value));
                      break;
                    case "select":
                      a.multiple = !!d.multiple;
                      f = d.value;
                      null != f ? fb(a, !!d.multiple, f, false) : null != d.defaultValue && fb(
                        a,
                        !!d.multiple,
                        d.defaultValue,
                        true
                      );
                      break;
                    default:
                      "function" === typeof e.onClick && (a.onclick = Bf);
                  }
                  switch (c) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                      d = !!d.autoFocus;
                      break a;
                    case "img":
                      d = true;
                      break a;
                    default:
                      d = false;
                  }
                }
                d && (b.flags |= 4);
              }
              null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            }
            S(b);
            return null;
          case 6:
            if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
            else {
              if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
              c = xh(wh.current);
              xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.memoizedProps;
                d[Of] = b;
                if (f = d.nodeValue !== c) {
                  if (a = xg, null !== a) switch (a.tag) {
                    case 3:
                      Af(d.nodeValue, c, 0 !== (a.mode & 1));
                      break;
                    case 5:
                      true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
                  }
                }
                f && (b.flags |= 4);
              } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
            }
            S(b);
            return null;
          case 13:
            E(L);
            d = b.memoizedState;
            if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
              if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f = false;
              else if (f = Gg(b), null !== d && null !== d.dehydrated) {
                if (null === a) {
                  if (!f) throw Error(p(318));
                  f = b.memoizedState;
                  f = null !== f ? f.dehydrated : null;
                  if (!f) throw Error(p(317));
                  f[Of] = b;
                } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
                S(b);
                f = false;
              } else null !== zg && (Fj(zg), zg = null), f = true;
              if (!f) return b.flags & 65536 ? b : null;
            }
            if (0 !== (b.flags & 128)) return b.lanes = c, b;
            d = null !== d;
            d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
            null !== b.updateQueue && (b.flags |= 4);
            S(b);
            return null;
          case 4:
            return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
          case 10:
            return ah(b.type._context), S(b), null;
          case 17:
            return Zf(b.type) && $f(), S(b), null;
          case 19:
            E(L);
            f = b.memoizedState;
            if (null === f) return S(b), null;
            d = 0 !== (b.flags & 128);
            g = f.rendering;
            if (null === g) if (d) Dj(f, false);
            else {
              if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
                g = Ch(a);
                if (null !== g) {
                  b.flags |= 128;
                  Dj(f, false);
                  d = g.updateQueue;
                  null !== d && (b.updateQueue = d, b.flags |= 4);
                  b.subtreeFlags = 0;
                  d = c;
                  for (c = b.child; null !== c; ) f = c, a = d, f.flags &= 14680066, g = f.alternate, null === g ? (f.childLanes = 0, f.lanes = a, f.child = null, f.subtreeFlags = 0, f.memoizedProps = null, f.memoizedState = null, f.updateQueue = null, f.dependencies = null, f.stateNode = null) : (f.childLanes = g.childLanes, f.lanes = g.lanes, f.child = g.child, f.subtreeFlags = 0, f.deletions = null, f.memoizedProps = g.memoizedProps, f.memoizedState = g.memoizedState, f.updateQueue = g.updateQueue, f.type = g.type, a = g.dependencies, f.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
                  G(L, L.current & 1 | 2);
                  return b.child;
                }
                a = a.sibling;
              }
              null !== f.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
            }
            else {
              if (!d) if (a = Ch(g), null !== a) {
                if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f, true), null === f.tail && "hidden" === f.tailMode && !g.alternate && !I) return S(b), null;
              } else 2 * B() - f.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
              f.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f.last, null !== c ? c.sibling = g : b.child = g, f.last = g);
            }
            if (null !== f.tail) return b = f.tail, f.rendering = b, f.tail = b.sibling, f.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
            S(b);
            return null;
          case 22:
          case 23:
            return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
          case 24:
            return null;
          case 25:
            return null;
        }
        throw Error(p(156, b.tag));
      }
      function Ij(a, b) {
        wg(b);
        switch (b.tag) {
          case 1:
            return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 3:
            return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
          case 5:
            return Bh(b), null;
          case 13:
            E(L);
            a = b.memoizedState;
            if (null !== a && null !== a.dehydrated) {
              if (null === b.alternate) throw Error(p(340));
              Ig();
            }
            a = b.flags;
            return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 19:
            return E(L), null;
          case 4:
            return zh(), null;
          case 10:
            return ah(b.type._context), null;
          case 22:
          case 23:
            return Hj(), null;
          case 24:
            return null;
          default:
            return null;
        }
      }
      var Jj = false;
      var U = false;
      var Kj = "function" === typeof WeakSet ? WeakSet : Set;
      var V = null;
      function Lj(a, b) {
        var c = a.ref;
        if (null !== c) if ("function" === typeof c) try {
          c(null);
        } catch (d) {
          W(a, b, d);
        }
        else c.current = null;
      }
      function Mj(a, b, c) {
        try {
          c();
        } catch (d) {
          W(a, b, d);
        }
      }
      var Nj = false;
      function Oj(a, b) {
        Cf = dd;
        a = Me();
        if (Ne(a)) {
          if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
          else a: {
            c = (c = a.ownerDocument) && c.defaultView || window;
            var d = c.getSelection && c.getSelection();
            if (d && 0 !== d.rangeCount) {
              c = d.anchorNode;
              var e = d.anchorOffset, f = d.focusNode;
              d = d.focusOffset;
              try {
                c.nodeType, f.nodeType;
              } catch (F) {
                c = null;
                break a;
              }
              var g = 0, h = -1, k = -1, l = 0, m = 0, q = a, r = null;
              b: for (; ; ) {
                for (var y; ; ) {
                  q !== c || 0 !== e && 3 !== q.nodeType || (h = g + e);
                  q !== f || 0 !== d && 3 !== q.nodeType || (k = g + d);
                  3 === q.nodeType && (g += q.nodeValue.length);
                  if (null === (y = q.firstChild)) break;
                  r = q;
                  q = y;
                }
                for (; ; ) {
                  if (q === a) break b;
                  r === c && ++l === e && (h = g);
                  r === f && ++m === d && (k = g);
                  if (null !== (y = q.nextSibling)) break;
                  q = r;
                  r = q.parentNode;
                }
                q = y;
              }
              c = -1 === h || -1 === k ? null : { start: h, end: k };
            } else c = null;
          }
          c = c || { start: 0, end: 0 };
        } else c = null;
        Df = { focusedElem: a, selectionRange: c };
        dd = false;
        for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
        else for (; null !== V; ) {
          b = V;
          try {
            var n = b.alternate;
            if (0 !== (b.flags & 1024)) switch (b.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (null !== n) {
                  var t = n.memoizedProps, J = n.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t : Ci(b.type, t), J);
                  x.__reactInternalSnapshotBeforeUpdate = w;
                }
                break;
              case 3:
                var u = b.stateNode.containerInfo;
                1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(p(163));
            }
          } catch (F) {
            W(b, b.return, F);
          }
          a = b.sibling;
          if (null !== a) {
            a.return = b.return;
            V = a;
            break;
          }
          V = b.return;
        }
        n = Nj;
        Nj = false;
        return n;
      }
      function Pj(a, b, c) {
        var d = b.updateQueue;
        d = null !== d ? d.lastEffect : null;
        if (null !== d) {
          var e = d = d.next;
          do {
            if ((e.tag & a) === a) {
              var f = e.destroy;
              e.destroy = void 0;
              void 0 !== f && Mj(b, c, f);
            }
            e = e.next;
          } while (e !== d);
        }
      }
      function Qj(a, b) {
        b = b.updateQueue;
        b = null !== b ? b.lastEffect : null;
        if (null !== b) {
          var c = b = b.next;
          do {
            if ((c.tag & a) === a) {
              var d = c.create;
              c.destroy = d();
            }
            c = c.next;
          } while (c !== b);
        }
      }
      function Rj(a) {
        var b = a.ref;
        if (null !== b) {
          var c = a.stateNode;
          switch (a.tag) {
            case 5:
              a = c;
              break;
            default:
              a = c;
          }
          "function" === typeof b ? b(a) : b.current = a;
        }
      }
      function Sj(a) {
        var b = a.alternate;
        null !== b && (a.alternate = null, Sj(b));
        a.child = null;
        a.deletions = null;
        a.sibling = null;
        5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
        a.stateNode = null;
        a.return = null;
        a.dependencies = null;
        a.memoizedProps = null;
        a.memoizedState = null;
        a.pendingProps = null;
        a.stateNode = null;
        a.updateQueue = null;
      }
      function Tj(a) {
        return 5 === a.tag || 3 === a.tag || 4 === a.tag;
      }
      function Uj(a) {
        a: for (; ; ) {
          for (; null === a.sibling; ) {
            if (null === a.return || Tj(a.return)) return null;
            a = a.return;
          }
          a.sibling.return = a.return;
          for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
            if (a.flags & 2) continue a;
            if (null === a.child || 4 === a.tag) continue a;
            else a.child.return = a, a = a.child;
          }
          if (!(a.flags & 2)) return a.stateNode;
        }
      }
      function Vj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
        else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
      }
      function Wj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
        else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
      }
      var X = null;
      var Xj = false;
      function Yj(a, b, c) {
        for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
      }
      function Zj(a, b, c) {
        if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
          lc.onCommitFiberUnmount(kc, c);
        } catch (h) {
        }
        switch (c.tag) {
          case 5:
            U || Lj(c, b);
          case 6:
            var d = X, e = Xj;
            X = null;
            Yj(a, b, c);
            X = d;
            Xj = e;
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
            break;
          case 18:
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
            break;
          case 4:
            d = X;
            e = Xj;
            X = c.stateNode.containerInfo;
            Xj = true;
            Yj(a, b, c);
            X = d;
            Xj = e;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
              e = d = d.next;
              do {
                var f = e, g = f.destroy;
                f = f.tag;
                void 0 !== g && (0 !== (f & 2) ? Mj(c, b, g) : 0 !== (f & 4) && Mj(c, b, g));
                e = e.next;
              } while (e !== d);
            }
            Yj(a, b, c);
            break;
          case 1:
            if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
              d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
            } catch (h) {
              W(c, b, h);
            }
            Yj(a, b, c);
            break;
          case 21:
            Yj(a, b, c);
            break;
          case 22:
            c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
            break;
          default:
            Yj(a, b, c);
        }
      }
      function ak(a) {
        var b = a.updateQueue;
        if (null !== b) {
          a.updateQueue = null;
          var c = a.stateNode;
          null === c && (c = a.stateNode = new Kj());
          b.forEach(function(b2) {
            var d = bk.bind(null, a, b2);
            c.has(b2) || (c.add(b2), b2.then(d, d));
          });
        }
      }
      function ck(a, b) {
        var c = b.deletions;
        if (null !== c) for (var d = 0; d < c.length; d++) {
          var e = c[d];
          try {
            var f = a, g = b, h = g;
            a: for (; null !== h; ) {
              switch (h.tag) {
                case 5:
                  X = h.stateNode;
                  Xj = false;
                  break a;
                case 3:
                  X = h.stateNode.containerInfo;
                  Xj = true;
                  break a;
                case 4:
                  X = h.stateNode.containerInfo;
                  Xj = true;
                  break a;
              }
              h = h.return;
            }
            if (null === X) throw Error(p(160));
            Zj(f, g, e);
            X = null;
            Xj = false;
            var k = e.alternate;
            null !== k && (k.return = null);
            e.return = null;
          } catch (l) {
            W(e, b, l);
          }
        }
        if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
      }
      function dk(a, b) {
        var c = a.alternate, d = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            ck(b, a);
            ek(a);
            if (d & 4) {
              try {
                Pj(3, a, a.return), Qj(3, a);
              } catch (t) {
                W(a, a.return, t);
              }
              try {
                Pj(5, a, a.return);
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 1:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            break;
          case 5:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            if (a.flags & 32) {
              var e = a.stateNode;
              try {
                ob(e, "");
              } catch (t) {
                W(a, a.return, t);
              }
            }
            if (d & 4 && (e = a.stateNode, null != e)) {
              var f = a.memoizedProps, g = null !== c ? c.memoizedProps : f, h = a.type, k = a.updateQueue;
              a.updateQueue = null;
              if (null !== k) try {
                "input" === h && "radio" === f.type && null != f.name && ab(e, f);
                vb(h, g);
                var l = vb(h, f);
                for (g = 0; g < k.length; g += 2) {
                  var m = k[g], q = k[g + 1];
                  "style" === m ? sb(e, q) : "dangerouslySetInnerHTML" === m ? nb(e, q) : "children" === m ? ob(e, q) : ta(e, m, q, l);
                }
                switch (h) {
                  case "input":
                    bb(e, f);
                    break;
                  case "textarea":
                    ib(e, f);
                    break;
                  case "select":
                    var r = e._wrapperState.wasMultiple;
                    e._wrapperState.wasMultiple = !!f.multiple;
                    var y = f.value;
                    null != y ? fb(e, !!f.multiple, y, false) : r !== !!f.multiple && (null != f.defaultValue ? fb(
                      e,
                      !!f.multiple,
                      f.defaultValue,
                      true
                    ) : fb(e, !!f.multiple, f.multiple ? [] : "", false));
                }
                e[Pf] = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 6:
            ck(b, a);
            ek(a);
            if (d & 4) {
              if (null === a.stateNode) throw Error(p(162));
              e = a.stateNode;
              f = a.memoizedProps;
              try {
                e.nodeValue = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 3:
            ck(b, a);
            ek(a);
            if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
              bd(b.containerInfo);
            } catch (t) {
              W(a, a.return, t);
            }
            break;
          case 4:
            ck(b, a);
            ek(a);
            break;
          case 13:
            ck(b, a);
            ek(a);
            e = a.child;
            e.flags & 8192 && (f = null !== e.memoizedState, e.stateNode.isHidden = f, !f || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
            d & 4 && ak(a);
            break;
          case 22:
            m = null !== c && null !== c.memoizedState;
            a.mode & 1 ? (U = (l = U) || m, ck(b, a), U = l) : ck(b, a);
            ek(a);
            if (d & 8192) {
              l = null !== a.memoizedState;
              if ((a.stateNode.isHidden = l) && !m && 0 !== (a.mode & 1)) for (V = a, m = a.child; null !== m; ) {
                for (q = V = m; null !== V; ) {
                  r = V;
                  y = r.child;
                  switch (r.tag) {
                    case 0:
                    case 11:
                    case 14:
                    case 15:
                      Pj(4, r, r.return);
                      break;
                    case 1:
                      Lj(r, r.return);
                      var n = r.stateNode;
                      if ("function" === typeof n.componentWillUnmount) {
                        d = r;
                        c = r.return;
                        try {
                          b = d, n.props = b.memoizedProps, n.state = b.memoizedState, n.componentWillUnmount();
                        } catch (t) {
                          W(d, c, t);
                        }
                      }
                      break;
                    case 5:
                      Lj(r, r.return);
                      break;
                    case 22:
                      if (null !== r.memoizedState) {
                        gk(q);
                        continue;
                      }
                  }
                  null !== y ? (y.return = r, V = y) : gk(q);
                }
                m = m.sibling;
              }
              a: for (m = null, q = a; ; ) {
                if (5 === q.tag) {
                  if (null === m) {
                    m = q;
                    try {
                      e = q.stateNode, l ? (f = e.style, "function" === typeof f.setProperty ? f.setProperty("display", "none", "important") : f.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                    } catch (t) {
                      W(a, a.return, t);
                    }
                  }
                } else if (6 === q.tag) {
                  if (null === m) try {
                    q.stateNode.nodeValue = l ? "" : q.memoizedProps;
                  } catch (t) {
                    W(a, a.return, t);
                  }
                } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a) && null !== q.child) {
                  q.child.return = q;
                  q = q.child;
                  continue;
                }
                if (q === a) break a;
                for (; null === q.sibling; ) {
                  if (null === q.return || q.return === a) break a;
                  m === q && (m = null);
                  q = q.return;
                }
                m === q && (m = null);
                q.sibling.return = q.return;
                q = q.sibling;
              }
            }
            break;
          case 19:
            ck(b, a);
            ek(a);
            d & 4 && ak(a);
            break;
          case 21:
            break;
          default:
            ck(
              b,
              a
            ), ek(a);
        }
      }
      function ek(a) {
        var b = a.flags;
        if (b & 2) {
          try {
            a: {
              for (var c = a.return; null !== c; ) {
                if (Tj(c)) {
                  var d = c;
                  break a;
                }
                c = c.return;
              }
              throw Error(p(160));
            }
            switch (d.tag) {
              case 5:
                var e = d.stateNode;
                d.flags & 32 && (ob(e, ""), d.flags &= -33);
                var f = Uj(a);
                Wj(a, f, e);
                break;
              case 3:
              case 4:
                var g = d.stateNode.containerInfo, h = Uj(a);
                Vj(a, h, g);
                break;
              default:
                throw Error(p(161));
            }
          } catch (k) {
            W(a, a.return, k);
          }
          a.flags &= -3;
        }
        b & 4096 && (a.flags &= -4097);
      }
      function hk(a, b, c) {
        V = a;
        ik(a, b, c);
      }
      function ik(a, b, c) {
        for (var d = 0 !== (a.mode & 1); null !== V; ) {
          var e = V, f = e.child;
          if (22 === e.tag && d) {
            var g = null !== e.memoizedState || Jj;
            if (!g) {
              var h = e.alternate, k = null !== h && null !== h.memoizedState || U;
              h = Jj;
              var l = U;
              Jj = g;
              if ((U = k) && !l) for (V = e; null !== V; ) g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k ? (k.return = g, V = k) : jk(e);
              for (; null !== f; ) V = f, ik(f, b, c), f = f.sibling;
              V = e;
              Jj = h;
              U = l;
            }
            kk(a, b, c);
          } else 0 !== (e.subtreeFlags & 8772) && null !== f ? (f.return = e, V = f) : kk(a, b, c);
        }
      }
      function kk(a) {
        for (; null !== V; ) {
          var b = V;
          if (0 !== (b.flags & 8772)) {
            var c = b.alternate;
            try {
              if (0 !== (b.flags & 8772)) switch (b.tag) {
                case 0:
                case 11:
                case 15:
                  U || Qj(5, b);
                  break;
                case 1:
                  var d = b.stateNode;
                  if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
                  else {
                    var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
                    d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
                  }
                  var f = b.updateQueue;
                  null !== f && sh(b, f, d);
                  break;
                case 3:
                  var g = b.updateQueue;
                  if (null !== g) {
                    c = null;
                    if (null !== b.child) switch (b.child.tag) {
                      case 5:
                        c = b.child.stateNode;
                        break;
                      case 1:
                        c = b.child.stateNode;
                    }
                    sh(b, g, c);
                  }
                  break;
                case 5:
                  var h = b.stateNode;
                  if (null === c && b.flags & 4) {
                    c = h;
                    var k = b.memoizedProps;
                    switch (b.type) {
                      case "button":
                      case "input":
                      case "select":
                      case "textarea":
                        k.autoFocus && c.focus();
                        break;
                      case "img":
                        k.src && (c.src = k.src);
                    }
                  }
                  break;
                case 6:
                  break;
                case 4:
                  break;
                case 12:
                  break;
                case 13:
                  if (null === b.memoizedState) {
                    var l = b.alternate;
                    if (null !== l) {
                      var m = l.memoizedState;
                      if (null !== m) {
                        var q = m.dehydrated;
                        null !== q && bd(q);
                      }
                    }
                  }
                  break;
                case 19:
                case 17:
                case 21:
                case 22:
                case 23:
                case 25:
                  break;
                default:
                  throw Error(p(163));
              }
              U || b.flags & 512 && Rj(b);
            } catch (r) {
              W(b, b.return, r);
            }
          }
          if (b === a) {
            V = null;
            break;
          }
          c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function gk(a) {
        for (; null !== V; ) {
          var b = V;
          if (b === a) {
            V = null;
            break;
          }
          var c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function jk(a) {
        for (; null !== V; ) {
          var b = V;
          try {
            switch (b.tag) {
              case 0:
              case 11:
              case 15:
                var c = b.return;
                try {
                  Qj(4, b);
                } catch (k) {
                  W(b, c, k);
                }
                break;
              case 1:
                var d = b.stateNode;
                if ("function" === typeof d.componentDidMount) {
                  var e = b.return;
                  try {
                    d.componentDidMount();
                  } catch (k) {
                    W(b, e, k);
                  }
                }
                var f = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, f, k);
                }
                break;
              case 5:
                var g = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, g, k);
                }
            }
          } catch (k) {
            W(b, b.return, k);
          }
          if (b === a) {
            V = null;
            break;
          }
          var h = b.sibling;
          if (null !== h) {
            h.return = b.return;
            V = h;
            break;
          }
          V = b.return;
        }
      }
      var lk = Math.ceil;
      var mk = ua.ReactCurrentDispatcher;
      var nk = ua.ReactCurrentOwner;
      var ok = ua.ReactCurrentBatchConfig;
      var K = 0;
      var Q = null;
      var Y = null;
      var Z = 0;
      var fj = 0;
      var ej = Uf(0);
      var T = 0;
      var pk = null;
      var rh = 0;
      var qk = 0;
      var rk = 0;
      var sk = null;
      var tk = null;
      var fk = 0;
      var Gj = Infinity;
      var uk = null;
      var Oi = false;
      var Pi = null;
      var Ri = null;
      var vk = false;
      var wk = null;
      var xk = 0;
      var yk = 0;
      var zk = null;
      var Ak = -1;
      var Bk = 0;
      function R() {
        return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
      }
      function yi(a) {
        if (0 === (a.mode & 1)) return 1;
        if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
        if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
        a = C;
        if (0 !== a) return a;
        a = window.event;
        a = void 0 === a ? 16 : jd(a.type);
        return a;
      }
      function gi(a, b, c, d) {
        if (50 < yk) throw yk = 0, zk = null, Error(p(185));
        Ac(a, c, d);
        if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
      }
      function Dk(a, b) {
        var c = a.callbackNode;
        wc(a, b);
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
        else if (b = d & -d, a.callbackPriority !== b) {
          null != c && bc(c);
          if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
            0 === (K & 6) && jg();
          }), c = null;
          else {
            switch (Dc(d)) {
              case 1:
                c = fc;
                break;
              case 4:
                c = gc;
                break;
              case 16:
                c = hc;
                break;
              case 536870912:
                c = jc;
                break;
              default:
                c = hc;
            }
            c = Fk(c, Gk.bind(null, a));
          }
          a.callbackPriority = b;
          a.callbackNode = c;
        }
      }
      function Gk(a, b) {
        Ak = -1;
        Bk = 0;
        if (0 !== (K & 6)) throw Error(p(327));
        var c = a.callbackNode;
        if (Hk() && a.callbackNode !== c) return null;
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d) return null;
        if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
        else {
          b = d;
          var e = K;
          K |= 2;
          var f = Jk();
          if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
          do
            try {
              Lk();
              break;
            } catch (h) {
              Mk(a, h);
            }
          while (1);
          $g();
          mk.current = f;
          K = e;
          null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
        }
        if (0 !== b) {
          2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
          if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
          if (6 === b) Ck(a, d);
          else {
            e = a.current.alternate;
            if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f = xc(a), 0 !== f && (d = f, b = Nk(a, f))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
            a.finishedWork = e;
            a.finishedLanes = d;
            switch (b) {
              case 0:
              case 1:
                throw Error(p(345));
              case 2:
                Pk(a, tk, uk);
                break;
              case 3:
                Ck(a, d);
                if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
                  if (0 !== uc(a, 0)) break;
                  e = a.suspendedLanes;
                  if ((e & d) !== d) {
                    R();
                    a.pingedLanes |= a.suspendedLanes & e;
                    break;
                  }
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 4:
                Ck(a, d);
                if ((d & 4194240) === d) break;
                b = a.eventTimes;
                for (e = -1; 0 < d; ) {
                  var g = 31 - oc(d);
                  f = 1 << g;
                  g = b[g];
                  g > e && (e = g);
                  d &= ~f;
                }
                d = e;
                d = B() - d;
                d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
                if (10 < d) {
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 5:
                Pk(a, tk, uk);
                break;
              default:
                throw Error(p(329));
            }
          }
        }
        Dk(a, B());
        return a.callbackNode === c ? Gk.bind(null, a) : null;
      }
      function Nk(a, b) {
        var c = sk;
        a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
        a = Ik(a, b);
        2 !== a && (b = tk, tk = c, null !== b && Fj(b));
        return a;
      }
      function Fj(a) {
        null === tk ? tk = a : tk.push.apply(tk, a);
      }
      function Ok(a) {
        for (var b = a; ; ) {
          if (b.flags & 16384) {
            var c = b.updateQueue;
            if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
              var e = c[d], f = e.getSnapshot;
              e = e.value;
              try {
                if (!He(f(), e)) return false;
              } catch (g) {
                return false;
              }
            }
          }
          c = b.child;
          if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
          else {
            if (b === a) break;
            for (; null === b.sibling; ) {
              if (null === b.return || b.return === a) return true;
              b = b.return;
            }
            b.sibling.return = b.return;
            b = b.sibling;
          }
        }
        return true;
      }
      function Ck(a, b) {
        b &= ~rk;
        b &= ~qk;
        a.suspendedLanes |= b;
        a.pingedLanes &= ~b;
        for (a = a.expirationTimes; 0 < b; ) {
          var c = 31 - oc(b), d = 1 << c;
          a[c] = -1;
          b &= ~d;
        }
      }
      function Ek(a) {
        if (0 !== (K & 6)) throw Error(p(327));
        Hk();
        var b = uc(a, 0);
        if (0 === (b & 1)) return Dk(a, B()), null;
        var c = Ik(a, b);
        if (0 !== a.tag && 2 === c) {
          var d = xc(a);
          0 !== d && (b = d, c = Nk(a, d));
        }
        if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
        if (6 === c) throw Error(p(345));
        a.finishedWork = a.current.alternate;
        a.finishedLanes = b;
        Pk(a, tk, uk);
        Dk(a, B());
        return null;
      }
      function Qk(a, b) {
        var c = K;
        K |= 1;
        try {
          return a(b);
        } finally {
          K = c, 0 === K && (Gj = B() + 500, fg && jg());
        }
      }
      function Rk(a) {
        null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
        var b = K;
        K |= 1;
        var c = ok.transition, d = C;
        try {
          if (ok.transition = null, C = 1, a) return a();
        } finally {
          C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
        }
      }
      function Hj() {
        fj = ej.current;
        E(ej);
      }
      function Kk(a, b) {
        a.finishedWork = null;
        a.finishedLanes = 0;
        var c = a.timeoutHandle;
        -1 !== c && (a.timeoutHandle = -1, Gf(c));
        if (null !== Y) for (c = Y.return; null !== c; ) {
          var d = c;
          wg(d);
          switch (d.tag) {
            case 1:
              d = d.type.childContextTypes;
              null !== d && void 0 !== d && $f();
              break;
            case 3:
              zh();
              E(Wf);
              E(H);
              Eh();
              break;
            case 5:
              Bh(d);
              break;
            case 4:
              zh();
              break;
            case 13:
              E(L);
              break;
            case 19:
              E(L);
              break;
            case 10:
              ah(d.type._context);
              break;
            case 22:
            case 23:
              Hj();
          }
          c = c.return;
        }
        Q = a;
        Y = a = Pg(a.current, null);
        Z = fj = b;
        T = 0;
        pk = null;
        rk = qk = rh = 0;
        tk = sk = null;
        if (null !== fh) {
          for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
            c.interleaved = null;
            var e = d.next, f = c.pending;
            if (null !== f) {
              var g = f.next;
              f.next = e;
              d.next = g;
            }
            c.pending = d;
          }
          fh = null;
        }
        return a;
      }
      function Mk(a, b) {
        do {
          var c = Y;
          try {
            $g();
            Fh.current = Rh;
            if (Ih) {
              for (var d = M.memoizedState; null !== d; ) {
                var e = d.queue;
                null !== e && (e.pending = null);
                d = d.next;
              }
              Ih = false;
            }
            Hh = 0;
            O = N = M = null;
            Jh = false;
            Kh = 0;
            nk.current = null;
            if (null === c || null === c.return) {
              T = 1;
              pk = b;
              Y = null;
              break;
            }
            a: {
              var f = a, g = c.return, h = c, k = b;
              b = Z;
              h.flags |= 32768;
              if (null !== k && "object" === typeof k && "function" === typeof k.then) {
                var l = k, m = h, q = m.tag;
                if (0 === (m.mode & 1) && (0 === q || 11 === q || 15 === q)) {
                  var r = m.alternate;
                  r ? (m.updateQueue = r.updateQueue, m.memoizedState = r.memoizedState, m.lanes = r.lanes) : (m.updateQueue = null, m.memoizedState = null);
                }
                var y = Ui(g);
                if (null !== y) {
                  y.flags &= -257;
                  Vi(y, g, h, f, b);
                  y.mode & 1 && Si(f, l, b);
                  b = y;
                  k = l;
                  var n = b.updateQueue;
                  if (null === n) {
                    var t = /* @__PURE__ */ new Set();
                    t.add(k);
                    b.updateQueue = t;
                  } else n.add(k);
                  break a;
                } else {
                  if (0 === (b & 1)) {
                    Si(f, l, b);
                    tj();
                    break a;
                  }
                  k = Error(p(426));
                }
              } else if (I && h.mode & 1) {
                var J = Ui(g);
                if (null !== J) {
                  0 === (J.flags & 65536) && (J.flags |= 256);
                  Vi(J, g, h, f, b);
                  Jg(Ji(k, h));
                  break a;
                }
              }
              f = k = Ji(k, h);
              4 !== T && (T = 2);
              null === sk ? sk = [f] : sk.push(f);
              f = g;
              do {
                switch (f.tag) {
                  case 3:
                    f.flags |= 65536;
                    b &= -b;
                    f.lanes |= b;
                    var x = Ni(f, k, b);
                    ph(f, x);
                    break a;
                  case 1:
                    h = k;
                    var w = f.type, u = f.stateNode;
                    if (0 === (f.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                      f.flags |= 65536;
                      b &= -b;
                      f.lanes |= b;
                      var F = Qi(f, h, b);
                      ph(f, F);
                      break a;
                    }
                }
                f = f.return;
              } while (null !== f);
            }
            Sk(c);
          } catch (na) {
            b = na;
            Y === c && null !== c && (Y = c = c.return);
            continue;
          }
          break;
        } while (1);
      }
      function Jk() {
        var a = mk.current;
        mk.current = Rh;
        return null === a ? Rh : a;
      }
      function tj() {
        if (0 === T || 3 === T || 2 === T) T = 4;
        null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
      }
      function Ik(a, b) {
        var c = K;
        K |= 2;
        var d = Jk();
        if (Q !== a || Z !== b) uk = null, Kk(a, b);
        do
          try {
            Tk();
            break;
          } catch (e) {
            Mk(a, e);
          }
        while (1);
        $g();
        K = c;
        mk.current = d;
        if (null !== Y) throw Error(p(261));
        Q = null;
        Z = 0;
        return T;
      }
      function Tk() {
        for (; null !== Y; ) Uk(Y);
      }
      function Lk() {
        for (; null !== Y && !cc(); ) Uk(Y);
      }
      function Uk(a) {
        var b = Vk(a.alternate, a, fj);
        a.memoizedProps = a.pendingProps;
        null === b ? Sk(a) : Y = b;
        nk.current = null;
      }
      function Sk(a) {
        var b = a;
        do {
          var c = b.alternate;
          a = b.return;
          if (0 === (b.flags & 32768)) {
            if (c = Ej(c, b, fj), null !== c) {
              Y = c;
              return;
            }
          } else {
            c = Ij(c, b);
            if (null !== c) {
              c.flags &= 32767;
              Y = c;
              return;
            }
            if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
            else {
              T = 6;
              Y = null;
              return;
            }
          }
          b = b.sibling;
          if (null !== b) {
            Y = b;
            return;
          }
          Y = b = a;
        } while (null !== b);
        0 === T && (T = 5);
      }
      function Pk(a, b, c) {
        var d = C, e = ok.transition;
        try {
          ok.transition = null, C = 1, Wk(a, b, c, d);
        } finally {
          ok.transition = e, C = d;
        }
        return null;
      }
      function Wk(a, b, c, d) {
        do
          Hk();
        while (null !== wk);
        if (0 !== (K & 6)) throw Error(p(327));
        c = a.finishedWork;
        var e = a.finishedLanes;
        if (null === c) return null;
        a.finishedWork = null;
        a.finishedLanes = 0;
        if (c === a.current) throw Error(p(177));
        a.callbackNode = null;
        a.callbackPriority = 0;
        var f = c.lanes | c.childLanes;
        Bc(a, f);
        a === Q && (Y = Q = null, Z = 0);
        0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
          Hk();
          return null;
        }));
        f = 0 !== (c.flags & 15990);
        if (0 !== (c.subtreeFlags & 15990) || f) {
          f = ok.transition;
          ok.transition = null;
          var g = C;
          C = 1;
          var h = K;
          K |= 4;
          nk.current = null;
          Oj(a, c);
          dk(c, a);
          Oe(Df);
          dd = !!Cf;
          Df = Cf = null;
          a.current = c;
          hk(c, a, e);
          dc();
          K = h;
          C = g;
          ok.transition = f;
        } else a.current = c;
        vk && (vk = false, wk = a, xk = e);
        f = a.pendingLanes;
        0 === f && (Ri = null);
        mc(c.stateNode, d);
        Dk(a, B());
        if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
        if (Oi) throw Oi = false, a = Pi, Pi = null, a;
        0 !== (xk & 1) && 0 !== a.tag && Hk();
        f = a.pendingLanes;
        0 !== (f & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
        jg();
        return null;
      }
      function Hk() {
        if (null !== wk) {
          var a = Dc(xk), b = ok.transition, c = C;
          try {
            ok.transition = null;
            C = 16 > a ? 16 : a;
            if (null === wk) var d = false;
            else {
              a = wk;
              wk = null;
              xk = 0;
              if (0 !== (K & 6)) throw Error(p(331));
              var e = K;
              K |= 4;
              for (V = a.current; null !== V; ) {
                var f = V, g = f.child;
                if (0 !== (V.flags & 16)) {
                  var h = f.deletions;
                  if (null !== h) {
                    for (var k = 0; k < h.length; k++) {
                      var l = h[k];
                      for (V = l; null !== V; ) {
                        var m = V;
                        switch (m.tag) {
                          case 0:
                          case 11:
                          case 15:
                            Pj(8, m, f);
                        }
                        var q = m.child;
                        if (null !== q) q.return = m, V = q;
                        else for (; null !== V; ) {
                          m = V;
                          var r = m.sibling, y = m.return;
                          Sj(m);
                          if (m === l) {
                            V = null;
                            break;
                          }
                          if (null !== r) {
                            r.return = y;
                            V = r;
                            break;
                          }
                          V = y;
                        }
                      }
                    }
                    var n = f.alternate;
                    if (null !== n) {
                      var t = n.child;
                      if (null !== t) {
                        n.child = null;
                        do {
                          var J = t.sibling;
                          t.sibling = null;
                          t = J;
                        } while (null !== t);
                      }
                    }
                    V = f;
                  }
                }
                if (0 !== (f.subtreeFlags & 2064) && null !== g) g.return = f, V = g;
                else b: for (; null !== V; ) {
                  f = V;
                  if (0 !== (f.flags & 2048)) switch (f.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(9, f, f.return);
                  }
                  var x = f.sibling;
                  if (null !== x) {
                    x.return = f.return;
                    V = x;
                    break b;
                  }
                  V = f.return;
                }
              }
              var w = a.current;
              for (V = w; null !== V; ) {
                g = V;
                var u = g.child;
                if (0 !== (g.subtreeFlags & 2064) && null !== u) u.return = g, V = u;
                else b: for (g = w; null !== V; ) {
                  h = V;
                  if (0 !== (h.flags & 2048)) try {
                    switch (h.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Qj(9, h);
                    }
                  } catch (na) {
                    W(h, h.return, na);
                  }
                  if (h === g) {
                    V = null;
                    break b;
                  }
                  var F = h.sibling;
                  if (null !== F) {
                    F.return = h.return;
                    V = F;
                    break b;
                  }
                  V = h.return;
                }
              }
              K = e;
              jg();
              if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
                lc.onPostCommitFiberRoot(kc, a);
              } catch (na) {
              }
              d = true;
            }
            return d;
          } finally {
            C = c, ok.transition = b;
          }
        }
        return false;
      }
      function Xk(a, b, c) {
        b = Ji(c, b);
        b = Ni(a, b, 1);
        a = nh(a, b, 1);
        b = R();
        null !== a && (Ac(a, 1, b), Dk(a, b));
      }
      function W(a, b, c) {
        if (3 === a.tag) Xk(a, a, c);
        else for (; null !== b; ) {
          if (3 === b.tag) {
            Xk(b, a, c);
            break;
          } else if (1 === b.tag) {
            var d = b.stateNode;
            if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
              a = Ji(c, a);
              a = Qi(b, a, 1);
              b = nh(b, a, 1);
              a = R();
              null !== b && (Ac(b, 1, a), Dk(b, a));
              break;
            }
          }
          b = b.return;
        }
      }
      function Ti(a, b, c) {
        var d = a.pingCache;
        null !== d && d.delete(b);
        b = R();
        a.pingedLanes |= a.suspendedLanes & c;
        Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
        Dk(a, b);
      }
      function Yk(a, b) {
        0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
        var c = R();
        a = ih(a, b);
        null !== a && (Ac(a, b, c), Dk(a, c));
      }
      function uj(a) {
        var b = a.memoizedState, c = 0;
        null !== b && (c = b.retryLane);
        Yk(a, c);
      }
      function bk(a, b) {
        var c = 0;
        switch (a.tag) {
          case 13:
            var d = a.stateNode;
            var e = a.memoizedState;
            null !== e && (c = e.retryLane);
            break;
          case 19:
            d = a.stateNode;
            break;
          default:
            throw Error(p(314));
        }
        null !== d && d.delete(b);
        Yk(a, c);
      }
      var Vk;
      Vk = function(a, b, c) {
        if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
        else {
          if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
          dh = 0 !== (a.flags & 131072) ? true : false;
        }
        else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
        b.lanes = 0;
        switch (b.tag) {
          case 2:
            var d = b.type;
            ij(a, b);
            a = b.pendingProps;
            var e = Yf(b, H.current);
            ch(b, c);
            e = Nh(null, b, d, a, e, c);
            var f = Sh();
            b.flags |= 1;
            "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f = true, cg(b)) : f = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f, c)) : (b.tag = 0, I && f && vg(b), Xi(null, b, e, c), b = b.child);
            return b;
          case 16:
            d = b.elementType;
            a: {
              ij(a, b);
              a = b.pendingProps;
              e = d._init;
              d = e(d._payload);
              b.type = d;
              e = b.tag = Zk(d);
              a = Ci(d, a);
              switch (e) {
                case 0:
                  b = cj(null, b, d, a, c);
                  break a;
                case 1:
                  b = hj(null, b, d, a, c);
                  break a;
                case 11:
                  b = Yi(null, b, d, a, c);
                  break a;
                case 14:
                  b = $i(null, b, d, Ci(d.type, a), c);
                  break a;
              }
              throw Error(p(
                306,
                d,
                ""
              ));
            }
            return b;
          case 0:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
          case 1:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
          case 3:
            a: {
              kj(b);
              if (null === a) throw Error(p(387));
              d = b.pendingProps;
              f = b.memoizedState;
              e = f.element;
              lh(a, b);
              qh(b, d, null, c);
              var g = b.memoizedState;
              d = g.element;
              if (f.isDehydrated) if (f = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f, b.memoizedState = f, b.flags & 256) {
                e = Ji(Error(p(423)), b);
                b = lj(a, b, d, c, e);
                break a;
              } else if (d !== e) {
                e = Ji(Error(p(424)), b);
                b = lj(a, b, d, c, e);
                break a;
              } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
              else {
                Ig();
                if (d === e) {
                  b = Zi(a, b, c);
                  break a;
                }
                Xi(a, b, d, c);
              }
              b = b.child;
            }
            return b;
          case 5:
            return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f && Ef(d, f) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
          case 6:
            return null === a && Eg(b), null;
          case 13:
            return oj(a, b, c);
          case 4:
            return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
          case 11:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
          case 7:
            return Xi(a, b, b.pendingProps, c), b.child;
          case 8:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 12:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 10:
            a: {
              d = b.type._context;
              e = b.pendingProps;
              f = b.memoizedProps;
              g = e.value;
              G(Wg, d._currentValue);
              d._currentValue = g;
              if (null !== f) if (He(f.value, g)) {
                if (f.children === e.children && !Wf.current) {
                  b = Zi(a, b, c);
                  break a;
                }
              } else for (f = b.child, null !== f && (f.return = b); null !== f; ) {
                var h = f.dependencies;
                if (null !== h) {
                  g = f.child;
                  for (var k = h.firstContext; null !== k; ) {
                    if (k.context === d) {
                      if (1 === f.tag) {
                        k = mh(-1, c & -c);
                        k.tag = 2;
                        var l = f.updateQueue;
                        if (null !== l) {
                          l = l.shared;
                          var m = l.pending;
                          null === m ? k.next = k : (k.next = m.next, m.next = k);
                          l.pending = k;
                        }
                      }
                      f.lanes |= c;
                      k = f.alternate;
                      null !== k && (k.lanes |= c);
                      bh(
                        f.return,
                        c,
                        b
                      );
                      h.lanes |= c;
                      break;
                    }
                    k = k.next;
                  }
                } else if (10 === f.tag) g = f.type === b.type ? null : f.child;
                else if (18 === f.tag) {
                  g = f.return;
                  if (null === g) throw Error(p(341));
                  g.lanes |= c;
                  h = g.alternate;
                  null !== h && (h.lanes |= c);
                  bh(g, c, b);
                  g = f.sibling;
                } else g = f.child;
                if (null !== g) g.return = f;
                else for (g = f; null !== g; ) {
                  if (g === b) {
                    g = null;
                    break;
                  }
                  f = g.sibling;
                  if (null !== f) {
                    f.return = g.return;
                    g = f;
                    break;
                  }
                  g = g.return;
                }
                f = g;
              }
              Xi(a, b, e.children, c);
              b = b.child;
            }
            return b;
          case 9:
            return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
          case 14:
            return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
          case 15:
            return bj(a, b, b.type, b.pendingProps, c);
          case 17:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
          case 19:
            return xj(a, b, c);
          case 22:
            return dj(a, b, c);
        }
        throw Error(p(156, b.tag));
      };
      function Fk(a, b) {
        return ac(a, b);
      }
      function $k(a, b, c, d) {
        this.tag = a;
        this.key = c;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.ref = null;
        this.pendingProps = b;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = d;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
      }
      function Bg(a, b, c, d) {
        return new $k(a, b, c, d);
      }
      function aj(a) {
        a = a.prototype;
        return !(!a || !a.isReactComponent);
      }
      function Zk(a) {
        if ("function" === typeof a) return aj(a) ? 1 : 0;
        if (void 0 !== a && null !== a) {
          a = a.$$typeof;
          if (a === Da) return 11;
          if (a === Ga) return 14;
        }
        return 2;
      }
      function Pg(a, b) {
        var c = a.alternate;
        null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
        c.flags = a.flags & 14680064;
        c.childLanes = a.childLanes;
        c.lanes = a.lanes;
        c.child = a.child;
        c.memoizedProps = a.memoizedProps;
        c.memoizedState = a.memoizedState;
        c.updateQueue = a.updateQueue;
        b = a.dependencies;
        c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
        c.sibling = a.sibling;
        c.index = a.index;
        c.ref = a.ref;
        return c;
      }
      function Rg(a, b, c, d, e, f) {
        var g = 2;
        d = a;
        if ("function" === typeof a) aj(a) && (g = 1);
        else if ("string" === typeof a) g = 5;
        else a: switch (a) {
          case ya:
            return Tg(c.children, e, f, b);
          case za:
            g = 8;
            e |= 8;
            break;
          case Aa:
            return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f, a;
          case Ea:
            return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f, a;
          case Fa:
            return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f, a;
          case Ia:
            return pj(c, e, f, b);
          default:
            if ("object" === typeof a && null !== a) switch (a.$$typeof) {
              case Ba:
                g = 10;
                break a;
              case Ca:
                g = 9;
                break a;
              case Da:
                g = 11;
                break a;
              case Ga:
                g = 14;
                break a;
              case Ha:
                g = 16;
                d = null;
                break a;
            }
            throw Error(p(130, null == a ? a : typeof a, ""));
        }
        b = Bg(g, c, b, e);
        b.elementType = a;
        b.type = d;
        b.lanes = f;
        return b;
      }
      function Tg(a, b, c, d) {
        a = Bg(7, a, d, b);
        a.lanes = c;
        return a;
      }
      function pj(a, b, c, d) {
        a = Bg(22, a, d, b);
        a.elementType = Ia;
        a.lanes = c;
        a.stateNode = { isHidden: false };
        return a;
      }
      function Qg(a, b, c) {
        a = Bg(6, a, null, b);
        a.lanes = c;
        return a;
      }
      function Sg(a, b, c) {
        b = Bg(4, null !== a.children ? a.children : [], a.key, b);
        b.lanes = c;
        b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
        return b;
      }
      function al(a, b, c, d, e) {
        this.tag = b;
        this.containerInfo = a;
        this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
        this.timeoutHandle = -1;
        this.callbackNode = this.pendingContext = this.context = null;
        this.callbackPriority = 0;
        this.eventTimes = zc(0);
        this.expirationTimes = zc(-1);
        this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
        this.entanglements = zc(0);
        this.identifierPrefix = d;
        this.onRecoverableError = e;
        this.mutableSourceEagerHydrationData = null;
      }
      function bl(a, b, c, d, e, f, g, h, k) {
        a = new al(a, b, c, h, k);
        1 === b ? (b = 1, true === f && (b |= 8)) : b = 0;
        f = Bg(3, null, null, b);
        a.current = f;
        f.stateNode = a;
        f.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
        kh(f);
        return a;
      }
      function cl(a, b, c) {
        var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
      }
      function dl(a) {
        if (!a) return Vf;
        a = a._reactInternals;
        a: {
          if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
          var b = a;
          do {
            switch (b.tag) {
              case 3:
                b = b.stateNode.context;
                break a;
              case 1:
                if (Zf(b.type)) {
                  b = b.stateNode.__reactInternalMemoizedMergedChildContext;
                  break a;
                }
            }
            b = b.return;
          } while (null !== b);
          throw Error(p(171));
        }
        if (1 === a.tag) {
          var c = a.type;
          if (Zf(c)) return bg(a, c, b);
        }
        return b;
      }
      function el2(a, b, c, d, e, f, g, h, k) {
        a = bl(c, d, true, a, e, f, g, h, k);
        a.context = dl(null);
        c = a.current;
        d = R();
        e = yi(c);
        f = mh(d, e);
        f.callback = void 0 !== b && null !== b ? b : null;
        nh(c, f, e);
        a.current.lanes = e;
        Ac(a, e, d);
        Dk(a, d);
        return a;
      }
      function fl(a, b, c, d) {
        var e = b.current, f = R(), g = yi(e);
        c = dl(c);
        null === b.context ? b.context = c : b.pendingContext = c;
        b = mh(f, g);
        b.payload = { element: a };
        d = void 0 === d ? null : d;
        null !== d && (b.callback = d);
        a = nh(e, b, g);
        null !== a && (gi(a, e, g, f), oh(a, e, g));
        return g;
      }
      function gl(a) {
        a = a.current;
        if (!a.child) return null;
        switch (a.child.tag) {
          case 5:
            return a.child.stateNode;
          default:
            return a.child.stateNode;
        }
      }
      function hl(a, b) {
        a = a.memoizedState;
        if (null !== a && null !== a.dehydrated) {
          var c = a.retryLane;
          a.retryLane = 0 !== c && c < b ? c : b;
        }
      }
      function il(a, b) {
        hl(a, b);
        (a = a.alternate) && hl(a, b);
      }
      function jl() {
        return null;
      }
      var kl = "function" === typeof reportError ? reportError : function(a) {
        console.error(a);
      };
      function ll(a) {
        this._internalRoot = a;
      }
      ml.prototype.render = ll.prototype.render = function(a) {
        var b = this._internalRoot;
        if (null === b) throw Error(p(409));
        fl(a, b, null, null);
      };
      ml.prototype.unmount = ll.prototype.unmount = function() {
        var a = this._internalRoot;
        if (null !== a) {
          this._internalRoot = null;
          var b = a.containerInfo;
          Rk(function() {
            fl(null, a, null, null);
          });
          b[uf] = null;
        }
      };
      function ml(a) {
        this._internalRoot = a;
      }
      ml.prototype.unstable_scheduleHydration = function(a) {
        if (a) {
          var b = Hc();
          a = { blockedOn: null, target: a, priority: b };
          for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
          Qc.splice(c, 0, a);
          0 === c && Vc(a);
        }
      };
      function nl(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
      }
      function ol(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
      }
      function pl() {
      }
      function ql(a, b, c, d, e) {
        if (e) {
          if ("function" === typeof d) {
            var f = d;
            d = function() {
              var a2 = gl(g);
              f.call(a2);
            };
          }
          var g = el2(b, d, a, 0, null, false, false, "", pl);
          a._reactRootContainer = g;
          a[uf] = g.current;
          sf(8 === a.nodeType ? a.parentNode : a);
          Rk();
          return g;
        }
        for (; e = a.lastChild; ) a.removeChild(e);
        if ("function" === typeof d) {
          var h = d;
          d = function() {
            var a2 = gl(k);
            h.call(a2);
          };
        }
        var k = bl(a, 0, false, null, null, false, false, "", pl);
        a._reactRootContainer = k;
        a[uf] = k.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        Rk(function() {
          fl(b, k, c, d);
        });
        return k;
      }
      function rl(a, b, c, d, e) {
        var f = c._reactRootContainer;
        if (f) {
          var g = f;
          if ("function" === typeof e) {
            var h = e;
            e = function() {
              var a2 = gl(g);
              h.call(a2);
            };
          }
          fl(b, g, a, e);
        } else g = ql(c, b, a, e, d);
        return gl(g);
      }
      Ec = function(a) {
        switch (a.tag) {
          case 3:
            var b = a.stateNode;
            if (b.current.memoizedState.isDehydrated) {
              var c = tc(b.pendingLanes);
              0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
            }
            break;
          case 13:
            Rk(function() {
              var b2 = ih(a, 1);
              if (null !== b2) {
                var c2 = R();
                gi(b2, a, 1, c2);
              }
            }), il(a, 1);
        }
      };
      Fc = function(a) {
        if (13 === a.tag) {
          var b = ih(a, 134217728);
          if (null !== b) {
            var c = R();
            gi(b, a, 134217728, c);
          }
          il(a, 134217728);
        }
      };
      Gc = function(a) {
        if (13 === a.tag) {
          var b = yi(a), c = ih(a, b);
          if (null !== c) {
            var d = R();
            gi(c, a, b, d);
          }
          il(a, b);
        }
      };
      Hc = function() {
        return C;
      };
      Ic = function(a, b) {
        var c = C;
        try {
          return C = a, b();
        } finally {
          C = c;
        }
      };
      yb = function(a, b, c) {
        switch (b) {
          case "input":
            bb(a, c);
            b = c.name;
            if ("radio" === c.type && null != b) {
              for (c = a; c.parentNode; ) c = c.parentNode;
              c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
              for (b = 0; b < c.length; b++) {
                var d = c[b];
                if (d !== a && d.form === a.form) {
                  var e = Db(d);
                  if (!e) throw Error(p(90));
                  Wa(d);
                  bb(d, e);
                }
              }
            }
            break;
          case "textarea":
            ib(a, c);
            break;
          case "select":
            b = c.value, null != b && fb(a, !!c.multiple, b, false);
        }
      };
      Gb = Qk;
      Hb = Rk;
      var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] };
      var tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
      var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
        a = Zb(a);
        return null === a ? null : a.stateNode;
      }, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
      if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
        vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!vl.isDisabled && vl.supportsFiber) try {
          kc = vl.inject(ul), lc = vl;
        } catch (a) {
        }
      }
      var vl;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
      exports.createPortal = function(a, b) {
        var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!nl(b)) throw Error(p(200));
        return cl(a, b, null, c);
      };
      exports.createRoot = function(a, b) {
        if (!nl(a)) throw Error(p(299));
        var c = false, d = "", e = kl;
        null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
        b = bl(a, 1, false, null, null, c, false, d, e);
        a[uf] = b.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        return new ll(b);
      };
      exports.findDOMNode = function(a) {
        if (null == a) return null;
        if (1 === a.nodeType) return a;
        var b = a._reactInternals;
        if (void 0 === b) {
          if ("function" === typeof a.render) throw Error(p(188));
          a = Object.keys(a).join(",");
          throw Error(p(268, a));
        }
        a = Zb(b);
        a = null === a ? null : a.stateNode;
        return a;
      };
      exports.flushSync = function(a) {
        return Rk(a);
      };
      exports.hydrate = function(a, b, c) {
        if (!ol(b)) throw Error(p(200));
        return rl(null, a, b, true, c);
      };
      exports.hydrateRoot = function(a, b, c) {
        if (!nl(a)) throw Error(p(405));
        var d = null != c && c.hydratedSources || null, e = false, f = "", g = kl;
        null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
        b = el2(b, null, a, 1, null != c ? c : null, e, false, f, g);
        a[uf] = b.current;
        sf(a);
        if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
          c,
          e
        );
        return new ml(b);
      };
      exports.render = function(a, b, c) {
        if (!ol(b)) throw Error(p(200));
        return rl(null, a, b, false, c);
      };
      exports.unmountComponentAtNode = function(a) {
        if (!ol(a)) throw Error(p(40));
        return a._reactRootContainer ? (Rk(function() {
          rl(null, null, a, false, function() {
            a._reactRootContainer = null;
            a[uf] = null;
          });
        }), true) : false;
      };
      exports.unstable_batchedUpdates = Qk;
      exports.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
        if (!ol(c)) throw Error(p(200));
        if (null == a || void 0 === a._reactInternals) throw Error(p(38));
        return rl(a, b, c, false, d);
      };
      exports.version = "18.3.1-next-f1338f8080-20240426";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports) {
      "use strict";
      var m = require_react_dom();
      if (true) {
        exports.createRoot = m.createRoot;
        exports.hydrateRoot = m.hydrateRoot;
      } else {
        i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        exports.createRoot = function(c, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.createRoot(c, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
        exports.hydrateRoot = function(c, h, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.hydrateRoot(c, h, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
      }
      var i;
    }
  });

  // node_modules/react/cjs/react-jsx-runtime.production.min.js
  var require_react_jsx_runtime_production_min = __commonJS({
    "node_modules/react/cjs/react-jsx-runtime.production.min.js"(exports) {
      "use strict";
      var f = require_react();
      var k = Symbol.for("react.element");
      var l = Symbol.for("react.fragment");
      var m = Object.prototype.hasOwnProperty;
      var n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
      var p = { key: true, ref: true, __self: true, __source: true };
      function q(c, a, g) {
        var b, d = {}, e = null, h = null;
        void 0 !== g && (e = "" + g);
        void 0 !== a.key && (e = "" + a.key);
        void 0 !== a.ref && (h = a.ref);
        for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
        if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
        return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
      }
      exports.Fragment = l;
      exports.jsx = q;
      exports.jsxs = q;
    }
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_jsx_runtime_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // extension/media/src/index.jsx
  var import_client = __toESM(require_client());
  var import_react_dom = __toESM(require_react_dom());

  // extension/media/src/chrome/ExportMenu.jsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  function ExportMenu() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { id: "exportMenu", hidden: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "export-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Export" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", id: "exportClose", title: "Close export", children: "Close" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", id: "exportCopyPng", children: "Copy PNG" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", id: "exportPng", children: "PNG" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", id: "exportSvg", children: "SVG" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", id: "exportCopyShare", children: "Copy Share Card" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", id: "exportShare", children: "Share Card" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", id: "exportRouteShare", children: "Route Share Card" }) })
      ] })
    ] });
  }

  // extension/media/src/chrome/GraphBar.jsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime());
  function GraphBar() {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { id: "graphBar", hidden: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("nav", { id: "workspaces", className: "workspaces", "aria-label": "Explorer workspaces", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "map", children: "Map" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "slice", children: "Slice" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "lineage", children: "Lineage" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "decisions", children: "Decisions" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "registry", children: "Registry" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "overview", children: "Overview" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "timeline", children: "Timeline" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "delta", children: "Delta" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "sequence", children: "Sequence" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "dataflow", children: "Data-flow" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "data-ws": "lifecycle", children: "Lifecycle" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("nav", { id: "tabs" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { id: "egoBtn", type: "button", title: "Ego: isolate the selected node and its k-hop neighborhood", children: "Ego" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "ego-hops", title: "Ego hop depth on the derived graph", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { id: "egoHops", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "1", children: "1-hop" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "2", children: "2-hop" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { id: "pathBtn", type: "button", title: "Route probe: shortest derived directed path (R)", children: "PATH" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { id: "lensBtn", type: "button", title: "Lens: compare Function / Type / Endpoint or Source|Sink (L)", children: "LENS" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          type: "button",
          className: "reorg-btn",
          title: "Auto-reorganize this chart. Drag any box to pin a new place.",
          children: "Reorganize"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "search-wrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "search-ico", "aria-hidden": "true", children: "⌕" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            id: "graphSearch",
            type: "search",
            spellCheck: false,
            placeholder: "Find FQN, file, flow, or hop…"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("kbd", { children: "/" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { id: "kindFilters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "kind-pill kind-Function", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", "data-kind": "Function", defaultChecked: true }),
          " Function"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "kind-pill kind-Type", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", "data-kind": "Type", defaultChecked: true }),
          " Type"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "kind-pill kind-Endpoint", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", "data-kind": "Endpoint", defaultChecked: true }),
          " Endpoint"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { id: "legend" })
    ] });
  }

  // extension/media/src/chrome/Header.jsx
  var import_jsx_runtime3 = __toESM(require_jsx_runtime());
  function Header() {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "brand", children: [
        "Graph",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "ide" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "now-pill", id: "nowPill", hidden: true }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          id: "prompt",
          type: "text",
          spellCheck: false,
          placeholder: "name=hit,hit",
          title: "Optional prompt: name=hit,hit  (repeat with ; )"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "backBtn", title: "Back (Backspace)", disabled: true, children: "Back" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "reviewBtn", title: "Review workspace", children: "Review" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "cancelBtn", title: "Cancel review (Esc)", hidden: true, children: "Cancel" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "stampBtn", title: "Human stamp: this flow still holds (S)", children: "Stamp" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "skipBtn", title: "Skip this flow without a stamp (X)", children: "Skip" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "llmBtn", type: "button", title: "Connect an LLM or ask about this review path", children: "LLM" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "keysBtn", type: "button", title: "Keyboard shortcuts (?)", children: "?" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "exportBtn", type: "button", title: "Export PNG, SVG, or Share Card", children: "Export" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { id: "themeSeg", className: "theme-seg", role: "group", "aria-label": "Appearance", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", id: "themeDay", "data-theme": "day", title: "Day appearance (D)", children: "Day" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", id: "themeNight", "data-theme": "night", title: "Night appearance (D)", children: "Night" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          id: "presetBtn",
          type: "button",
          "data-preset": "classic",
          title: "Style: Classic. Cycles Classic / Signal / Blueprint",
          children: "Classic"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "presentBtn", type: "button", title: "Presentation Stage (F)", "aria-pressed": "false", children: "Present" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { id: "zoomBar", hidden: true, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "zoomOut", title: "Zoom out (−)", children: "−" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { id: "zoomPct", children: "100%" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "zoomIn", title: "Zoom in (+)", children: "+" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { id: "zoomFit", title: "Fit (0)", children: "Fit" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            type: "button",
            className: "reorg-btn",
            id: "reorgBtn",
            title: "Auto-reorganize this chart. Drag any box to pin a new place.",
            children: "Reorganize"
          }
        )
      ] })
    ] });
  }

  // extension/media/src/chrome/KeysPane.jsx
  var import_jsx_runtime4 = __toESM(require_jsx_runtime());
  function KeysPane() {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("aside", { id: "keysPane", hidden: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "keys-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: "Keys" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", id: "keysClose", title: "Close shortcuts", children: "Close" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("ul", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "1" }),
          "–",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "9" }),
          " workspaces"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "/" }),
          " find · ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "?" }),
          " this sheet"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "S" }),
          " stamp · ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "X" }),
          " skip"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "P" }),
          " play path · ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "[" }),
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "]" }),
          " step"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "R" }),
          " PATH · ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "L" }),
          " LENS · ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "E" }),
          " ego"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "F" }),
          " present · Style button cycles Classic / Signal / Blueprint"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "D" }),
          " day / night"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "+" }),
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "−" }),
          " zoom · ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("kbd", { children: "0" }),
          " fit · Backspace back"
        ] })
      ] })
    ] });
  }

  // extension/media/src/chrome/LlmPane.jsx
  var import_jsx_runtime5 = __toESM(require_jsx_runtime());
  function LlmPane() {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("aside", { id: "llmPane", hidden: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "llm-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: "Ask" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { id: "llmStatus", children: "No host yet — graph answers still work. Agents never stamp." }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", id: "llmClose", title: "Close Ask", children: "Close" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("form", { id: "llmConnect", className: "llm-connect", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
          "Host",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("select", { id: "llmPreset", children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "ollama", children: "Local Ollama · 11434" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "lmstudio", children: "Local LM Studio · 1234" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "llamacpp", children: "Local llama.cpp · 8080" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "openai", children: "OpenAI" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "custom", children: "Custom URL" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
          "Base URL",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { id: "llmBaseUrl", type: "url", spellCheck: false, placeholder: "http://127.0.0.1:11434/v1" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
          "Model",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { id: "llmModel", type: "text", spellCheck: false, placeholder: "llama3.2" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
          "API key",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { id: "llmKey", type: "password", spellCheck: false, placeholder: "empty for most local hosts" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "llm-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", id: "llmSave", children: "Save host" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", id: "llmTest", children: "Test" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", id: "llmShowKey", children: "Copy bridge key" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { id: "llmBridge", className: "llm-bridge", children: "Bridge off until Review view loads." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { id: "llmLog", className: "llm-log" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "llm-ask-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { id: "llmAsk", rows: 2, placeholder: "Ask the start → features → end path, a hop, or coverage…" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", id: "llmSend", children: "Ask" })
      ] })
    ] });
  }

  // extension/media/src/chrome/ProbeDock.jsx
  var import_jsx_runtime6 = __toESM(require_jsx_runtime());
  function ProbeDock() {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("aside", { id: "probeDock", hidden: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { id: "routeReceipt", hidden: true }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { id: "lensReceipt", hidden: true })
    ] });
  }

  // extension/media/src/chrome/Progress.jsx
  var import_jsx_runtime7 = __toESM(require_jsx_runtime());
  function Progress() {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { id: "progress", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "progress-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("ol", { id: "phases", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("li", { "data-phase": "walk", children: "Scan" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("li", { "data-phase": "extract", children: "Extract" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("li", { "data-phase": "link", children: "Link" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("li", { "data-phase": "cluster", children: "Cluster" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("li", { "data-phase": "flows", children: "Flows" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { id: "progressBar", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { id: "progressFill" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { id: "progressMeta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { id: "progressLabel" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { id: "progressCounts" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { id: "progressPct" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { id: "progressTime" })
      ] })
    ] }) });
  }

  // extension/media/src/chrome/Workspace.jsx
  var import_jsx_runtime8 = __toESM(require_jsx_runtime());
  function Workspace() {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { id: "workspace", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("section", { id: "canvas" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("aside", { id: "ledgerPane", hidden: true, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "led-head", children: "SLICE" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: "ledgerGrid" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: "ledgerMeta" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("aside", { id: "sourcePane", hidden: true, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "src-bar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "src-k", children: "Evidence" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { id: "srcTitle" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { id: "srcEditor", title: "Open this span in the editor", children: "Editor" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { id: "srcClose", title: "Close inspect (Esc)", children: "Close" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: "hopCard", hidden: true }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: "inspMeta" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: "inspEdges" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: "srcBody" })
      ] })
    ] });
  }

  // extension/media/src/App.jsx
  var import_jsx_runtime9 = __toESM(require_jsx_runtime());
  function App() {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Header, {}),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { id: "tip", hidden: true }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { id: "toast", hidden: true, role: "status" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(KeysPane, {}),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ExportMenu, {}),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Progress, {}),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(GraphBar, {}),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ProbeDock, {}),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("section", { id: "meta" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Workspace, {}),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("section", { id: "coverage" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(LlmPane, {}),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("footer", { id: "status" })
    ] });
  }

  // extension/media/src/host/adapter.js
  function acquireHost() {
    const fn = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi : typeof window !== "undefined" ? window.acquireVsCodeApi : null;
    if (typeof fn !== "function") {
      throw new Error("Graphide desk: acquireVsCodeApi is missing");
    }
    return fn();
  }

  // extension/media/src/graph/desk.js
  function bootDesk() {
    const vscode = acquireHost();
    const canvas = document.getElementById("canvas");
    const meta = document.getElementById("meta");
    const coverage = document.getElementById("coverage");
    const tabs = document.getElementById("tabs");
    const status = document.getElementById("status");
    const prompt = document.getElementById("prompt");
    const reviewBtn = document.getElementById("reviewBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const stampBtn = document.getElementById("stampBtn");
    const skipBtn = document.getElementById("skipBtn");
    const backBtn = document.getElementById("backBtn");
    const progressEl = document.getElementById("progress");
    const progressFill = document.getElementById("progressFill");
    const progressBar = document.getElementById("progressBar");
    const progressLabel = document.getElementById("progressLabel");
    const progressCounts = document.getElementById("progressCounts");
    const progressPct = document.getElementById("progressPct");
    const progressTime = document.getElementById("progressTime");
    const phasesEl = document.getElementById("phases");
    const zoomBar = document.getElementById("zoomBar");
    const zoomInBtn = document.getElementById("zoomIn");
    const zoomOutBtn = document.getElementById("zoomOut");
    const zoomFitBtn = document.getElementById("zoomFit");
    const zoomPct = document.getElementById("zoomPct");
    const tip = document.getElementById("tip");
    const workspace = document.getElementById("workspace");
    const sourcePane = document.getElementById("sourcePane");
    const srcTitle = document.getElementById("srcTitle");
    const srcBody = document.getElementById("srcBody");
    const srcEditor = document.getElementById("srcEditor");
    const srcClose = document.getElementById("srcClose");
    const graphBar = document.getElementById("graphBar");
    const graphSearch = document.getElementById("graphSearch");
    const kindFilters = document.getElementById("kindFilters");
    const legendEl = document.getElementById("legend");
    const hopCard = document.getElementById("hopCard");
    const inspMeta = document.getElementById("inspMeta");
    const inspEdges = document.getElementById("inspEdges");
    const ledgerPane = document.getElementById("ledgerPane");
    const ledgerGrid = document.getElementById("ledgerGrid");
    const ledgerMeta = document.getElementById("ledgerMeta");
    const workspacesEl = document.getElementById("workspaces");
    const egoBtn = document.getElementById("egoBtn");
    const egoHopsEl = document.getElementById("egoHops");
    const reorgBtns = document.querySelectorAll(".reorg-btn");
    const llmBtn = document.getElementById("llmBtn");
    const llmPane = document.getElementById("llmPane");
    const llmClose = document.getElementById("llmClose");
    const llmStatusEl = document.getElementById("llmStatus");
    const llmPreset = document.getElementById("llmPreset");
    const llmBaseUrl = document.getElementById("llmBaseUrl");
    const llmModel = document.getElementById("llmModel");
    const llmKey = document.getElementById("llmKey");
    const llmSave = document.getElementById("llmSave");
    const llmTest = document.getElementById("llmTest");
    const llmShowKey = document.getElementById("llmShowKey");
    const llmBridge = document.getElementById("llmBridge");
    const llmLog = document.getElementById("llmLog");
    const llmAsk = document.getElementById("llmAsk");
    const llmSend = document.getElementById("llmSend");
    const toastEl = document.getElementById("toast");
    const keysPane = document.getElementById("keysPane");
    const keysBtn = document.getElementById("keysBtn");
    const keysClose = document.getElementById("keysClose");
    const exportBtn = document.getElementById("exportBtn");
    const exportMenu = document.getElementById("exportMenu");
    const exportClose = document.getElementById("exportClose");
    const LLM_PRESETS = {
      ollama: { url: "http://127.0.0.1:11434/v1", model: "llama3.2" },
      lmstudio: { url: "http://127.0.0.1:1234/v1", model: "local-model" },
      llamacpp: { url: "http://127.0.0.1:8080/v1", model: "local-model" },
      openai: { url: "https://api.openai.com/v1", model: "gpt-4o-mini" },
      custom: { url: "", model: "" }
    };
    let llmTok = 0;
    const WORKSPACES = ["map", "slice", "lineage", "decisions", "registry", "overview", "timeline", "delta", "sequence", "dataflow", "lifecycle"];
    const LIST_WORKSPACES = { decisions: 1, registry: 1, timeline: 1, delta: 1, sequence: 1, dataflow: 1, lifecycle: 1 };
    const PHASE_ORDER = ["walk", "extract", "link", "cluster", "flows"];
    const PHASE_ALIAS = {
      start: "walk",
      walk: "walk",
      extract: "extract",
      parent: "extract",
      link: "link",
      preview: "link",
      cluster: "cluster",
      flows: "flows",
      done: "flows"
    };
    let snapshot = null;
    let flowName = null;
    let stampRows = [];
    let skippedFlows = [];
    let stack = [{ kind: "flow" }];
    let nodeById = /* @__PURE__ */ new Map();
    let busy = false;
    let previewTimer = 0;
    let lastTreeKey = "";
    let targetPct = 0;
    let shownPct = 0;
    let barRaf = 0;
    let pendingProgress = null;
    let progressRaf = 0;
    let navToken = 0;
    let viewportEl = null;
    let cam = { x: 0, y: 0, k: 1 };
    let camTo = { x: 0, y: 0, k: 1 };
    let camRaf = 0;
    let progFocus = 0;
    let selectedNodeId = null;
    let pathEnds = [];
    let explorerWs = "map";
    let explorerPinned = false;
    let egoMode = false;
    let egoHops = 1;
    let selectedDecisionKey = "";
    let timelineCursor = 0;
    let deltaView = "delta";
    let deltaCursor = -1;
    let deltaWalk = { playing: false, timer: 0 };
    let seqCursor = -1;
    let seqWalk = { playing: false, timer: 0 };
    let dfCursor = -1;
    let dfWalk = { playing: false, timer: 0 };
    let lcCursor = -1;
    let lcWalk = { playing: false, timer: 0 };
    let decisionOutcomeFilter = "";
    let layoutPins = /* @__PURE__ */ new Map();
    let zoomPopReady = false;
    let pathWalk = { i: -1, playing: false, timer: 0 };
    let sourceId = null;
    let graphFilter = { q: "", kinds: { Function: true, Type: true, Endpoint: true }, program: null, bubble: null };
    const CAM_MIN = 0.35;
    const CAM_MAX = 6.5;
    const BUBBLE_COLORS = ["#007aff", "#34c759", "#ff9f0a", "#af52de", "#ff375f", "#5ac8fa", "#ffd60a", "#30d158", "#ff453a", "#8e8e93"];
    const themeDayBtn = document.getElementById("themeDay");
    const themeNightBtn = document.getElementById("themeNight");
    const presetBtn = document.getElementById("presetBtn");
    const presentBtn = document.getElementById("presentBtn");
    const pathBtn = document.getElementById("pathBtn");
    const lensBtn = document.getElementById("lensBtn");
    const probeDock = document.getElementById("probeDock");
    const routeReceipt = document.getElementById("routeReceipt");
    const lensReceipt = document.getElementById("lensReceipt");
    const PRESETS = ["classic", "signal-flow", "blueprint"];
    const PRESET_LABEL = { classic: "Classic", "signal-flow": "Signal", blueprint: "Blueprint" };
    const ROUTE_KINDS = { Calls: 1, Reads: 1, Writes: 1, Publishes: 1, Subscribes: 1 };
    const LENS_KIND_ROLES = { Function: 1, Type: 1, Endpoint: 1 };
    const LENS_END_ROLES = { Source: 1, Sink: 1 };
    let routeOpen = false;
    let lensOpen = false;
    let routeCursor = -1;
    let routeWalk = { playing: false, timer: 0 };
    let lensRoles = ["Function", "Endpoint"];
    let lastRoute = { nodes: [], hops: [], ok: false, reason: "" };
    function hostThemeGuess() {
      try {
        const q = new URLSearchParams(location.search).get("theme");
        if (q === "night" || q === "day") return q;
      } catch (_) {
      }
      try {
        const st = vscode.getState && vscode.getState();
        if (st && (st.theme === "night" || st.theme === "day")) return st.theme;
      } catch (_) {
      }
      try {
        const saved = localStorage.getItem("graphide-theme");
        if (saved === "night" || saved === "day") return saved;
      } catch (_) {
      }
      if (document.body && (document.body.classList.contains("vscode-dark") || document.body.classList.contains("vscode-high-contrast"))) {
        return "night";
      }
      if (document.documentElement && document.documentElement.classList.contains("night")) return "night";
      return "day";
    }
    function applyTheme(mode, persist) {
      const night = mode === "night";
      if (document.documentElement) {
        document.documentElement.classList.add("bright");
        document.documentElement.classList.toggle("night", night);
      }
      if (document.body) {
        document.body.classList.add("bright");
        document.body.classList.toggle("night", night);
      }
      if (themeDayBtn) themeDayBtn.classList.toggle("on", !night);
      if (themeNightBtn) themeNightBtn.classList.toggle("on", night);
      if (!persist) return;
      try {
        const prev = vscode.getState && vscode.getState() || {};
        vscode.setState(Object.assign({}, prev, { theme: night ? "night" : "day" }));
      } catch (_) {
      }
      try {
        localStorage.setItem("graphide-theme", night ? "night" : "day");
      } catch (_) {
      }
      vscode.postMessage({ type: "setAppearance", appearance: night ? "night" : "day" });
    }
    function toggleTheme() {
      applyTheme(document.documentElement.classList.contains("night") ? "day" : "night", true);
    }
    function currentPreset() {
      const raw = document.documentElement && document.documentElement.getAttribute("data-preset") || "classic";
      return PRESETS.indexOf(raw) >= 0 ? raw : "classic";
    }
    function hostPresetGuess() {
      try {
        const q = new URLSearchParams(location.search).get("preset");
        if (q && PRESETS.indexOf(q) >= 0) return q;
      } catch (_) {
      }
      try {
        const st = vscode.getState && vscode.getState();
        if (st && PRESETS.indexOf(st.preset) >= 0) return st.preset;
      } catch (_) {
      }
      try {
        const saved = localStorage.getItem("graphide-preset");
        if (saved && PRESETS.indexOf(saved) >= 0) return saved;
      } catch (_) {
      }
      return "classic";
    }
    function applyPreset(name, persist) {
      const preset = PRESETS.indexOf(name) >= 0 ? name : "classic";
      if (document.documentElement) document.documentElement.setAttribute("data-preset", preset);
      if (document.body) document.body.setAttribute("data-preset", preset);
      if (presetBtn) {
        presetBtn.setAttribute("data-preset", preset);
        presetBtn.textContent = PRESET_LABEL[preset] || "Classic";
        presetBtn.title = "Style: " + (PRESET_LABEL[preset] || "Classic") + ". Cycles Classic / Signal / Blueprint";
      }
      if (!persist) return;
      try {
        const prev = vscode.getState && vscode.getState() || {};
        vscode.setState(Object.assign({}, prev, { preset }));
      } catch (_) {
      }
      try {
        localStorage.setItem("graphide-preset", preset);
      } catch (_) {
      }
    }
    function cyclePreset() {
      const i = PRESETS.indexOf(currentPreset());
      applyPreset(PRESETS[(i + 1) % PRESETS.length], true);
    }
    function isPresenting() {
      return !!(document.body && document.body.classList.contains("present"));
    }
    function applyPresent(on) {
      const next = !!on;
      if (document.body) document.body.classList.toggle("present", next);
      if (document.documentElement) document.documentElement.classList.toggle("present", next);
      if (presentBtn) {
        presentBtn.classList.toggle("on", next);
        presentBtn.setAttribute("aria-pressed", next ? "true" : "false");
        presentBtn.textContent = next ? "Exit" : "Present";
        presentBtn.title = next ? "Exit Presentation Stage (Esc)" : "Presentation Stage (F)";
      }
      if (!next) return;
      if (typeof setKeysPane === "function") setKeysPane(false);
      if (typeof setExportMenu === "function") setExportMenu(false);
      if (llmPane && !llmPane.hidden && typeof setLlmPane === "function") setLlmPane(false);
      if (sourcePane && !sourcePane.hidden && typeof closeSourcePane === "function") closeSourcePane();
      if (toastEl) {
        toastEl.classList.remove("on");
        toastEl.hidden = true;
      }
      if (tip) tip.hidden = true;
    }
    function togglePresent() {
      applyPresent(!isPresenting());
    }
    applyTheme(hostThemeGuess(), false);
    applyPreset(hostPresetGuess(), false);
    if (themeDayBtn) themeDayBtn.onclick = () => applyTheme("day", true);
    if (themeNightBtn) themeNightBtn.onclick = () => applyTheme("night", true);
    if (presetBtn) presetBtn.onclick = () => cyclePreset();
    if (presentBtn) presentBtn.onclick = () => togglePresent();
    reviewBtn.onclick = () => startReview();
    cancelBtn.onclick = () => {
      setBusy(true);
      progressLabel.textContent = "Cancelling…";
      vscode.postMessage({ type: "cancel" });
    };
    backBtn.onclick = () => goBack();
    prompt.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        startReview();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && busy) {
        e.preventDefault();
        vscode.postMessage({ type: "cancel" });
        return;
      }
      if (e.target && e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "Escape" && sourcePane && !sourcePane.hidden) {
        e.preventDefault();
        closeSourcePane();
        return;
      }
      if (e.key === "Escape" && llmPane && !llmPane.hidden) {
        e.preventDefault();
        setLlmPane(false);
        return;
      }
      if (e.key === "Escape" && keysPane && !keysPane.hidden) {
        e.preventDefault();
        setKeysPane(false);
        return;
      }
      if (e.key === "Escape" && exportMenu && !exportMenu.hidden) {
        e.preventDefault();
        setExportMenu(false);
        return;
      }
      if (e.key === "Escape" && routeOpen) {
        e.preventDefault();
        setRouteOpen(false);
        return;
      }
      if (e.key === "Escape" && lensOpen) {
        e.preventDefault();
        setLensOpen(false);
        return;
      }
      if (e.key === "Escape" && isPresenting()) {
        e.preventDefault();
        applyPresent(false);
        return;
      }
      if (stack[stack.length - 1]?.kind === "programs") {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          moveProgFocus(1);
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          moveProgFocus(-1);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          openFocusedProgram();
          return;
        }
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          openAllPrograms();
          return;
        }
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomBy(1.18);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomBy(1 / 1.18);
        return;
      }
      if (e.key === "0") {
        e.preventDefault();
        fitChart();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        goBack();
        return;
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (isPresenting()) cyclePreset();
        else requestStamp();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        togglePresent();
        return;
      }
      if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        requestSkip();
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setEgoMode(!egoMode);
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        toggleRoute();
        return;
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        toggleLens();
        return;
      }
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        toggleTheme();
        return;
      }
      if (e.key === "/" && graphSearch) {
        e.preventDefault();
        graphSearch.focus();
        graphSearch.select();
        return;
      }
      if (e.key === "?" || e.key === "F1") {
        e.preventDefault();
        setKeysPane(!(keysPane && !keysPane.hidden));
        return;
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        if (explorerWs === "delta") toggleDeltaReview();
        else if (explorerWs === "sequence") toggleSeqReview();
        else if (explorerWs === "dataflow") toggleDfReview();
        else if (explorerWs === "lifecycle") toggleLcReview();
        else togglePathWalk();
        return;
      }
      if (e.key === "[") {
        e.preventDefault();
        if (explorerWs === "delta") {
          stopDeltaWalk();
          stepDeltaWalk(deltaCursor < 0 ? 1 : -1);
        } else if (explorerWs === "sequence") {
          stopSeqWalk();
          stepSeqWalk(seqCursor < 0 ? 1 : -1);
        } else if (explorerWs === "dataflow") {
          stopDfWalk();
          stepDfWalk(dfCursor < 0 ? 1 : -1);
        } else if (explorerWs === "lifecycle") {
          stopLcWalk();
          stepLcWalk(lcCursor < 0 ? 1 : -1);
        } else {
          stopPathWalk();
          stepPathWalk(pathWalk.i < 0 ? 1 : -1);
        }
        return;
      }
      if (e.key === "]") {
        e.preventDefault();
        if (explorerWs === "delta") {
          stopDeltaWalk();
          stepDeltaWalk(1);
        } else if (explorerWs === "sequence") {
          stopSeqWalk();
          stepSeqWalk(1);
        } else if (explorerWs === "dataflow") {
          stopDfWalk();
          stepDfWalk(1);
        } else if (explorerWs === "lifecycle") {
          stopLcWalk();
          stepLcWalk(1);
        } else {
          stopPathWalk();
          stepPathWalk(1);
        }
        return;
      }
      const wsIdx = "123456789".indexOf(e.key);
      if (wsIdx >= 0 && WORKSPACES[wsIdx]) {
        e.preventDefault();
        setWorkspace(WORKSPACES[wsIdx], true);
      }
    });
    if (zoomInBtn) zoomInBtn.onclick = () => zoomBy(1.2);
    if (zoomOutBtn) zoomOutBtn.onclick = () => zoomBy(1 / 1.2);
    if (zoomFitBtn) zoomFitBtn.onclick = () => fitChart();
    if (srcClose) srcClose.onclick = () => closeSourcePane();
    if (srcEditor)
      srcEditor.onclick = () => {
        if (!sourceId) return;
        const flow = currentFlow();
        vscode.postMessage({ type: "enterNode", flow: flow ? flow.name : "", id: sourceId, isLeaf: true });
      };
    if (graphSearch)
      graphSearch.addEventListener("input", () => {
        graphFilter.q = graphSearch.value.trim();
        refreshExplorer();
      });
    if (kindFilters)
      kindFilters.querySelectorAll("input").forEach((el2) => {
        el2.addEventListener("change", () => {
          graphFilter.kinds[el2.getAttribute("data-kind")] = el2.checked;
          syncKindPills();
          refreshExplorer();
        });
      });
    syncKindPills();
    if (keysBtn) keysBtn.onclick = () => setKeysPane(!(keysPane && !keysPane.hidden));
    if (keysClose) keysClose.onclick = () => setKeysPane(false);
    if (exportBtn) exportBtn.onclick = () => setExportMenu(!(exportMenu && !exportMenu.hidden));
    if (exportClose) exportClose.onclick = () => setExportMenu(false);
    const exportCopyPng = document.getElementById("exportCopyPng");
    const exportPng = document.getElementById("exportPng");
    const exportSvg = document.getElementById("exportSvg");
    const exportCopyShare = document.getElementById("exportCopyShare");
    const exportShare = document.getElementById("exportShare");
    if (exportCopyPng) exportCopyPng.onclick = () => runExport("copy-png");
    if (exportPng) exportPng.onclick = () => runExport("png");
    if (exportSvg) exportSvg.onclick = () => runExport("svg");
    if (exportCopyShare) exportCopyShare.onclick = () => runExport("copy-share");
    if (exportShare) exportShare.onclick = () => runExport("share");
    const exportRouteShare = document.getElementById("exportRouteShare");
    if (exportRouteShare) exportRouteShare.onclick = () => runExport("route-share");
    if (pathBtn) pathBtn.onclick = () => toggleRoute();
    if (lensBtn) lensBtn.onclick = () => toggleLens();
    if (workspacesEl) {
      workspacesEl.querySelectorAll("[data-ws]").forEach((el2) => {
        el2.onclick = () => {
          el2.classList.add("press");
          window.setTimeout(() => el2.classList.remove("press"), 160);
          setWorkspace(el2.getAttribute("data-ws"), true);
        };
      });
    }
    if (egoBtn) egoBtn.onclick = () => setEgoMode(!egoMode);
    reorgBtns.forEach((el2) => {
      el2.onclick = () => autoReorganize();
    });
    if (egoHopsEl)
      egoHopsEl.addEventListener("change", () => {
        const n = parseInt(egoHopsEl.value, 10);
        egoHops = n === 2 ? 2 : 1;
        applyEgoPaint();
        if (explorerWs === "lineage") paint({ animate: "none" });
      });
    if (stampBtn) stampBtn.onclick = () => requestStamp();
    if (skipBtn) skipBtn.onclick = () => requestSkip();
    if (llmBtn) llmBtn.onclick = () => toggleLlmPane();
    if (llmClose) llmClose.onclick = () => setLlmPane(false);
    if (llmPreset)
      llmPreset.onchange = () => {
        const p = LLM_PRESETS[llmPreset.value] || LLM_PRESETS.custom;
        if (p.url && llmBaseUrl) llmBaseUrl.value = p.url;
        if (p.model && llmModel) llmModel.value = p.model;
      };
    if (llmSave)
      llmSave.onclick = () => {
        vscode.postMessage({
          type: "llmSave",
          baseUrl: llmBaseUrl ? llmBaseUrl.value : "",
          model: llmModel ? llmModel.value : "",
          apiKey: llmKey ? llmKey.value : ""
        });
        appendLlmLog("Saved host " + (llmBaseUrl && llmBaseUrl.value || "(empty)") + " · " + (llmModel && llmModel.value || "graph-only"), "ok");
      };
    if (llmTest) llmTest.onclick = () => vscode.postMessage({ type: "llmTest" });
    if (llmShowKey) llmShowKey.onclick = () => vscode.postMessage({ type: "llmShowKey" });
    if (llmSend) llmSend.onclick = () => sendLlmAsk();
    if (llmAsk)
      llmAsk.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendLlmAsk();
        }
      });
    if (llmBaseUrl && !llmBaseUrl.value) llmBaseUrl.value = "http://127.0.0.1:11434/v1";
    function startReview() {
      targetPct = 0;
      shownPct = 0;
      lastTreeKey = "";
      showProgress({
        phase: "start",
        label: "Starting review…",
        done: 0,
        total: 0,
        pct: 2,
        elapsed_ms: 0
      });
      const flows = prompt.value.split(";").map((s) => s.trim()).filter(Boolean);
      vscode.postMessage({ type: "review", flows });
    }
    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg.type === "appearance") {
        applyTheme(msg.mode === "night" ? "night" : "day", false);
        return;
      }
      if (msg.type === "empty") {
        stopPathWalk();
        snapshot = null;
        finishWork();
        backBtn.disabled = true;
        canvas.className = "";
        canvas.innerHTML = '<div class="empty desk-empty"><b>Review any repo.</b><div>Open a workspace, optionally type <code>name=hit,hit</code>, then Review.</div><div class="desk-keys"><kbd>S</kbd> stamp · <kbd>X</kbd> skip · <kbd>P</kbd> play · <kbd>/</kbd> find</div></div>';
        setDeskMode(false);
        refreshNowPill();
        meta.textContent = "";
        coverage.textContent = "";
        tabs.innerHTML = "";
        status.textContent = "";
        setZoomUi(false);
        hideTip();
        closeSourcePane();
        explorerPinned = false;
        explorerWs = "overview";
        pathEnds = [];
        selectedNodeId = null;
        setGraphChrome(false);
        return;
      }
      if (msg.type === "setup") {
        finishWork();
        setZoomUi(false);
        hideTip();
        canvas.className = "";
        canvas.innerHTML = '<div class="empty"><b>Install Graphide once.</b><div>' + esc(msg.text || "Builds the local CLI and is only needed the first time.") + '</div><button id="installBtn" class="primary">Install</button></div>';
        const btn = document.getElementById("installBtn");
        if (btn) btn.onclick = () => vscode.postMessage({ type: "install" });
        status.textContent = "needs install";
        setGraphChrome(false);
        return;
      }
      if (msg.type === "progress") {
        queueProgress(msg);
        return;
      }
      if (msg.type === "tick") {
        if (progressTime) progressTime.textContent = formatMs(msg.elapsed_ms);
        return;
      }
      if (msg.type === "preview") {
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => applyPreview(msg), 40);
        return;
      }
      if (msg.type === "cancelled") {
        clearTimeout(previewTimer);
        finishWork();
        if (snapshot) paint({ animate: "none" });
        status.textContent = "cancelled";
        return;
      }
      if (msg.type === "loading") {
        queueProgress({
          phase: "start",
          label: msg.text || "Working…",
          done: 0,
          total: 0,
          pct: 2,
          elapsed_ms: 0
        });
        return;
      }
      if (msg.type === "error") {
        clearTimeout(previewTimer);
        finishWork();
        canvas.className = "";
        canvas.innerHTML = '<div class="empty error">' + esc(msg.text) + "</div>";
        status.textContent = "failed";
        setZoomUi(false);
        hideTip();
        return;
      }
      if (msg.type === "source") {
        showSource(msg);
        return;
      }
      if (msg.type === "programs") {
        clearTimeout(previewTimer);
        applyPrograms(msg);
        return;
      }
      if (msg.type === "flowchart" || msg.type === "inner") {
        clearTimeout(previewTimer);
        applySnapshot(msg, msg.type === "inner");
      }
      if (msg.type === "llmStatus") {
        applyLlmStatus(msg);
        return;
      }
      if (msg.type === "llmReply") {
        llmTok++;
        appendLlmLog(msg.text || "", msg.via === "graph" ? "graph" : "llm");
        return;
      }
      if (msg.type === "llmError") {
        llmTok++;
        appendLlmLog(msg.text || "LLM error", "err");
      }
    });
    function applyPreview(msg) {
      if (!busy) return;
      const flows = (msg.flows || []).map((f) => ({
        ...f,
        flowchart: { runs: [], spine: [], positions: [] }
      }));
      snapshot = {
        flows,
        flow: flows.find((f) => f.name === flowName) || flows[0],
        graph: msg.graph || { nodes: [] },
        bubbles: [],
        coverage: { changed: [], uncovered: [] },
        findings: [],
        plugin: msg.plugin,
        stats: { files: 0, elapsed_ms: msg.elapsed_ms, nodes: msg.nodes, edges: msg.edges },
        preview: true
      };
      if (!flowName && flows[0]) flowName = flows[0].name;
      stack = [{ kind: "flow" }];
      indexGraph(snapshot.graph);
      paint({ animate: "tree", preview: true, keepCam: !!canvas.querySelector(".stage") });
    }
    function applyPrograms(msg) {
      snapshot = {
        flows: msg.flows || snapshot?.flows || [],
        flow: snapshot?.flow,
        graph: msg.graph || snapshot?.graph,
        bubbles: msg.bubbles || snapshot?.bubbles || [],
        coverage: msg.coverage,
        findings: msg.findings,
        plugin: msg.plugin,
        stats: msg.stats,
        stamps: msg.stamps || [],
        skipped: msg.skipped || [],
        programs: msg.programs || [],
        delta: msg.delta || { facts: [] },
        program: null,
        snippets: {},
        preview: false,
        inner: null,
        depth: 0
      };
      stack = [{ kind: "programs" }];
      indexGraph(snapshot.graph);
      stampRows = snapshot.stamps || [];
      skippedFlows = snapshot.skipped || [];
      applyExplorerLanding();
      finishWork();
      paint({ animate: "none" });
    }
    function applySnapshot(msg, inner) {
      snapshot = {
        flows: msg.flows || (msg.flow ? [msg.flow] : snapshot?.flows) || [],
        flow: msg.flow,
        graph: msg.graph || snapshot?.graph,
        bubbles: msg.bubbles || snapshot?.bubbles || [],
        coverage: msg.coverage,
        findings: msg.findings,
        plugin: msg.plugin,
        stats: msg.stats,
        stamps: msg.stamps || [],
        skipped: msg.skipped || [],
        programs: msg.programs || snapshot?.programs || [],
        delta: msg.delta || snapshot?.delta || { facts: [] },
        program: msg.program || null,
        snippets: msg.snippets || {},
        preview: false,
        inner: inner ? msg.inner : null,
        depth: msg.depth || 0
      };
      if (msg.flow?.name) flowName = msg.flow.name;
      else if (!flowName && snapshot.flows[0]) flowName = snapshot.flows[0].name;
      if (inner) {
        stack = [
          { kind: "programs" },
          { kind: "flow" },
          { kind: "bubble", flow: msg.inner.flow, bubble: String(msg.inner.bubble) }
        ];
      } else {
        stack = [{ kind: "programs" }, { kind: "flow" }];
      }
      indexGraph(snapshot.graph);
      stampRows = snapshot.stamps || [];
      skippedFlows = snapshot.skipped || [];
      applyExplorerLanding();
      finishWork();
      paint({ animate: lastTreeKey && treeKey(currentFlow()) === lastTreeKey ? "runs" : "all" });
    }
    function currentFlow() {
      if (!snapshot) return null;
      const named = (snapshot.flows || []).find((f) => f.name === flowName);
      const rich = snapshot.flow && (!flowName || snapshot.flow.name === flowName);
      if (rich && (snapshot.flow.tree?.edges || []).length) return snapshot.flow;
      if (named && (named.tree?.edges || []).length) return named;
      return named || snapshot.flow || snapshot.flows[0];
    }
    function treeKey(flow) {
      if (!flow?.tree) return "";
      return (flow.tree.nodes || []).map(idVal).join(",");
    }
    function indexGraph(graph) {
      nodeById = /* @__PURE__ */ new Map();
      for (const n of graph?.nodes || []) nodeById.set(idVal(n.id), n);
    }
    function reduceMotion() {
      try {
        return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      } catch (e) {
        return false;
      }
    }
    function flashToast(text, kind) {
      if (!toastEl) return;
      toastEl.hidden = false;
      toastEl.className = kind ? "on " + kind : "on";
      toastEl.textContent = text;
      clearTimeout(flashToast._t);
      flashToast._t = setTimeout(() => {
        toastEl.classList.remove("on");
        toastEl.hidden = true;
      }, 1600);
    }
    function flashBtn(el2, cls) {
      if (!el2) return;
      el2.classList.remove(cls);
      void el2.offsetWidth;
      el2.classList.add(cls);
      setTimeout(() => el2.classList.remove(cls), 720);
    }
    function flashCanvas() {
      if (!canvas || reduceMotion()) return;
      canvas.classList.remove("swap");
      void canvas.offsetWidth;
      canvas.classList.add("swap");
    }
    function setKeysPane(on) {
      if (!keysPane) return;
      if (on) setExportMenu(false);
      keysPane.hidden = !on;
      keysPane.classList.toggle("open", !!on);
      if (keysBtn) keysBtn.classList.toggle("on", !!on);
    }
    function setExportMenu(on) {
      if (!exportMenu) return;
      if (on) {
        setKeysPane(false);
        if (llmPane && !llmPane.hidden) setLlmPane(false);
      }
      exportMenu.hidden = !on;
      exportMenu.classList.toggle("open", !!on);
      if (exportBtn) exportBtn.classList.toggle("on", !!on);
    }
    const EXPORT_STRIP = ["on", "dim", "focus", "selected", "ego-dim", "ego", "press", "flash-holds", "flash-skip", "present"];
    function exportDiagramRoot() {
      return document.getElementById("seqCanvas") || document.getElementById("dfCanvas") || document.getElementById("lcCanvas") || document.getElementById("deltaCanvas") || document.querySelector("#canvas .stage") || document.getElementById("canvas");
    }
    function stripExportViewerState(root2) {
      if (!root2) return root2;
      const nodes = [root2];
      if (root2.querySelectorAll) nodes.push.apply(nodes, root2.querySelectorAll("*"));
      nodes.forEach((el2) => {
        EXPORT_STRIP.forEach((c) => el2.classList.remove(c));
        el2.removeAttribute("data-delta-review-current");
        if (el2.getAttribute && el2.getAttribute("aria-pressed") === "true") el2.setAttribute("aria-pressed", "false");
      });
      const vp = root2.querySelector && root2.querySelector(".viewport");
      if (vp) vp.style.transform = "none";
      return root2;
    }
    function exportSlug(s) {
      return String(s || "diagram").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "diagram";
    }
    function exportFileBase() {
      const flow = currentFlow();
      return "graphide-" + exportSlug(flow && flow.name || explorerWs || "diagram");
    }
    function exportTitle() {
      const flow = currentFlow();
      return "Graphide · " + (flow && flow.name || explorerWs || "Review");
    }
    function collectExportCss() {
      let css = "";
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        try {
          const rules = sheet.cssRules;
          for (let r = 0; r < rules.length; r++) css += rules[r].cssText + "\n";
        } catch (_) {
        }
      }
      const cs = getComputedStyle(document.documentElement);
      const vars = [];
      for (let i = 0; i < cs.length; i++) {
        const k = cs[i];
        if (k.indexOf("--") === 0) vars.push(k + ":" + cs.getPropertyValue(k));
      }
      const bg = getComputedStyle(document.body).backgroundColor || "#f2f2f7";
      const fg = getComputedStyle(document.body).color || "#1d1d1f";
      return ":root,html,.bright{" + vars.join(";") + "}.export-root{background:" + bg + ";color:" + fg + ";font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',system-ui,sans-serif;}" + css;
    }
    function measureExportBox(el2) {
      const vp = el2.querySelector && el2.querySelector(".viewport");
      const w = Math.max(el2.scrollWidth || 0, el2.clientWidth || 0, vp ? vp.scrollWidth : 0, vp ? vp.offsetWidth : 0, 320);
      const h = Math.max(el2.scrollHeight || 0, el2.clientHeight || 0, vp ? vp.scrollHeight : 0, vp ? vp.offsetHeight : 0, 200);
      return { w: Math.ceil(w), h: Math.ceil(h) };
    }
    function buildCanonicalSvg() {
      const src = exportDiagramRoot();
      if (!src) throw new Error("nothing to export");
      const box = measureExportBox(src);
      const clone = src.cloneNode(true);
      stripExportViewerState(clone);
      clone.style.width = box.w + "px";
      clone.style.height = box.h + "px";
      clone.style.transform = "none";
      clone.style.position = "relative";
      clone.style.overflow = "visible";
      const night = document.documentElement.classList.contains("night");
      const preset = currentPreset();
      const css = collectExportCss().replace(/<\//g, "<\\/").replace(/]]>/g, "]]\\>");
      let markup = "";
      try {
        markup = new XMLSerializer().serializeToString(clone);
      } catch (_) {
        markup = clone.outerHTML;
      }
      const inner = '<div xmlns="http://www.w3.org/1999/xhtml" class="export-root bright' + (night ? " night" : "") + '" data-preset="' + preset + '" style="width:' + box.w + "px;height:" + box.h + 'px"><style>' + css + "</style>" + markup + "</div>";
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + box.w + '" height="' + box.h + '" viewBox="0 0 ' + box.w + " " + box.h + '"><foreignObject width="100%" height="100%">' + inner + "</foreignObject></svg>";
      return { svg, w: box.w, h: box.h, night, preset, title: exportTitle(), name: exportFileBase() };
    }
    function loadBlobImage(blob) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("image load failed"));
        };
        img.src = url;
      });
    }
    function canvasPngBlob(c) {
      return new Promise((resolve, reject) => {
        c.toBlob((b) => {
          if (!b) reject(new Error("png blob failed"));
          else resolve(b);
        }, "image/png");
      });
    }
    function loadDataImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const t = setTimeout(() => {
          img.onload = img.onerror = null;
          reject(new Error("image timeout"));
        }, 2200);
        img.onload = () => {
          clearTimeout(t);
          resolve(img);
        };
        img.onerror = () => {
          clearTimeout(t);
          reject(new Error("image load failed"));
        };
        img.src = url;
      });
    }
    async function rasterizeSvg(svg, w, h) {
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      const img = await loadDataImage(url);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.fillStyle = getComputedStyle(document.body).backgroundColor || "#f2f2f7";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      return canvasPngBlob(c);
    }
    function exportRoundRect(ctx, x, y, w, h, r) {
      const rad = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      if (!rad) {
        ctx.rect(x, y, w, h);
        return;
      }
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    }
    function directExportText(el2) {
      let t = "";
      const kids = el2.childNodes || [];
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].nodeType === 3) t += kids[i].textContent || "";
      }
      return t.replace(/\s+/g, " ").trim();
    }
    function paintCloneToCanvas(src, w, h) {
      const bg = getComputedStyle(document.body).backgroundColor || "#f2f2f7";
      const host = document.createElement("div");
      host.setAttribute("data-export-stage", "1");
      host.style.cssText = "position:fixed;left:-12000px;top:0;width:" + w + "px;height:" + h + "px;overflow:visible;background:" + bg + ";pointer-events:none;z-index:-1;";
      const clone = src.cloneNode(true);
      stripExportViewerState(clone);
      clone.style.width = w + "px";
      clone.style.height = h + "px";
      clone.style.transform = "none";
      clone.style.position = "relative";
      host.appendChild(clone);
      document.body.appendChild(host);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      const origin = clone.getBoundingClientRect();
      const els = [clone];
      if (clone.querySelectorAll) els.push.apply(els, clone.querySelectorAll("*"));
      for (let i = 0; i < els.length; i++) {
        const el2 = els[i];
        if (el2.tagName === "svg" || el2.tagName === "path" || el2.tagName === "line") continue;
        const cs = getComputedStyle(el2);
        if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
        const r = el2.getBoundingClientRect();
        const x = r.left - origin.left;
        const y = r.top - origin.top;
        if (r.width < 1 || r.height < 1) continue;
        if (x + r.width < 0 || y + r.height < 0 || x > w || y > h) continue;
        const bgc = cs.backgroundColor;
        if (bgc && bgc !== "rgba(0, 0, 0, 0)" && bgc !== "transparent") {
          ctx.fillStyle = bgc;
          exportRoundRect(ctx, x, y, r.width, r.height, parseFloat(cs.borderRadius) || 0);
          ctx.fill();
        }
        const bw = parseFloat(cs.borderTopWidth) || 0;
        if (bw > 0) {
          const bc = cs.borderTopColor;
          if (bc && bc !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = bc;
            ctx.lineWidth = bw;
            exportRoundRect(ctx, x, y, r.width, r.height, parseFloat(cs.borderRadius) || 0);
            ctx.stroke();
          }
        }
        const text = directExportText(el2);
        if (text) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, r.width, r.height);
          ctx.clip();
          ctx.fillStyle = cs.color || "#1d1d1f";
          ctx.font = cs.font || "13px system-ui";
          ctx.textBaseline = "middle";
          ctx.fillText(text, x + 6, y + r.height / 2, Math.max(8, r.width - 10));
          ctx.restore();
        }
      }
      host.remove();
      return c;
    }
    async function rasterizeCanonical(art) {
      try {
        return await rasterizeSvg(art.svg, art.w, art.h);
      } catch (_) {
        const src = exportDiagramRoot();
        if (!src) throw new Error("nothing to export");
        return canvasPngBlob(paintCloneToCanvas(src, art.w, art.h));
      }
    }
    function paintShareCard(img, diagW, diagH) {
      const W = 1200;
      const H = 630;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");
      const body = getComputedStyle(document.body);
      ctx.fillStyle = body.backgroundColor || "#f2f2f7";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = body.color || "#1d1d1f";
      ctx.font = "600 22px -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText(exportTitle(), 40, 28);
      const top = 72;
      const pad = 40;
      const availW = W - pad * 2;
      const availH = H - top - pad;
      const scale = Math.min(availW / Math.max(1, diagW), availH / Math.max(1, diagH));
      const dw = diagW * scale;
      const dh = diagH * scale;
      const x = pad + (availW - dw) / 2;
      const y = top + (availH - dh) / 2;
      ctx.drawImage(img, 0, 0, diagW, diagH, x, y, dw, dh);
      return c;
    }
    function blobToDataUrl(blob) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    }
    async function blobToBase64(blob) {
      const url = await blobToDataUrl(blob);
      const i = url.indexOf(",");
      return i >= 0 ? url.slice(i + 1) : "";
    }
    function rememberExport(kind, rec) {
      window.__graphideLastExport = window.__graphideLastExport || {};
      window.__graphideLastExport[kind] = rec;
    }
    function downloadBlob(blob, name) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2500);
    }
    function postExportFile(name, mime, data) {
      vscode.postMessage({ type: "exportFile", name, mime, data });
    }
    async function copyPngBlob(blob) {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        return true;
      }
      return false;
    }
    async function runExport(kind) {
      setExportMenu(false);
      try {
        const art = buildCanonicalSvg();
        const base = art.name;
        if (kind === "svg") {
          const blob = new Blob([art.svg], { type: "image/svg+xml;charset=utf-8" });
          const name2 = base + ".svg";
          const dataUrl2 = await blobToDataUrl(blob);
          rememberExport("svg", {
            name: name2,
            mime: "image/svg+xml",
            dataUrl: dataUrl2,
            w: art.w,
            h: art.h,
            canonical: true,
            theme: art.night ? "night" : "day",
            preset: art.preset || currentPreset()
          });
          downloadBlob(blob, name2);
          postExportFile(name2, "image/svg+xml", await blobToBase64(blob));
          flashToast(name2, "ok");
          return;
        }
        const png = await rasterizeCanonical(art);
        if (kind === "png" || kind === "copy-png") {
          const name2 = base + ".png";
          const dataUrl2 = await blobToDataUrl(png);
          rememberExport("png", {
            name: name2,
            mime: "image/png",
            dataUrl: dataUrl2,
            w: art.w,
            h: art.h,
            canonical: true,
            theme: art.night ? "night" : "day",
            preset: art.preset || currentPreset()
          });
          if (kind === "copy-png") {
            const ok = await copyPngBlob(png).catch(() => false);
            flashToast(ok ? "Copied PNG" : "Clipboard unavailable", ok ? "ok" : "");
            return;
          }
          downloadBlob(png, name2);
          postExportFile(name2, "image/png", await blobToBase64(png));
          flashToast(name2, "ok");
          return;
        }
        if (kind === "route-share") {
          const route = resolveRoute();
          if (!route.ok || route.hops.length < 1) {
            flashToast("No route", "skip");
            return;
          }
          const rimg = await loadBlobImage(png);
          const rcard = paintShareCard(rimg, art.w, art.h);
          const rshare = await canvasPngBlob(rcard);
          const rname = base + "-route.png";
          const rurl = await blobToDataUrl(rshare);
          rememberExport("route", {
            name: rname,
            mime: "image/png",
            dataUrl: rurl,
            w: 1200,
            h: 630,
            canonical: false,
            variant: "route",
            hops: route.hops.length,
            theme: art.night ? "night" : "day",
            preset: art.preset || currentPreset()
          });
          downloadBlob(rshare, rname);
          postExportFile(rname, "image/png", await blobToBase64(rshare));
          flashToast(rname, "ok");
          return;
        }
        const img = await loadBlobImage(png);
        const card = paintShareCard(img, art.w, art.h);
        const share = await canvasPngBlob(card);
        const name = base + "-share.png";
        const dataUrl = await blobToDataUrl(share);
        rememberExport("share", {
          name,
          mime: "image/png",
          dataUrl,
          w: 1200,
          h: 630,
          canonical: true,
          theme: art.night ? "night" : "day",
          preset: art.preset || currentPreset()
        });
        if (kind === "copy-share") {
          const ok = await copyPngBlob(share).catch(() => false);
          flashToast(ok ? "Copied Share Card" : "Clipboard unavailable", ok ? "ok" : "");
          return;
        }
        downloadBlob(share, name);
        postExportFile(name, "image/png", await blobToBase64(share));
        flashToast(name, "ok");
      } catch (e) {
        window.__graphideExportError = String(e && e.message ? e.message : e);
        flashToast("Export failed", "");
      }
    }
    function syncKindPills() {
      if (!kindFilters) return;
      kindFilters.querySelectorAll("label").forEach((lab) => {
        const box = lab.querySelector("input");
        lab.classList.toggle("off", !!(box && !box.checked));
      });
    }
    function clamp(n, lo, hi) {
      return Math.max(lo, Math.min(hi, n));
    }
    function setZoomUi(on) {
      if (zoomBar) zoomBar.hidden = !on;
      if (on) updateZoomPct();
    }
    function reviewMarks() {
      const names = (snapshot && snapshot.flows ? snapshot.flows : []).map((f) => f.name);
      let holds = 0, broken = 0, skipped = 0, pending = 0;
      for (const name of names) {
        const mark = flowMark(name);
        if (mark === "holds") holds++;
        else if (mark === "broken") broken++;
        else if (mark === "skipped") skipped++;
        else pending++;
      }
      skipped += skippedFlows.filter((n) => names.indexOf(n) < 0).length;
      return { names, holds, broken, skipped, pending };
    }
    function reviewAltitude() {
      if (graphFilter.bubble) return "inside";
      if (explorerWs === "slice") return "slice";
      if (explorerWs === "map") return "map";
      if (explorerWs === "overview") return "overview";
      if (explorerWs === "lineage") return "lineage";
      return explorerWs || "review";
    }
    function nowStripHtml() {
      if (!snapshot) return "";
      const m = reviewMarks();
      const ws = explorerWs || "overview";
      const alt = reviewAltitude();
      const walk = pathWalk.i >= 0 ? pathWalkStops()[pathWalk.i] : null;
      const here = walk ? shortOf(walk.label) || "" : "";
      const place = ws === alt ? ws : ws + " · " + alt;
      return '<span class="now-pill" id="nowPill">' + esc(place) + (here ? " · " + esc(here) : "") + (m.names.length ? " · " + (m.pending ? m.pending + " left" : "queue clear") : "") + "</span>";
    }
    function refreshNowPill() {
      const el2 = document.getElementById("nowPill");
      if (!el2) return;
      const html = nowStripHtml();
      if (!html) {
        el2.hidden = true;
        el2.textContent = "";
        return;
      }
      const box = document.createElement("div");
      box.innerHTML = html;
      const next = box.firstElementChild;
      if (next) {
        next.hidden = false;
        el2.replaceWith(next);
      }
    }
    function setMeta(html) {
      if (!meta) return;
      meta.innerHTML = html || "";
      refreshNowPill();
    }
    function setDeskMode(on) {
      document.body.classList.toggle("desk", !!on);
      document.body.classList.toggle("reviewed", !!(on && snapshot));
    }
    function setGraphChrome(on) {
      setDeskMode(!!on);
      if (graphBar) graphBar.hidden = !on;
      const list = !!LIST_WORKSPACES[explorerWs];
      if (ledgerPane) ledgerPane.hidden = !on || list;
      if (workspace) workspace.classList.toggle("has-ledger", !!(on && !list));
      if (kindFilters) kindFilters.hidden = list;
      if (egoBtn) {
        egoBtn.hidden = !on;
        egoBtn.classList.toggle("on", !!egoMode);
      }
      if (egoHopsEl) {
        egoHopsEl.disabled = !on;
        egoHopsEl.value = String(egoHops);
        const wrap = egoHopsEl.closest(".ego-hops");
        if (wrap) wrap.hidden = !on || !egoMode;
      }
      reorgBtns.forEach((el2) => {
        el2.hidden = !on;
      });
      syncWorkspaces();
    }
    function syncWorkspaces() {
      if (!workspacesEl) return;
      workspacesEl.querySelectorAll("[data-ws]").forEach((el2) => {
        el2.classList.toggle("on", el2.getAttribute("data-ws") === explorerWs);
      });
    }
    function isListWorkspace(ws) {
      return !!LIST_WORKSPACES[ws];
    }
    function defaultRunFlow() {
      const flows = snapshot && snapshot.flows || [];
      return flows.find((f) => f.name === "control-flow") || flows.find((f) => f.name === "overview") || currentFlow() || flows[0] || null;
    }
    function defaultLandingWorkspace() {
      return defaultRunFlow() ? "overview" : "map";
    }
    function applyExplorerLanding() {
      if (explorerPinned) return;
      try {
        const q = new URLSearchParams(location.search || "").get("ws");
        if (q && WORKSPACES.indexOf(q) >= 0) {
          explorerWs = q;
          explorerPinned = true;
          if (q === "lineage" && !egoMode) egoMode = true;
          return;
        }
      } catch (e) {
      }
      explorerWs = defaultLandingWorkspace();
    }
    let harnessConsumed = false;
    function consumeHarnessActions() {
      let q;
      try {
        q = new URLSearchParams(location.search || "");
      } catch (e) {
        return;
      }
      const drill = q.get("drill") === "1";
      const hop = q.get("hop") === "1";
      const ego = q.get("ego") === "1";
      const zoomK = parseFloat(q.get("zoom") || "");
      if (!harnessConsumed && (drill || hop || ego)) {
        harnessConsumed = true;
        if (ego) {
          egoMode = true;
          if (egoBtn) egoBtn.classList.add("on");
        }
        if (drill) {
          if (explorerWs !== "map") {
            explorerWs = "map";
            explorerPinned = true;
            paint({ animate: "none" });
          }
          const card = document.querySelector(".bubble-card");
          if (card) {
            graphFilter.bubble = card.getAttribute("data-bubble");
            selectedNodeId = null;
            renderProgramOverview();
          }
        }
        if (hop) {
          if (!document.querySelector(".edge-hit, text.ekind")) {
            explorerWs = "slice";
            explorerPinned = true;
            paint({ animate: "none" });
          }
          const hit = document.querySelector(".edge-hit, text.ekind");
          if (hit) hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      }
      if (Number.isFinite(zoomK) && zoomK > 0) {
        cam.k = zoomK;
        camTo.k = zoomK;
        applyCam();
      }
      try {
        const pr = q.get("preset");
        if (pr && PRESETS.indexOf(pr) >= 0) applyPreset(pr, false);
        if (q.get("present") === "1" && !consumeHarnessActions._present) {
          consumeHarnessActions._present = true;
          applyPresent(true);
        }
        if (q.get("route") === "1" && !consumeHarnessActions._route) {
          consumeHarnessActions._route = true;
          setRouteOpen(true);
        }
        if (q.get("lens") === "1" && !consumeHarnessActions._lens) {
          consumeHarnessActions._lens = true;
          setLensOpen(true);
        }
      } catch (_) {
      }
    }
    function setWorkspace(name, pin) {
      if (WORKSPACES.indexOf(name) < 0) return;
      explorerWs = name;
      if (pin) explorerPinned = true;
      if (name === "lineage" && !egoMode) egoMode = true;
      paint({ animate: "none" });
      flashCanvas();
    }
    function setEgoMode(on) {
      egoMode = !!on;
      if (egoBtn) egoBtn.classList.toggle("on", egoMode);
      if (egoHopsEl) {
        const wrap = egoHopsEl.closest(".ego-hops");
        if (wrap) wrap.hidden = !egoMode;
      }
      applyEgoPaint();
    }
    function refreshExplorer() {
      if (!snapshot) return;
      if (isListWorkspace(explorerWs) || explorerWs === "lineage" || explorerWs === "overview") {
        paint({ animate: "none" });
        return;
      }
      if (explorerWs === "map" || stack[stack.length - 1]?.kind === "programs") {
        renderProgramOverview();
        return;
      }
      applyGraphFilter();
      applyEgoPaint();
    }
    function setLedgerHead(label) {
      const el2 = document.querySelector("#ledgerPane .led-head");
      if (!el2) return;
      const raw = String(label || "Slice");
      el2.textContent = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
    function updateZoomPct() {
      if (!zoomPct) return;
      const k = camTo && camTo.k ? camTo.k : cam.k;
      zoomPct.textContent = Math.round(k * 100) + "% · " + lodName(lodOf(k));
    }
    function lodOf(k) {
      if (k < 0.75) return 0;
      if (k < 1.5) return 1;
      if (k < 2.6) return 2;
      return 3;
    }
    function lodName(lod) {
      return ["overview", "labels", "hops", "source"][lod] || "labels";
    }
    function canPopAltitude() {
      if (graphFilter.bubble) return true;
      const top = stack[stack.length - 1];
      return !!(top && top.kind === "bubble");
    }
    function popAltitudeFromZoom() {
      if (graphFilter.bubble) {
        graphFilter.bubble = null;
        selectedNodeId = null;
        resetCam();
        zoomPopReady = false;
        if (explorerWs === "map" || stack[stack.length - 1]?.kind === "programs") renderProgramOverview();
        else paint({ animate: "none" });
        return;
      }
      if (stack[stack.length - 1]?.kind === "bubble") {
        resetCam();
        zoomPopReady = false;
        goBack();
      }
    }
    function applyCam() {
      if (viewportEl) {
        viewportEl.style.transform = "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.k + ")";
        viewportEl.style.setProperty("--cam-k", String(cam.k));
        const lod = String(lodOf(cam.k));
        if (viewportEl.getAttribute("data-lod") !== lod) viewportEl.setAttribute("data-lod", lod);
      }
      updateZoomPct();
      const popK = camTo && camTo.k != null ? camTo.k : cam.k;
      if (popK > 0.8) zoomPopReady = true;
      if (zoomPopReady && popK <= 0.42 && canPopAltitude()) {
        zoomPopReady = false;
        popAltitudeFromZoom();
      }
    }
    function tickCam() {
      cam.x += (camTo.x - cam.x) * 0.24;
      cam.y += (camTo.y - cam.y) * 0.24;
      cam.k += (camTo.k - cam.k) * 0.24;
      if (Math.hypot(camTo.x - cam.x, camTo.y - cam.y) < 0.35 && Math.abs(camTo.k - cam.k) < 4e-3) {
        cam.x = camTo.x;
        cam.y = camTo.y;
        cam.k = camTo.k;
        camRaf = 0;
      } else {
        camRaf = requestAnimationFrame(tickCam);
      }
      applyCam();
    }
    function setCamTarget(x, y, k) {
      camTo = { x, y, k: clamp(k, CAM_MIN, CAM_MAX) };
      updateZoomPct();
      if (camTo.k > 0.8) zoomPopReady = true;
      if (zoomPopReady && camTo.k <= 0.42 && canPopAltitude()) {
        zoomPopReady = false;
        popAltitudeFromZoom();
        return;
      }
      if (reduceMotion()) {
        cam = { x: camTo.x, y: camTo.y, k: camTo.k };
        applyCam();
        return;
      }
      if (!camRaf) camRaf = requestAnimationFrame(tickCam);
    }
    function resetCam() {
      cam = { x: 0, y: 0, k: 1 };
      camTo = { x: 0, y: 0, k: 1 };
      applyCam();
    }
    function fitChart() {
      const stage = canvas.querySelector(".stage");
      const wrap = stage && stage.querySelector(".comm-wrap, .steiner-wrap") || canvas.querySelector(".comm-wrap, .steiner-wrap");
      if (!stage || !wrap) {
        setCamTarget(0, 0, 1);
        return;
      }
      const sr = stage.getBoundingClientRect();
      const W = Math.max(1, parseFloat(wrap.style.width) || wrap.scrollWidth || wrap.offsetWidth || 1);
      const H = Math.max(1, parseFloat(wrap.style.height) || wrap.scrollHeight || wrap.offsetHeight || 1);
      const pad = 36;
      let k = Math.min((sr.width - pad) / W, (sr.height - pad) / H, 1.05);
      if (!Number.isFinite(k) || k <= 0) k = 1;
      if (canPopAltitude()) k = Math.max(k, 0.78);
      k = clamp(k, CAM_MIN, CAM_MAX);
      zoomPopReady = false;
      setCamTarget((sr.width - W * k) / 2, (sr.height - H * k) / 2, k);
      zoomPopReady = k > 0.8;
    }
    function zoomBy(factor) {
      const stage = canvas.querySelector(".stage");
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      zoomAt(r.width / 2, r.height / 2, camTo.k * factor);
    }
    function zoomAt(px, py, nextK) {
      const k = camTo.k;
      const nk = clamp(nextK, CAM_MIN, CAM_MAX);
      setCamTarget(px - (px - camTo.x) * nk / k, py - (py - camTo.y) * nk / k, nk);
    }
    function zoomToEl(el2, k) {
      const stage = canvas.querySelector(".stage");
      if (!stage || !el2) return;
      const vr = stage.getBoundingClientRect();
      const r = el2.getBoundingClientRect();
      const cx = r.left + r.width / 2 - vr.left;
      const cy = r.top + r.height / 2 - vr.top;
      const contentX = (cx - cam.x) / cam.k;
      const contentY = (cy - cam.y) / cam.k;
      const nk = k || Math.min(CAM_MAX, Math.max(1.55, cam.k * 1.45));
      setCamTarget(vr.width / 2 - contentX * nk, vr.height / 2 - contentY * nk, nk);
    }
    function hideTip() {
      if (!tip) return;
      tip.hidden = true;
    }
    function showTip(text, ev) {
      if (!tip || !text) return;
      tip.textContent = text;
      tip.hidden = false;
      const x = Math.min(ev.clientX + 12, window.innerWidth - 16 - tip.offsetWidth);
      const y = Math.min(ev.clientY + 14, window.innerHeight - 16 - tip.offsetHeight);
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    }
    function bindStage(stage, opts) {
      viewportEl = stage.querySelector(".viewport");
      if (!opts || opts.reset) {
        resetCam();
        requestAnimationFrame(() => fitChart());
      } else applyCam();
      if (stage && !stage.dataset.uiBound) {
        stage.dataset.uiBound = "1";
        stage.addEventListener("pointermove", (e) => {
          const r = stage.getBoundingClientRect();
          stage.style.setProperty("--mx", e.clientX - r.left + "px");
          stage.style.setProperty("--my", e.clientY - r.top + "px");
        });
        stage.addEventListener("pointerleave", () => {
          stage.style.setProperty("--mx", "50%");
          stage.style.setProperty("--my", "40%");
        });
      }
      stage.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          const r = stage.getBoundingClientRect();
          const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
          zoomAt(e.clientX - r.left, e.clientY - r.top, camTo.k * factor);
        },
        { passive: false }
      );
      let drag = null;
      stage.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        if (e.target.closest("button, .run, .inode, a, input")) return;
        drag = { x: e.clientX, y: e.clientY, cx: camTo.x, cy: camTo.y };
        stage.classList.add("panning");
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener("pointermove", (e) => {
        if (!drag) return;
        setCamTarget(drag.cx + (e.clientX - drag.x), drag.cy + (e.clientY - drag.y), camTo.k);
      });
      const endDrag = () => {
        drag = null;
        stage.classList.remove("panning");
      };
      stage.addEventListener("pointerup", endDrag);
      stage.addEventListener("pointercancel", endDrag);
      stage.addEventListener("dblclick", (e) => {
        if (e.target.closest(".vnode, .run")) return;
        fitChart();
      });
    }
    function bindGraphFx() {
      const wrap = canvas.querySelector(".steiner-wrap");
      const svg = canvas.querySelector("svg.steiner");
      if (svg) {
        const edges = [...svg.querySelectorAll(".edge")];
        const flows = [...svg.querySelectorAll(".edge-flow")];
        const nodes = [...(wrap || canvas).querySelectorAll(".vnode")];
        const clearHot = () => {
          svg.classList.remove("focus");
          if (wrap) wrap.classList.remove("focus");
          edges.forEach((el2) => el2.classList.remove("hot"));
          flows.forEach((el2) => el2.classList.remove("hot"));
          nodes.forEach((el2) => el2.classList.remove("hot"));
          hideTip();
        };
        nodes.forEach((g) => {
          const id = g.getAttribute("data-id");
          const fqn = g.getAttribute("data-fqn") || "";
          g.addEventListener("pointerenter", (ev) => {
            svg.classList.add("focus");
            if (wrap) wrap.classList.add("focus");
            g.classList.add("hot");
            edges.forEach((el2) => {
              if (el2.dataset.from === id || el2.dataset.to === id) el2.classList.add("hot");
            });
            flows.forEach((el2) => {
              if (el2.dataset.from === id || el2.dataset.to === id) el2.classList.add("hot");
            });
            showTip(fqn, ev);
          });
          g.addEventListener("pointermove", (ev) => showTip(fqn, ev));
          g.addEventListener("pointerleave", clearHot);
          g.addEventListener("click", (ev) => {
            ev.stopPropagation();
            selectNode(id, { zoomEl: g });
          });
          g.addEventListener("dblclick", (ev) => {
            ev.stopPropagation();
            const run = [...canvas.querySelectorAll(".run")].find(
              (el2) => (el2.getAttribute("data-nodes") || "").split(",").includes(id)
            );
            if (run) {
              enterRun(run.getAttribute("data-flow"), run.getAttribute("data-bubble"), run);
              return;
            }
            const flow = currentFlow();
            if (flow) peekSource(id);
          });
        });
        bindHopClicks(svg);
        if (!reduceMotion()) {
          setTimeout(() => {
            svg.classList.add("flowing");
            if (wrap) wrap.classList.add("flowing");
          }, 520);
        }
      }
      bindDraggable(canvas.querySelector(".steiner-wrap"), ".vnode", {
        onClick: (id, el2) => selectNode(id, { zoomEl: el2 })
      });
      bindDraggable(canvas.querySelector(".chart"), ".run", {
        idAttr: "data-run",
        onClick: (_id, el2) => enterRun(el2.getAttribute("data-flow"), el2.getAttribute("data-bubble"), el2)
      });
    }
    function selectFlow(name) {
      if (name) flowName = name;
      vscode.postMessage({ type: "selectFlow", flow: name });
      const flow = currentFlow();
      if (flow && (flow.tree && flow.tree.edges && flow.tree.edges.length || flow.tree && flow.tree.nodes && flow.tree.nodes.length)) {
        explorerWs = "slice";
        paint({ animate: "none" });
      }
    }
    function enterRun(flow, bubble, fromEl) {
      vscode.postMessage({ type: "enterRun", flow, bubble });
      const token = ++navToken;
      const go = () => {
        if (token !== navToken) return;
        stack.push({ kind: "bubble", flow, bubble: String(bubble) });
        paint({ animate: "list" });
      };
      if (fromEl && !reduceMotion()) {
        fromEl.classList.add("zoom-in");
        canvas.classList.add("leaving");
        zoomToEl(fromEl, 1.9);
        setTimeout(go, 200);
      } else {
        go();
      }
    }
    function syncBackBtn() {
      if (!backBtn) return;
      backBtn.disabled = stack.length <= 1 && !graphFilter.bubble;
    }
    function goBack() {
      if (graphFilter.bubble && (explorerWs === "map" || stack[stack.length - 1]?.kind === "programs")) {
        graphFilter.bubble = null;
        selectedNodeId = null;
        renderProgramOverview();
        return;
      }
      if (stack.length <= 1) return;
      const top = stack[stack.length - 1];
      if (top.kind === "flow") {
        stack.pop();
        if (stack.length === 0) stack.push({ kind: "programs" });
        explorerWs = defaultLandingWorkspace();
        explorerPinned = false;
        vscode.postMessage({ type: "back" });
        paint({ animate: "none" });
        return;
      }
      const token = ++navToken;
      const fromInner = top.kind === "bubble";
      const go = () => {
        if (token !== navToken) return;
        stack.pop();
        paint({ animate: "tree", fromInner });
      };
      if (fromInner && !reduceMotion()) {
        canvas.classList.add("leaving");
        setTimeout(go, 150);
      } else {
        go();
      }
    }
    function paint(opts) {
      const animate = opts && opts.animate || "all";
      const preview = !!(opts && opts.preview) || !!(snapshot && snapshot.preview);
      if (!snapshot) return;
      const top = stack[stack.length - 1];
      syncBackBtn();
      syncWorkspaces();
      if (top && top.kind === "bubble") {
        const inner2 = enterBubble(snapshot, top.flow, top.bubble);
        renderInner(
          {
            inner: inner2,
            flow: currentFlow(),
            coverage: snapshot.coverage,
            findings: snapshot.findings,
            plugin: snapshot.plugin,
            stats: snapshot.stats
          },
          animate
        );
        applyEgoPaint();
        consumeHarnessActions();
        return;
      }
      if (isListWorkspace(explorerWs) || explorerWs === "overview") {
        renderExplorerList(explorerWs);
        consumeHarnessActions();
        return;
      }
      if (explorerWs === "lineage") {
        renderLineage();
        consumeHarnessActions();
        return;
      }
      if (explorerWs === "map") {
        renderProgramOverview();
        consumeHarnessActions();
        return;
      }
      if (explorerWs === "slice") {
        let flow = currentFlow();
        const story = storyFlow();
        if (story && (flow?.tree?.nodes || []).length < 2 && (story.tree?.nodes || []).length >= 2) {
          flowName = story.name;
          flow = story;
        }
        renderFlowchart(
          {
            flows: snapshot.flows,
            flow,
            graph: snapshot.graph,
            bubbles: snapshot.bubbles,
            coverage: snapshot.coverage,
            findings: snapshot.findings,
            plugin: snapshot.plugin,
            stats: snapshot.stats
          },
          { animate: animate === "all" ? "none" : animate, preview, keepCam: !!(opts && opts.keepCam) }
        );
        lastTreeKey = treeKey(flow);
        applyEgoPaint();
        consumeHarnessActions();
        return;
      }
      if (top.kind === "programs") {
        renderProgramOverview();
        consumeHarnessActions();
        return;
      }
      if (top.kind === "flow") {
        const flow = currentFlow();
        renderFlowchart(
          {
            flows: snapshot.flows,
            flow,
            graph: snapshot.graph,
            bubbles: snapshot.bubbles,
            coverage: snapshot.coverage,
            findings: snapshot.findings,
            plugin: snapshot.plugin,
            stats: snapshot.stats
          },
          { animate, preview, keepCam: !!(opts && opts.keepCam), fromInner: !!(opts && opts.fromInner) }
        );
        lastTreeKey = treeKey(flow);
        if (opts && opts.fromInner) {
          cam = { x: 0, y: 0, k: 1.45 };
          camTo = { x: 0, y: 0, k: 1.45 };
          applyCam();
          setCamTarget(0, 0, 1);
        }
        consumeHarnessActions();
        return;
      }
      const inner = enterBubble(snapshot, top.flow, top.bubble);
      renderInner(
        {
          inner,
          flow: currentFlow(),
          coverage: snapshot.coverage,
          findings: snapshot.findings,
          plugin: snapshot.plugin,
          stats: snapshot.stats
        },
        animate
      );
      consumeHarnessActions();
    }
    function queueProgress(msg) {
      pendingProgress = msg;
      if (!progressRaf) progressRaf = requestAnimationFrame(flushProgress);
    }
    function flushProgress() {
      progressRaf = 0;
      if (!pendingProgress) return;
      const msg = pendingProgress;
      pendingProgress = null;
      showProgress(msg);
    }
    function setBusy(on) {
      busy = on;
      reviewBtn.hidden = on;
      cancelBtn.hidden = !on;
      reviewBtn.disabled = on;
    }
    function showProgress(msg) {
      setBusy(true);
      progressEl.classList.add("on");
      const phase = PHASE_ALIAS[msg.phase] || msg.phase || "walk";
      setPhases(phase);
      progressBar.classList.toggle("work", phase === "cluster" || phase === "extract");
      targetPct = Math.max(targetPct, Math.max(0, Math.min(100, Number(msg.pct) || 0)));
      if (!barRaf) barRaf = requestAnimationFrame(tickBar);
      progressLabel.textContent = msg.label || msg.phase || "Working…";
      if (msg.total) progressCounts.textContent = (msg.done || 0) + "/" + msg.total;
      else progressCounts.textContent = phase;
      if (msg.elapsed_ms != null) progressTime.textContent = formatMs(msg.elapsed_ms);
      if (snapshot && snapshot.preview) canvas.classList.remove("stale");
      else if (canvas.childElementCount && snapshot) canvas.classList.add("stale");
      else if (!canvas.childElementCount || canvas.querySelector(".empty")) {
        canvas.classList.remove("stale");
        if (!canvas.querySelector(".skeleton")) {
          canvas.innerHTML = '<div class="skeleton" aria-hidden="true"><i></i><i></i><i></i></div><div class="empty pulse">' + esc(msg.label || "Working…") + "</div>";
        } else {
          const empty = canvas.querySelector(".empty");
          if (empty) empty.textContent = msg.label || "Working…";
        }
      }
      status.textContent = (msg.phase || "review") + " · " + Math.round(targetPct) + "%";
    }
    function tickBar() {
      shownPct += (targetPct - shownPct) * 0.22;
      if (Math.abs(targetPct - shownPct) < 0.15) shownPct = targetPct;
      progressFill.style.width = shownPct + "%";
      progressPct.textContent = Math.round(shownPct) + "%";
      if (shownPct !== targetPct) barRaf = requestAnimationFrame(tickBar);
      else barRaf = 0;
    }
    function setPhases(active) {
      const idx = PHASE_ORDER.indexOf(active);
      phasesEl.querySelectorAll("li").forEach((el2) => {
        const i = PHASE_ORDER.indexOf(el2.getAttribute("data-phase"));
        el2.classList.toggle("done", i < idx);
        el2.classList.toggle("on", i === idx);
      });
    }
    function hideProgress() {
      progressEl.classList.remove("on");
      progressBar.classList.remove("work");
      phasesEl.querySelectorAll("li").forEach((el2) => el2.classList.remove("on", "done"));
      targetPct = 0;
      shownPct = 0;
      progressFill.style.width = "0%";
    }
    function finishWork() {
      setBusy(false);
      hideProgress();
      canvas.classList.remove("stale");
    }
    function formatMs(ms) {
      const n = Number(ms) || 0;
      if (n < 1e3) return n + "ms";
      return (n / 1e3).toFixed(1) + "s";
    }
    function idVal(id) {
      if (id && typeof id === "object" && "0" in id) return String(id[0]);
      return String(id);
    }
    function sameId(a, b) {
      return idVal(a) === idVal(b);
    }
    function fqnOf(graph, id) {
      const n = nodeById.get(idVal(id)) || (graph.nodes || []).find((x) => sameId(x.id, id));
      return n ? n.fqn : String(id);
    }
    function kindOf(graph, id) {
      const n = nodeById.get(idVal(id)) || (graph.nodes || []).find((x) => sameId(x.id, id));
      return n ? n.kind : "";
    }
    function shortOf(fqn) {
      return String(fqn || "").split(/::|\./).pop();
    }
    function shortToken(id) {
      const s = String(idVal(id) || "").replace(/^n/i, "");
      return (s.slice(-4).toUpperCase() || "0").padStart(4, "0");
    }
    function kindClass(kind) {
      const k = String(kind || "Function");
      if (k === "Type") return "kind-Type";
      if (k === "Endpoint") return "kind-Endpoint";
      return "kind-Function";
    }
    function endpointOf(id) {
      const n = nodeById.get(idVal(id)) || (snapshot && snapshot.graph && snapshot.graph.nodes || []).find((x) => sameId(x.id, id));
      return n && n.endpoint ? n.endpoint : null;
    }
    function kindLine(id, kind) {
      const ep = endpointOf(id);
      if (ep && (ep.role || ep.channel)) {
        return String(ep.role || "Endpoint") + (ep.channel ? " · " + ep.channel : "");
      }
      return String(kind || "Function") + " · " + shortToken(id);
    }
    function graphEdge(from, to, kind) {
      const a = idVal(from), b = idVal(to);
      const pools = [];
      const flow = currentFlow();
      if (flow && flow.tree && flow.tree.edges) pools.push(flow.tree.edges);
      if (snapshot && snapshot.graph && snapshot.graph.edges) pools.push(snapshot.graph.edges);
      let found = null;
      for (const edges of pools) {
        for (const e of edges) {
          if (idVal(e.from) !== a || idVal(e.to) !== b) continue;
          if (kind && e.kind && e.kind !== kind) continue;
          found = e;
          break;
        }
        if (found) break;
      }
      return found;
    }
    function bindHopClicks(root2) {
      if (!root2) return;
      root2.querySelectorAll("[data-from][data-to]").forEach((el2) => {
        if (el2.dataset.hopBound) return;
        el2.dataset.hopBound = "1";
        const go = (ev) => {
          ev.stopPropagation();
          showHop(el2.getAttribute("data-from"), el2.getAttribute("data-to"), el2.getAttribute("data-kind"));
        };
        el2.addEventListener("click", go);
        el2.addEventListener("pointerdown", (ev) => ev.stopPropagation());
      });
    }
    function orthoPath(a, b) {
      const mx = Math.round((a.x + b.x) / 2);
      return "M" + a.x + "," + a.y + " H" + mx + " V" + b.y + " H" + b.x;
    }
    function layoutViewKey() {
      return [
        explorerWs || "map",
        graphFilter.bubble || "",
        currentFlow() && currentFlow().name || "",
        graphFilter.program && graphFilter.program.name || ""
      ].join("/");
    }
    function pinsForCurrent() {
      const prefix = layoutViewKey() + ":";
      const m = /* @__PURE__ */ new Map();
      for (const [k, v] of layoutPins) {
        if (k.startsWith(prefix)) m.set(k.slice(prefix.length), { x: v.x, y: v.y });
      }
      return m;
    }
    function pinNode(id, x, y) {
      layoutPins.set(layoutViewKey() + ":" + String(id), { x, y });
    }
    function clearCurrentPins() {
      const prefix = layoutViewKey() + ":";
      for (const k of [...layoutPins.keys()]) if (k.startsWith(prefix)) layoutPins.delete(k);
    }
    function autoReorganize() {
      clearCurrentPins();
      if (!snapshot) return;
      paint({ animate: "none", keepCam: true });
      flashToast("Reorganized", "ok");
    }
    function kindWeight(kind) {
      if (kind === "Calls" || kind === "Publishes" || kind === "Subscribes") return 3;
      if (kind === "Reads" || kind === "Writes") return 2;
      return 1;
    }
    function baryOf(id, neighborIdx, edges) {
      let sum = 0, n = 0;
      for (const e of edges) {
        const other = e.from === id ? e.to : e.to === id ? e.from : null;
        if (other == null || !neighborIdx.has(other)) continue;
        sum += neighborIdx.get(other);
        n++;
      }
      return n ? sum / n : 0;
    }
    function separateBoxes(pos, nodeW, nodeH, gap) {
      const ids = [...pos.keys()];
      const minX = nodeW + gap;
      const minY = nodeH + gap;
      for (let t = 0; t < 36; t++) {
        let moved = false;
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = pos.get(ids[i]), b = pos.get(ids[j]);
            const dx = a.x - b.x, dy = a.y - b.y;
            const ox = minX - Math.abs(dx);
            const oy = minY - Math.abs(dy);
            if (ox <= 0 || oy <= 0) continue;
            moved = true;
            if (ox < oy) {
              const s = (dx < 0 ? -1 : 1) * (ox / 2 + 0.5);
              a.x += s;
              b.x -= s;
            } else {
              const s = (dy === 0 ? i % 2 ? 1 : -1 : dy < 0 ? -1 : 1) * (oy / 2 + 0.5);
              a.y += s;
              b.y -= s;
            }
          }
        }
        if (!moved) break;
      }
    }
    function layeredPositions(ids, rawEdges, opts) {
      opts = opts || {};
      const nodeW = opts.nodeW || 196;
      const nodeH = opts.nodeH || 72;
      const gapX = opts.gapX || 80;
      const gapY = opts.gapY || 40;
      const pad = opts.pad || 48;
      const list = (ids || []).map((id) => String(idVal(id)));
      const idSet = new Set(list);
      const edges = [];
      for (const e of rawEdges || []) {
        const a = String(idVal(e.from)), b = String(idVal(e.to));
        if (!idSet.has(a) || !idSet.has(b) || a === b) continue;
        edges.push({ from: a, to: b, kind: e.kind || "Calls" });
      }
      const incoming = new Map(list.map((id) => [id, 0]));
      const outs = new Map(list.map((id) => [id, []]));
      for (const e of edges) {
        incoming.set(e.to, (incoming.get(e.to) || 0) + 1);
        (outs.get(e.from) || []).push(e.to);
      }
      let sources = list.filter((id) => incoming.get(id) === 0);
      if (!sources.length && list.length) sources = [list[0]];
      const rank = /* @__PURE__ */ new Map();
      const q = sources.map((id) => [id, 0]);
      const seen = /* @__PURE__ */ new Set();
      while (q.length) {
        const [id, d] = q.shift();
        if (seen.has(id)) continue;
        seen.add(id);
        rank.set(id, d);
        for (const n of outs.get(id) || []) q.push([n, d + 1]);
      }
      for (const id of list) if (!rank.has(id)) rank.set(id, 0);
      const buckets = [];
      for (const id of list) {
        const r = rank.get(id);
        while (buckets.length <= r) buckets.push([]);
        buckets[r].push(id);
      }
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 1; i < buckets.length; i++) {
          const prevIdx = new Map(buckets[i - 1].map((id, j) => [id, j]));
          buckets[i].sort((a, b) => baryOf(a, prevIdx, edges) - baryOf(b, prevIdx, edges) || a.localeCompare(b));
        }
        for (let i = buckets.length - 2; i >= 0; i--) {
          const nextIdx = new Map(buckets[i + 1].map((id, j) => [id, j]));
          buckets[i].sort((a, b) => baryOf(a, nextIdx, edges) - baryOf(b, nextIdx, edges) || a.localeCompare(b));
        }
      }
      const colW = nodeW + gapX;
      const rowH = nodeH + gapY;
      const maxCols = Math.max(1, opts.maxCols || 7);
      const maxRows = buckets.reduce((m, c) => Math.max(m, c.length), 1);
      const pack = maxRows > 4 || buckets.length > maxCols;
      const pos = /* @__PURE__ */ new Map();
      if (!pack) {
        const H0 = Math.max(opts.minH || 280, pad * 2 + maxRows * rowH);
        buckets.forEach((col, i) => {
          const colH = col.length * rowH;
          const y0 = (H0 - colH) / 2 + rowH / 2;
          col.forEach((id, j) => {
            pos.set(id, { x: pad + colW * i + nodeW / 2, y: y0 + j * rowH });
          });
        });
      } else {
        const order = [];
        buckets.forEach((col) => col.forEach((id) => order.push(id)));
        const cols = Math.min(maxCols, Math.max(1, order.length));
        order.forEach((id, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          pos.set(id, { x: pad + colW * c + nodeW / 2, y: pad + rowH * r + nodeH / 2 });
        });
      }
      const pins = opts.pins || pinsForCurrent();
      for (const [id, p] of pos) {
        const pin = pins.get(id);
        if (pin) {
          p.x = pin.x;
          p.y = pin.y;
        }
      }
      separateBoxes(pos, nodeW, nodeH, 18);
      let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
      for (const p of pos.values()) {
        minX = Math.min(minX, p.x - nodeW / 2);
        minY = Math.min(minY, p.y - nodeH / 2);
        maxX = Math.max(maxX, p.x + nodeW / 2);
        maxY = Math.max(maxY, p.y + nodeH / 2);
      }
      if (!pos.size) {
        minX = 0;
        minY = 0;
      }
      const dx = pad - minX, dy = pad - minY;
      if (dx || dy) for (const p of pos.values()) {
        p.x += dx;
        p.y += dy;
      }
      const W = Math.max(opts.minW || 720, maxX + dx + pad);
      const H = Math.max(opts.minH || 280, maxY + dy + pad);
      return { W: Math.round(W), H: Math.round(H), pos, rank };
    }
    function communityEdgeList(clusters) {
      const memberTo = /* @__PURE__ */ new Map();
      for (const b of clusters || []) {
        const bid = idVal(b.id);
        for (const m of b.members || []) memberTo.set(idVal(m), bid);
      }
      const counts = /* @__PURE__ */ new Map();
      for (const e of snapshot && snapshot.graph && snapshot.graph.edges || []) {
        const a = memberTo.get(idVal(e.from)), b = memberTo.get(idVal(e.to));
        if (!a || !b || a === b) continue;
        const kind = e.kind || "Calls";
        const k = a + "	" + b;
        const cur = counts.get(k);
        const w = kindWeight(kind);
        if (!cur || w > cur.w || w === cur.w && (cur.count || 0) < 1) {
          counts.set(k, { from: a, to: b, kind, w, count: (cur && cur.count) + 1 || 1 });
        } else {
          cur.count += 1;
          if (w > cur.w) {
            cur.kind = kind;
            cur.w = w;
          }
        }
      }
      const byFrom = /* @__PURE__ */ new Map();
      for (const e of counts.values()) {
        if (!byFrom.has(e.from)) byFrom.set(e.from, []);
        byFrom.get(e.from).push(e);
      }
      const out = [];
      for (const list of byFrom.values()) {
        list.sort((a, b) => b.count - a.count || b.w - a.w);
        out.push(...list.slice(0, 2));
      }
      return out;
    }
    function edgeSvg(cls, edges, pos, W, H) {
      let svg = '<svg class="' + cls + '" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">';
      for (const e of edges || []) {
        const a = pos.get ? pos.get(idVal(e.from)) : pos[idVal(e.from)];
        const b = pos.get ? pos.get(idVal(e.to)) : pos[idVal(e.to)];
        if (!a || !b) continue;
        const kind = e.kind || "Calls";
        const d = orthoPath(a, b);
        const mx = Math.round((a.x + b.x) / 2), my = Math.round((a.y + b.y) / 2) - 10;
        svg += '<path class="edge-hit" data-from="' + idVal(e.from) + '" data-to="' + idVal(e.to) + '" data-kind="' + esc(kind) + '" d="' + d + '" />';
        svg += '<path data-from="' + idVal(e.from) + '" data-to="' + idVal(e.to) + '" data-kind="' + esc(kind) + '" d="' + d + '" />';
        svg += '<text class="ekind" x="' + mx + '" y="' + my + '" text-anchor="middle" data-from="' + idVal(e.from) + '" data-to="' + idVal(e.to) + '" data-kind="' + esc(kind) + '">' + esc(kind) + (e.count > 1 ? " · " + e.count : "") + "</text>";
      }
      svg += "</svg>";
      return svg;
    }
    function syncGraphEdges(wrap) {
      if (!wrap) return;
      const posOf = (id) => {
        const escId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(String(id)) : String(id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const el2 = wrap.querySelector('[data-id="' + escId + '"]') || wrap.querySelector('[data-bubble="' + escId + '"]');
        if (!el2) return null;
        return { x: parseFloat(el2.style.left), y: parseFloat(el2.style.top) };
      };
      wrap.querySelectorAll("path[data-from][data-to]").forEach((p) => {
        const a = posOf(p.getAttribute("data-from"));
        const b = posOf(p.getAttribute("data-to"));
        if (!a || !b) return;
        p.setAttribute("d", orthoPath(a, b));
      });
      wrap.querySelectorAll("text.ekind").forEach((t) => {
        const a = posOf(t.getAttribute("data-from"));
        const b = posOf(t.getAttribute("data-to"));
        if (!a || !b) return;
        t.setAttribute("x", String(Math.round((a.x + b.x) / 2)));
        t.setAttribute("y", String(Math.round((a.y + b.y) / 2) - 10));
      });
      wrap.querySelectorAll("animateMotion").forEach((m) => {
        const path = m.getAttribute("path");
        const parent = m.closest("g");
        const from = parent && parent.previousElementSibling;
        if (path && m.parentNode) {
          const hit = wrap.querySelector("path.edge[data-from], path[data-from]");
          if (hit) m.setAttribute("path", hit.getAttribute("d") || path);
        }
      });
    }
    function bindDraggable(root2, selector, opts) {
      opts = opts || {};
      if (!root2) return;
      root2.querySelectorAll(selector).forEach((el2) => {
        if (el2.dataset.dragBound) return;
        el2.dataset.dragBound = "1";
        el2.title = (el2.title ? el2.title + " · " : "") + "Drag to move · click to open";
        let start = null;
        const moveTo = (ev) => {
          if (!start) return;
          const k = cam && cam.k ? cam.k : 1;
          const dx = (ev.clientX - start.x) / k;
          const dy = (ev.clientY - start.y) / k;
          if (!start.moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 4) return;
          start.moved = true;
          el2.dataset.didDrag = "1";
          const nx = start.left + dx, ny = start.top + dy;
          el2.style.left = nx + "px";
          el2.style.top = ny + "px";
          if (start.id) pinNode(start.id, nx, ny);
          syncGraphEdges(root2);
        };
        const end = () => {
          if (!start) return;
          el2.classList.remove("dragging");
          start = null;
          window.removeEventListener("pointermove", moveTo, true);
          window.removeEventListener("pointerup", end, true);
          window.removeEventListener("pointercancel", end, true);
        };
        el2.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          const id = el2.getAttribute(opts.idAttr || "data-id") || el2.getAttribute("data-bubble");
          start = {
            x: e.clientX,
            y: e.clientY,
            left: parseFloat(el2.style.left) || 0,
            top: parseFloat(el2.style.top) || 0,
            id,
            moved: false
          };
          try {
            el2.setPointerCapture(e.pointerId);
          } catch (err) {
          }
          el2.classList.add("dragging");
          window.addEventListener("pointermove", moveTo, true);
          window.addEventListener("pointerup", end, true);
          window.addEventListener("pointercancel", end, true);
        });
        el2.addEventListener(
          "click",
          (e) => {
            if (el2.dataset.didDrag === "1") {
              e.preventDefault();
              e.stopPropagation();
              el2.dataset.didDrag = "";
              return;
            }
            const id = el2.getAttribute(opts.idAttr || "data-id") || el2.getAttribute("data-bubble");
            if (opts.onClick) opts.onClick(id, el2, e);
          },
          true
        );
      });
    }
    function esc(s) {
      return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function flowMark(name) {
      if (skippedFlows.indexOf(name) >= 0) return "skipped";
      const row = stampRows.find((s) => s.name === name);
      if (!row) return "";
      return row.holds ? "holds" : "broken";
    }
    function requestStamp(name) {
      const flow = name || currentFlow() && currentFlow().name;
      if (!flow) return;
      skippedFlows = skippedFlows.filter((n) => n !== flow);
      const row = stampRows.find((s) => s.name === flow);
      if (row) row.holds = true;
      else stampRows.push({ name: flow, holds: true });
      if (snapshot) {
        snapshot.skipped = (snapshot.skipped || []).filter((n) => n !== flow);
        snapshot.stamps = stampRows.slice();
        snapshot.findings = (snapshot.findings || []).filter(
          (f) => !(findingKindOf(f) === "StampBroken" && f.flow === flow)
        );
      }
      vscode.postMessage({ type: "stamp", flow });
      flashToast("Stamped " + flow + " · holds", "holds");
      flashBtn(stampBtn, "flash-holds");
      paint({ animate: "none" });
    }
    function requestSkip(name) {
      const flow = name || currentFlow() && currentFlow().name;
      if (!flow) return;
      if (skippedFlows.indexOf(flow) < 0) skippedFlows.push(flow);
      if (snapshot && (snapshot.skipped || []).indexOf(flow) < 0) {
        snapshot.skipped = (snapshot.skipped || []).concat([flow]);
      }
      vscode.postMessage({ type: "skip", flow });
      flashToast("Skipped " + flow, "skip");
      flashBtn(skipBtn, "flash-skip");
      paint({ animate: "none" });
    }
    function programKeyOf(p) {
      return (p.kind || "") + "\0" + (p.name || "") + "\0" + (p.root || "");
    }
    function detectHint(file) {
      const f = String(file || "").replace(/\\/g, "/").replace(/^\.\//, "");
      let i = f.indexOf("/src/bin/");
      if (i >= 0) {
        const rest = f.slice(i + 9);
        const name = (rest.split("/")[0] || "bin").replace(/\.rs$/, "").replace(/\.go$/, "");
        return { kind: "bin", name, root: f.slice(0, i) };
      }
      if (f.startsWith("src/bin/")) {
        const rest = f.slice(8);
        const name = (rest.split("/")[0] || "bin").replace(/\.rs$/, "").replace(/\.go$/, "");
        return { kind: "bin", name, root: "" };
      }
      if (f === "src/main.rs") return { kind: "bin", name: "main", root: "" };
      if (f.endsWith("/src/main.rs")) {
        const root2 = f.slice(0, -"/src/main.rs".length);
        return { kind: "bin", name: root2.split("/").pop() || "main", root: root2 };
      }
      if (f === "src/lib.rs") return { kind: "lib", name: "lib", root: "" };
      if (f.endsWith("/src/lib.rs")) {
        const root2 = f.slice(0, -"/src/lib.rs".length);
        return { kind: "lib", name: root2.split("/").pop() || "lib", root: root2 };
      }
      if (f.endsWith("/main.go") || f === "main.go") {
        const root2 = f.replace(/main\.go$/, "").replace(/\/$/, "");
        if (root2.startsWith("cmd/")) {
          const name = root2.slice(4).split("/")[0] || "main";
          return { kind: "bin", name, root: "cmd/" + name };
        }
        return { kind: "bin", name: root2.split("/").filter(Boolean).pop() || "main", root: root2 };
      }
      if (f.endsWith("/__main__.py") || f.endsWith("/main.py")) {
        const root2 = f.replace(/__main__\.py$/, "").replace(/main\.py$/, "").replace(/\/$/, "");
        return { kind: "bin", name: root2.split("/").filter(Boolean).pop() || "main", root: root2 };
      }
      return null;
    }
    function crateRootOf(file) {
      const f = String(file || "").replace(/\\/g, "/").replace(/^\.\//, "");
      const i = f.indexOf("/src/bin/");
      if (i >= 0) return f.slice(0, i);
      if (f.startsWith("src/bin/") || f === "src" || f.startsWith("src/")) return "";
      const s = f.indexOf("/src/");
      if (s >= 0) return f.slice(0, s);
      if (f === "main.go" || f === "main.py" || f === "__main__.py") return "";
      if (f.startsWith("cmd/")) return "cmd/" + (f.slice(4).split("/")[0] || "main");
      const slash = f.indexOf("/");
      return slash >= 0 ? f.slice(0, slash) : "";
    }
    function assignProgram(file, programs) {
      const hint = detectHint(file);
      if (hint) return hint;
      const root2 = crateRootOf(file);
      const at = (programs || []).filter((p) => (p.root || "") === root2);
      const lib = at.find((p) => p.kind === "lib");
      if (lib) return lib;
      const pkgBin = root2 ? root2.split("/").filter(Boolean).pop() : "main";
      const bin = at.find((p) => p.kind === "bin" && p.name === pkgBin);
      if (bin) return bin;
      const f = String(file || "").replace(/\\/g, "/");
      const slash = f.indexOf("/");
      if (slash >= 0) {
        const a = f.slice(0, slash);
        if (a === "src") return { kind: "pkg", name: "src", root: "" };
        return { kind: "pkg", name: a, root: a };
      }
      return { kind: "pkg", name: "root", root: "" };
    }
    function flowTouchesProgram(flow, program) {
      const want = programKeyOf(program);
      const graph = snapshot && snapshot.graph;
      const programs = snapshot && snapshot.programs || [];
      for (const id of flow?.tree?.nodes || []) {
        const n = nodeById.get(idVal(id)) || (graph?.nodes || []).find((x) => sameId(x.id, id));
        const file = n?.span?.file;
        if (file && programKeyOf(assignProgram(file, programs)) === want) return true;
      }
      return false;
    }
    function snippetPreview(raw) {
      if (!raw) return "";
      if (typeof raw === "string") return raw;
      return raw.preview || raw.text || "";
    }
    function nodeFlags(id) {
      const sid = idVal(id);
      const cov = snapshot && snapshot.coverage || {};
      const uncovered = (cov.uncovered || []).some((x) => idVal(x) === sid);
      const changed = (cov.changed || []).some((x) => idVal(x) === sid);
      return { uncovered, changed };
    }
    function nodeAway(id) {
      const prog = snapshot && snapshot.program;
      if (!prog) return false;
      const n = nodeById.get(idVal(id));
      const file = n?.span?.file;
      if (!file) return false;
      return programKeyOf(assignProgram(file, snapshot.programs || [])) !== programKeyOf(prog);
    }
    function peekSource(id) {
      if (!id) return;
      const sid = idVal(id);
      sourceId = sid;
      const node = nodeById.get(sid);
      const bag = snapshot && snapshot.snippets || {};
      const local = bag[sid] || bag[id];
      const span = node && node.span || {};
      const line = span.start && span.start.line || span.line;
      const file = span.file || "";
      if (local) {
        showSource({
          id: sid,
          fqn: node && node.fqn || sid,
          kind: node && node.kind,
          file,
          line,
          ...typeof local === "string" ? { text: local, preview: local } : local
        });
      } else if (node) {
        showSource({
          id: sid,
          fqn: node.fqn || sid,
          kind: node.kind,
          file,
          line,
          endLine: span.end && span.end.line || span.endLine,
          text: "",
          preview: ""
        });
      }
      vscode.postMessage({ type: "peekSource", id: sid });
    }
    function showSource(msg) {
      if (!sourcePane) return;
      if (msg.missing) {
        sourcePane.hidden = false;
        if (srcTitle) srcTitle.textContent = "No span for this node";
        if (srcBody) srcBody.textContent = "";
        return;
      }
      sourceId = msg.id || sourceId;
      sourcePane.hidden = false;
      if (workspace) workspace.classList.add("has-source");
      const where = msg.file ? shortFile(msg.file) + (msg.line ? ":" + msg.line : "") : "";
      if (srcTitle) srcTitle.textContent = (shortOf(msg.fqn) || "source") + (where ? " · " + where : "");
      fillInspect(msg);
      if (srcBody) srcBody.innerHTML = renderSourceLines(msg);
      const hot = srcBody && srcBody.querySelector(".src-line.hot");
      if (hot && typeof hot.scrollIntoView === "function") hot.scrollIntoView({ block: "center" });
    }
    function showHop(from, to, kind) {
      const a = idVal(from), b = idVal(to);
      const edge = graphEdge(a, b, kind);
      const k = edge && edge.kind || kind || "Calls";
      const span = edge && edge.span || {};
      const where = span.file ? shortFile(span.file) + (span.start && span.start.line ? ":" + span.start.line : span.line ? ":" + span.line : "") : "";
      if (sourcePane) {
        sourcePane.hidden = false;
        if (workspace) workspace.classList.add("has-source");
      }
      if (srcTitle) srcTitle.textContent = k + " · " + shortToken(a) + " → " + shortToken(b);
      if (hopCard) {
        hopCard.hidden = false;
        hopCard.innerHTML = '<div class="hop-k">Hop · ' + esc(k) + '</div><div class="hop-path"><button type="button" data-id="' + esc(a) + '" class="' + kindClass(kindOf(snapshot && snapshot.graph, a)) + '">' + esc(shortOf(fqnOf(snapshot && snapshot.graph, a))) + " · " + esc(shortToken(a)) + '</button><span class="arr">→</span><button type="button" data-id="' + esc(b) + '" class="' + kindClass(kindOf(snapshot && snapshot.graph, b)) + '">' + esc(shortOf(fqnOf(snapshot && snapshot.graph, b))) + " · " + esc(shortToken(b)) + "</button></div>" + (where ? '<div class="hop-span">' + esc(where) + "</div>" : "") + '<div class="hop-fqn">' + esc(fqnOf(snapshot && snapshot.graph, a)) + '</div><div class="hop-fqn">' + esc(fqnOf(snapshot && snapshot.graph, b)) + "</div>";
        hopCard.querySelectorAll("[data-id]").forEach((el2) => {
          el2.onclick = () => selectNode(el2.getAttribute("data-id"));
        });
      }
      selectNode(b, { peek: true });
    }
    function fillInspect(msg) {
      const id = msg.id;
      const node = nodeById.get(idVal(id));
      const deg = incidentEdges(id).length;
      const bub = bubbleOf(id);
      const file = msg.file || node?.span?.file || "";
      const line = msg.line || node?.span?.start?.line || "";
      const prog = file ? assignProgram(file, snapshot && snapshot.programs || []) : null;
      const flags = nodeFlags(id);
      const ep = node && node.endpoint || endpointOf(id);
      const flow = currentFlow();
      const onTree = !!(flow && (flow.tree?.nodes || []).some((n) => idVal(n) === idVal(id)));
      if (inspMeta) {
        const rows = [
          ["kind", msg.kind || node && node.kind || ""],
          ["role", ep && ep.role ? ep.role : "—"],
          ["channel", ep && ep.channel ? ep.channel : "—"],
          ["span", file ? shortFile(file) + (line ? ":" + line : "") : "—"],
          ["slice", onTree ? "on tree" : "off tree"],
          ["community", bub ? bub.label || idVal(bub.id) : "—"],
          ["file", file ? shortFile(file) : "—"],
          ["program", prog ? prog.kind + " " + prog.name : "—"],
          ["degree", String(deg)],
          ["mark", flags.uncovered ? "uncovered" : flags.changed ? "changed" : "—"]
        ];
        inspMeta.innerHTML = rows.map((r) => '<div class="row"><span class="k">' + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span></div>").join("");
      }
      if (inspEdges) {
        const edges = incidentEdges(id).slice(0, 18);
        inspEdges.innerHTML = edges.length ? edges.map((e) => {
          const other = e.dir === "out" ? e.to : e.from;
          return '<div class="row" data-from="' + esc(e.from) + '" data-to="' + esc(e.to) + '" data-kind="' + esc(e.kind) + '"><span class="k">' + esc(e.kind) + " " + (e.dir === "out" ? "→" : "←") + "</span><span>" + esc(shortOf(fqnOf(snapshot.graph, other))) + "</span></div>";
        }).join("") : '<div class="row"><span class="k">edges</span><span>none on the derived graph</span></div>';
        bindHopClicks(inspEdges);
      }
      if (ledgerGrid) {
        ledgerGrid.querySelectorAll(".cell").forEach((el2) => {
          el2.classList.toggle("on", el2.getAttribute("data-id") === String(id));
        });
        if (ledgerMeta) {
          const lit = ledgerGrid.querySelectorAll(".on").length;
          const n = ledgerGrid.querySelectorAll(".cell").length;
          ledgerMeta.textContent = "objects " + lit + "/" + n;
        }
      }
    }
    function incidentEdges(id) {
      const sid = idVal(id);
      const out = [];
      for (const e of snapshot && snapshot.graph && snapshot.graph.edges || []) {
        if (idVal(e.from) === sid) out.push({ dir: "out", kind: e.kind, from: sid, to: idVal(e.to) });
        else if (idVal(e.to) === sid) out.push({ dir: "in", kind: e.kind, from: idVal(e.from), to: sid });
      }
      return out;
    }
    function allBubbles() {
      return snapshot && snapshot.bubbles || [];
    }
    function coarseBubbles() {
      const bs = allBubbles();
      const top = bs.filter((b) => b.parent == null);
      return top.length ? top : bs;
    }
    function mapAltitudeBubbles() {
      const bs = allBubbles();
      const roots = bs.filter((b) => b.parent == null);
      if (roots.length === 1) {
        const kids = bs.filter((b) => b.parent != null && idVal(b.parent) === idVal(roots[0].id));
        if (kids.length) return kids;
      }
      if (roots.length) return roots;
      if (bs.length) return bs;
      return fallbackProgramBubbles();
    }
    function fallbackProgramBubbles() {
      const nodes = (snapshot && snapshot.graph && snapshot.graph.nodes || []).map((n) => idVal(n.id));
      if (!nodes.length) return [];
      const name = snapshot.programs && snapshot.programs[0] && snapshot.programs[0].name || "program";
      return [{ id: "_program", label: name, parent: null, members: nodes }];
    }
    function findBubble(id) {
      const sid = String(id);
      if (sid === "_program") return fallbackProgramBubbles()[0] || null;
      return allBubbles().find((b) => idVal(b.id) === sid) || null;
    }
    function bubbleOf(id) {
      const sid = idVal(id);
      const bs = allBubbles();
      let found = null;
      for (const b of bs) {
        if (!(b.members || []).some((m) => idVal(m) === sid)) continue;
        if (!found || b.parent != null && found.parent == null) found = b;
      }
      return found;
    }
    function flowWalk(flow) {
      const nodes = flow && flow.tree && flow.tree.nodes || [];
      const edges = flow && flow.tree && flow.tree.edges || [];
      if (!nodes.length) return [];
      const kids = /* @__PURE__ */ new Map();
      for (const e of edges) {
        const a = idVal(e.from), b = idVal(e.to);
        if (!kids.has(a)) kids.set(a, []);
        kids.get(a).push(b);
      }
      const ids = new Set(nodes.map((n) => idVal(n)));
      const incoming = new Set(edges.map((e) => idVal(e.to)));
      const sources = nodes.map((n) => idVal(n)).filter((id) => !incoming.has(id));
      const start = sources.length ? sources : [idVal(nodes[0])];
      const seen = /* @__PURE__ */ new Set();
      const walk = [];
      const q = start.slice();
      while (q.length) {
        const id = q.shift();
        if (!ids.has(id) || seen.has(id)) continue;
        seen.add(id);
        walk.push(id);
        for (const t of kids.get(id) || []) q.push(t);
      }
      for (const n of nodes) {
        const id = idVal(n);
        if (!seen.has(id)) walk.push(id);
      }
      return walk;
    }
    function storyFlow() {
      return defaultRunFlow() || currentFlow();
    }
    function featurePath(flow) {
      const f = flow || storyFlow();
      const seen = /* @__PURE__ */ new Set();
      const path = [];
      for (const id of flowWalk(f)) {
        const b = bubbleOf(id);
        if (!b) continue;
        const bid = idVal(b.id);
        if (seen.has(bid)) continue;
        seen.add(bid);
        path.push(b);
      }
      return path;
    }
    function featureRole(step, last) {
      if (step === 0) return "START";
      if (last > 0 && step === last) return "END";
      if (step >= 0) return "STEP " + (step + 1);
      return "";
    }
    function bindStoryRail() {
      canvas.querySelectorAll(".story-rail [data-feature]").forEach((el2) => {
        el2.onclick = () => {
          stopPathWalk();
          graphFilter.bubble = el2.getAttribute("data-feature");
          selectedNodeId = null;
          explorerWs = "map";
          explorerPinned = true;
          renderProgramOverview();
        };
      });
      canvas.querySelectorAll(".story-rail [data-hop]").forEach((el2) => {
        el2.onclick = () => {
          stopPathWalk();
          const id = el2.getAttribute("data-hop");
          selectedNodeId = id;
          const story = storyFlow();
          if (story && story.name) flowName = story.name;
          explorerWs = "slice";
          explorerPinned = true;
          paint({ animate: "none" });
          selectNode(id);
        };
      });
    }
    function storyMapBubbles() {
      const shown = mapAltitudeBubbles();
      if (!shown.length) return featurePath(storyFlow());
      const seen = /* @__PURE__ */ new Set();
      const path = [];
      for (const id of flowWalk(storyFlow())) {
        const b = shown.find((bub) => (bub.members || []).some((m) => idVal(m) === idVal(id)));
        if (!b) continue;
        const bid = idVal(b.id);
        if (seen.has(bid)) continue;
        seen.add(bid);
        path.push(b);
      }
      return path.length ? path : featurePath(storyFlow());
    }
    function storyRailPath() {
      if (explorerWs === "map" && !graphFilter.bubble) return storyMapBubbles();
      return featurePath(storyFlow());
    }
    function storyHopStops() {
      const hops = [];
      const seen = /* @__PURE__ */ new Set();
      for (const id of flowWalk(storyFlow())) {
        const sid = idVal(id);
        if (seen.has(sid)) continue;
        seen.add(sid);
        const n = nodeById.get(sid);
        hops.push({
          id: sid,
          label: n ? shortOf(n.fqn) || n.fqn || sid : sid,
          kind: "hop"
        });
      }
      return hops;
    }
    function storyRailStops() {
      const comm = storyRailPath();
      if (comm.length >= 2) {
        return comm.map((b) => ({ id: idVal(b.id), label: b.label, kind: "feature" }));
      }
      const hops = storyHopStops();
      if (hops.length >= 2) return hops;
      return comm.map((b) => ({ id: idVal(b.id), label: b.label, kind: "feature" }));
    }
    function pinStoryClusters(clusters) {
      const path = storyMapBubbles();
      const byId = /* @__PURE__ */ new Map();
      for (const b of path) byId.set(idVal(b.id), b);
      for (const b of clusters || []) byId.set(idVal(b.id), b);
      return [...byId.values()];
    }
    function renderStoryRailHtml() {
      const path = storyRailStops();
      if (!path.length) return "";
      const chips = path.map((stop, i) => {
        const name = shortOf(stop.label) || "feature";
        const role = i === 0 ? "start" : i === path.length - 1 ? "end" : "";
        const hop = stop.kind === "hop";
        const here = hop ? selectedNodeId && idVal(selectedNodeId) === idVal(stop.id) ? " here" : "" : graphFilter.bubble && idVal(stop.id) === idVal(graphFilter.bubble) ? " here" : "";
        return (i ? '<span class="path-arrow">→</span>' : "") + '<button type="button" class="feat-chip' + (role ? " " + role : "") + here + '" ' + (hop ? "data-hop" : "data-feature") + '="' + esc(idVal(stop.id)) + '">' + esc((i === 0 ? "START · " : i === path.length - 1 ? "END · " : "") + name) + "</button>";
      }).join("");
      return '<div class="story-rail" id="storyRail"><div class="story-rail-label">Start → features → end</div><div class="story-rail-row">' + chips + "</div></div>";
    }
    function renderFeaturePathHtml() {
      const path = storyRailStops();
      if (!path.length) return "";
      const chips = path.map((stop, i) => {
        const name = shortOf(stop.label) || "feature";
        const role = i === 0 ? "start" : i === path.length - 1 ? "end" : "";
        const hop = stop.kind === "hop";
        const here = hop ? selectedNodeId && idVal(selectedNodeId) === idVal(stop.id) ? " here" : "" : graphFilter.bubble && idVal(stop.id) === idVal(graphFilter.bubble) ? " here" : "";
        const label = i === 0 ? "START · " + name : i === path.length - 1 ? "END · " + name : name;
        return (i ? '<span class="path-arrow">→</span>' : "") + '<button type="button" class="feat-chip' + (role ? " " + role : "") + here + '" style="--i:' + i + '" ' + (hop ? "data-hop" : "data-feature") + '="' + esc(idVal(stop.id)) + '">' + esc(label) + "</button>";
      }).join("");
      return '<div class="feature-path"><div class="feature-path-head"><div class="feature-path-label">Start → features → end</div><div class="path-walk" role="group" aria-label="Walk the feature path"><button type="button" id="pathWalkPrev" title="Previous feature ([)">Prev</button><button type="button" id="pathWalkBtn" title="Play start → features → end (P)">Play</button><button type="button" id="pathWalkNext" title="Next feature (])">Next</button><span id="pathWalkMeta"></span></div></div><div class="feature-path-row">' + chips + "</div></div>";
    }
    function pathWalkStops() {
      return storyRailStops();
    }
    function focusWalkStop(stop) {
      if (!stop) return;
      if (stop.kind === "hop") {
        selectedNodeId = idVal(stop.id);
        peekSource(stop.id);
        return;
      }
      const bub = findBubble(stop.id);
      const mem = bub && (bub.members || [])[0];
      if (mem) peekSource(mem);
    }
    function stopPathWalk() {
      pathWalk.playing = false;
      if (pathWalk.timer) {
        clearInterval(pathWalk.timer);
        pathWalk.timer = 0;
      }
      applyPathWalkPaint();
    }
    function stepPathWalk(delta) {
      const stops = pathWalkStops();
      if (!stops.length) return;
      let i = pathWalk.i + delta;
      if (i < 0) i = 0;
      if (i >= stops.length) {
        i = stops.length - 1;
        stopPathWalk();
      }
      pathWalk.i = i;
      applyPathWalkPaint();
      focusWalkStop(stops[i]);
    }
    function togglePathWalk() {
      if (pathWalk.playing) {
        const stops2 = pathWalkStops();
        stopPathWalk();
        if (pathWalk.i >= 0) {
          flashToast("Paused · " + (pathWalk.i + 1) + "/" + stops2.length, "ok");
        }
        return;
      }
      const stops = pathWalkStops();
      if (!stops.length) {
        flashToast("No start → features → end path yet", "skip");
        return;
      }
      const replay = pathWalk.i >= stops.length - 1;
      if (pathWalk.i < 0 || replay) pathWalk.i = -1;
      if (reduceMotion()) {
        stepPathWalk(1);
        return;
      }
      pathWalk.playing = true;
      flashToast(replay ? "Replaying start → features → end" : "Walking start → features → end", "ok");
      stepPathWalk(1);
      pathWalk.timer = setInterval(() => {
        const next = pathWalkStops();
        if (pathWalk.i >= next.length - 1) {
          stopPathWalk();
          flashToast("End · start → features → end", "ok");
          return;
        }
        stepPathWalk(1);
      }, 720);
    }
    function applyPathWalkPaint() {
      const stops = pathWalkStops();
      const cur = pathWalk.i >= 0 ? stops[pathWalk.i] : null;
      const bid = cur ? idVal(cur.id) : "";
      document.querySelectorAll(".feat-chip").forEach((el2) => {
        const on = !!bid && (el2.getAttribute("data-feature") === bid || el2.getAttribute("data-hop") === bid);
        el2.classList.toggle("walk", on);
        if (on) el2.classList.add("here");
      });
      document.querySelectorAll(".bubble-card").forEach((el2) => {
        const bub = el2.getAttribute("data-bubble");
        const own = bubbleOf(bid);
        el2.classList.toggle(
          "walk",
          !!bid && (bub === bid || !!(own && idVal(own.id) === bub))
        );
      });
      document.querySelectorAll(".vnode, .comm-node").forEach((el2) => {
        const id = el2.getAttribute("data-id");
        const b = id ? bubbleOf(id) : null;
        el2.classList.toggle("walk", !!(bid && (id === bid || b && idVal(b.id) === bid)));
      });
      document.querySelectorAll(".comm-edges path, svg.steiner .edge").forEach((p) => {
        if (!bid) {
          p.classList.remove("walk");
          return;
        }
        const a = p.getAttribute("data-from");
        const t = p.getAttribute("data-to");
        const ba = a && bubbleOf(a);
        const bt = t && bubbleOf(t);
        const hot = !!(ba && idVal(ba.id) === bid || bt && idVal(bt.id) === bid || p.getAttribute("data-from") === bid || p.getAttribute("data-to") === bid);
        p.classList.toggle("walk", hot);
        if (hot) p.classList.add("hot");
      });
      const play = document.getElementById("pathWalkBtn");
      if (play) {
        play.classList.toggle("on", !!pathWalk.playing);
        play.textContent = pathWalk.playing ? "Pause" : "Play";
      }
      const metaEl = document.getElementById("pathWalkMeta");
      if (metaEl) {
        metaEl.textContent = cur ? pathWalk.i + 1 + "/" + stops.length + " · " + (shortOf(cur.label) || "feature") : "";
      }
      refreshNowPill();
    }
    function bindPathWalk() {
      const play = document.getElementById("pathWalkBtn");
      const prev = document.getElementById("pathWalkPrev");
      const next = document.getElementById("pathWalkNext");
      if (play) play.onclick = () => togglePathWalk();
      if (prev)
        prev.onclick = () => {
          stopPathWalk();
          stepPathWalk(pathWalk.i < 0 ? 1 : -1);
        };
      if (next)
        next.onclick = () => {
          stopPathWalk();
          stepPathWalk(1);
        };
      applyPathWalkPaint();
    }
    function colorOfBubble(b) {
      if (!b) return BUBBLE_COLORS[BUBBLE_COLORS.length - 1];
      let h = 0;
      const s = String(idVal(b.id));
      for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
      return BUBBLE_COLORS[Math.abs(h) % BUBBLE_COLORS.length];
    }
    function renderSourceLines(msg) {
      const text = msg.text || msg.preview || "";
      if (!text) {
        const span = msg.file ? shortFile(msg.file) + (msg.line ? ":" + msg.line : "") : "";
        return '<div class="src-line"><span class="ln">—</span><span class="tx">' + esc(span ? "Span " + span + " · open Editor for the file" : "No snippet on this snapshot — inspect rows still hold") + "</span></div>";
      }
      const lines = String(text).split("\n");
      const from = msg.from || msg.line || 1;
      const lo = msg.line || 0;
      const hi = msg.endLine || lo;
      return lines.map((line, i) => {
        const ln = from + i;
        const hot = lo && ln >= lo && ln <= hi;
        return '<div class="src-line' + (hot ? " hot" : "") + '"><span class="ln">' + ln + '</span><span class="tx">' + esc(line) + "</span></div>";
      }).join("");
    }
    function closeSourcePane() {
      if (!sourcePane || sourcePane.hidden) return false;
      sourcePane.hidden = true;
      if (workspace) workspace.classList.remove("has-source");
      if (srcBody) srcBody.innerHTML = "";
      if (inspMeta) inspMeta.innerHTML = "";
      if (inspEdges) inspEdges.innerHTML = "";
      if (hopCard) {
        hopCard.hidden = true;
        hopCard.innerHTML = "";
      }
      sourceId = null;
      return true;
    }
    function programMarks(p) {
      const key = programKeyOf(p);
      const programs = snapshot && snapshot.programs || [];
      let uncovered = 0;
      for (const id of snapshot && snapshot.coverage && snapshot.coverage.uncovered || []) {
        const n = nodeById.get(idVal(id));
        if (n?.span?.file && programKeyOf(assignProgram(n.span.file, programs)) === key) uncovered++;
      }
      const flows = (snapshot && snapshot.flows || []).filter((f) => flowTouchesProgram(f, p)).length;
      return { uncovered, flows };
    }
    function programLinks() {
      const programs = snapshot && snapshot.programs || [];
      const graph = snapshot && snapshot.graph;
      const counts = /* @__PURE__ */ new Map();
      for (const e of graph?.edges || []) {
        const a = nodeById.get(idVal(e.from));
        const b = nodeById.get(idVal(e.to));
        if (!a?.span?.file || !b?.span?.file) continue;
        const ka = programKeyOf(assignProgram(a.span.file, programs));
        const kb = programKeyOf(assignProgram(b.span.file, programs));
        if (!ka || ka === kb) continue;
        const kind = e.kind || "Imports";
        const k = ka + "	" + kb + "	" + kind;
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      const out = [];
      for (const [k, count] of counts) {
        const [from, to, kind] = k.split("	");
        out.push({ from, to, kind, count });
      }
      return out;
    }
    function layoutPrograms(programs) {
      const n = programs.length;
      const W = Math.max(560, 200 + n * 70);
      const H = Math.max(300, 220 + n * 18);
      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(W, H) * 0.3 + Math.max(0, n - 2) * 8;
      return programs.map((p, i) => {
        const a = -Math.PI / 2 + i / Math.max(n, 1) * Math.PI * 2;
        return { p, i, x: n === 1 ? cx : cx + Math.cos(a) * r, y: n === 1 ? cy : cy + Math.sin(a) * r };
      });
    }
    function moveProgFocus(delta) {
      const n = snapshot && snapshot.programs || [];
      if (!n.length) return;
      progFocus = (progFocus + delta + n.length) % n.length;
      graphFilter.program = n[progFocus];
      renderProgramOverview();
    }
    function openAllPrograms() {
      const flows = snapshot && snapshot.flows || [];
      vscode.postMessage({ type: "selectProgram", all: true, flow: flows[0] && flows[0].name });
    }
    function openFocusedProgram() {
      const programs = snapshot && snapshot.programs || [];
      const p = programs[progFocus];
      if (!p) return;
      const el2 = canvas.querySelector('.prog-chip[data-i="' + progFocus + '"]');
      openProgram(p, el2);
    }
    function openProgram(p, fromEl) {
      const flows = snapshot && snapshot.flows || [];
      const first = flows.find((f) => flowTouchesProgram(f, p));
      const go = () => vscode.postMessage({
        type: "selectProgram",
        kind: p.kind,
        name: p.name,
        root: p.root || "",
        flow: first ? first.name : flows[0] && flows[0].name
      });
      if (fromEl && !reduceMotion()) {
        fromEl.classList.add("zoom-in");
        canvas.classList.add("leaving");
        zoomToEl(fromEl, 2.1);
        setTimeout(go, 180);
      } else {
        go();
      }
    }
    function selectNode(id, opts) {
      const sid = id ? idVal(id) : "";
      if (!sid) return;
      if (selectedNodeId && selectedNodeId !== sid) pathEnds = [selectedNodeId, sid];
      else if (pathEnds.length < 2) pathEnds = [sid];
      selectedNodeId = sid;
      highlightCommunity(sid);
      applyEgoPaint();
      if (opts && opts.zoomEl) zoomToEl(opts.zoomEl, Math.min(CAM_MAX, Math.max(2.6, camTo.k * 1.45)));
      if (!opts || opts.peek !== false) peekSource(sid);
    }
    function shortestPath(from, to) {
      const a = idVal(from), b = idVal(to);
      if (!a || !b || a === b) return a ? [a] : [];
      const adj = /* @__PURE__ */ new Map();
      const add = (x, y) => {
        if (!adj.has(x)) adj.set(x, []);
        adj.get(x).push(y);
      };
      for (const e of snapshot && snapshot.graph && snapshot.graph.edges || []) {
        const u = idVal(e.from), v = idVal(e.to);
        add(u, v);
        add(v, u);
      }
      const prev = /* @__PURE__ */ new Map();
      const q = [a];
      prev.set(a, null);
      for (let i = 0; i < q.length; i++) {
        const cur = q[i];
        if (cur === b) break;
        for (const n of adj.get(cur) || []) {
          if (prev.has(n)) continue;
          prev.set(n, cur);
          q.push(n);
        }
      }
      if (!prev.has(b)) return [];
      const path = [b];
      while (path[0] !== a) {
        const p = prev.get(path[0]);
        if (p == null) return [];
        path.unshift(p);
      }
      return path;
    }
    function pathHops(path) {
      const hops = [];
      for (let i = 0; i < path.length - 1; i++) {
        const edge = graphEdge(path[i], path[i + 1]) || graphEdge(path[i + 1], path[i]);
        hops.push({
          from: path[i],
          to: path[i + 1],
          kind: edge && edge.kind || "Calls"
        });
      }
      return hops;
    }
    function consecutiveOnPath(path, a, b) {
      for (let i = 0; i < path.length - 1; i++) {
        if (path[i] === a && path[i + 1] === b || path[i] === a && path[i + 1] === b || path[i] === b && path[i + 1] === a)
          return true;
      }
      return false;
    }
    function neighborhood(id, hops) {
      const start = id ? String(idVal(id)) : "";
      const seen = /* @__PURE__ */ new Set();
      if (!start) return seen;
      seen.add(start);
      let frontier = [start];
      const depth = hops === 2 ? 2 : 1;
      for (let h = 0; h < depth; h++) {
        const next = [];
        for (const cur of frontier) {
          incidentEdges(cur).forEach((e) => {
            const other = e.from === cur ? e.to : e.from;
            if (seen.has(other)) return;
            seen.add(other);
            next.push(other);
          });
        }
        frontier = next;
      }
      return seen;
    }
    function hopDistance(from, to) {
      const a = String(idVal(from)), b = String(idVal(to));
      if (!a || !b) return 99;
      if (a === b) return 0;
      const seen = /* @__PURE__ */ new Set([a]);
      const q = [[a, 0]];
      for (let i = 0; i < q.length; i++) {
        const cur = q[i][0], d = q[i][1];
        if (cur === b) return d;
        incidentEdges(cur).forEach((e) => {
          const other = e.from === cur ? e.to : e.from;
          if (seen.has(other)) return;
          seen.add(other);
          q.push([other, d + 1]);
        });
      }
      return 99;
    }
    function applyEgoPaint() {
      const sid = selectedNodeId ? String(selectedNodeId) : "";
      const neighbors = sid ? neighborhood(sid, egoHops) : /* @__PURE__ */ new Set();
      const path = pathEnds.length === 2 ? shortestPath(pathEnds[0], pathEnds[1]) : [];
      const pathSet = new Set(path);
      canvas.querySelectorAll(".vnode, .comm-node, .ego-node").forEach((el2) => {
        const id = el2.getAttribute("data-id");
        const onEgo = neighbors.has(id);
        if (sid && id) el2.setAttribute("data-dist", String(hopDistance(sid, id)));
        const onPath = pathSet.has(id);
        el2.classList.toggle("selected", id === sid);
        el2.classList.toggle("ego", onEgo);
        el2.classList.toggle("on-path", onPath);
        el2.classList.toggle("ego-dim", !!(egoMode && sid && !onEgo && !onPath));
      });
      canvas.querySelectorAll("[data-from][data-to]").forEach((el2) => {
        const a = el2.getAttribute("data-from"), b = el2.getAttribute("data-to");
        const incident = !!(sid && neighbors.has(a) && neighbors.has(b));
        const onPath = path.length > 1 && consecutiveOnPath(path, a, b);
        el2.classList.toggle("ego", incident);
        el2.classList.toggle("on-path", onPath);
        el2.classList.toggle("ego-dim", !!(egoMode && sid && !incident && !onPath));
      });
      applyProbePaint();
    }
    function isRouteKind(kind) {
      return !!ROUTE_KINDS[String(kind || "")];
    }
    function routeEdges() {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      const push = (e) => {
        if (!e || !isRouteKind(e.kind)) return;
        const a = idVal(e.from);
        const b = idVal(e.to);
        if (!a || !b || a === b) return;
        const k = a + "	" + b + "	" + e.kind;
        if (seen.has(k)) return;
        seen.add(k);
        out.push({ from: a, to: b, kind: e.kind });
      };
      const flow = typeof currentFlow === "function" ? currentFlow() : null;
      if (flow && flow.tree && flow.tree.edges) flow.tree.edges.forEach(push);
      if (snapshot && snapshot.graph && snapshot.graph.edges) snapshot.graph.edges.forEach(push);
      return out;
    }
    function directedRoute(from, to) {
      const a = idVal(from);
      const b = idVal(to);
      if (!a || !b) return { nodes: [], hops: [], ok: false, reason: "need two nodes", from: a, to: b };
      if (a === b) return { nodes: [a], hops: [], ok: false, reason: "same node", from: a, to: b };
      const adj = /* @__PURE__ */ new Map();
      const edgeOf = /* @__PURE__ */ new Map();
      routeEdges().forEach((e) => {
        if (!adj.has(e.from)) adj.set(e.from, []);
        adj.get(e.from).push(e.to);
        const k = e.from + "	" + e.to;
        if (!edgeOf.has(k)) edgeOf.set(k, e);
      });
      const prev = /* @__PURE__ */ new Map();
      const q = [a];
      prev.set(a, null);
      for (let i = 0; i < q.length; i++) {
        const cur = q[i];
        if (cur === b) break;
        for (const n of adj.get(cur) || []) {
          if (prev.has(n)) continue;
          prev.set(n, cur);
          q.push(n);
        }
      }
      if (!prev.has(b)) return { nodes: [], hops: [], ok: false, reason: "unreachable", from: a, to: b };
      const nodes = [b];
      while (nodes[0] !== a) {
        const p = prev.get(nodes[0]);
        if (p == null) return { nodes: [], hops: [], ok: false, reason: "unreachable", from: a, to: b };
        nodes.unshift(p);
      }
      const hops = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        const e = edgeOf.get(nodes[i] + "	" + nodes[i + 1]);
        if (!e) return { nodes: [], hops: [], ok: false, reason: "unreachable", from: a, to: b };
        hops.push(e);
      }
      return { nodes, hops, ok: hops.length >= 1, reason: "", from: a, to: b };
    }
    function routeEndpoints() {
      if (pathEnds.length === 2) return [idVal(pathEnds[0]), idVal(pathEnds[1])];
      if (explorerWs === "sequence" && typeof seqHops === "function") {
        const hops = seqHops();
        const h = seqCursor >= 0 ? hops[seqCursor] : hops[0];
        if (h) return [idVal(h.from), idVal(h.to)];
      }
      if (explorerWs === "dataflow" && typeof dfHops === "function") {
        const hops = dfHops();
        const h = dfCursor >= 0 ? hops[dfCursor] : hops[0];
        if (h) return [idVal(h.from), idVal(h.to)];
      }
      const flow = typeof currentFlow === "function" ? currentFlow() : null;
      const edges = flow && flow.tree && flow.tree.edges || [];
      const e = edges.find((x) => isRouteKind(x.kind));
      if (e) return [idVal(e.from), idVal(e.to)];
      return [];
    }
    function resolveRoute() {
      const ends = routeEndpoints();
      if (ends.length < 2) {
        lastRoute = { nodes: [], hops: [], ok: false, reason: "need two nodes", from: "", to: "" };
        return lastRoute;
      }
      lastRoute = directedRoute(ends[0], ends[1]);
      return lastRoute;
    }
    function stopRouteWalk() {
      routeWalk.playing = false;
      if (routeWalk.timer) {
        clearInterval(routeWalk.timer);
        routeWalk.timer = 0;
      }
      const play = document.getElementById("routePlay");
      if (play) {
        play.classList.remove("on");
        play.setAttribute("aria-pressed", "false");
      }
    }
    function stepRouteWalk(dir) {
      const route = resolveRoute();
      if (!route.ok || !route.hops.length) {
        stopRouteWalk();
        return;
      }
      let i = routeCursor + dir;
      if (i < 0) i = 0;
      if (i >= route.hops.length) {
        i = route.hops.length - 1;
        stopRouteWalk();
      }
      routeCursor = i;
      fillRouteReceipt();
      applyProbePaint();
    }
    function toggleRouteWalk() {
      if (routeWalk.playing) {
        stopRouteWalk();
        flashToast("Paused · " + Math.max(routeCursor, 0) + "/" + (lastRoute.hops || []).length, "ok");
        return;
      }
      const route = resolveRoute();
      if (!route.ok || !route.hops.length) {
        flashToast("Unreachable", "skip");
        return;
      }
      if (routeCursor >= route.hops.length - 1) routeCursor = -1;
      routeWalk.playing = true;
      stepRouteWalk(1);
      if (reduceMotion()) {
        stopRouteWalk();
        return;
      }
      routeWalk.timer = setInterval(() => {
        const next = resolveRoute();
        if (routeCursor >= next.hops.length - 1) {
          stopRouteWalk();
          flashToast("End · " + next.hops.length, "ok");
          fillRouteReceipt();
          return;
        }
        stepRouteWalk(1);
      }, 720);
    }
    function syncProbeDock() {
      if (!probeDock) return;
      const on = !!(routeOpen || lensOpen);
      probeDock.hidden = !on;
      if (routeReceipt) routeReceipt.hidden = !routeOpen;
      if (lensReceipt) lensReceipt.hidden = !lensOpen;
      if (pathBtn) {
        pathBtn.classList.toggle("on", !!routeOpen);
        pathBtn.setAttribute("aria-pressed", routeOpen ? "true" : "false");
      }
      if (lensBtn) {
        lensBtn.classList.toggle("on", !!lensOpen);
        lensBtn.setAttribute("aria-pressed", lensOpen ? "true" : "false");
      }
    }
    function fillRouteReceipt() {
      if (!routeReceipt) return;
      const route = lastRoute && lastRoute.nodes ? lastRoute : resolveRoute();
      lastRoute = route;
      const fromN = route.from ? nodeById.get(route.from) : null;
      const toN = route.to ? nodeById.get(route.to) : null;
      const fromL = shortOf(fromN && fromN.fqn || route.from || "?");
      const toL = shortOf(toN && toN.fqn || route.to || "?");
      const hops = route.hops || [];
      if (routeCursor >= hops.length) routeCursor = hops.length - 1;
      const hot = routeCursor >= 0 ? hops[routeCursor] : null;
      const status2 = !route.ok ? route.reason === "unreachable" ? "Unreachable" : "Pick two nodes" : hot ? routeCursor + 1 + "/" + hops.length + " · " + (hot.kind || "") + " " + shortOf(fqnOf(snapshot.graph, hot.from)) + " → " + shortOf(fqnOf(snapshot.graph, hot.to)) : hops.length + " hops · " + fromL + " → " + toL;
      const list = hops.map((h, i) => {
        return '<button type="button" class="route-hop' + (i === routeCursor ? " on" : "") + '" data-route-i="' + i + '" data-from="' + esc(h.from) + '" data-to="' + esc(h.to) + '" data-kind="' + esc(h.kind || "") + '">' + esc((h.kind || "") + " " + shortOf(fqnOf(snapshot.graph, h.from)) + " → " + shortOf(fqnOf(snapshot.graph, h.to))) + "</button>";
      }).join("");
      routeReceipt.innerHTML = '<div class="review-strip" id="routeReview"><span class="probe-k">PATH</span><button type="button" class="review-step" id="routeOverview">Overview</button><button type="button" class="review-step" id="routePrev">Prev</button><button type="button" class="review-step' + (routeWalk.playing ? " on" : "") + '" id="routePlay" aria-pressed="' + (routeWalk.playing ? "true" : "false") + '">Play</button><button type="button" class="review-step" id="routeNext">Next</button><span id="routeStatus">' + esc(status2) + '</span></div><div id="routeHops" class="route-hops">' + (list || '<span class="empty">No derived directed hops.</span>') + "</div>";
      const overview = document.getElementById("routeOverview");
      const prev = document.getElementById("routePrev");
      const next = document.getElementById("routeNext");
      const play = document.getElementById("routePlay");
      if (overview)
        overview.onclick = () => {
          stopRouteWalk();
          routeCursor = -1;
          fillRouteReceipt();
          applyProbePaint();
        };
      if (prev)
        prev.onclick = () => {
          stopRouteWalk();
          stepRouteWalk(routeCursor < 0 ? 1 : -1);
        };
      if (next)
        next.onclick = () => {
          stopRouteWalk();
          stepRouteWalk(1);
        };
      if (play) play.onclick = () => toggleRouteWalk();
      routeReceipt.querySelectorAll("[data-route-i]").forEach((el2) => {
        el2.onclick = () => {
          const i = parseInt(el2.getAttribute("data-route-i"), 10);
          if (!Number.isFinite(i)) return;
          stopRouteWalk();
          routeCursor = i;
          fillRouteReceipt();
          applyProbePaint();
        };
      });
    }
    function fillLensReceipt() {
      if (!lensReceipt) return;
      const roles = lensRoles.slice(0, 2);
      const chips = ["Function", "Type", "Endpoint", "Source", "Sink"].map((r) => {
        const on = roles.indexOf(r) >= 0;
        const cls = LENS_KIND_ROLES[r] ? "kind-" + r : "kind-Endpoint";
        return '<button type="button" class="kind-pill ' + cls + (on ? "" : " off") + '" data-lens-role="' + r + '" aria-pressed="' + (on ? "true" : "false") + '">' + r + "</button>";
      }).join("");
      const compare = roles.length === 2 ? roles[0] + " · " + roles[1] : roles[0] || "pick a role";
      lensReceipt.innerHTML = '<div class="review-strip" id="lensReview"><span class="probe-k">LENS</span><span id="lensCompare" class="lens-compare">' + esc(compare) + '</span></div><div id="lensRoles" class="lens-roles">' + chips + "</div>";
      lensReceipt.querySelectorAll("[data-lens-role]").forEach((el2) => {
        el2.onclick = () => toggleLensRole(el2.getAttribute("data-lens-role"));
      });
    }
    function setRouteOpen(on) {
      routeOpen = !!on;
      if (!routeOpen) {
        stopRouteWalk();
        routeCursor = -1;
      } else {
        resolveRoute();
        if (!lastRoute.ok) flashToast(lastRoute.reason === "unreachable" ? "Unreachable" : "Pick two nodes", "skip");
      }
      syncProbeDock();
      if (routeOpen) fillRouteReceipt();
      applyProbePaint();
    }
    function setLensOpen(on) {
      lensOpen = !!on;
      if (lensOpen && (!lensRoles.length || lensRoles.length > 2)) lensRoles = ["Function", "Endpoint"];
      syncProbeDock();
      if (lensOpen) fillLensReceipt();
      applyProbePaint();
    }
    function toggleRoute() {
      setRouteOpen(!routeOpen);
    }
    function toggleLens() {
      setLensOpen(!lensOpen);
    }
    function toggleLensRole(role) {
      const r = String(role || "");
      if (!LENS_KIND_ROLES[r] && !LENS_END_ROLES[r]) return;
      const isEnd = !!LENS_END_ROLES[r];
      let next = lensRoles.filter((x) => isEnd ? LENS_END_ROLES[x] : LENS_KIND_ROLES[x]);
      const i = next.indexOf(r);
      if (i >= 0) next.splice(i, 1);
      else {
        if (next.length >= 2) next = next.slice(1);
        next.push(r);
      }
      lensRoles = next.slice(0, 2);
      fillLensReceipt();
      applyProbePaint();
    }
    function nodeLensHit(id) {
      if (!id || !lensRoles.length) return false;
      const n = nodeById.get(idVal(id));
      if (!n) return false;
      const kind = n.kind || "Function";
      const ep = n.endpoint && n.endpoint.role;
      for (let i = 0; i < lensRoles.length; i++) {
        const r = lensRoles[i];
        if (LENS_KIND_ROLES[r] && kind === r) return true;
        if (LENS_END_ROLES[r] && ep === r) return true;
      }
      return false;
    }
    function applyProbePaint() {
      const route = routeOpen ? resolveRoute() : { nodes: [], hops: [], ok: false };
      if (routeOpen) lastRoute = route;
      const pathSet = new Set(route.ok ? route.nodes : []);
      const hopSet = new Set((route.ok ? route.hops : []).map((h) => h.from + "	" + h.to));
      const hot = routeOpen && routeCursor >= 0 && route.hops[routeCursor] ? route.hops[routeCursor] : null;
      let extra = 0;
      let hits = 0;
      canvas.querySelectorAll(".vnode, .comm-node, .ego-node, .seq-part, .df-node, .bubble-card, .lc-end").forEach((el2) => {
        const id = el2.getAttribute("data-id");
        const onRoute = !!(id && pathSet.has(id));
        el2.classList.toggle("on-route", onRoute);
        if (el2.classList.contains("on-route") && id && !pathSet.has(id)) extra++;
        el2.classList.toggle("on-route-hot", !!(hot && id && (id === hot.from || id === hot.to)));
        el2.classList.toggle("route-dim", !!(routeOpen && route.ok && id && !pathSet.has(id)));
        const lensHit = !!(lensOpen && id && nodeLensHit(id));
        if (lensHit) hits++;
        el2.classList.toggle("lens-on", lensHit);
        el2.classList.toggle("lens-dim", !!(lensOpen && id && !lensHit));
      });
      canvas.querySelectorAll("[data-from][data-to]").forEach((el2) => {
        const a = el2.getAttribute("data-from");
        const b = el2.getAttribute("data-to");
        const onRoute = !!(a && b && hopSet.has(a + "	" + b));
        el2.classList.toggle("on-route", onRoute);
        if (el2.classList.contains("on-route") && a && b && !hopSet.has(a + "	" + b)) extra++;
        el2.classList.toggle("on-route-hot", !!(hot && a === hot.from && b === hot.to));
        el2.classList.toggle("route-dim", !!(routeOpen && route.ok && !onRoute));
      });
      if (kindFilters && lensOpen) {
        kindFilters.querySelectorAll("label").forEach((lab) => {
          const box = lab.querySelector("input");
          const k = box && box.getAttribute("data-kind");
          lab.classList.toggle("lens", !!(k && lensRoles.indexOf(k) >= 0));
        });
      } else if (kindFilters) {
        kindFilters.querySelectorAll("label").forEach((lab) => lab.classList.remove("lens"));
      }
      window.__graphideRoute = {
        open: !!routeOpen,
        ok: !!route.ok,
        reason: route.reason || "",
        nodes: route.nodes || [],
        hops: (route.hops || []).map((h) => ({ from: h.from, to: h.to, kind: h.kind })),
        extra,
        cursor: routeCursor
      };
      window.__graphideLens = {
        open: !!lensOpen,
        roles: lensRoles.slice(),
        hits
      };
    }
    function defaultFocusId() {
      const sid = selectedNodeId ? idVal(selectedNodeId) : "";
      if (sid && incidentEdges(sid).length) return sid;
      const story = storyFlow();
      const storyTree = story && story.tree && story.tree.nodes || [];
      if (storyTree.length >= 2) return idVal(storyTree[0]);
      if (sid) return sid;
      const flow = currentFlow();
      const tree = flow && flow.tree && flow.tree.nodes || [];
      if (tree[0]) return idVal(tree[0]);
      const unc = snapshot && snapshot.coverage && snapshot.coverage.uncovered || [];
      if (unc[0]) return idVal(unc[0]);
      const n = snapshot && snapshot.graph && snapshot.graph.nodes && snapshot.graph.nodes[0];
      return n ? idVal(n.id) : "";
    }
    function matchesExplorerQuery(text) {
      const q = (graphFilter.q || "").toLowerCase();
      if (!q) return true;
      return String(text || "").toLowerCase().includes(q);
    }
    function findingKindOf(f) {
      if (!f) return "";
      if (typeof f.kind === "string") return f.kind;
      return f.kind && f.kind.kind || "";
    }
    function findingTitle(f) {
      const k = findingKindOf(f);
      if (k === "StampBroken") return "StampBroken · " + (f.flow || "");
      if (k === "UnmatchedHint") return "UnmatchedHint · " + (f.flow || "") + " · " + shortOf(f.fqn || "");
      if (k === "UncoveredNode") return "UncoveredNode · " + shortOf(f.fqn || "");
      if (k === "DuplicateFqn") return "DuplicateFqn · " + shortOf(f.fqn || "");
      if (k === "KindMismatch") return "KindMismatch · " + (f.edge || "");
      if (k === "SpanlessDrop") return "SpanlessDrop · " + shortFile(f.file || "");
      if (k === "PluginBug") return "PluginBug";
      return k || "finding";
    }
    function decisionRecords() {
      const rows = [];
      const seen = /* @__PURE__ */ new Set();
      for (const s of stampRows.concat(snapshot && snapshot.stamps || [])) {
        const name = s.name || s.flow;
        if (!name || seen.has("stamp:" + name)) continue;
        seen.add("stamp:" + name);
        rows.push({
          kind: "stamp",
          flow: name,
          verdict: s.holds ? "holds" : "broken",
          title: name,
          body: s.holds ? "Human stamp still holds on this graph." : "Stamp no longer matches the derived tree.",
          outcome: s.holds ? "approved" : "rejected"
        });
      }
      for (const name of skippedFlows.concat(snapshot && snapshot.skipped || [])) {
        if (!name || seen.has("skip:" + name)) continue;
        seen.add("skip:" + name);
        rows.push({
          kind: "skip",
          flow: name,
          verdict: "skipped",
          title: name,
          body: "Skipped this session — no stamp written.",
          outcome: "deferred"
        });
      }
      for (const f of snapshot && snapshot.findings || []) {
        const k = findingKindOf(f);
        if (k !== "StampBroken" && k !== "UnmatchedHint") continue;
        rows.push({
          kind: "finding",
          flow: f.flow || "",
          verdict: k === "StampBroken" ? "broken" : "hint",
          title: findingTitle(f),
          body: k === "StampBroken" ? (f.added || []).length + " added · " + (f.removed || []).length + " removed hops" : String(f.fqn || "unmatched hit"),
          outcome: k === "StampBroken" ? "rejected" : "pending",
          added: f.added || [],
          removed: f.removed || []
        });
      }
      return rows;
    }
    function registryEvents() {
      const ev = [];
      const s = snapshot && snapshot.stats || {};
      ev.push({
        kind: "review",
        title: "Review snapshot",
        body: (snapshot.graph && snapshot.graph.nodes || []).length + " nodes · " + (snapshot.graph && snapshot.graph.edges || []).length + " edges · " + (s.files || 0) + " files" + (s.elapsed_ms != null ? " · " + s.elapsed_ms + "ms" : "")
      });
      decisionRecords().forEach((d) => ev.push({ kind: d.kind, title: d.title, body: d.body, flow: d.flow, verdict: d.verdict }));
      const findings = (snapshot && snapshot.findings || []).filter((f) => {
        const k = findingKindOf(f);
        return k && k !== "UncoveredNode" && k !== "StampBroken" && k !== "UnmatchedHint";
      });
      findings.forEach((f) => {
        const hop = f.from && f.to ? shortOf(f.from) + " → " + shortOf(f.to) : "";
        ev.push({
          kind: "finding",
          title: findingTitle(f),
          body: f.message || f.fqn || hop || f.plugin || f.span && f.span.file || "",
          flow: f.flow || ""
        });
      });
      return ev;
    }
    function timelineEvents() {
      const cov = snapshot && snapshot.coverage || {};
      const changed = cov.changed || [];
      const uncovered = cov.uncovered || [];
      const ev = [
        {
          kind: "parent",
          title: "Parent cut",
          body: changed.length + " nodes changed vs parent (HEAD^ unless overridden)"
        },
        {
          kind: "coverage",
          title: "Uncovered",
          body: uncovered.length + " changed nodes sit off every proposed tree",
          sample: uncovered.slice(0, 8).map((id) => idVal(id))
        }
      ];
      decisionRecords().forEach((d) => ev.push({ kind: d.verdict || d.kind, title: d.title, body: d.body, flow: d.flow }));
      return ev;
    }
    function decisionKey(r) {
      return (r.verdict || r.kind || "") + ":" + (r.flow || "") + ":" + (r.title || "");
    }
    function provBucket(kind) {
      if (kind === "Reads") return "used";
      if (kind === "Writes" || kind === "Publishes") return "generated";
      return "informed";
    }
    function causalChainFor(rec) {
      const steps = [];
      if (!rec) return steps;
      const flow = (snapshot && snapshot.flows || []).find((f) => f.name === rec.flow) || (rec.flow && rec.flow === (currentFlow() && currentFlow().name) ? currentFlow() : null) || (snapshot && snapshot.flows || []).find((f) => f.name === rec.flow);
      const tree = flow && flow.tree || { nodes: [], edges: [] };
      (tree.edges || []).forEach((e) => {
        steps.push({
          from: idVal(e.from),
          to: idVal(e.to),
          relationship: e.kind || "Calls",
          content: shortOf(fqnOf(snapshot.graph, e.to)),
          type: kindOf(snapshot.graph, e.to),
          scar: ""
        });
      });
      if (!steps.length && (tree.nodes || []).length) {
        const id = idVal(tree.nodes[0]);
        steps.push({
          from: "",
          to: id,
          relationship: "hit",
          content: shortOf(fqnOf(snapshot.graph, id)),
          type: kindOf(snapshot.graph, id),
          scar: ""
        });
      }
      const scars = (snapshot.findings || []).filter(
        (f) => findingKindOf(f) === "StampBroken" && (!rec.flow || f.flow === rec.flow)
      );
      scars.forEach((f) => {
        (f.added || []).forEach((e) => {
          steps.push({
            from: idVal(e.from),
            to: idVal(e.to),
            relationship: e.kind || "Calls",
            content: shortOf(fqnOf(snapshot.graph, e.to)) || shortToken(idVal(e.to)),
            type: kindOf(snapshot.graph, e.to),
            scar: "added"
          });
        });
        (f.removed || []).forEach((e) => {
          steps.push({
            from: idVal(e.from),
            to: idVal(e.to),
            relationship: e.kind || "Calls",
            content: shortOf(fqnOf(snapshot.graph, e.to)) || shortToken(idVal(e.to)),
            type: kindOf(snapshot.graph, e.to),
            scar: "removed"
          });
        });
      });
      return steps;
    }
    function renderChain(steps) {
      if (!steps.length) return '<div class="empty">No derived hops for this decision. Open a flow tab after Review.</div>';
      return '<div class="chain">' + steps.map((s, i) => {
        return (i ? '<div class="chain-rel">' + esc(s.relationship) + (s.scar ? " · " + s.scar : "") + "</div>" : "") + '<button type="button" class="chain-step ' + esc(s.scar || "") + '" data-from="' + esc(s.from) + '" data-to="' + esc(s.to) + '" data-kind="' + esc(s.relationship) + '"><div class="k">' + esc(s.type || "node") + (s.scar ? " · " + s.scar : "") + '</div><div class="t">' + esc(s.content || shortToken(s.to)) + "</div></button>";
      }).join("") + "</div>";
    }
    function renderDecisionBody() {
      const rows = decisionRecords().filter(
        (r) => matchesExplorerQuery([r.title, r.body, r.flow, r.verdict, r.kind].join(" "))
      );
      if (!rows.length) {
        if (graphFilter.q) {
          return '<div class="empty">No decisions match “' + esc(graphFilter.q) + "”. Clear find to see stamps and skips.</div>";
        }
        return '<div class="empty">No stamps, skips, or stamp scars yet. Stamp (S) or Skip (X) a flow.</div>';
      }
      if (!selectedDecisionKey || !rows.some((r) => decisionKey(r) === selectedDecisionKey)) {
        selectedDecisionKey = decisionKey(rows[0]);
      }
      const selected = rows.find((r) => decisionKey(r) === selectedDecisionKey) || rows[0];
      const chain = causalChainFor(selected);
      const list = rows.map((r) => {
        const key = decisionKey(r);
        return '<article class="expl-card ' + esc(r.verdict || r.kind) + (key === selectedDecisionKey ? " on" : "") + '" data-decision="' + esc(key) + '" data-outcome="' + esc(r.outcome || r.verdict || "") + '"><div class="k">' + esc(r.outcome || r.verdict || r.kind) + '</div><div class="t">' + esc(r.title) + '</div><div class="b">' + esc(r.body) + "</div></article>";
      }).join("");
      const outcomes = [
        ["", "All"],
        ["approved", "Approved"],
        ["rejected", "Rejected"],
        ["deferred", "Deferred"],
        ["pending", "Pending"]
      ];
      const strip = '<div class="outcome-strip" role="tablist" aria-label="Decision outcomes"><span class="outcome-k">Outcomes</span>' + outcomes.map((pair) => {
        const on = decisionOutcomeFilter === pair[0] ? " on" : "";
        return '<button type="button" class="outcome-filter' + on + '" data-outcome-filter="' + esc(pair[0]) + '">' + esc(pair[1]) + "</button>";
      }).join("") + "</div>";
      return '<div class="ws-split"><div class="ws-list">' + strip + list + '</div><div class="ws-detail"><div class="k">Decision record</div><div class="t">' + esc(selected.title) + '</div><div class="outcome ' + esc(selected.verdict || "") + '">' + esc(selected.outcome || selected.verdict || "") + "</div>" + (selected.flow ? '<button type="button" class="crumb-btn" data-open-slice="' + esc(selected.flow) + '">Open slice</button>' : "") + '<div class="flow-title">Causal chain · ' + chain.length + " step" + (chain.length === 1 ? "" : "s") + " on the derived graph</div>" + renderChain(chain) + "</div></div>";
    }
    function renderRegistryBody() {
      const ev = registryEvents().filter(
        (r) => matchesExplorerQuery([r.title, r.body, r.flow, r.verdict, r.kind].join(" "))
      );
      if (!ev.length) {
        if (graphFilter.q) {
          return '<div class="empty">No registry rows match “' + esc(graphFilter.q) + "”. Clear find to see the audit log.</div>";
        }
        return '<div class="empty">Review first — the registry is this snapshot’s audit log.</div>';
      }
      return '<table class="audit"><thead><tr><th>Kind</th><th>Subject</th><th>Detail</th></tr></thead><tbody>' + ev.map((e) => {
        return '<tr class="' + esc(e.verdict || e.kind) + '"' + (e.flow ? ' data-flow="' + esc(e.flow) + '"' : "") + '><td><span class="mut mut-' + esc(e.verdict || e.kind) + '">' + esc(e.verdict || e.kind) + "</span></td><td>" + esc(e.title) + "</td><td>" + esc(e.body) + "</td></tr>";
      }).join("") + "</tbody></table>";
    }
    function renderTimelineBody() {
      const ev = timelineEvents().filter(
        (r) => matchesExplorerQuery([r.title, r.body, r.flow, r.verdict, r.kind].join(" "))
      );
      if (!ev.length) {
        if (graphFilter.q) {
          return '<div class="empty">No timeline events match “' + esc(graphFilter.q) + "”. Clear find to see the parent cut.</div>";
        }
        return '<div class="empty">No parent cut or stamp events yet.</div>';
      }
      if (timelineCursor >= ev.length) timelineCursor = ev.length - 1;
      if (timelineCursor < 0) timelineCursor = 0;
      const cur = ev[timelineCursor];
      return '<div class="tl-page"><div class="tl-scrub"><label>Watch this review <input id="tlScrub" type="range" min="0" max="' + (ev.length - 1) + '" value="' + timelineCursor + '" /></label><span id="tlScrubMeta">t' + timelineCursor + " · " + esc(cur && cur.title || "event") + '</span></div><div class="tl-rail">' + ev.map((e, i) => {
        return '<article class="tl-item ' + esc(e.kind || e.verdict || "") + (i === timelineCursor ? " now" : i < timelineCursor ? " past" : " ahead") + '" data-t="' + i + '"' + (e.flow ? ' data-flow="' + esc(e.flow) + '"' : "") + '><i class="tl-dot"></i><div class="tl-when">t' + i + '</div><div class="k">' + esc(e.kind || e.verdict || "") + '</div><div class="t">' + esc(e.title) + '</div><div class="b">' + esc(e.body) + "</div></article>";
      }).join("") + "</div></div>";
    }
    function deltaFacts() {
      const facts = (snapshot && snapshot.delta && snapshot.delta.facts || []).slice();
      if (!graphFilter.q) return facts;
      return facts.filter(
        (f) => matchesExplorerQuery([f.status, f.subject, f.fqn, f.detail, f.class, f.from_fqn, f.to_fqn].join(" "))
      );
    }
    function deltaMarker(status2) {
      if (status2 === "added") return "+";
      if (status2 === "removed") return "−";
      if (status2 === "changed") return "~";
      if (status2 === "moved") return "↔";
      if (status2 === "rerouted") return "↝";
      return "·";
    }
    function applyDeltaFactView(fact) {
      if (!fact) return;
      if (fact.status === "added") deltaView = "after";
      else if (fact.status === "removed") deltaView = "before";
      else deltaView = "delta";
    }
    function stopDeltaWalk() {
      deltaWalk.playing = false;
      if (deltaWalk.timer) {
        clearInterval(deltaWalk.timer);
        deltaWalk.timer = 0;
      }
      const play = document.getElementById("deltaPlay");
      if (play) {
        play.classList.remove("on");
        play.setAttribute("aria-pressed", "false");
      }
    }
    function stepDeltaWalk(dir) {
      const facts = deltaFacts();
      if (!facts.length) return;
      let i = deltaCursor + dir;
      if (i < 0) i = 0;
      if (i >= facts.length) {
        i = facts.length - 1;
        stopDeltaWalk();
      }
      deltaCursor = i;
      applyDeltaFactView(facts[i]);
      paint({ animate: "none" });
    }
    function toggleDeltaReview() {
      if (deltaWalk.playing) {
        stopDeltaWalk();
        const facts2 = deltaFacts();
        flashToast("Paused · " + Math.max(deltaCursor, 0) + "/" + facts2.length, "ok");
        return;
      }
      const facts = deltaFacts();
      if (!facts.length) {
        flashToast("No delta facts", "skip");
        return;
      }
      if (deltaCursor >= facts.length - 1) deltaCursor = -1;
      deltaWalk.playing = true;
      flashToast("Review · " + facts.length + " facts", "ok");
      stepDeltaWalk(1);
      if (reduceMotion()) {
        stopDeltaWalk();
        return;
      }
      deltaWalk.timer = setInterval(() => {
        const next = deltaFacts();
        if (deltaCursor >= next.length - 1) {
          stopDeltaWalk();
          flashToast("End · " + next.length + " facts", "ok");
          return;
        }
        stepDeltaWalk(1);
      }, 720);
    }
    function resetDeltaOverview() {
      stopDeltaWalk();
      deltaCursor = -1;
      deltaView = "delta";
      paint({ animate: "none" });
    }
    function deltaGraphPair() {
      const head = snapshot && snapshot.graph || { nodes: [], edges: [] };
      const parent = snapshot && snapshot.delta && snapshot.delta.parent || { nodes: [], edges: [] };
      return { head, parent };
    }
    function deltaNodeState(fqn) {
      const facts = (snapshot && snapshot.delta && snapshot.delta.facts || []).filter((f) => f.fqn === fqn && !f.from_fqn);
      if (facts.some((f) => f.status === "added")) return "added";
      if (facts.some((f) => f.status === "removed")) return "removed";
      if (facts.some((f) => f.status === "moved")) return "moved";
      if (facts.some((f) => f.status === "changed")) return "changed";
      return "same";
    }
    function deltaHopState(fromFqn, toFqn, kind) {
      const facts = snapshot && snapshot.delta && snapshot.delta.facts || [];
      for (const f of facts) {
        if (f.from_fqn === fromFqn && f.to_fqn === toFqn && (!kind || !f.edge_kind || f.edge_kind === kind)) {
          if (f.status === "added" || f.status === "removed" || f.status === "rerouted") return f.status;
        }
      }
      const { head, parent } = deltaGraphPair();
      const inHead = (head.edges || []).some(
        (e) => fqnOf(head, e.from) === fromFqn && fqnOf(head, e.to) === toFqn
      );
      const inParent = (parent.edges || []).some(
        (e) => fqnOf(parent, e.from) === fromFqn && fqnOf(parent, e.to) === toFqn
      );
      if (inHead && !inParent) return "added";
      if (inParent && !inHead) return "removed";
      return "same";
    }
    function renderDeltaCanvas(view, hot) {
      const { head, parent } = deltaGraphPair();
      const src = view === "before" ? parent : view === "after" ? head : null;
      const nodesById = /* @__PURE__ */ new Map();
      const pushNode = (n) => {
        if (!n) return;
        nodesById.set(idVal(n.id), n);
      };
      if (src) {
        (src.nodes || []).forEach(pushNode);
      } else {
        (parent.nodes || []).forEach(pushNode);
        (head.nodes || []).forEach(pushNode);
      }
      const want = /* @__PURE__ */ new Set();
      deltaFacts().forEach((f) => {
        if (f.from_fqn) want.add(f.from_fqn);
        if (f.to_fqn) want.add(f.to_fqn);
        if (f.fqn && !f.from_fqn) want.add(f.fqn);
      });
      let nodes = [...nodesById.values()].filter((n) => !want.size || want.has(n.fqn));
      if (nodes.length < 2) nodes = [...nodesById.values()].slice(0, 16);
      if (nodes.length > 24) nodes = nodes.slice(0, 24);
      if (!nodes.length) {
        return '<div class="empty" id="deltaCanvas">No derived nodes for this reading.</div>';
      }
      const ids = nodes.map((n) => idVal(n.id));
      const idSet = new Set(ids);
      const edgeSrc = view === "before" ? parent.edges || [] : view === "after" ? head.edges || [] : [].concat(parent.edges || [], head.edges || []);
      const seenE = /* @__PURE__ */ new Set();
      const edges = [];
      edgeSrc.forEach((e) => {
        const a = idVal(e.from);
        const b = idVal(e.to);
        if (!idSet.has(a) || !idSet.has(b)) return;
        const k = a + "	" + b + "	" + (e.kind || "");
        if (seenE.has(k)) return;
        seenE.add(k);
        edges.push(e);
      });
      const laid = layeredPositions(ids, edges, {
        nodeW: 176,
        nodeH: 64,
        gapX: 88,
        gapY: 40,
        pad: 40,
        minW: 560,
        minH: 240,
        maxCols: 6,
        pins: /* @__PURE__ */ new Map()
      });
      const W = laid.W;
      const H = laid.H;
      const pos = laid.pos;
      let svg = '<svg class="steiner steiner-edges" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">';
      edges.forEach((e) => {
        const a = pos.get(idVal(e.from));
        const b = pos.get(idVal(e.to));
        if (!a || !b) return;
        const fromN = nodesById.get(idVal(e.from));
        const toN = nodesById.get(idVal(e.to));
        const state = deltaHopState(fromN && fromN.fqn || "", toN && toN.fqn || "", e.kind);
        const hotHop = !!(hot && hot.from_fqn && fromN && toN && hot.from_fqn === fromN.fqn && hot.to_fqn === toN.fqn);
        const d = orthoPath(a, b);
        svg += '<path class="edge-hit" data-from="' + idVal(e.from) + '" data-to="' + idVal(e.to) + '" data-kind="' + esc(e.kind || "") + '" data-delta-state="' + state + (hotHop ? '" data-delta-review-current="1' : "") + '" d="' + d + '" /><path class="edge' + (hotHop ? " walk" : "") + '" data-from="' + idVal(e.from) + '" data-to="' + idVal(e.to) + '" data-kind="' + esc(e.kind || "") + '" data-delta-state="' + state + '" d="' + d + '" />';
      });
      svg += "</svg>";
      let cards = "";
      nodes.forEach((n) => {
        const p = pos.get(idVal(n.id));
        if (!p) return;
        const state = deltaNodeState(n.fqn);
        const hotNode = !!(hot && !hot.from_fqn && hot.fqn === n.fqn);
        cards += '<button type="button" class="vnode ' + kindClass(n.kind) + (hotNode ? " walk" : "") + '" style="left:' + p.x + "px;top:" + p.y + 'px" data-id="' + idVal(n.id) + '" data-fqn="' + esc(n.fqn) + '" data-kind="' + esc(n.kind || "") + '" data-delta-state="' + state + (hotNode ? '" data-delta-review-current="1' : "") + '"><span class="kind">' + esc(n.kind || "node") + '</span><span class="name">' + esc(shortOf(n.fqn)) + '</span><span class="fqn">' + esc(n.fqn) + "</span></button>";
      });
      return '<div id="deltaCanvas" class="delta-canvas" data-delta-view="' + esc(view) + '"><div class="steiner-wrap" style="width:' + W + "px;height:" + H + 'px">' + svg + cards + "</div></div>";
    }
    function renderDeltaBody() {
      const facts = deltaFacts();
      const raw = snapshot && snapshot.delta || {};
      const hasParent = !!(raw.parent && (raw.parent.nodes || []).length);
      if (!facts.length && !hasParent) {
        if (graphFilter.q) {
          return '<div class="empty">No delta facts match “' + esc(graphFilter.q) + "”.</div>";
        }
        return '<div class="empty">No parent cut. Review with a parent root (fixtures/demo vs demo-parent, or git HEAD^) to read Architecture Delta.</div>';
      }
      if (deltaCursor >= facts.length) deltaCursor = facts.length - 1;
      const hot = deltaCursor >= 0 ? facts[deltaCursor] : null;
      const views = [
        ["before", "Before"],
        ["delta", "Delta"],
        ["after", "After"]
      ];
      const switcher = '<div class="outcome-strip" id="deltaView" role="tablist" aria-label="Delta view">' + views.map((pair) => {
        const on = deltaView === pair[0] ? " on" : "";
        return '<button type="button" class="outcome-filter' + on + '" data-delta-view="' + pair[0] + '" aria-selected="' + (deltaView === pair[0] ? "true" : "false") + '">' + pair[1] + "</button>";
      }).join("") + '<span class="outcome-k">' + (raw.added || 0) + " + · " + (raw.removed || 0) + " − · " + (raw.changed || 0) + " ~ · " + (raw.moved || 0) + " ↔ · " + (raw.rerouted || 0) + " ↝</span></div>";
      const review = '<div class="review-strip" id="deltaReview"><button type="button" class="review-step" id="deltaOverview">Overview</button><button type="button" class="review-step" id="deltaPrev">Previous</button><button type="button" class="review-step' + (deltaWalk.playing ? " on" : "") + '" id="deltaPlay" aria-pressed="' + (deltaWalk.playing ? "true" : "false") + '">Review</button><button type="button" class="review-step" id="deltaNext">Next</button><span id="deltaStatus">' + (hot ? deltaCursor + 1 + "/" + facts.length + " · " + deltaMarker(hot.status) + " " + (hot.fqn || "") : facts.length ? facts.length + " facts" : "identical pair") + "</span></div>";
      const list = facts.map((f, i) => {
        return '<article class="delta-fact expl-card ' + esc(f.status || "") + (i === deltaCursor ? " on" : "") + '" data-delta-kind="' + esc(f.status || "") + '" data-delta-class="' + esc(f.class || "") + '" data-fqn="' + esc(f.fqn || "") + '" data-delta-i="' + i + '"><div class="k">' + esc(deltaMarker(f.status) + " " + (f.status || "")) + '</div><div class="t">' + esc((f.subject || "") + " · " + (f.fqn || "")) + '</div><div class="b">' + esc(f.detail || f.class || "") + "</div></article>";
      }).join("");
      return '<div class="delta-page">' + switcher + review + '<div class="ws-split"><div class="ws-list" id="deltaFacts">' + (list || '<div class="empty">No added, removed, changed, moved, or rerouted facts.</div>') + '</div><div class="ws-detail"><div class="k">' + esc(deltaView) + " · derived</div>" + renderDeltaCanvas(deltaView, hot) + "</div></div></div>";
    }
    function bindDeltaPage() {
      canvas.querySelectorAll("[data-delta-view]").forEach((el2) => {
        if (el2.id === "deltaCanvas") return;
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const v = el2.getAttribute("data-delta-view");
          if (v === "before" || v === "delta" || v === "after") {
            deltaView = v;
            paint({ animate: "none" });
          }
        };
      });
      canvas.querySelectorAll("#deltaFacts .delta-fact").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const i = parseInt(el2.getAttribute("data-delta-i"), 10);
          if (!Number.isFinite(i)) return;
          deltaCursor = i;
          applyDeltaFactView(deltaFacts()[i]);
          paint({ animate: "none" });
        };
      });
      const overview = document.getElementById("deltaOverview");
      const prev = document.getElementById("deltaPrev");
      const next = document.getElementById("deltaNext");
      const play = document.getElementById("deltaPlay");
      if (overview) overview.onclick = () => resetDeltaOverview();
      if (prev)
        prev.onclick = () => {
          stopDeltaWalk();
          stepDeltaWalk(deltaCursor < 0 ? 1 : -1);
        };
      if (next)
        next.onclick = () => {
          stopDeltaWalk();
          stepDeltaWalk(1);
        };
      if (play) play.onclick = () => toggleDeltaReview();
    }
    function isInteractionKind(kind) {
      return kind === "Calls" || kind === "Publishes" || kind === "Subscribes" || kind === "Reads" || kind === "Writes";
    }
    function sequenceFlow() {
      const cur = currentFlow();
      if (cur && sequenceOf(cur).hops.length) return cur;
      const story = storyFlow();
      if (story && sequenceOf(story).hops.length) return story;
      for (const f of snapshot && snapshot.flows || []) {
        if (sequenceOf(f).hops.length) return f;
      }
      return cur || story || null;
    }
    function sequenceOf(flow) {
      const ready = flow && flow.sequence;
      if (ready && (ready.participants || []).length && (ready.hops || []).length) {
        return {
          participants: ready.participants.slice(),
          hops: ready.hops.slice()
        };
      }
      return deriveSequence(flow);
    }
    function deriveSequence(flow) {
      const tree = flow && flow.tree || { nodes: [], edges: [] };
      const edges = (tree.edges || []).filter((e) => isInteractionKind(e.kind));
      if (!edges.length) return { participants: [], hops: [] };
      const walk = flowWalk(flow);
      const rank = new Map(walk.map((id, i) => [idVal(id), i]));
      const ordered = edges.slice().sort((a, b) => {
        const af = rank.has(idVal(a.from)) ? rank.get(idVal(a.from)) : 1e9;
        const bf = rank.has(idVal(b.from)) ? rank.get(idVal(b.from)) : 1e9;
        if (af !== bf) return af - bf;
        const at = rank.has(idVal(a.to)) ? rank.get(idVal(a.to)) : 1e9;
        const bt = rank.has(idVal(b.to)) ? rank.get(idVal(b.to)) : 1e9;
        return at - bt;
      });
      const hops = [];
      const seen = /* @__PURE__ */ new Set();
      for (const e of ordered) {
        const key = idVal(e.from) + "\0" + idVal(e.to) + "\0" + (e.kind || "");
        if (seen.has(key)) continue;
        seen.add(key);
        const fromN = nodeById.get(idVal(e.from));
        const toN = nodeById.get(idVal(e.to));
        const fromFqn = fromN && fromN.fqn || idVal(e.from);
        const toFqn = toN && toN.fqn || idVal(e.to);
        const variant = e.kind === "Calls" ? "call" : "default";
        hops.push({
          from: idVal(e.from),
          to: idVal(e.to),
          from_fqn: fromFqn,
          to_fqn: toFqn,
          kind: e.kind,
          variant,
          file: e.span && e.span.file || fromN && fromN.span && fromN.span.file || ""
        });
        if (e.kind === "Calls") {
          hops.push({
            from: idVal(e.to),
            to: idVal(e.from),
            from_fqn: toFqn,
            to_fqn: fromFqn,
            kind: e.kind,
            variant: "return",
            file: e.span && e.span.file || toN && toN.span && toN.span.file || ""
          });
        }
      }
      const participants = [];
      const seenP = /* @__PURE__ */ new Set();
      for (const h of hops) {
        for (const id of [idVal(h.from), idVal(h.to)]) {
          if (seenP.has(id)) continue;
          seenP.add(id);
          const n = nodeById.get(id);
          participants.push({
            id,
            fqn: n && n.fqn || id,
            kind: n && n.kind || "Function",
            file: n && n.span ? n.span.file : ""
          });
        }
      }
      return { participants, hops };
    }
    function seqHops() {
      return sequenceOf(sequenceFlow()).hops;
    }
    function seqParts() {
      return sequenceOf(sequenceFlow()).participants;
    }
    function stopSeqWalk() {
      seqWalk.playing = false;
      if (seqWalk.timer) {
        clearInterval(seqWalk.timer);
        seqWalk.timer = 0;
      }
      const play = document.getElementById("seqPlay");
      if (play) {
        play.classList.remove("on");
        play.setAttribute("aria-pressed", "false");
        play.textContent = "Play";
      }
    }
    function stepSeqWalk(dir) {
      const hops = seqHops();
      if (!hops.length) return;
      let i = seqCursor + dir;
      if (i < 0) i = 0;
      if (i >= hops.length) {
        i = hops.length - 1;
        stopSeqWalk();
      }
      seqCursor = i;
      paint({ animate: "none" });
      focusSeqHop(hops[i]);
    }
    function toggleSeqReview() {
      if (seqWalk.playing) {
        stopSeqWalk();
        const hops2 = seqHops();
        flashToast("Paused · " + Math.max(seqCursor, 0) + "/" + hops2.length, "ok");
        return;
      }
      const hops = seqHops();
      if (!hops.length) {
        flashToast("No derived call hops on this flow", "skip");
        return;
      }
      if (seqCursor >= hops.length - 1) seqCursor = -1;
      seqWalk.playing = true;
      flashToast("Walking callers → callees", "ok");
      stepSeqWalk(1);
      if (reduceMotion()) {
        stopSeqWalk();
        return;
      }
      seqWalk.timer = setInterval(() => {
        const next = seqHops();
        if (seqCursor >= next.length - 1) {
          stopSeqWalk();
          flashToast("End · sequence", "ok");
          return;
        }
        stepSeqWalk(1);
      }, 720);
    }
    function resetSeqOverview() {
      stopSeqWalk();
      seqCursor = -1;
      paint({ animate: "none" });
    }
    function focusSeqHop(hop) {
      if (!hop) return;
      const id = hop.variant === "return" ? hop.to : hop.from;
      if (id) {
        selectedNodeId = idVal(id);
        peekSource(id);
      }
      showHop(idVal(hop.from), idVal(hop.to), hop.kind);
    }
    function seqVariantMark(v) {
      if (v === "return") return "←";
      if (v === "call") return "→";
      return "·";
    }
    function renderSequenceBody() {
      const flow = sequenceFlow();
      const reading = sequenceOf(flow);
      const parts = reading.participants;
      const hops = reading.hops;
      if (graphFilter.q) {
        const q = graphFilter.q.toLowerCase();
        const hit = (s) => String(s || "").toLowerCase().indexOf(q) >= 0;
        const keepP = parts.filter((p) => hit(p.fqn) || hit(p.kind) || hit(p.file));
        const keepH = hops.filter((h) => hit(h.from_fqn) || hit(h.to_fqn) || hit(h.kind) || hit(h.variant));
        if (!keepP.length && !keepH.length) {
          return '<div class="empty">No sequence hops match “' + esc(graphFilter.q) + "”.</div>";
        }
      }
      if (!parts.length || !hops.length) {
        return '<div class="empty">No Steiner Calls (or Publishes / Subscribes) on this flow. Sequence reads derived interaction only.</div>';
      }
      if (seqCursor >= hops.length) seqCursor = hops.length - 1;
      const hot = seqCursor >= 0 ? hops[seqCursor] : null;
      const review = '<div class="review-strip" id="seqReview"><button type="button" class="review-step" id="seqOverview">Overview</button><button type="button" class="review-step" id="seqPrev">Prev</button><button type="button" class="review-step' + (seqWalk.playing ? " on" : "") + '" id="seqPlay" aria-pressed="' + (seqWalk.playing ? "true" : "false") + '">Play</button><button type="button" class="review-step" id="seqNext">Next</button><span id="seqStatus">' + (hot ? seqCursor + 1 + "/" + hops.length + " · " + (hot.kind || "") + " " + shortOf(hot.from_fqn) + " → " + shortOf(hot.to_fqn) : hops.length + " hops · " + (flow && flow.name ? flow.name : "flow")) + "</span></div>";
      const heads = parts.map((p) => {
        const on = hot && (idVal(hot.from) === idVal(p.id) || idVal(hot.to) === idVal(p.id));
        return '<button type="button" class="seq-part vnode kind-' + esc(p.kind || "Function") + (on ? " on" : "") + '" data-id="' + esc(idVal(p.id)) + '" data-fqn="' + esc(p.fqn) + '" data-kind="' + esc(p.kind || "") + '"><span class="name">' + esc(shortOf(p.fqn)) + '</span> <span class="meta">' + esc(p.kind || "") + "</span></button>";
      }).join("");
      const colOf = new Map(parts.map((p, i) => [idVal(p.id), i]));
      const rows = hops.map((h, i) => {
        const a = colOf.has(idVal(h.from)) ? colOf.get(idVal(h.from)) : 0;
        const b = colOf.has(idVal(h.to)) ? colOf.get(idVal(h.to)) : 0;
        const lo = Math.min(a, b) + 1;
        const hi = Math.max(a, b) + 1;
        const self = a === b;
        const back = h.variant === "return" || a > b;
        return '<div class="seq-row' + (i === seqCursor ? " on" : "") + (back ? " ret" : "") + '" data-seq-i="' + i + '" data-kind="' + esc(h.kind || "") + '" data-seq-variant="' + esc(h.variant || "default") + '" data-from="' + esc(idVal(h.from)) + '" data-to="' + esc(idVal(h.to)) + '"><span class="seq-msg" style="grid-column:' + (self ? lo + " / " + (lo + 1) : lo + " / " + (hi + 1)) + '">' + esc((h.kind || "") + (h.variant === "return" ? " return" : "")) + " " + esc(shortOf(h.from_fqn)) + (back ? " ← " : " → ") + esc(shortOf(h.to_fqn)) + "</span></div>";
      }).join("");
      const list = hops.map((h, i) => {
        return '<article class="seq-hop expl-card' + (i === seqCursor ? " on" : "") + '" data-seq-i="' + i + '" data-kind="' + esc(h.kind || "") + '" data-seq-variant="' + esc(h.variant || "default") + '" data-from="' + esc(idVal(h.from)) + '" data-to="' + esc(idVal(h.to)) + '" data-fqn="' + esc(h.from_fqn) + '"><div class="k">' + esc(seqVariantMark(h.variant) + " " + (h.kind || "") + (h.variant === "return" ? " return" : "")) + '</div><div class="t">' + esc(shortOf(h.from_fqn) + " → " + shortOf(h.to_fqn)) + '</div><div class="b">' + esc((h.from_fqn || "") + (h.file ? " · " + h.file : "")) + "</div></article>";
      }).join("");
      return '<div class="seq-page">' + review + '<div class="seq-parts" id="seqParts" style="--seq-n:' + parts.length + '">' + heads + '</div><div class="ws-split"><div class="ws-list" id="seqHops">' + list + '</div><div class="ws-detail"><div class="k">' + esc(flow && flow.name || "flow") + ' · Steiner</div><div id="seqCanvas" class="seq-canvas" style="--seq-n:' + parts.length + '"><div class="seq-rows" style="grid-template-columns:repeat(' + parts.length + ',minmax(72px,1fr))">' + rows + "</div></div></div></div></div>";
    }
    function bindSequencePage() {
      canvas.querySelectorAll("#seqHops .seq-hop, #seqCanvas .seq-row").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const i = parseInt(el2.getAttribute("data-seq-i"), 10);
          if (!Number.isFinite(i)) return;
          stopSeqWalk();
          seqCursor = i;
          paint({ animate: "none" });
          focusSeqHop(seqHops()[i]);
        };
      });
      canvas.querySelectorAll("#seqParts .seq-part, #seqCanvas .seq-part").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const id = el2.getAttribute("data-id");
          if (id) {
            selectedNodeId = id;
            peekSource(id);
          }
        };
      });
      const overview = document.getElementById("seqOverview");
      const prev = document.getElementById("seqPrev");
      const next = document.getElementById("seqNext");
      const play = document.getElementById("seqPlay");
      if (overview) overview.onclick = () => resetSeqOverview();
      if (prev)
        prev.onclick = () => {
          stopSeqWalk();
          stepSeqWalk(seqCursor < 0 ? 1 : -1);
        };
      if (next)
        next.onclick = () => {
          stopSeqWalk();
          stepSeqWalk(1);
        };
      if (play) play.onclick = () => toggleSeqReview();
    }
    function isDataKind(kind) {
      return kind === "Reads" || kind === "Writes" || kind === "Publishes" || kind === "Subscribes";
    }
    function dataReverses(kind) {
      return kind === "Reads" || kind === "Subscribes";
    }
    function dataflowFlow() {
      const cur = currentFlow();
      if (cur && dataflowOf(cur).hops.length) return cur;
      const named = (snapshot && snapshot.flows || []).find((f) => f && f.name === "data-subscription");
      if (named && dataflowOf(named).hops.length) return named;
      const story = storyFlow();
      if (story && dataflowOf(story).hops.length) return story;
      for (const f of snapshot && snapshot.flows || []) {
        if (dataflowOf(f).hops.length) return f;
      }
      return cur || story || named || null;
    }
    function dataflowOf(flow) {
      const ready = flow && flow.dataflow;
      if (ready && (ready.nodes || []).length && (ready.hops || []).length) {
        return {
          nodes: ready.nodes.slice(),
          hops: ready.hops.slice()
        };
      }
      return deriveDataflow(flow);
    }
    function deriveDataflow(flow) {
      const tree = flow && flow.tree || { nodes: [], edges: [] };
      const treeIds = new Set((tree.nodes || []).map(idVal));
      const graphEdges = (snapshot && snapshot.graph && snapshot.graph.edges || []).concat(tree.edges || []);
      const endpoints = /* @__PURE__ */ new Set();
      treeIds.forEach((id) => {
        const n = nodeById.get(id);
        if (n && n.kind === "Endpoint") endpoints.add(id);
      });
      const seen = /* @__PURE__ */ new Set();
      const edges = [];
      const consider = (e) => {
        if (!e || !isDataKind(e.kind)) return;
        const key = idVal(e.from) + "\0" + idVal(e.to) + "\0" + e.kind;
        if (seen.has(key)) return;
        const onTree = (tree.edges || []).some(
          (t) => idVal(t.from) === idVal(e.from) && idVal(t.to) === idVal(e.to) && t.kind === e.kind
        );
        const bus = endpoints.has(idVal(e.from)) || endpoints.has(idVal(e.to));
        if (!onTree && !bus) return;
        seen.add(key);
        edges.push(e);
      };
      (tree.edges || []).forEach(consider);
      graphEdges.forEach(consider);
      if (!edges.length) return { nodes: [], hops: [] };
      const walk = flowWalk(flow);
      const rank = new Map(walk.map((id, i) => [idVal(id), i]));
      const ordered = edges.slice().sort((a, b) => {
        const aEnds = dataReverses(a.kind) ? [idVal(a.to), idVal(a.from)] : [idVal(a.from), idVal(a.to)];
        const bEnds = dataReverses(b.kind) ? [idVal(b.to), idVal(b.from)] : [idVal(b.from), idVal(b.to)];
        const af = rank.has(aEnds[0]) ? rank.get(aEnds[0]) : 1e9;
        const bf = rank.has(bEnds[0]) ? rank.get(bEnds[0]) : 1e9;
        if (af !== bf) return af - bf;
        const at = rank.has(aEnds[1]) ? rank.get(aEnds[1]) : 1e9;
        const bt = rank.has(bEnds[1]) ? rank.get(bEnds[1]) : 1e9;
        return at - bt;
      });
      const hops = [];
      for (const e of ordered) {
        const rev = dataReverses(e.kind);
        const from = idVal(rev ? e.to : e.from);
        const to = idVal(rev ? e.from : e.to);
        const fromN = nodeById.get(from);
        const toN = nodeById.get(to);
        hops.push({
          from,
          to,
          from_fqn: fromN && fromN.fqn || from,
          to_fqn: toN && toN.fqn || to,
          kind: e.kind,
          file: e.span && e.span.file || fromN && fromN.span && fromN.span.file || ""
        });
      }
      const incoming = /* @__PURE__ */ new Map();
      const outgoing = /* @__PURE__ */ new Map();
      const order = [];
      const seenN = /* @__PURE__ */ new Set();
      for (const h of hops) {
        outgoing.set(h.from, (outgoing.get(h.from) || 0) + 1);
        incoming.set(h.to, (incoming.get(h.to) || 0) + 1);
        for (const id of [h.from, h.to]) {
          if (seenN.has(id)) continue;
          seenN.add(id);
          order.push(id);
        }
      }
      const nodes = order.map((id) => {
        const n = nodeById.get(id);
        const ep = n && n.endpoint ? n.endpoint : null;
        const inn = incoming.get(id) || 0;
        const out = outgoing.get(id) || 0;
        return {
          id,
          fqn: n && n.fqn || id,
          kind: n && n.kind || "Function",
          role: classifyDfRole(n && n.kind || "Function", ep, inn, out),
          end_role: ep && ep.role ? ep.role : "",
          channel: ep && ep.channel ? ep.channel : "",
          file: n && n.span ? n.span.file : ""
        };
      });
      return { nodes, hops };
    }
    function classifyDfRole(kind, ep, incoming, outgoing) {
      const channel = ep && ep.channel ? ep.channel : "";
      const endRole = ep && ep.role ? ep.role : "";
      if (incoming > 0 && outgoing > 0) {
        if (kind === "Endpoint" || channel === "Queue" || channel === "Table" || channel === "Channel") {
          return "store";
        }
        return "transform";
      }
      if (outgoing > 0 && incoming === 0) return "source";
      if (incoming > 0 && outgoing === 0) return "sink";
      if (endRole === "Source") return "source";
      if (endRole === "Sink") return "sink";
      return kind === "Endpoint" ? "store" : "transform";
    }
    function dfHops() {
      return dataflowOf(dataflowFlow()).hops;
    }
    function dfNodes() {
      return dataflowOf(dataflowFlow()).nodes;
    }
    function stopDfWalk() {
      dfWalk.playing = false;
      if (dfWalk.timer) {
        clearInterval(dfWalk.timer);
        dfWalk.timer = 0;
      }
      const play = document.getElementById("dfPlay");
      if (play) {
        play.classList.remove("on");
        play.setAttribute("aria-pressed", "false");
        play.textContent = "Play";
      }
    }
    function stepDfWalk(dir) {
      const hops = dfHops();
      if (!hops.length) return;
      let i = dfCursor + dir;
      if (i < 0) i = 0;
      if (i >= hops.length) {
        i = hops.length - 1;
        stopDfWalk();
      }
      dfCursor = i;
      paint({ animate: "none" });
      focusDfHop(hops[i]);
    }
    function toggleDfReview() {
      if (dfWalk.playing) {
        stopDfWalk();
        const hops2 = dfHops();
        flashToast("Paused · " + Math.max(dfCursor, 0) + "/" + hops2.length, "ok");
        return;
      }
      const hops = dfHops();
      if (!hops.length) {
        flashToast("No derived data hops on this flow", "skip");
        return;
      }
      if (dfCursor >= hops.length - 1) dfCursor = -1;
      dfWalk.playing = true;
      flashToast("Walking sources → sinks", "ok");
      stepDfWalk(1);
      if (reduceMotion()) {
        stopDfWalk();
        return;
      }
      dfWalk.timer = setInterval(() => {
        const next = dfHops();
        if (dfCursor >= next.length - 1) {
          stopDfWalk();
          flashToast("End · data-flow", "ok");
          return;
        }
        stepDfWalk(1);
      }, 720);
    }
    function resetDfOverview() {
      stopDfWalk();
      dfCursor = -1;
      paint({ animate: "none" });
    }
    function focusDfHop(hop) {
      if (!hop) return;
      if (hop.from) {
        selectedNodeId = idVal(hop.from);
        peekSource(hop.from);
      }
      showHop(idVal(hop.from), idVal(hop.to), hop.kind);
    }
    function dfRoleLabel(role) {
      if (role === "source") return "Sources";
      if (role === "transform") return "Transforms";
      if (role === "store") return "Stores";
      return "Sinks";
    }
    function renderDataflowBody() {
      const flow = dataflowFlow();
      const reading = dataflowOf(flow);
      const nodes = reading.nodes;
      const hops = reading.hops;
      if (graphFilter.q) {
        const q = graphFilter.q.toLowerCase();
        const hit = (s) => String(s || "").toLowerCase().indexOf(q) >= 0;
        const keepN = nodes.filter((n) => hit(n.fqn) || hit(n.kind) || hit(n.role) || hit(n.end_role));
        const keepH = hops.filter((h) => hit(h.from_fqn) || hit(h.to_fqn) || hit(h.kind));
        if (!keepN.length && !keepH.length) {
          return '<div class="empty">No data-flow hops match “' + esc(graphFilter.q) + "”.</div>";
        }
      }
      if (!nodes.length || !hops.length) {
        return '<div class="empty">No Steiner Reads / Writes / Publishes / Subscribes on this flow. Data-flow reads derived movement only.</div>';
      }
      if (dfCursor >= hops.length) dfCursor = hops.length - 1;
      const hot = dfCursor >= 0 ? hops[dfCursor] : null;
      const review = '<div class="review-strip" id="dfReview"><button type="button" class="review-step" id="dfOverview">Overview</button><button type="button" class="review-step" id="dfPrev">Prev</button><button type="button" class="review-step' + (dfWalk.playing ? " on" : "") + '" id="dfPlay" aria-pressed="' + (dfWalk.playing ? "true" : "false") + '">Play</button><button type="button" class="review-step" id="dfNext">Next</button><span id="dfStatus">' + (hot ? dfCursor + 1 + "/" + hops.length + " · " + (hot.kind || "") + " " + shortOf(hot.from_fqn) + " → " + shortOf(hot.to_fqn) : hops.length + " hops · " + (flow && flow.name ? flow.name : "flow")) + "</span></div>";
      const stages = ["source", "transform", "store", "sink"].filter((role) => nodes.some((n) => n.role === role));
      const stageCols = stages.map((role) => {
        const col = nodes.filter((n) => n.role === role);
        const cards = col.map((n) => {
          const on = hot && (idVal(hot.from) === idVal(n.id) || idVal(hot.to) === idVal(n.id));
          const ep = n.end_role || n.channel ? [n.end_role, n.channel].filter(Boolean).join(" · ") : "";
          return '<button type="button" class="df-node vnode kind-' + esc(n.kind || "Function") + (on ? " on" : "") + '" data-id="' + esc(idVal(n.id)) + '" data-fqn="' + esc(n.fqn) + '" data-kind="' + esc(n.kind || "") + '" data-df-role="' + esc(n.role) + '"' + (n.end_role ? ' data-end-role="' + esc(n.end_role) + '"' : "") + (n.channel ? ' data-channel="' + esc(n.channel) + '"' : "") + '><span class="name">' + esc(shortOf(n.fqn)) + '</span> <span class="meta">' + esc(n.kind || "") + (ep ? " · " + esc(ep) : "") + "</span></button>";
        }).join("");
        return '<div class="df-stage" data-df-role="' + role + '"><div class="k">' + esc(dfRoleLabel(role)) + "</div>" + cards + "</div>";
      }).join("");
      const list = hops.map((h, i) => {
        return '<article class="df-hop expl-card' + (i === dfCursor ? " on" : "") + '" data-df-i="' + i + '" data-kind="' + esc(h.kind || "") + '" data-from="' + esc(idVal(h.from)) + '" data-to="' + esc(idVal(h.to)) + '" data-fqn="' + esc(h.from_fqn) + '"><div class="k">' + esc(h.kind || "") + '</div><div class="t">' + esc(shortOf(h.from_fqn) + " → " + shortOf(h.to_fqn)) + '</div><div class="b">' + esc((h.from_fqn || "") + (h.file ? " · " + h.file : "")) + "</div></article>";
      }).join("");
      return '<div class="df-page">' + review + '<div class="ws-split"><div class="ws-list" id="dfHops">' + list + '</div><div class="ws-detail"><div class="k">' + esc(flow && flow.name || "flow") + ' · pipeline</div><div id="dfCanvas" class="df-canvas"><div class="df-stages" id="dfStages" style="--df-n:' + stages.length + '">' + stageCols + "</div></div></div></div></div>";
    }
    function bindDataflowPage() {
      canvas.querySelectorAll("#dfHops .df-hop").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const i = parseInt(el2.getAttribute("data-df-i"), 10);
          if (!Number.isFinite(i)) return;
          stopDfWalk();
          dfCursor = i;
          paint({ animate: "none" });
          focusDfHop(dfHops()[i]);
        };
      });
      canvas.querySelectorAll("#dfStages .df-node, #dfCanvas .df-node").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const id = el2.getAttribute("data-id");
          if (id) {
            selectedNodeId = id;
            peekSource(id);
          }
        };
      });
      const overview = document.getElementById("dfOverview");
      const prev = document.getElementById("dfPrev");
      const next = document.getElementById("dfNext");
      const play = document.getElementById("dfPlay");
      if (overview) overview.onclick = () => resetDfOverview();
      if (prev)
        prev.onclick = () => {
          stopDfWalk();
          stepDfWalk(dfCursor < 0 ? 1 : -1);
        };
      if (next)
        next.onclick = () => {
          stopDfWalk();
          stepDfWalk(1);
        };
      if (play) play.onclick = () => toggleDfReview();
    }
    function lifecycleFlow() {
      const cur = currentFlow();
      if (cur && lifecycleOf(cur).transitions.length) return cur;
      const named = (snapshot && snapshot.flows || []).find((f) => f && f.name === "data-subscription");
      if (named && lifecycleOf(named).transitions.length) return named;
      const story = storyFlow();
      if (story && lifecycleOf(story).transitions.length) return story;
      for (const f of snapshot && snapshot.flows || []) {
        if (lifecycleOf(f).transitions.length) return f;
      }
      return cur || story || named || null;
    }
    function lifecycleOf(flow) {
      const ready = flow && flow.lifecycle;
      if (ready && (ready.states || []).length && (ready.transitions || []).length) {
        return {
          lanes: (ready.lanes || []).slice(),
          states: ready.states.slice(),
          transitions: ready.transitions.slice(),
          endpoints: (ready.endpoints || []).slice()
        };
      }
      return deriveLifecycle(flow);
    }
    function deriveLifecycle(flow) {
      if (!flow) return { lanes: [], states: [], transitions: [], endpoints: [] };
      const tree = flow.tree || { nodes: [], edges: [] };
      const hops = (tree.edges || []).length;
      const walkingSub = hops === 0 ? "" : hops === 1 ? "1 hop" : hops + " hops";
      const ends = [];
      const seen = /* @__PURE__ */ new Set();
      for (const id of tree.nodes || []) {
        const key = idVal(id);
        if (seen.has(key)) continue;
        seen.add(key);
        const n = nodeById.get(key);
        if (!n || n.kind !== "Type" && n.kind !== "Endpoint") continue;
        ends.push({
          id: key,
          fqn: n.fqn || key,
          kind: n.kind,
          file: n.span ? n.span.file : ""
        });
      }
      ends.sort((a, b) => String(a.fqn).localeCompare(String(b.fqn)));
      return {
        lanes: [
          { id: "main", label: "Review" },
          { id: "events", label: "Wait / retry" },
          { id: "terminal", label: "Outcomes" }
        ],
        states: [
          { id: "proposed", type: "start", label: "Proposed", lane: "main", col: 0 },
          { id: "walking", type: "active", label: "Walking", sublabel: walkingSub, lane: "main", col: 1 },
          { id: "waiting", type: "waiting", label: "Waiting", sublabel: "stamp / skip", lane: "events", col: 0 },
          { id: "stamped", type: "success", label: "Stamped", lane: "terminal", col: 0 },
          { id: "skipped", type: "neutral", label: "Skipped", lane: "terminal", col: 1 },
          { id: "broken", type: "failure", label: "Broken", lane: "events", col: 1 }
        ],
        transitions: [
          { from: "proposed", to: "walking", label: "play" },
          { from: "walking", to: "waiting", label: "wait" },
          { from: "waiting", to: "stamped", label: "stamp" },
          { from: "waiting", to: "skipped", label: "skip" },
          { from: "stamped", to: "broken", label: "break" },
          { from: "broken", to: "walking", label: "recover" }
        ],
        endpoints: ends
      };
    }
    function lcTrans() {
      return lifecycleOf(lifecycleFlow()).transitions;
    }
    function lcStates() {
      return lifecycleOf(lifecycleFlow()).states;
    }
    function lcCurrentId(flow) {
      const mark = flowMark(flow && flow.name);
      if (mark === "holds") return "stamped";
      if (mark === "skipped") return "skipped";
      if (mark === "broken") return "broken";
      return "proposed";
    }
    function stopLcWalk() {
      lcWalk.playing = false;
      if (lcWalk.timer) {
        clearInterval(lcWalk.timer);
        lcWalk.timer = 0;
      }
      const play = document.getElementById("lcPlay");
      if (play) {
        play.classList.remove("on");
        play.setAttribute("aria-pressed", "false");
        play.textContent = "Play";
      }
    }
    function stepLcWalk(dir) {
      const hops = lcTrans();
      if (!hops.length) return;
      let i = lcCursor + dir;
      if (i < 0) i = 0;
      if (i >= hops.length) {
        i = hops.length - 1;
        stopLcWalk();
      }
      lcCursor = i;
      paint({ animate: "none" });
      focusLcTrans(hops[i]);
    }
    function toggleLcReview() {
      if (lcWalk.playing) {
        stopLcWalk();
        const hops2 = lcTrans();
        flashToast("Paused · " + Math.max(lcCursor, 0) + "/" + hops2.length, "ok");
        return;
      }
      const hops = lcTrans();
      if (!hops.length) {
        flashToast("No derived review machine on this flow", "skip");
        return;
      }
      if (lcCursor >= hops.length - 1) lcCursor = -1;
      lcWalk.playing = true;
      flashToast("Walking review states", "ok");
      stepLcWalk(1);
      if (reduceMotion()) {
        stopLcWalk();
        return;
      }
      lcWalk.timer = setInterval(() => {
        const next = lcTrans();
        if (lcCursor >= next.length - 1) {
          stopLcWalk();
          flashToast("End · lifecycle", "ok");
          return;
        }
        stepLcWalk(1);
      }, 720);
    }
    function resetLcOverview() {
      stopLcWalk();
      lcCursor = -1;
      paint({ animate: "none" });
    }
    function focusLcTrans(hop) {
      if (!hop) return;
      const status2 = document.getElementById("lcStatus");
      if (status2) {
        status2.textContent = lcCursor + 1 + "/" + lcTrans().length + " · " + (hop.label || "") + " " + hop.from + " → " + hop.to;
      }
    }
    function lcStateKind(s) {
      return s.type || s.kind || "neutral";
    }
    function renderLifecycleBody() {
      const flow = lifecycleFlow();
      const reading = lifecycleOf(flow);
      const states = reading.states;
      const hops = reading.transitions;
      const ends = reading.endpoints;
      const lanes = reading.lanes;
      if (graphFilter.q) {
        const q = graphFilter.q.toLowerCase();
        const hit = (s) => String(s || "").toLowerCase().indexOf(q) >= 0;
        const keepS = states.filter((s) => hit(s.id) || hit(s.label) || hit(lcStateKind(s)) || hit(s.lane));
        const keepT = hops.filter((h) => hit(h.from) || hit(h.to) || hit(h.label));
        const keepE = ends.filter((e) => hit(e.fqn) || hit(e.kind));
        if (!keepS.length && !keepT.length && !keepE.length) {
          return '<div class="empty">No lifecycle states match “' + esc(graphFilter.q) + "”.</div>";
        }
      }
      if (!states.length || !hops.length) {
        return '<div class="empty">No derived review machine on this flow. Lifecycle does not invent AST match/enum states.</div>';
      }
      if (lcCursor >= hops.length) lcCursor = hops.length - 1;
      const hot = lcCursor >= 0 ? hops[lcCursor] : null;
      const now = hot ? hot.to : lcCurrentId(flow);
      const review = '<div class="review-strip" id="lcReview"><button type="button" class="review-step" id="lcOverview">Overview</button><button type="button" class="review-step" id="lcPrev">Prev</button><button type="button" class="review-step' + (lcWalk.playing ? " on" : "") + '" id="lcPlay" aria-pressed="' + (lcWalk.playing ? "true" : "false") + '">Play</button><button type="button" class="review-step" id="lcNext">Next</button><span id="lcStatus">' + (hot ? lcCursor + 1 + "/" + hops.length + " · " + (hot.label || "") + " " + hot.from + " → " + hot.to : hops.length + " events · " + (flow && flow.name ? flow.name : "flow") + " · " + now) + "</span></div>";
      const laneCols = lanes.map((lane) => {
        const col = states.filter((s) => s.lane === lane.id).slice().sort((a, b) => (a.col || 0) - (b.col || 0));
        const cards = col.map((s) => {
          const kind = lcStateKind(s);
          const on = now === s.id || hot && (hot.from === s.id || hot.to === s.id);
          return '<button type="button" class="lc-state vnode' + (on ? " on" : "") + '" data-lc-id="' + esc(s.id) + '" data-lc-type="' + esc(kind) + '" data-lc-lane="' + esc(s.lane) + '" data-lc-col="' + esc(String(s.col == null ? 0 : s.col)) + '"><span class="name">' + esc(s.label || s.id) + '</span> <span class="meta">' + esc(kind + (s.sublabel ? " · " + s.sublabel : "")) + "</span></button>";
        }).join("");
        return '<div class="lc-lane" data-lc-lane="' + esc(lane.id) + '"><div class="k">' + esc(lane.label || lane.id) + "</div>" + cards + "</div>";
      }).join("");
      const list = hops.map((h, i) => {
        return '<article class="lc-trans expl-card' + (i === lcCursor ? " on" : "") + '" data-lc-i="' + i + '" data-from="' + esc(h.from) + '" data-to="' + esc(h.to) + '" data-lc-event="' + esc(h.label || "") + '"><div class="k">' + esc(h.label || "event") + '</div><div class="t">' + esc(h.from + " → " + h.to) + "</div></article>";
      }).join("");
      const endCards = ends.map((e) => {
        return '<button type="button" class="lc-end vnode kind-' + esc(e.kind || "Type") + '" data-id="' + esc(idVal(e.id)) + '" data-fqn="' + esc(e.fqn) + '" data-kind="' + esc(e.kind || "") + '"><span class="name">' + esc(shortOf(e.fqn)) + '</span> <span class="meta">' + esc(e.kind || "") + "</span></button>";
      }).join("");
      const endsBlock = ends.length ? '<div class="k">plugin Type / Endpoint</div><div id="lcEnds" class="lc-ends">' + endCards + "</div>" : "";
      return '<div class="lc-page">' + review + '<div class="ws-split"><div class="ws-list" id="lcTrans">' + list + '</div><div class="ws-detail"><div class="k">' + esc(flow && flow.name || "flow") + ' · review machine</div><div id="lcCanvas" class="lc-canvas"><div class="lc-lanes" id="lcLanes" style="--lc-n:' + lanes.length + '">' + laneCols + "</div>" + endsBlock + "</div></div></div></div>";
    }
    function bindLifecyclePage() {
      canvas.querySelectorAll("#lcTrans .lc-trans").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const i = parseInt(el2.getAttribute("data-lc-i"), 10);
          if (!Number.isFinite(i)) return;
          stopLcWalk();
          lcCursor = i;
          paint({ animate: "none" });
          focusLcTrans(lcTrans()[i]);
        };
      });
      canvas.querySelectorAll("#lcCanvas .lc-state").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const id = el2.getAttribute("data-lc-id");
          const hops = lcTrans();
          const i = hops.findIndex((h) => h.to === id || h.from === id);
          if (i >= 0) {
            stopLcWalk();
            lcCursor = i;
            paint({ animate: "none" });
            focusLcTrans(hops[i]);
          }
        };
      });
      canvas.querySelectorAll("#lcEnds .lc-end").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const id = el2.getAttribute("data-id");
          if (id) {
            selectedNodeId = id;
            peekSource(id);
          }
        };
      });
      const overview = document.getElementById("lcOverview");
      const prev = document.getElementById("lcPrev");
      const next = document.getElementById("lcNext");
      const play = document.getElementById("lcPlay");
      if (overview) overview.onclick = () => resetLcOverview();
      if (prev)
        prev.onclick = () => {
          stopLcWalk();
          stepLcWalk(lcCursor < 0 ? 1 : -1);
        };
      if (next)
        next.onclick = () => {
          stopLcWalk();
          stepLcWalk(1);
        };
      if (play) play.onclick = () => toggleLcReview();
    }
    function countMap(items, keyFn) {
      const m = /* @__PURE__ */ new Map();
      for (const x of items || []) {
        const k = keyFn(x) || "—";
        m.set(k, (m.get(k) || 0) + 1);
      }
      return m;
    }
    function statChips(map) {
      return [...map.entries()].sort((a, b) => b[1] - a[1]).map((e) => '<span class="stat-chip"><b>' + esc(e[0]) + "</b> " + e[1] + "</span>").join("");
    }
    function renderExplorerList(ws) {
      renderTabs(snapshot.flows || [], currentFlow() && currentFlow().name);
      renderStats(snapshot);
      renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph);
      setGraphChrome(true);
      setZoomUi(false);
      hideTip();
      setLedgerHead(ws.toUpperCase());
      if (stampBtn) stampBtn.disabled = !currentFlow();
      if (skipBtn) skipBtn.disabled = !currentFlow();
      const titles = {
        decisions: "Decisions — stamps, skips, and broken attestations",
        registry: "Registry — audit of this review snapshot",
        overview: "Overview — default run and control-flow graph",
        timeline: "Timeline — parent cut, coverage, stamp scars",
        delta: "Delta — derived parent vs head",
        sequence: "Sequence — callers, callees, returns on this flow",
        dataflow: "Data-flow — sources, transforms, stores, sinks on this flow",
        lifecycle: "Lifecycle — review states, waits, terminals on this flow"
      };
      setMeta(
        '<span class="crumb">Review</span> / <b>' + esc(ws) + "</b> · " + esc(titles[ws] || ws)
      );
      let html = "";
      if (ws === "overview") html = renderOverviewBody();
      else if (ws === "decisions") html = renderDecisionBody();
      else if (ws === "registry") html = renderRegistryBody();
      else if (ws === "delta") html = renderDeltaBody();
      else if (ws === "sequence") html = renderSequenceBody();
      else if (ws === "dataflow") html = renderDataflowBody();
      else if (ws === "lifecycle") html = renderLifecycleBody();
      else html = renderTimelineBody();
      canvas.className = ws === "overview" ? "play has-stage explorer-list" : "play explorer-list";
      canvas.innerHTML = '<div class="expl-wrap"><div class="flow-title">' + esc(titles[ws] || ws) + "</div>" + html + "</div>";
      if (ws === "overview") {
        const stage = canvas.querySelector(".stage");
        if (stage) {
          bindStage(stage, { reset: true });
          setZoomUi(true);
        } else {
          setZoomUi(false);
        }
        bindGraphFx();
        applyEgoPaint();
        const flow = defaultRunFlow();
        const treeIds = (flow && flow.tree && flow.tree.nodes || []).map((id) => nodeById.get(idVal(id)) || { id, kind: kindOf(snapshot.graph, id), fqn: fqnOf(snapshot.graph, id) });
        if (treeIds.length) renderLedger(treeIds, { selected: selectedNodeId, onTree: new Set((flow.tree.nodes || []).map(idVal)) });
        setLedgerHead("RUN");
      }
      canvas.querySelectorAll("[data-decision]").forEach((el2) => {
        el2.onclick = () => {
          selectedDecisionKey = el2.getAttribute("data-decision") || "";
          paint({ animate: "none" });
        };
      });
      canvas.querySelectorAll("[data-open-slice]").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          const name = el2.getAttribute("data-open-slice");
          if (!name) return;
          explorerWs = "slice";
          explorerPinned = true;
          selectFlow(name);
        };
      });
      canvas.querySelectorAll(".chain-step[data-from][data-to]").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          showHop(el2.getAttribute("data-from"), el2.getAttribute("data-to"), el2.getAttribute("data-kind"));
        };
      });
      canvas.querySelectorAll("[data-flow]").forEach((el2) => {
        el2.onclick = () => {
          const name = el2.getAttribute("data-flow");
          if (!name) return;
          explorerWs = "slice";
          explorerPinned = true;
          selectFlow(name);
        };
      });
      canvas.querySelectorAll("[data-id]").forEach((el2) => {
        el2.onclick = () => {
          explorerWs = "lineage";
          explorerPinned = true;
          selectNode(el2.getAttribute("data-id"));
          paint({ animate: "none" });
        };
      });
      canvas.querySelectorAll("[data-ws]").forEach((el2) => {
        el2.onclick = () => setWorkspace(el2.getAttribute("data-ws"), true);
      });
      canvas.querySelectorAll("[data-feature]").forEach((el2) => {
        el2.onclick = () => {
          stopPathWalk();
          graphFilter.bubble = el2.getAttribute("data-feature");
          selectedNodeId = null;
          explorerWs = "map";
          explorerPinned = true;
          renderProgramOverview();
        };
      });
      canvas.querySelectorAll(".feature-path [data-hop]").forEach((el2) => {
        el2.onclick = () => {
          stopPathWalk();
          const id = el2.getAttribute("data-hop");
          const stops = pathWalkStops();
          const idx = stops.findIndex((s) => idVal(s.id) === idVal(id));
          if (idx >= 0) pathWalk.i = idx;
          applyPathWalkPaint();
          focusWalkStop(stops[idx] || { id, kind: "hop" });
        };
      });
      bindPathWalk();
      bindWorkbenchPages();
      if (ws === "delta") bindDeltaPage();
      if (ws === "sequence") bindSequencePage();
      if (ws === "dataflow") bindDataflowPage();
      if (ws === "lifecycle") bindLifecyclePage();
      applyProbePaint();
    }
    function applyDecisionOutcomeFilter() {
      canvas.querySelectorAll(".expl-card[data-outcome]").forEach((el2) => {
        const out = el2.getAttribute("data-outcome") || "";
        el2.classList.toggle("off", !!(decisionOutcomeFilter && out !== decisionOutcomeFilter));
      });
      canvas.querySelectorAll("[data-outcome-filter]").forEach((el2) => {
        el2.classList.toggle("on", (el2.getAttribute("data-outcome-filter") || "") === decisionOutcomeFilter);
      });
    }
    function applyTimelineScrub() {
      const items = [...canvas.querySelectorAll(".tl-item")];
      items.forEach((el2, i) => {
        const t = parseInt(el2.getAttribute("data-t"), 10);
        const idx = Number.isFinite(t) ? t : i;
        el2.classList.toggle("now", idx === timelineCursor);
        el2.classList.toggle("past", idx < timelineCursor);
        el2.classList.toggle("ahead", idx > timelineCursor);
      });
      const scrub = document.getElementById("tlScrub");
      if (scrub) scrub.value = String(timelineCursor);
      const metaEl = document.getElementById("tlScrubMeta");
      const now = items[timelineCursor];
      if (metaEl && now) {
        const title = ((now.querySelector(".t") || {}).textContent || "event").trim();
        metaEl.textContent = "t" + timelineCursor + " · " + title;
      }
    }
    function bindWorkbenchPages() {
      applyDecisionOutcomeFilter();
      canvas.querySelectorAll("[data-outcome-filter]").forEach((el2) => {
        el2.onclick = (ev) => {
          ev.stopPropagation();
          decisionOutcomeFilter = el2.getAttribute("data-outcome-filter") || "";
          applyDecisionOutcomeFilter();
        };
      });
      const scrub = document.getElementById("tlScrub");
      if (scrub) {
        scrub.oninput = () => {
          timelineCursor = parseInt(scrub.value, 10) || 0;
          applyTimelineScrub();
        };
      }
      canvas.querySelectorAll(".tl-item").forEach((el2) => {
        el2.addEventListener("click", () => {
          const t = parseInt(el2.getAttribute("data-t"), 10);
          if (Number.isFinite(t)) timelineCursor = t;
          applyTimelineScrub();
        });
      });
    }
    function renderCardList(rows, empty) {
      const shown = (rows || []).filter(
        (r) => matchesExplorerQuery([r.title, r.body, r.flow, r.verdict, r.kind].join(" "))
      );
      if (!shown.length) return '<div class="empty">' + esc(empty) + "</div>";
      return '<div class="expl-list">' + shown.map((r) => {
        const mark = r.verdict || r.kind || "";
        return '<article class="expl-card ' + esc(mark) + '"' + (r.flow ? ' data-flow="' + esc(r.flow) + '"' : "") + '><div class="k">' + esc(mark) + '</div><div class="t">' + esc(r.title) + '</div><div class="b">' + esc(r.body) + "</div></article>";
      }).join("") + "</div>";
    }
    function renderOverviewBody() {
      const nodes = snapshot.graph && snapshot.graph.nodes || [];
      const edges = snapshot.graph && snapshot.graph.edges || [];
      const bubbles = mapAltitudeBubbles();
      const programs = snapshot.programs || [];
      const flows = snapshot.flows || [];
      const cov = snapshot.coverage || {};
      const kinds = countMap(nodes, (n) => n.kind);
      const hops = countMap(edges, (e) => e.kind);
      const marks = countMap(
        flows.map((f) => ({ m: flowMark(f.name) || "open" })),
        (x) => x.m
      );
      const degrees = degreeMap();
      const topDeg = nodes.map((n) => ({ n, d: degrees.get(idVal(n.id)) || 0 })).sort((a, b) => b.d - a.d).slice(0, 8);
      const q = (graphFilter.q || "").toLowerCase();
      const path = featurePath(storyFlow());
      const pathRank = new Map(path.map((b, i) => [idVal(b.id), i]));
      const comms = bubbles.filter((b) => !q || String(b.label || "").toLowerCase().includes(q)).sort((a, b) => {
        const pa = pathRank.has(idVal(a.id)) ? pathRank.get(idVal(a.id)) : 1e3;
        const pb = pathRank.has(idVal(b.id)) ? pathRank.get(idVal(b.id)) : 1e3;
        if (pa !== pb) return pa - pb;
        return (b.members || []).length - (a.members || []).length;
      }).slice(0, 8);
      return renderFeaturePathHtml() + renderDefaultCfg() + '<div class="stat-strip"><span><i class="k">Nodes</i> <b class="n">' + nodes.length + "</b> " + statChips(kinds) + '</span><span><i class="k">Hops</i> <b class="n">' + edges.length + "</b> " + statChips(hops) + '</span><span><i class="k">Communities</i> <b class="n">' + bubbles.length + '</b> <button type="button" class="crumb-btn" data-ws="map">Open map</button></span><span><i class="k">Programs</i> <b class="n">' + programs.length + "</b> " + statChips(countMap(programs, (p) => p.kind)) + '</span><span><i class="k">Uncovered</i> <b class="n">' + (cov.uncovered || []).length + "</b> of " + (cov.changed || []).length + ' changed</span><span><i class="k">Flows</i> <b class="n">' + flows.length + "</b> " + statChips(marks) + '</span></div><div class="flow-title">Communities</div><div class="expl-list compact">' + comms.map((b) => {
        const marks2 = bubbleMarks(b);
        const step = pathRank.has(idVal(b.id)) ? pathRank.get(idVal(b.id)) : -1;
        const role = featureRole(step, path.length - 1);
        return '<article class="expl-card" data-ws="map"><div class="k">community' + (role ? " · " + esc(role) : "") + '</div><div class="t">' + esc(shortOf(b.label) || "bubble") + '</div><div class="b">' + (b.members || []).length + " nodes" + (marks2.uncovered ? " · " + marks2.uncovered + " unc." : "") + (marks2.onTree ? " · " + marks2.onTree + " on tree" : "") + "</div></article>";
      }).join("") + '</div><div class="flow-title">Highest degree</div><div class="expl-list compact">' + topDeg.slice(0, 6).map((x) => {
        const id = idVal(x.n.id);
        return '<article class="expl-card" data-id="' + esc(id) + '"><div class="k">' + esc(x.n.kind) + '</div><div class="t">' + esc(shortOf(x.n.fqn)) + '</div><div class="b">degree ' + x.d + " · " + esc(shortToken(id)) + "</div></article>";
      }).join("") + "</div>";
    }
    function renderDefaultCfg() {
      const flow = defaultRunFlow();
      if (!flow || !(flow.tree && (flow.tree.nodes || []).length)) {
        return '<div class="flow-title">Default run</div><div class="empty">No control-flow yet. Review a repo — default run uses derived entries.</div>';
      }
      const treeHtml = renderSteiner(flow, snapshot.graph, false, scarSet(snapshot.findings, flow.name));
      const runHtml = renderRuns(flow, snapshot, false);
      return '<div class="flow-title">Default run · ' + esc(flow.name) + ' — control-flow graph</div><div class="stage"><div class="viewport" data-lod="' + lodOf(cam.k) + '">' + treeHtml + (runHtml ? '<div class="flow-title">Subsystem runs — click to enter</div>' + runHtml : "") + "</div></div>";
    }
    function renderLineage() {
      renderTabs(snapshot.flows || [], currentFlow() && currentFlow().name);
      renderStats(snapshot);
      renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph);
      setGraphChrome(true);
      hideTip();
      if (stampBtn) stampBtn.disabled = !currentFlow();
      if (skipBtn) skipBtn.disabled = !currentFlow();
      const id = defaultFocusId();
      if (id && id !== selectedNodeId) selectedNodeId = id;
      if (!id) {
        setMeta('<span class="crumb">Review</span> / <b>lineage</b>');
        canvas.className = "play";
        canvas.innerHTML = '<div class="empty">Select a node on the map or slice to see its incident hops.</div>';
        setZoomUi(false);
        return;
      }
      const node = nodeById.get(id);
      const hops = incidentEdges(id);
      const path = pathEnds.length === 2 ? shortestPath(pathEnds[0], pathEnds[1]) : [id];
      const pathSet = new Set(path);
      setMeta(
        '<span class="crumb">Review</span> / <button type="button" class="crumb-btn" data-ws="map">map</button> / <b>lineage</b> · ' + esc(shortOf(node && node.fqn || id)) + " · " + hops.length + " incident hops" + (path.length > 1 ? " · path " + path.length : "")
      );
      const up = meta.querySelector("[data-ws]");
      if (up) up.onclick = () => setWorkspace("map", true);
      const neighbors = [];
      const seen = /* @__PURE__ */ new Set([id]);
      hops.forEach((e) => {
        const other = e.dir === "out" ? e.to : e.from;
        if (seen.has(other)) return;
        seen.add(other);
        const n = nodeById.get(other);
        neighbors.push({
          id: other,
          fqn: n && n.fqn || other,
          kind: n && n.kind || kindOf(snapshot.graph, other),
          dir: e.dir,
          hop: e.kind
        });
      });
      const shown = neighbors.filter(
        (n) => graphFilter.kinds[n.kind] !== false && matchesExplorerQuery(n.fqn + " " + n.hop)
      );
      const laidIds = [id].concat(shown.map((n) => n.id));
      const laidEdges = hops.map((e) => ({ from: e.from, to: e.to, kind: e.kind }));
      const laid = layeredPositions(laidIds, laidEdges, {
        nodeW: 176,
        nodeH: 64,
        gapX: 100,
        gapY: 40,
        pad: 48,
        minW: 720,
        minH: Math.max(300, 80 + shown.length * 36),
        pins: pinsForCurrent()
      });
      const W = laid.W, H = laid.H, pos = laid.pos;
      let svg = '<svg class="comm-edges lineage-edges" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">';
      hops.forEach((e) => {
        const pa = pos.get(e.from), pb = pos.get(e.to);
        if (!pa || !pb) return;
        const d = orthoPath(pa, pb);
        svg += '<path class="edge-hit" data-from="' + e.from + '" data-to="' + e.to + '" data-kind="' + esc(e.kind) + '" d="' + d + '" /><path data-from="' + e.from + '" data-to="' + e.to + '" data-kind="' + esc(e.kind) + '" d="' + d + '" />';
      });
      svg += "</svg>";
      const box = (nid, extra) => {
        const n = nodeById.get(nid) || { id: nid, fqn: fqnOf(snapshot.graph, nid), kind: kindOf(snapshot.graph, nid) };
        const p = pos.get(nid);
        if (!p) return "";
        const flags = nodeFlags(nid);
        return '<button type="button" class="comm-node ego-node ' + kindClass(n.kind) + (nid === id ? " selected" : "") + (pathSet.has(nid) ? " on-path" : "") + (flags.uncovered ? " uncovered" : "") + (extra || "") + '" style="left:' + p.x + "px;top:" + p.y + 'px" data-id="' + nid + '" data-fqn="' + esc(n.fqn) + '" data-kind="' + esc(n.kind) + '"><span class="name">' + esc(shortOf(n.fqn)) + '</span><span class="meta">' + esc(kindLine(nid, n.kind)) + "</span></button>";
      };
      let dots = box(id, " ego");
      shown.forEach((n) => {
        dots += box(n.id, "");
      });
      const hopCards = hops.slice(0, 24).map((e) => {
        return '<button type="button" class="expl-card hop" data-from="' + esc(e.from) + '" data-to="' + esc(e.to) + '" data-kind="' + esc(e.kind) + '"><div class="k">' + esc(e.kind) + " " + (e.dir === "out" ? "→" : "←") + '</div><div class="t">' + esc(shortOf(fqnOf(snapshot.graph, e.dir === "out" ? e.to : e.from))) + '</div><div class="b">' + esc(shortToken(e.from)) + " → " + esc(shortToken(e.to)) + "</div></button>";
      });
      const pathRow = path.length > 1 ? '<div class="path-row">' + path.map((pid) => {
        return '<button type="button" class="path-chip ' + kindClass(kindOf(snapshot.graph, pid)) + '" data-id="' + esc(pid) + '">' + esc(shortOf(fqnOf(snapshot.graph, pid))) + "</button>";
      }).join('<span class="arr">→</span>') + "</div>" : '<div class="path-row muted">Click a second node to draw the shortest path on the derived edges.</div>';
      const buckets = { used: [], informed: [], generated: [] };
      hops.forEach((e) => {
        buckets[provBucket(e.kind)].push(e);
      });
      const provCol = (name, label, items) => {
        return '<div class="prov-col" data-prov="' + name + '"><div class="k">' + label + "</div>" + (items.length ? items.map((e) => {
          const other = e.dir === "out" ? e.to : e.from;
          return '<button type="button" class="expl-card hop" data-from="' + esc(e.from) + '" data-to="' + esc(e.to) + '" data-kind="' + esc(e.kind) + '"><div class="t">' + esc(shortOf(fqnOf(snapshot.graph, other))) + '</div><div class="b">' + esc(e.kind) + "</div></button>";
        }).join("") : '<div class="empty">—</div>') + "</div>";
      };
      canvas.className = "play has-stage explorer-lineage";
      canvas.innerHTML = '<div class="stage"><div class="viewport" data-lod="0"><div class="flow-title">Lineage · ego of ' + esc(shortOf(node && node.fqn || id)) + " · " + egoHops + "-hop</div>" + pathRow + '<div class="comm-wrap" style="width:' + W + "px;height:" + H + 'px">' + svg + dots + '</div><div class="flow-title">Provenance on derived edges</div><div class="prov-row xy">' + provCol("used", "Used · Reads", buckets.used) + provCol("informed", "Informed · Calls", buckets.informed) + provCol("generated", "Generated · Writes", buckets.generated) + '</div><div class="flow-title">Incident hops</div><div class="expl-list compact hops">' + (hopCards.join("") || '<div class="empty">No incident hops on the derived graph.</div>') + "</div></div></div>";
      bindStage(canvas.querySelector(".stage"), { reset: true });
      setZoomUi(true);
      bindDraggable(canvas.querySelector(".comm-wrap"), ".ego-node", {
        onClick: (nid) => {
          selectNode(nid, { peek: true });
          paint({ animate: "none" });
        }
      });
      canvas.querySelectorAll(".ego-node, .path-chip").forEach((el2) => {
        const nid = el2.getAttribute("data-id");
        if (!nid) return;
        el2.addEventListener("click", (ev) => {
          ev.stopPropagation();
          selectNode(nid, { peek: true });
          if (el2.classList.contains("ego-node") || el2.classList.contains("path-chip")) paint({ animate: "none" });
        });
      });
      bindHopClicks(canvas);
      canvas.querySelectorAll(".expl-card.hop").forEach((el2) => {
        el2.addEventListener("click", (ev) => {
          ev.stopPropagation();
          showHop(el2.getAttribute("data-from"), el2.getAttribute("data-to"), el2.getAttribute("data-kind"));
        });
      });
      const focusNodes = [nodeById.get(id) || { id, kind: kindOf(snapshot.graph, id), fqn: fqnOf(snapshot.graph, id) }].concat(
        shown.map((n) => nodeById.get(n.id) || n)
      );
      renderLedger(focusNodes, { selected: id });
      setLedgerHead("EGO");
      applyEgoPaint();
      if (id) peekSource(id);
    }
    function renderProgramOverview() {
      const programs = snapshot.programs || [];
      renderTabs(snapshot.flows || [], null);
      renderStats(snapshot);
      renderCoverage(snapshot.coverage, snapshot.findings, snapshot.graph);
      hideTip();
      if (stampBtn) stampBtn.disabled = true;
      if (skipBtn) skipBtn.disabled = true;
      if (progFocus >= programs.length) progFocus = 0;
      const filt = graphFilter.program ? esc(graphFilter.program.name) : "all";
      const bub = graphFilter.bubble ? mapAltitudeBubbles().find((b) => idVal(b.id) === String(graphFilter.bubble)) : null;
      setMeta(
        '<span class="crumb">Review</span> / <button type="button" class="crumb-btn" data-up="map">map</button>' + (bub ? " / <b>" + esc(bub.label || "bubble") + "</b>" : "") + " · " + filt + (bub ? " · click a node to inspect" : " · communities only — click a bubble, then a flow tab")
      );
      const up = meta.querySelector("[data-up=map]");
      if (up)
        up.onclick = () => {
          graphFilter.bubble = null;
          renderProgramOverview();
        };
      setGraphChrome(true);
      syncBackBtn();
      setLedgerHead("MAP");
      renderLegend();
      renderCommunityGraph();
      applyEgoPaint();
    }
    function degreeMap() {
      const m = /* @__PURE__ */ new Map();
      for (const e of snapshot && snapshot.graph && snapshot.graph.edges || []) {
        m.set(idVal(e.from), (m.get(idVal(e.from)) || 0) + 1);
        m.set(idVal(e.to), (m.get(idVal(e.to)) || 0) + 1);
      }
      return m;
    }
    function pickCommunityNodes(degrees) {
      const must = /* @__PURE__ */ new Set();
      for (const id of (snapshot.coverage && snapshot.coverage.uncovered || []).concat(
        snapshot.coverage && snapshot.coverage.changed || []
      )) {
        must.add(idVal(id));
      }
      for (const f of snapshot.flows || []) {
        for (const id of f.tree?.nodes || []) must.add(idVal(id));
      }
      let nodes = (snapshot.graph && snapshot.graph.nodes || []).slice();
      if (graphFilter.program) {
        const want = programKeyOf(graphFilter.program);
        nodes = nodes.filter(
          (n) => n.span?.file && programKeyOf(assignProgram(n.span.file, snapshot.programs || [])) === want
        );
      }
      if (graphFilter.bubble) {
        const bub = findBubble(graphFilter.bubble);
        const mem = new Set((bub?.members || []).map((m) => idVal(m)));
        nodes = nodes.filter((n) => mem.has(idVal(n.id)));
      }
      nodes = nodes.filter((n) => graphFilter.kinds[n.kind] !== false);
      const q = (graphFilter.q || "").toLowerCase();
      if (q) {
        nodes = nodes.filter(
          (n) => String(n.fqn || "").toLowerCase().includes(q) || String(n.span?.file || "").toLowerCase().includes(q)
        );
      }
      const scored = nodes.map((n) => ({ n, d: degrees.get(idVal(n.id)) || 0, must: must.has(idVal(n.id)) }));
      scored.sort((a, b) => Number(b.must) - Number(a.must) || b.d - a.d);
      const cap = graphFilter.bubble ? 24 : 48;
      return scored.slice(0, cap).map((x) => x.n);
    }
    function readableEdgesAmong(ids) {
      const picked = new Set((ids || []).map((id) => idVal(id)));
      const byFrom = /* @__PURE__ */ new Map();
      for (const e of snapshot && snapshot.graph && snapshot.graph.edges || []) {
        const a = idVal(e.from), b = idVal(e.to);
        if (!picked.has(a) || !picked.has(b) || a === b) continue;
        if (!byFrom.has(a)) byFrom.set(a, []);
        byFrom.get(a).push(e);
      }
      const out = [];
      for (const list of byFrom.values()) {
        list.sort((a, b) => kindWeight(b.kind || "Calls") - kindWeight(a.kind || "Calls"));
        out.push(...list.slice(0, 2));
      }
      return out;
    }
    function layoutCommunity(nodes) {
      const ids = (nodes || []).map((n) => idVal(n.id));
      return layeredPositions(ids, readableEdgesAmong(ids), {
        nodeW: 176,
        nodeH: 64,
        gapX: 72,
        gapY: 36,
        pad: 48,
        minW: 720,
        minH: 280,
        maxCols: 6,
        pins: pinsForCurrent()
      });
    }
    function renderLegend() {
      if (!legendEl) return;
      const programs = snapshot.programs || [];
      let html = "";
      programs.forEach((p, i) => {
        const on = graphFilter.program && programKeyOf(graphFilter.program) === programKeyOf(p);
        html += '<button type="button" class="leg' + (on ? " on" : "") + '" data-prog="' + i + '">' + esc(p.kind) + " " + esc(p.name) + "</button>";
      });
      if (programs.length > 1) {
        html += '<button type="button" class="leg' + (!graphFilter.program ? " on" : "") + '" data-prog="-1">All programs</button>';
      }
      legendEl.innerHTML = html;
      legendEl.querySelectorAll("[data-prog]").forEach((el2) => {
        el2.onclick = () => {
          const i = Number(el2.getAttribute("data-prog"));
          graphFilter.program = i >= 0 ? programs[i] : null;
          progFocus = i >= 0 ? i : 0;
          renderProgramOverview();
        };
      });
      legendEl.querySelectorAll("[data-bubble]").forEach((el2) => {
        el2.onclick = () => {
          const id = el2.getAttribute("data-bubble");
          graphFilter.bubble = String(graphFilter.bubble) === id ? null : id;
          renderProgramOverview();
        };
      });
    }
    function renderCommunityGraph() {
      if (!graphFilter.bubble) {
        renderBubbleMap(mapAltitudeBubbles());
        return;
      }
      const degrees = degreeMap();
      const nodes = pickCommunityNodes(degrees);
      if (!nodes.length) {
        canvas.className = "play";
        canvas.innerHTML = '<div class="empty">No derived nodes match this filter. Clear the search, program chip, or kinds.</div>';
        setZoomUi(false);
        return;
      }
      const { W, H, pos } = layoutCommunity(nodes);
      const readable = readableEdgesAmong(nodes.map((n) => idVal(n.id)));
      const svg = edgeSvg("comm-edges", readable, pos, W, H);
      let dots = "";
      for (const n of nodes) {
        const id = idVal(n.id);
        const p = pos.get(id);
        if (!p) continue;
        const flags = nodeFlags(id);
        dots += '<button type="button" class="comm-node ' + kindClass(n.kind) + (selectedNodeId === id ? " selected" : "") + (flags.uncovered ? " uncovered" : "") + '" style="left:' + p.x + "px;top:" + p.y + 'px" data-id="' + id + '" data-fqn="' + esc(n.fqn) + '" data-kind="' + esc(n.kind) + '" data-file="' + esc(n.span?.file || "") + '" title="' + esc(n.fqn) + '"><span class="name">' + esc(shortOf(n.fqn)) + '</span><span class="meta">' + esc(kindLine(id, n.kind)) + "</span></button>";
      }
      canvas.className = "play has-stage programs-view";
      canvas.innerHTML = '<div class="stage"><div class="viewport" data-lod="0"><div class="flow-title">' + (graphFilter.q ? nodes.length + " matching “" + esc(graphFilter.q) + "” — click to inspect" : graphFilter.bubble ? "Inside this community — layered on derived hops · " + nodes.length + " review-relevant of " + (findBubble(graphFilter.bubble) && findBubble(graphFilter.bubble).members || []).length + " (uncovered / on-tree first). Drag to rearrange." : "Nodes — zoom in for kind lines, click to inspect") + '</div><div class="comm-wrap" style="width:' + W + "px;height:" + H + 'px">' + svg + dots + "</div></div></div>";
      bindStage(canvas.querySelector(".stage"), { reset: true });
      setZoomUi(true);
      const wrap = canvas.querySelector(".comm-wrap");
      canvas.querySelectorAll(".comm-node").forEach((el2) => {
        const id = el2.getAttribute("data-id");
        el2.addEventListener("pointerenter", (ev) => {
          highlightCommunity(id);
          showTip(el2.getAttribute("data-fqn"), ev);
        });
        el2.addEventListener("pointerleave", () => {
          highlightCommunity(selectedNodeId);
          hideTip();
        });
        el2.addEventListener("dblclick", (ev) => {
          ev.stopPropagation();
          const p = assignProgram(el2.getAttribute("data-file") || "", snapshot.programs || []);
          if (p) openProgram(p, el2);
        });
      });
      bindDraggable(wrap, ".comm-node", {
        onClick: (id) => selectNode(id)
      });
      applyGraphFilter();
      bindHopClicks(canvas.querySelector("svg.comm-edges"));
      renderLedger(nodes, { selected: selectedNodeId });
      applyEgoPaint();
      if (selectedNodeId) peekSource(selectedNodeId);
    }
    function renderBubbleMap(clusters) {
      const path = storyMapBubbles();
      const pathRank = new Map(path.map((b, i) => [idVal(b.id), i]));
      clusters = pinStoryClusters(clusters || []).slice().sort((a, b) => {
        const pa = pathRank.has(idVal(a.id)) ? pathRank.get(idVal(a.id)) : 1e3;
        const pb = pathRank.has(idVal(b.id)) ? pathRank.get(idVal(b.id)) : 1e3;
        if (pa !== pb) return pa - pb;
        return (b.members || []).length - (a.members || []).length;
      }).slice(0, 24);
      if (!clusters.length) {
        canvas.className = "play";
        canvas.innerHTML = '<div class="empty">No communities yet. Review again after clustering finishes.</div>';
        setZoomUi(false);
        return;
      }
      const ids = clusters.map((b) => idVal(b.id));
      const idSet = new Set(ids);
      const pathIds = path.map((b) => idVal(b.id)).filter((id) => idSet.has(id));
      const rest = ids.filter((id) => pathIds.indexOf(id) < 0);
      const pathEdges = [];
      for (let i = 0; i < pathIds.length - 1; i++) {
        pathEdges.push({ from: pathIds[i], to: pathIds[i + 1], kind: "Calls" });
      }
      const layoutEdges = pathEdges.slice();
      if (pathIds.length && rest.length) {
        layoutEdges.push({ from: pathIds[pathIds.length - 1], to: rest[0], kind: "Contains" });
        for (let i = 0; i < rest.length - 1; i++) {
          layoutEdges.push({ from: rest[i], to: rest[i + 1], kind: "Contains" });
        }
      }
      const edges = pathIds.length >= 2 ? pathEdges : communityEdgeList(clusters);
      const laid = layeredPositions(ids, pathIds.length >= 2 ? layoutEdges : edges, {
        nodeW: 220,
        nodeH: 128,
        gapX: 96,
        gapY: 56,
        pad: 64,
        minW: 760,
        minH: 340,
        maxCols: 6,
        pins: pinsForCurrent()
      });
      const { W, H, pos } = laid;
      const byId = new Map(clusters.map((b) => [idVal(b.id), b]));
      let html = "";
      for (const id of ids) {
        const b = byId.get(id);
        const p = pos.get(id);
        if (!b || !p) continue;
        const n = (b.members || []).length;
        const marks = bubbleMarks(b);
        const step = pathRank.has(id) ? pathRank.get(id) : -1;
        const role = featureRole(step, path.length - 1) || (pathIds.length ? "off path" : "");
        const roleClass = step === 0 ? " start" : step === path.length - 1 && path.length > 1 ? " end" : role === "off path" ? " off" : "";
        const here = graphFilter.bubble && idVal(id) === idVal(graphFilter.bubble) ? " here" : "";
        html += '<button type="button" class="bubble-card' + roleClass + here + '" style="left:' + p.x + "px;top:" + p.y + "px;--c:" + colorOfBubble(b) + '" data-bubble="' + id + '">' + (role ? '<span class="role">' + esc(role) + "</span>" : "") + '<span class="name">' + esc(shortOf(b.label) || "bubble") + '</span><span class="meta">' + (role ? role + " · " : "") + n + (n === 1 ? " node" : " nodes") + (marks.uncovered ? " · " + marks.uncovered + " unc." : "") + (marks.onTree ? " · " + marks.onTree + " on tree" : "") + "</span>" + bubbleMemberChips(b, 4) + "</button>";
      }
      canvas.className = "play has-stage programs-view";
      canvas.innerHTML = renderStoryRailHtml() + '<div class="stage"><div class="viewport" data-lod="0"><div class="flow-title">' + (pathIds.length ? "Start → features → end — control-flow through communities. Drag to rearrange, Reorganize to auto-layout. zoom in to peek members, click to enter" : "Community flow — drag to rearrange, Reorganize to auto-layout. zoom in to peek members, click to enter") + '</div><div class="comm-wrap" style="width:' + W + "px;height:" + H + 'px">' + edgeSvg("comm-edges", edges, pos, W, H) + html + "</div></div></div>";
      bindStage(canvas.querySelector(".stage"), { reset: true });
      setZoomUi(true);
      const wrap = canvas.querySelector(".comm-wrap");
      canvas.querySelectorAll(".bubble-card").forEach((el2) => {
        const id = el2.getAttribute("data-bubble");
        el2.addEventListener("pointerenter", () => {
          canvas.querySelectorAll(".comm-edges path").forEach((p) => {
            p.classList.toggle("hot", p.getAttribute("data-from") === id || p.getAttribute("data-to") === id);
          });
        });
        el2.addEventListener("pointerleave", () => {
          canvas.querySelectorAll(".comm-edges path.hot").forEach((p) => p.classList.remove("hot"));
        });
      });
      bindDraggable(wrap, ".bubble-card", {
        idAttr: "data-bubble",
        onClick: (id) => {
          graphFilter.bubble = id;
          selectedNodeId = null;
          renderProgramOverview();
        }
      });
      bindHopClicks(canvas.querySelector("svg.comm-edges"));
      applyGraphFilter();
      const sample = [];
      const seen = /* @__PURE__ */ new Set();
      for (const b of clusters) {
        for (const id of b.members || []) {
          const sid = idVal(id);
          if (seen.has(sid)) continue;
          seen.add(sid);
          const n = nodeById.get(sid);
          if (n) sample.push(n);
          if (sample.length >= 48) break;
        }
        if (sample.length >= 48) break;
      }
      renderLedger(sample, { selected: selectedNodeId });
      bindStoryRail();
      applyPathWalkPaint();
    }
    function bubblePreviewMembers(b, max) {
      const scored = (b.members || []).map((id) => {
        const sid = idVal(id);
        const flags = nodeFlags(sid);
        return { id: sid, n: nodeById.get(sid), must: flags.uncovered || flags.changed };
      });
      scored.sort((a, b2) => Number(b2.must) - Number(a.must));
      return scored.slice(0, max);
    }
    function bubbleMemberChips(b, max) {
      const preview = bubblePreviewMembers(b, max);
      const extra = Math.max(0, (b.members || []).length - preview.length);
      return '<span class="members">' + preview.map((x) => {
        const kind = x.n && x.n.kind || kindOf(snapshot && snapshot.graph, x.id);
        return '<i class="' + kindClass(kind) + '">' + esc(shortOf(x.n && x.n.fqn || x.id)) + "</i>";
      }).join("") + (extra ? '<i class="more">+' + extra + "</i>" : "") + "</span>";
    }
    function bubbleMarks(b) {
      const mem = new Set((b.members || []).map((m) => idVal(m)));
      let uncovered = 0;
      for (const id of snapshot.coverage && snapshot.coverage.uncovered || []) {
        if (mem.has(idVal(id))) uncovered++;
      }
      let onTree = 0;
      const flow = currentFlow();
      for (const id of flow && flow.tree && flow.tree.nodes || []) {
        if (mem.has(idVal(id))) onTree++;
      }
      return { uncovered, onTree };
    }
    function highlightCommunity(id) {
      const sid = id ? String(id) : "";
      canvas.querySelectorAll(".comm-node").forEach((el2) => {
        el2.classList.toggle("selected", el2.getAttribute("data-id") === sid);
      });
      canvas.querySelectorAll(".comm-edges path").forEach((el2) => {
        el2.classList.toggle("hot", el2.getAttribute("data-from") === sid || el2.getAttribute("data-to") === sid);
      });
      if (ledgerGrid) {
        ledgerGrid.querySelectorAll(".cell").forEach((el2) => {
          if (sid) el2.classList.toggle("on", el2.getAttribute("data-id") === sid || el2.classList.contains("uncovered"));
        });
      }
    }
    function applyGraphFilter() {
      const q = (graphFilter.q || "").toLowerCase();
      canvas.querySelectorAll(".comm-node, .vnode").forEach((el2) => {
        const fqn = (el2.getAttribute("data-fqn") || "").toLowerCase();
        const file = (el2.getAttribute("data-file") || "").toLowerCase();
        const kind = el2.getAttribute("data-kind") || "";
        const match = (!q || fqn.includes(q) || file.includes(q)) && graphFilter.kinds[kind] !== false;
        el2.classList.toggle("dim", !match);
        el2.classList.toggle("hit", !!(q && match));
      });
      canvas.querySelectorAll(".bubble-card").forEach((el2) => {
        const name = (el2.querySelector(".name") && el2.querySelector(".name").textContent || "").toLowerCase();
        const match = !q || name.includes(q);
        el2.classList.toggle("dim", !match);
        el2.classList.toggle("hit", !!(q && match));
      });
    }
    function renderTabs(flows, current) {
      const m = reviewMarks();
      const head = m.names.length ? '<span class="queue-left' + (m.pending ? "" : " done") + '">' + (m.pending ? m.pending + " left" : "queue clear") + "</span>" : "";
      tabs.innerHTML = head + (flows || []).map((f) => {
        const mark = flowMark(f.name);
        return '<button class="tab' + (f.name === current ? " on" : "") + (mark ? " " + mark : "") + '" data-flow="' + esc(f.name) + '">' + esc(f.name) + (mark ? '<span class="mark">' + mark + "</span>" : "") + "</button>";
      }).join("");
      tabs.querySelectorAll(".tab").forEach((el2) => {
        el2.onclick = () => selectFlow(el2.getAttribute("data-flow"));
      });
    }
    function renderLedger(nodes, opts) {
      if (!ledgerGrid) return;
      const selected = opts && opts.selected ? String(opts.selected) : "";
      const onTree = opts && opts.onTree || null;
      const list = (nodes || []).slice(0, 64);
      ledgerGrid.innerHTML = list.map((n) => {
        const id = idVal(n.id || n);
        const kind = n.kind || kindOf(snapshot && snapshot.graph, id);
        const flags = nodeFlags(id);
        const on = selected === id || flags.uncovered || onTree && onTree.has(id);
        const name = shortOf(n.fqn || fqnOf(snapshot && snapshot.graph, id)) || shortToken(id);
        return '<button type="button" class="cell dag ' + kindClass(kind) + (on ? " on" : "") + (flags.uncovered ? " uncovered" : "") + '" data-id="' + id + '"><span class="dag-k">' + esc(kind === "Type" ? "ty" : kind === "Endpoint" ? "ep" : "fn") + '</span><span class="dag-id">' + esc(name) + "</span></button>";
      }).join("");
      if (ledgerMeta) {
        const lit = ledgerGrid.querySelectorAll(".on").length;
        ledgerMeta.textContent = "objects " + lit + "/" + list.length;
      }
      ledgerGrid.querySelectorAll("[data-id]").forEach((el2) => {
        el2.onclick = () => {
          selectNode(el2.getAttribute("data-id"));
          renderLedger(list, { selected: selectedNodeId, onTree });
        };
      });
    }
    function renderStats(msg) {
      const g = msg.graph || {};
      const s = msg.stats || {};
      const bits = [];
      if (g.nodes && g.nodes.length) bits.push(g.nodes.length + " nodes");
      else if (s.nodes) bits.push(s.nodes + " nodes");
      if (g.edges && g.edges.length) bits.push(g.edges.length + " edges");
      else if (s.edges) bits.push(s.edges + " edges");
      if (s.files) bits.push(s.files + " files");
      if (s.elapsed_ms != null) bits.push(s.elapsed_ms + "ms");
      if (msg.plugin) bits.push(msg.plugin);
      status.textContent = bits.join(" · ");
    }
    function renderFlowchart(msg, opts) {
      const flow = msg.flow;
      const animate = opts && opts.animate || "all";
      const preview = !!(opts && opts.preview);
      if (stampBtn) stampBtn.disabled = !flow;
      if (skipBtn) skipBtn.disabled = !flow;
      renderTabs(msg.flows, flow && flow.name);
      renderStats(msg);
      renderCoverage(msg.coverage, msg.findings, msg.graph);
      if (!flow) {
        setMeta("No proposed flows. Type a prompt or add <code>flows.toml</code>.");
        canvas.className = "play";
        canvas.innerHTML = '<div class="empty">Graph is ready (' + (msg.graph?.nodes?.length || msg.stats?.nodes || 0) + " nodes). Prompt a story to slice it.</div>";
        setZoomUi(false);
        return;
      }
      const prog = snapshot && snapshot.program;
      setGraphChrome(true);
      let crumb = '<button type="button" class="crumb-btn" data-go="programs">Map</button>';
      if (prog) crumb += " / <b>" + esc(prog.name) + "</b>";
      crumb += " / <b>" + esc(flow.name) + "</b> · " + (flow.tree?.nodes || []).length + " on tree" + (preview ? ' <span class="live">live preview</span>' : "") + stampBadge(flow.name);
      setMeta(crumb);
      const backToPrograms = meta.querySelector("[data-go=programs]");
      if (backToPrograms) backToPrograms.onclick = () => goBack();
      const playTree = animate === "all" || animate === "tree";
      const playRuns = animate === "all" || animate === "runs";
      const keepCam = !!(opts && opts.keepCam) || animate === "runs";
      const treeHtml = renderSteiner(flow, msg.graph, playTree, scarSet(msg.findings, flow.name));
      const runHtml = renderRuns(flow, msg, playRuns);
      canvas.className = "play has-stage";
      canvas.innerHTML = renderStoryRailHtml() + '<div class="stage"><div class="viewport" data-lod="' + lodOf(cam.k) + '"><div class="flow-title">Flow · Steiner — zoom out for runs, in for hops and source</div>' + treeHtml + (runHtml ? '<div class="flow-title" style="margin-top:18px">Subsystem runs — click to enter</div>' + runHtml : preview ? '<div class="hint-live">Runs appear when clustering finishes</div>' : "") + "</div></div>";
      bindStage(canvas.querySelector(".stage"), { reset: !keepCam });
      bindGraphFx();
      setZoomUi(true);
      applyGraphFilter();
      setLedgerHead("SLICE");
      const treeIds = (flow.tree?.nodes || []).map((id) => nodeById.get(idVal(id)) || { id, kind: kindOf(msg.graph, id), fqn: fqnOf(msg.graph, id) });
      renderLedger(treeIds, { selected: selectedNodeId, onTree: new Set((flow.tree?.nodes || []).map(idVal)) });
      applyEgoPaint();
      bindStoryRail();
      applyPathWalkPaint();
    }
    function stampBadge(name) {
      const mark = flowMark(name);
      if (!mark) return "";
      return ' <span class="live ' + mark + '">' + mark + "</span>";
    }
    function scarSet(findings, flowName2) {
      const keys = /* @__PURE__ */ new Set();
      for (const f of findings || []) {
        if (f.kind !== "StampBroken" || f.flow !== flowName2) continue;
        for (const e of f.added || []) keys.add(e.from + ">" + e.to);
      }
      return keys;
    }
    function renderSteiner(flow, graph, animate, scars) {
      const nodes = flow.tree?.nodes || [];
      const edges = flow.tree?.edges || [];
      if (!nodes.length) return '<div class="empty">Empty tree.</div>';
      const ids = nodes.map(idVal);
      const laid = layeredPositions(ids, edges, {
        nodeW: 176,
        nodeH: 72,
        gapX: 96,
        gapY: 52,
        pad: 56,
        minW: 720,
        minH: 300,
        maxCols: 8,
        pins: pinsForCurrent()
      });
      const W = laid.W, H = laid.H;
      const pos = Object.fromEntries(laid.pos);
      const level = {};
      for (const [id, r] of laid.rank || []) level[id] = r;
      let svg = '<svg class="steiner steiner-edges' + (animate ? " play" : "") + '" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" /></marker></defs>';
      for (const e of edges) {
        const a = pos[idVal(e.from)], b = pos[idVal(e.to)];
        if (!a || !b) continue;
        const mx = Math.round((a.x + b.x) / 2), my = Math.round((a.y + b.y) / 2) - 10;
        const d = orthoPath(a, b);
        const from = idVal(e.from), to = idVal(e.to);
        const scar = scars && (scars.has(fqnOf(graph, e.from) + ">" + fqnOf(graph, e.to)) || scars.has(fqnOf(graph, from) + ">" + fqnOf(graph, to)));
        const kind = e.kind || "Calls";
        svg += '<path class="edge-hit" pathLength="1" data-from="' + from + '" data-to="' + to + '" data-kind="' + esc(kind) + '" d="' + d + '" />';
        svg += '<path class="edge' + (scar ? " scar" : "") + '" pathLength="1" marker-end="url(#arr)" data-from="' + from + '" data-to="' + to + '" data-kind="' + esc(kind) + '" d="' + d + '" />';
        svg += '<path class="edge-flow' + (scar ? " scar" : "") + '" pathLength="1" data-from="' + from + '" data-to="' + to + '" data-kind="' + esc(kind) + '" d="' + d + '" />';
        svg += '<text class="ekind" x="' + mx + '" y="' + my + '" text-anchor="middle" data-from="' + from + '" data-to="' + to + '" data-kind="' + esc(kind) + '">' + esc(kind) + "</text>";
        const pkt = String(kind).toUpperCase().slice(0, 5) + " " + shortToken(to);
        svg += '<g class="pkt"><rect x="-22" y="-7" width="44" height="14" rx="2" /><text x="0" y="3" text-anchor="middle">' + esc(pkt) + '</text><animateMotion dur="1.8s" repeatCount="indefinite" path="' + d + '" /></g>';
      }
      svg += "</svg>";
      const snippets = snapshot && snapshot.snippets || {};
      const walk = flowWalk(flow);
      let cards = "";
      for (const id of nodes) {
        const p = pos[idVal(id)];
        if (!p) continue;
        const nid = idVal(id);
        const kind = kindOf(graph, id) || "Function";
        const fqn = fqnOf(graph, id);
        const label = shortOf(fqn);
        const d = level[nid] || 0;
        const node = nodeById.get(nid);
        const file = node?.span?.file || "";
        const line = node?.span?.start?.line || "";
        const where = file ? shortFile(file) + (line ? ":" + line : "") : "";
        const snip = snippetPreview(snippets[nid]);
        const flags = nodeFlags(nid);
        const away = nodeAway(nid);
        cards += '<button type="button" class="vnode ' + kindClass(kind) + (away ? " away" : "") + (flags.uncovered ? " uncovered" : flags.changed ? " changed" : "") + (selectedNodeId === nid ? " selected" : "") + '" style="left:' + p.x + "px;top:" + p.y + "px;--d:" + d + '" data-id="' + nid + '" data-fqn="' + esc(fqn) + '" data-kind="' + esc(kind) + '" data-file="' + esc(file) + '">';
        const at = walk.indexOf(nid);
        const hopRole = at === 0 ? "START · " : at === walk.length - 1 && walk.length > 1 ? "END · " : "";
        cards += '<span class="kind">' + esc(hopRole + kindLine(nid, kind)) + "</span>";
        cards += '<span class="name">' + esc(label) + "</span>";
        if (where) cards += '<span class="where">' + esc(where) + "</span>";
        cards += '<span class="fqn">' + esc(fqn) + "</span>";
        if (snip) cards += '<pre class="snip">' + esc(snip) + "</pre>";
        cards += "</button>";
      }
      return '<div class="steiner-wrap' + (animate ? " play" : "") + '" style="width:' + W + "px;height:" + H + 'px">' + svg + cards + "</div>";
    }
    function shortFile(file) {
      const f = String(file || "").replace(/\\/g, "/");
      const parts = f.split("/");
      return parts.length > 2 ? parts.slice(-2).join("/") : f;
    }
    function renderRuns(flow, msg, animate) {
      const fc = flow.flowchart || { runs: [], spine: [], positions: [] };
      if (!fc.runs || fc.runs.length < 2) return "";
      const pos = {};
      for (const p of fc.positions || []) pos[idVal(p.run)] = { x: p.x, y: p.y };
      const pins = pinsForCurrent();
      for (const run of fc.runs || []) {
        const pin = pins.get(String(idVal(run.id)));
        if (pin) pos[idVal(run.id)] = { x: pin.x, y: pin.y };
      }
      let maxX = 200, maxY = 120;
      for (const p of Object.values(pos)) {
        maxX = Math.max(maxX, p.x + 240);
        maxY = Math.max(maxY, p.y + 120);
      }
      const bubbleLabel = {};
      for (const b of msg.bubbles || []) bubbleLabel[idVal(b.id)] = b.label;
      let html = '<div class="chart' + (animate ? " play" : "") + '" style="width:' + maxX + "px;height:" + maxY + 'px">';
      html += '<svg class="edges" viewBox="0 0 ' + maxX + " " + maxY + '">';
      for (const s of fc.spine || []) {
        const a = pos[idVal(s.from)];
        const b = pos[idVal(s.to)];
        if (!a || !b) continue;
        const x1 = a.x + 140, y1 = a.y + 28, x2 = b.x, y2 = b.y + 28;
        html += '<path class="spine" pathLength="1" d="M' + x1 + "," + y1 + " C" + (x1 + 40) + "," + y1 + " " + (x2 - 40) + "," + y2 + " " + x2 + "," + y2 + '" />';
        html += '<path class="spine-flow" pathLength="1" d="M' + x1 + "," + y1 + " C" + (x1 + 40) + "," + y1 + " " + (x2 - 40) + "," + y2 + " " + x2 + "," + y2 + '" />';
      }
      html += "</svg>";
      (fc.runs || []).forEach((run, i) => {
        const p = pos[idVal(run.id)] || { x: 0, y: 0 };
        const label = bubbleLabel[idVal(run.bubble)] || "run";
        const nodeIds = (run.nodes || []).map((n) => idVal(n)).join(",");
        const members = run.nodes || [];
        const chips = members.slice(0, 3).map((n) => {
          const id = idVal(n);
          const k = kindOf(msg.graph, n);
          return '<span class="chip ' + kindClass(k) + '">' + esc(shortOf(fqnOf(msg.graph, n))) + " · " + esc(shortToken(id)) + "</span>";
        }).join("");
        html += '<div class="run" style="left:' + p.x + "px;top:" + p.y + "px;--i:" + i + '" data-run="' + idVal(run.id) + '" data-flow="' + esc(flow.name) + '" data-bubble="' + idVal(run.bubble) + '" data-nodes="' + nodeIds + '">';
        html += '<div class="label">' + esc(shortOf(label)) + "</div>";
        html += '<div class="chips">' + chips + (members.length > 3 ? '<span class="chip">+' + (members.length - 3) + "</span>" : "") + "</div></div>";
      });
      html += "</div>";
      return html;
    }
    function renderInner(msg, animate) {
      const inner = msg.inner || { nodes: [] };
      renderTabs(msg.flow ? [msg.flow] : snapshot?.flows || [], inner.flow);
      renderStats(msg);
      renderCoverage(msg.coverage, msg.findings, null);
      setMeta(
        '<button type="button" class="crumb-btn" data-go="programs">Map</button> / ' + esc(inner.flow) + " / <b>enter</b> · walk lit, siblings grey"
      );
      const backToPrograms = meta.querySelector("[data-go=programs]");
      if (backToPrograms) backToPrograms.onclick = () => goBack();
      let html = '<div class="inner-list' + (animate ? " play" : "") + '">';
      (inner.nodes || []).forEach((n, i) => {
        const cls = n.lit ? "lit" : "grey";
        html += '<div class="inode ' + cls + '" style="--i:' + i + '" data-id="' + idVal(n.id) + '" data-leaf="' + (n.is_leaf ? 1 : 0) + '" data-flow="' + esc(inner.flow) + '">';
        html += "<div><b>" + esc(shortOf(n.fqn)) + '</b> <span class="meta">' + esc(n.kind) + (n.is_leaf ? " · leaf · source" : " · bubble") + (n.distance != null && !n.lit ? " · d" + n.distance : "") + "</span></div>";
        html += '<div class="meta">' + esc(n.fqn) + "</div></div>";
      });
      html += "</div>";
      canvas.className = "play";
      canvas.innerHTML = html;
      setZoomUi(false);
      hideTip();
      canvas.querySelectorAll(".inode").forEach((el2) => {
        el2.addEventListener("click", () => {
          const isLeaf = el2.getAttribute("data-leaf") === "1";
          if (!isLeaf) {
            enterRun(el2.getAttribute("data-flow"), el2.getAttribute("data-id"));
            return;
          }
          selectedNodeId = el2.getAttribute("data-id");
          peekSource(selectedNodeId);
        });
      });
    }
    function renderCoverage(cov, findings, graph) {
      const uncovered = cov && cov.uncovered || [];
      const changed = cov && cov.changed || [];
      const { names, holds, broken, skipped, pending } = reviewMarks();
      let html = "Coverage " + changed.length + " changed · " + uncovered.length + " uncovered";
      if (names.length) {
        html += " · Review " + holds + " stamped · " + skipped + " skipped · " + broken + " broken · " + pending + " pending";
        if (!pending && !broken && !uncovered.length) {
          html += ' <span class="live holds">complete</span>';
        }
      }
      if (uncovered.length && graph) {
        const sample = uncovered.slice(0, 3).map((id) => shortOf(fqnOf(graph, id))).filter(Boolean);
        if (sample.length) html += " · e.g. " + sample.map(esc).join(", ");
        if (uncovered.length > 3) html += " +" + (uncovered.length - 3);
      }
      const score = '<div class="score" id="scorecard"><span class="score-chip pending">' + pending + ' left</span><span class="score-chip holds">' + holds + ' stamped</span><span class="score-chip skip">' + skipped + ' skipped</span><span class="score-chip broken">' + broken + " broken</span></div>";
      html = score + '<span class="cov-chip">' + html + "</span>";
      const scars = (findings || []).filter((f) => f.kind === "StampBroken" || f.kind === "UnmatchedHint");
      if (scars.length) {
        html += "<ul>" + scars.slice(0, 4).map((f) => {
          if (f.kind === "UnmatchedHint")
            return '<li class="finding">unmatched ' + esc(f.fqn) + " in " + esc(f.flow) + "</li>";
          return '<li class="finding">stamp broken ' + esc(f.flow) + " · +" + (f.added || []).length + " / −" + (f.removed || []).length + "</li>";
        }).join("") + (scars.length > 4 ? "<li>…</li>" : "") + "</ul>";
      }
      coverage.innerHTML = html;
    }
    function enterBubble(snap, flowName2, bubbleId) {
      const flow = (snap.flows || []).find((f) => f.name === flowName2);
      const bubble = (snap.bubbles || []).find((b) => String(idVal(b.id)) === String(bubbleId));
      if (!flow || !bubble) return { flow: flowName2, bubble: bubbleId, nodes: [] };
      const tree = new Set((flow.tree?.nodes || []).map((id) => String(idVal(id))));
      const children = (snap.bubbles || []).filter(
        (b) => b.parent != null && String(idVal(b.parent)) === String(bubbleId)
      );
      const adj = /* @__PURE__ */ new Map();
      for (const e of snap.graph?.edges || []) {
        const a = String(idVal(e.from)), b = String(idVal(e.to));
        if (!adj.has(a)) adj.set(a, []);
        if (!adj.has(b)) adj.set(b, []);
        adj.get(a).push(b);
        adj.get(b).push(a);
      }
      const distTo = (target) => {
        if (tree.has(target)) return 0;
        const q = [...tree].map((id) => [id, 0]);
        const seen = new Set(tree);
        while (q.length) {
          const [n, d] = q.shift();
          if (n === target) return d;
          for (const m of adj.get(n) || []) {
            if (seen.has(m)) continue;
            seen.add(m);
            q.push([m, d + 1]);
          }
        }
        return 99;
      };
      let nodes;
      if (!children.length) {
        nodes = (bubble.members || []).map((id) => {
          const n = nodeById.get(String(idVal(id)));
          const lit = tree.has(String(idVal(id)));
          return {
            id,
            fqn: n?.fqn ?? String(id),
            kind: n?.kind ?? "Function",
            lit,
            grey: !lit,
            is_leaf: true,
            distance: lit ? 0 : distTo(String(idVal(id)))
          };
        });
      } else {
        nodes = children.map((b) => {
          const members = (b.members || []).map((m) => String(idVal(m)));
          const lit = members.some((m) => tree.has(m));
          const distance = Math.min(...members.map((m) => distTo(m)), 99);
          return {
            id: b.id,
            fqn: b.label,
            kind: "Type",
            lit,
            grey: !lit,
            is_leaf: false,
            distance: lit ? 0 : distance
          };
        });
      }
      nodes.sort(
        (a, b) => Number(b.lit) - Number(a.lit) || (a.distance ?? 99) - (b.distance ?? 99) || String(a.fqn).localeCompare(String(b.fqn))
      );
      if (!children.length && nodes.length > 24) nodes = nodes.slice(0, 24);
      return { flow: flowName2, bubble: bubbleId, nodes };
    }
    function setLlmPane(on) {
      if (!llmPane) return;
      if (on) setExportMenu(false);
      llmPane.hidden = !on;
      llmPane.classList.toggle("open", !!on);
      document.body.classList.toggle("llm-open", !!on);
      if (on) {
        vscode.postMessage({ type: "llmStatus" });
        if (llmAsk) llmAsk.focus();
      }
    }
    function toggleLlmPane() {
      setLlmPane(!(llmPane && !llmPane.hidden));
    }
    function applyLlmStatus(msg) {
      if (llmStatusEl) {
        llmStatusEl.textContent = msg.connected ? "Host " + (msg.baseUrl || "") + " · " + (msg.model || "") : "Graph-only until you save a host. Agents never stamp.";
      }
      if (llmBaseUrl && msg.baseUrl) llmBaseUrl.value = msg.baseUrl;
      if (llmModel && msg.model) llmModel.value = msg.model;
      if (llmBridge) {
        llmBridge.textContent = msg.bridge ? "Bridge " + msg.bridge.url + " — any OpenAI-compatible client, Bearer key." : "Bridge off. Enable graphide.bridge.enabled.";
      }
      if (msg.test) {
        appendLlmLog((msg.test.ok ? "Test ok: " : "Test failed: ") + (msg.test.detail || ""), msg.test.ok ? "ok" : "err");
      }
    }
    function appendLlmLog(text, kind) {
      if (!llmLog) return;
      const row = document.createElement("div");
      row.className = "llm-msg " + (kind || "llm");
      row.textContent = text;
      llmLog.appendChild(row);
      llmLog.scrollTop = llmLog.scrollHeight;
    }
    function localAsk(q) {
      const flow = (typeof defaultRunFlow === "function" ? defaultRunFlow() : null) || currentFlow();
      const nodes = flow && flow.tree && flow.tree.nodes || [];
      const names = nodes.slice(0, 12).map((id) => {
        const n = nodeById.get(idVal(id));
        return shortOf(n && n.fqn || id);
      });
      const path = [];
      const seen = /* @__PURE__ */ new Set();
      for (const id of nodes) {
        const b = typeof bubbleOf === "function" ? bubbleOf(id) : null;
        const label = b && (b.label || b.id);
        if (!label || seen.has(String(label))) continue;
        seen.add(String(label));
        path.push(String(b.label || b.id));
      }
      const lines = [
        "Start → features → end: " + (path.join(" → ") || "(review a repo first)"),
        names.length ? "Control-flow hops: " + names.join(" → ") : "",
        "This answer is from the derived review graph. An LLM is optional. Agents never stamp."
      ];
      if (/uncover|coverage/i.test(q || "") && snapshot && snapshot.coverage) {
        lines.splice(2, 0, "Coverage: " + (snapshot.coverage.changed || []).length + " changed · " + (snapshot.coverage.uncovered || []).length + " uncovered");
      }
      return lines.filter(Boolean).join("\n");
    }
    function sendLlmAsk() {
      if (!llmAsk) return;
      const q = llmAsk.value.trim();
      if (!q) return;
      appendLlmLog(q, "user");
      llmAsk.value = "";
      const token = ++llmTok;
      vscode.postMessage({ type: "llmAsk", prompt: q });
      setTimeout(() => {
        if (token !== llmTok) return;
        appendLlmLog(localAsk(q), "graph");
      }, 160);
    }
    if (typeof applyTheme === "function") window.applyTheme = applyTheme;
    if (typeof toggleTheme === "function") window.toggleTheme = toggleTheme;
    if (typeof applyPreset === "function") window.applyPreset = applyPreset;
    if (typeof cyclePreset === "function") window.cyclePreset = cyclePreset;
    if (typeof applyPresent === "function") window.applyPresent = applyPresent;
    if (typeof togglePresent === "function") window.togglePresent = togglePresent;
  }

  // extension/media/src/index.jsx
  var import_jsx_runtime10 = __toESM(require_jsx_runtime());
  var el = document.getElementById("root");
  if (!el) {
    throw new Error("Graphide desk: #root missing");
  }
  var root = (0, import_client.createRoot)(el);
  (0, import_react_dom.flushSync)(() => {
    root.render(/* @__PURE__ */ (0, import_jsx_runtime10.jsx)(App, {}));
  });
  bootDesk();
})();
