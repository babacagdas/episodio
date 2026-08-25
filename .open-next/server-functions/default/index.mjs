globalThis.monorepoPackagePath = "";globalThis.openNextDebug = false;globalThis.openNextVersion = "4.1.0";globalThis.nextVersion = "16.2.4";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod3) => function __require2() {
  return mod3 || (0, cb[__getOwnPropNames(cb)[0]])((mod3 = { exports: {} }).exports, mod3), mod3.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod3, secondTarget) => (__copyProps(target, mod3, "default"), secondTarget && __copyProps(secondTarget, mod3, "default"));
var __toESM = (mod3, isNodeMode, target) => (target = mod3 != null ? __create(__getProtoOf(mod3)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod3 || !mod3.__esModule ? __defProp(target, "default", { value: mod3, enumerable: true }) : target,
  mod3
));
var __toCommonJS = (mod3) => __copyProps(__defProp({}, "__esModule", { value: true }), mod3);

// node_modules/@opennextjs/aws/dist/utils/error.js
function isOpenNextError(e) {
  try {
    return "__openNextInternal" in e;
  } catch {
    return false;
  }
}
var IgnorableError, FatalError;
var init_error = __esm({
  "node_modules/@opennextjs/aws/dist/utils/error.js"() {
    IgnorableError = class extends Error {
      __openNextInternal = true;
      canIgnore = true;
      logLevel = 0;
      constructor(message) {
        super(message);
        this.name = "IgnorableError";
      }
    };
    FatalError = class extends Error {
      __openNextInternal = true;
      canIgnore = false;
      logLevel = 2;
      constructor(message) {
        super(message);
        this.name = "FatalError";
      }
    };
  }
});

// node_modules/@opennextjs/aws/dist/adapters/logger.js
function debug(...args) {
  if (globalThis.openNextDebug) {
    console.log(...args);
  }
}
function warn(...args) {
  console.warn(...args);
}
function error(...args) {
  if (args.some((arg) => isDownplayedErrorLog(arg))) {
    return debug(...args);
  }
  if (args.some((arg) => isOpenNextError(arg))) {
    const error2 = args.find((arg) => isOpenNextError(arg));
    if (error2.logLevel < getOpenNextErrorLogLevel()) {
      return;
    }
    if (error2.logLevel === 0) {
      return console.log(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    if (error2.logLevel === 1) {
      return warn(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    return console.error(...args);
  }
  console.error(...args);
}
function getOpenNextErrorLogLevel() {
  const strLevel = process.env.OPEN_NEXT_ERROR_LOG_LEVEL ?? "1";
  switch (strLevel.toLowerCase()) {
    case "debug":
    case "0":
      return 0;
    case "error":
    case "2":
      return 2;
    default:
      return 1;
  }
}
var DOWNPLAYED_ERROR_LOGS, isDownplayedErrorLog;
var init_logger = __esm({
  "node_modules/@opennextjs/aws/dist/adapters/logger.js"() {
    init_error();
    DOWNPLAYED_ERROR_LOGS = [
      {
        clientName: "S3Client",
        commandName: "GetObjectCommand",
        errorName: "NoSuchKey"
      }
    ];
    isDownplayedErrorLog = (errorLog) => DOWNPLAYED_ERROR_LOGS.some((downplayedInput) => downplayedInput.clientName === errorLog?.clientName && downplayedInput.commandName === errorLog?.commandName && (downplayedInput.errorName === errorLog?.error?.name || downplayedInput.errorName === errorLog?.error?.Code));
  }
});

// node_modules/@opennextjs/aws/dist/http/util.js
function parseSetCookieHeader(cookies) {
  if (!cookies) {
    return [];
  }
  if (typeof cookies === "string") {
    return cookies.split(/(?<!Expires=\w+),/i).map((c) => c.trim());
  }
  return cookies;
}
function getQueryFromIterator(it) {
  const query = {};
  for (const [key, value] of it) {
    if (key in query) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}
var parseHeaders, convertHeader;
var init_util = __esm({
  "node_modules/@opennextjs/aws/dist/http/util.js"() {
    init_logger();
    parseHeaders = (headers) => {
      const result = {};
      if (!headers) {
        return result;
      }
      for (const [key, value] of Object.entries(headers)) {
        if (value === void 0) {
          continue;
        }
        const keyLower = key.toLowerCase();
        if (keyLower === "location" && Array.isArray(value)) {
          if (value.length === 1 || value[0] === value[1]) {
            result[keyLower] = value[0];
          } else {
            warn("Multiple different values for Location header found. Using the last one");
            result[keyLower] = value[value.length - 1];
          }
          continue;
        }
        result[keyLower] = convertHeader(value);
      }
      return result;
    };
    convertHeader = (header) => {
      if (typeof header === "string") {
        return header;
      }
      if (Array.isArray(header)) {
        return header.join(",");
      }
      return String(header);
    };
  }
});

// node-built-in-modules:node:module
var node_module_exports = {};
import * as node_module_star from "node:module";
var init_node_module = __esm({
  "node-built-in-modules:node:module"() {
    __reExport(node_module_exports, node_module_star);
  }
});

// node_modules/@opennextjs/aws/dist/utils/stream.js
import { ReadableStream as ReadableStream2 } from "node:stream/web";
function emptyReadableStream() {
  if (process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
    return new ReadableStream2({
      pull(controller) {
        maybeSomethingBuffer ??= Buffer.from("SOMETHING");
        controller.enqueue(maybeSomethingBuffer);
        controller.close();
      }
    }, { highWaterMark: 0 });
  }
  return new ReadableStream2({
    start(controller) {
      controller.close();
    }
  });
}
var maybeSomethingBuffer;
var init_stream = __esm({
  "node_modules/@opennextjs/aws/dist/utils/stream.js"() {
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/utils.js
function getQueryFromSearchParams(searchParams) {
  return getQueryFromIterator(searchParams.entries());
}
var init_utils = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/utils.js"() {
    init_util();
  }
});

// node_modules/cookie/dist/index.js
var require_dist = __commonJS({
  "node_modules/cookie/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCookie = parseCookie;
    exports.parse = parseCookie;
    exports.stringifyCookie = stringifyCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    exports.parseSetCookie = parseSetCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    var maxAgeRegExp = /^-?\d+$/;
    var __toString = Object.prototype.toString;
    var NullObject = /* @__PURE__ */ (() => {
      const C = function() {
      };
      C.prototype = /* @__PURE__ */ Object.create(null);
      return C;
    })();
    function parseCookie(str, options) {
      const obj = new NullObject();
      const len = str.length;
      if (len < 2)
        return obj;
      const dec = options?.decode || decode;
      let index = 0;
      do {
        const eqIdx = eqIndex(str, index, len);
        if (eqIdx === -1)
          break;
        const endIdx = endIndex(str, index, len);
        if (eqIdx > endIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        const key = valueSlice(str, index, eqIdx);
        if (obj[key] === void 0) {
          obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
        }
        index = endIdx + 1;
      } while (index < len);
      return obj;
    }
    function stringifyCookie(cookie, options) {
      const enc = options?.encode || encodeURIComponent;
      const cookieStrings = [];
      for (const name of Object.keys(cookie)) {
        const val = cookie[name];
        if (val === void 0)
          continue;
        if (!cookieNameRegExp.test(name)) {
          throw new TypeError(`cookie name is invalid: ${name}`);
        }
        const value = enc(val);
        if (!cookieValueRegExp.test(value)) {
          throw new TypeError(`cookie val is invalid: ${val}`);
        }
        cookieStrings.push(`${name}=${value}`);
      }
      return cookieStrings.join("; ");
    }
    function stringifySetCookie(_name, _val, _opts) {
      const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
      const options = typeof _val === "object" ? _val : _opts;
      const enc = options?.encode || encodeURIComponent;
      if (!cookieNameRegExp.test(cookie.name)) {
        throw new TypeError(`argument name is invalid: ${cookie.name}`);
      }
      const value = cookie.value ? enc(cookie.value) : "";
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError(`argument val is invalid: ${cookie.value}`);
      }
      let str = cookie.name + "=" + value;
      if (cookie.maxAge !== void 0) {
        if (!Number.isInteger(cookie.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
        }
        str += "; Max-Age=" + cookie.maxAge;
      }
      if (cookie.domain) {
        if (!domainValueRegExp.test(cookie.domain)) {
          throw new TypeError(`option domain is invalid: ${cookie.domain}`);
        }
        str += "; Domain=" + cookie.domain;
      }
      if (cookie.path) {
        if (!pathValueRegExp.test(cookie.path)) {
          throw new TypeError(`option path is invalid: ${cookie.path}`);
        }
        str += "; Path=" + cookie.path;
      }
      if (cookie.expires) {
        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${cookie.expires}`);
        }
        str += "; Expires=" + cookie.expires.toUTCString();
      }
      if (cookie.httpOnly) {
        str += "; HttpOnly";
      }
      if (cookie.secure) {
        str += "; Secure";
      }
      if (cookie.partitioned) {
        str += "; Partitioned";
      }
      if (cookie.priority) {
        const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${cookie.priority}`);
        }
      }
      if (cookie.sameSite) {
        const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
        switch (sameSite) {
          case true:
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
        }
      }
      return str;
    }
    function parseSetCookie(str, options) {
      const dec = options?.decode || decode;
      const len = str.length;
      const endIdx = endIndex(str, 0, len);
      const eqIdx = eqIndex(str, 0, endIdx);
      const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
        name: valueSlice(str, 0, eqIdx),
        value: dec(valueSlice(str, eqIdx + 1, endIdx))
      };
      let index = endIdx + 1;
      while (index < len) {
        const endIdx2 = endIndex(str, index, len);
        const eqIdx2 = eqIndex(str, index, endIdx2);
        const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
        const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
        switch (attr.toLowerCase()) {
          case "httponly":
            setCookie.httpOnly = true;
            break;
          case "secure":
            setCookie.secure = true;
            break;
          case "partitioned":
            setCookie.partitioned = true;
            break;
          case "domain":
            setCookie.domain = val;
            break;
          case "path":
            setCookie.path = val;
            break;
          case "max-age":
            if (val && maxAgeRegExp.test(val))
              setCookie.maxAge = Number(val);
            break;
          case "expires":
            if (!val)
              break;
            const date = new Date(val);
            if (Number.isFinite(date.valueOf()))
              setCookie.expires = date;
            break;
          case "priority":
            if (!val)
              break;
            const priority = val.toLowerCase();
            if (priority === "low" || priority === "medium" || priority === "high") {
              setCookie.priority = priority;
            }
            break;
          case "samesite":
            if (!val)
              break;
            const sameSite = val.toLowerCase();
            if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
              setCookie.sameSite = sameSite;
            }
            break;
        }
        index = endIdx2 + 1;
      }
      return setCookie;
    }
    function endIndex(str, min, len) {
      const index = str.indexOf(";", min);
      return index === -1 ? len : index;
    }
    function eqIndex(str, min, max) {
      const index = str.indexOf("=", min);
      return index < max ? index : -1;
    }
    function valueSlice(str, min, max) {
      let start = min;
      let end = max;
      do {
        const code = str.charCodeAt(start);
        if (code !== 32 && code !== 9)
          break;
      } while (++start < end);
      while (end > start) {
        const code = str.charCodeAt(end - 1);
        if (code !== 32 && code !== 9)
          break;
        end--;
      }
      return str.slice(start, end);
    }
    function decode(str) {
      if (str.indexOf("%") === -1)
        return str;
      try {
        return decodeURIComponent(str);
      } catch (e) {
        return str;
      }
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/edge.js
var edge_exports = {};
__export(edge_exports, {
  default: () => edge_default
});
import { Buffer as Buffer2 } from "node:buffer";
var import_cookie, NULL_BODY_STATUSES, converter, edge_default;
var init_edge = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/edge.js"() {
    import_cookie = __toESM(require_dist(), 1);
    init_util();
    init_utils();
    NULL_BODY_STATUSES = /* @__PURE__ */ new Set([101, 103, 204, 205, 304]);
    converter = {
      convertFrom: async (event) => {
        const url = new URL(event.url);
        const searchParams = url.searchParams;
        const query = getQueryFromSearchParams(searchParams);
        const headers = {};
        event.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const rawPath = url.pathname;
        const method = event.method;
        const shouldHaveBody = method !== "GET" && method !== "HEAD";
        const body = shouldHaveBody ? Buffer2.from(await event.arrayBuffer()) : void 0;
        const cookieHeader = event.headers.get("cookie");
        const cookies = cookieHeader ? import_cookie.default.parse(cookieHeader) : {};
        return {
          type: "core",
          method,
          rawPath,
          url: event.url,
          body,
          headers,
          remoteAddress: event.headers.get("x-forwarded-for") ?? "::1",
          query,
          cookies
        };
      },
      convertTo: async (result) => {
        if ("internalEvent" in result) {
          const request = new Request(result.internalEvent.url, {
            body: result.internalEvent.body,
            method: result.internalEvent.method,
            headers: {
              ...result.internalEvent.headers,
              "x-forwarded-host": result.internalEvent.headers.host
            }
          });
          if (globalThis.__dangerous_ON_edge_converter_returns_request === true) {
            return request;
          }
          const cfCache = (result.isISR || result.internalEvent.rawPath.startsWith("/_next/image")) && process.env.DISABLE_CACHE !== "true" ? { cacheEverything: true } : {};
          return fetch(request, {
            // This is a hack to make sure that the response is cached by Cloudflare
            // See https://developers.cloudflare.com/workers/examples/cache-using-fetch/#caching-html-resources
            // @ts-expect-error - This is a Cloudflare specific option
            cf: cfCache
          });
        }
        const headers = new Headers();
        for (const [key, value] of Object.entries(result.headers)) {
          if (key === "set-cookie" && typeof value === "string") {
            const cookies = parseSetCookieHeader(value);
            for (const cookie of cookies) {
              headers.append(key, cookie);
            }
            continue;
          }
          if (Array.isArray(value)) {
            for (const v of value) {
              headers.append(key, v);
            }
          } else {
            headers.set(key, value);
          }
        }
        const body = NULL_BODY_STATUSES.has(result.statusCode) ? null : result.body;
        return new Response(body, {
          status: result.statusCode,
          headers
        });
      },
      name: "edge"
    };
    edge_default = converter;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-node.js
var cloudflare_node_exports = {};
__export(cloudflare_node_exports, {
  default: () => cloudflare_node_default
});
import { Writable } from "node:stream";
var NULL_BODY_STATUSES2, handler, cloudflare_node_default;
var init_cloudflare_node = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-node.js"() {
    NULL_BODY_STATUSES2 = /* @__PURE__ */ new Set([101, 204, 205, 304]);
    handler = async (handler3, converter2) => async (request, env, ctx, abortSignal) => {
      globalThis.process = process;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      }
      const internalEvent = await converter2.convertFrom(request);
      const url = new URL(request.url);
      const { promise: promiseResponse, resolve: resolveResponse } = Promise.withResolvers();
      const streamCreator = {
        writeHeaders(prelude) {
          const { statusCode, cookies, headers } = prelude;
          const responseHeaders = new Headers(headers);
          for (const cookie of cookies) {
            responseHeaders.append("Set-Cookie", cookie);
          }
          if (url.hostname === "localhost") {
            responseHeaders.set("Content-Encoding", "identity");
          }
          if (NULL_BODY_STATUSES2.has(statusCode)) {
            const response2 = new Response(null, {
              status: statusCode,
              headers: responseHeaders
            });
            resolveResponse(response2);
            return new Writable({
              write(chunk, encoding, callback) {
                callback();
              }
            });
          }
          let controller;
          const readable = new ReadableStream({
            start(c) {
              controller = c;
            }
          });
          const response = new Response(readable, {
            status: statusCode,
            headers: responseHeaders
          });
          resolveResponse(response);
          return new Writable({
            write(chunk, encoding, callback) {
              try {
                controller.enqueue(chunk);
              } catch (e) {
                return callback(e);
              }
              callback();
            },
            final(callback) {
              controller.close();
              callback();
            },
            destroy(error2, callback) {
              if (error2) {
                controller.error(error2);
              } else {
                try {
                  controller.close();
                } catch {
                }
              }
              callback(error2);
            }
          });
        },
        // This is for passing along the original abort signal from the initial Request you retrieve in your worker
        // Ensures that the response we pass to NextServer is aborted if the request is aborted
        // By doing this `request.signal.onabort` will work in route handlers
        abortSignal,
        // There is no need to retain the chunks that were pushed to the response stream.
        retainChunks: false
      };
      ctx.waitUntil(handler3(internalEvent, {
        streamCreator,
        waitUntil: ctx.waitUntil.bind(ctx)
      }));
      return promiseResponse;
    };
    cloudflare_node_default = {
      wrapper: handler,
      name: "cloudflare-node",
      supportStreaming: true
    };
  }
});

// node_modules/@opennextjs/aws/dist/overrides/tagCache/dummy.js
var dummy_exports = {};
__export(dummy_exports, {
  default: () => dummy_default
});
var dummyTagCache, dummy_default;
var init_dummy = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/tagCache/dummy.js"() {
    dummyTagCache = {
      name: "dummy",
      mode: "original",
      getByPath: async () => {
        return [];
      },
      getByTag: async () => {
        return [];
      },
      getLastModified: async (_, lastModified) => {
        return lastModified ?? Date.now();
      },
      writeTags: async () => {
        return;
      },
      isStale: async (_path) => {
        return false;
      }
    };
    dummy_default = dummyTagCache;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/queue/dummy.js
var dummy_exports2 = {};
__export(dummy_exports2, {
  default: () => dummy_default2
});
var dummyQueue, dummy_default2;
var init_dummy2 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/queue/dummy.js"() {
    init_error();
    dummyQueue = {
      name: "dummy",
      send: async () => {
        throw new FatalError("Dummy queue is not implemented");
      }
    };
    dummy_default2 = dummyQueue;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/incrementalCache/dummy.js
var dummy_exports3 = {};
__export(dummy_exports3, {
  default: () => dummy_default3
});
var dummyIncrementalCache, dummy_default3;
var init_dummy3 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/incrementalCache/dummy.js"() {
    init_error();
    dummyIncrementalCache = {
      name: "dummy",
      get: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      },
      set: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      },
      delete: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      }
    };
    dummy_default3 = dummyIncrementalCache;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js
var dummy_exports4 = {};
__export(dummy_exports4, {
  default: () => dummy_default4
});
var resolver, dummy_default4;
var init_dummy4 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js"() {
    resolver = {
      name: "dummy"
    };
    dummy_default4 = resolver;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js
var fetch_exports = {};
__export(fetch_exports, {
  default: () => fetch_default
});
var fetchProxy, fetch_default;
var init_fetch = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js"() {
    init_stream();
    fetchProxy = {
      name: "fetch-proxy",
      // @ts-ignore
      proxy: async (internalEvent) => {
        const { url, headers: eventHeaders, method, body } = internalEvent;
        const headers = Object.fromEntries(Object.entries(eventHeaders).filter(([key]) => key.toLowerCase() !== "cf-connecting-ip"));
        const response = await fetch(url, {
          method,
          headers,
          body
        });
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          const cur = responseHeaders[key];
          if (cur === void 0) {
            responseHeaders[key] = value;
          } else if (Array.isArray(cur)) {
            cur.push(value);
          } else {
            responseHeaders[key] = [cur, value];
          }
        });
        return {
          type: "core",
          headers: responseHeaders,
          statusCode: response.status,
          isBase64Encoded: true,
          body: response.body ?? emptyReadableStream()
        };
      }
    };
    fetch_default = fetchProxy;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/cdnInvalidation/dummy.js
var dummy_exports5 = {};
__export(dummy_exports5, {
  default: () => dummy_default5
});
var dummy_default5;
var init_dummy5 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/cdnInvalidation/dummy.js"() {
    dummy_default5 = {
      name: "dummy",
      invalidatePaths: (_) => {
        return Promise.resolve();
      }
    };
  }
});

// node_modules/@opennextjs/aws/dist/core/createMainHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/adapters/util.js
function setNodeEnv() {
  const processEnv = process.env;
  processEnv.NODE_ENV = process.env.NODE_ENV ?? "production";
}
function generateUniqueId() {
  return Math.random().toString(36).slice(2, 8);
}

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
import { AsyncLocalStorage } from "node:async_hooks";

// node_modules/@opennextjs/aws/dist/http/openNextResponse.js
init_logger();
init_util();
import { Transform } from "node:stream";
var SET_COOKIE_HEADER = "set-cookie";
var CANNOT_BE_USED = "This cannot be used in OpenNext";
var OpenNextNodeResponse = class extends Transform {
  fixHeadersFn;
  onEnd;
  streamCreator;
  initialHeaders;
  statusCode;
  statusMessage = "";
  headers = {};
  headersSent = false;
  _chunks = [];
  headersAlreadyFixed = false;
  _cookies = [];
  responseStream;
  bodyLength = 0;
  // To comply with the ServerResponse interface :
  strictContentLength = false;
  assignSocket(_socket) {
    throw new Error(CANNOT_BE_USED);
  }
  detachSocket(_socket) {
    throw new Error(CANNOT_BE_USED);
  }
  // We might have to revisit those 3 in the future
  writeContinue(_callback) {
    throw new Error(CANNOT_BE_USED);
  }
  writeEarlyHints(_hints, _callback) {
    throw new Error(CANNOT_BE_USED);
  }
  writeProcessing() {
    throw new Error(CANNOT_BE_USED);
  }
  /**
   * This is a dummy request object to comply with the ServerResponse interface
   * It will never be defined
   */
  req;
  chunkedEncoding = false;
  shouldKeepAlive = true;
  useChunkedEncodingByDefault = true;
  sendDate = false;
  connection = null;
  socket = null;
  setTimeout(_msecs, _callback) {
    throw new Error(CANNOT_BE_USED);
  }
  addTrailers(_headers) {
    throw new Error(CANNOT_BE_USED);
  }
  constructor(fixHeadersFn, onEnd, streamCreator, initialHeaders, statusCode) {
    super();
    this.fixHeadersFn = fixHeadersFn;
    this.onEnd = onEnd;
    this.streamCreator = streamCreator;
    this.initialHeaders = initialHeaders;
    if (statusCode && Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599) {
      this.statusCode = statusCode;
    }
    streamCreator?.abortSignal?.addEventListener("abort", () => {
      this.destroy();
    });
  }
  // Necessary for next 12
  // We might have to implement all the methods here
  get originalResponse() {
    return this;
  }
  get finished() {
    return this.responseStream ? this.responseStream?.writableFinished : this.writableFinished;
  }
  setHeader(name, value) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      if (Array.isArray(value)) {
        this._cookies = value;
      } else {
        this._cookies = [value];
      }
    }
    this.headers[key] = value;
    return this;
  }
  removeHeader(name) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      this._cookies = [];
    } else {
      delete this.headers[key];
    }
    return this;
  }
  hasHeader(name) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      return this._cookies.length > 0;
    }
    return this.headers[key] !== void 0;
  }
  getHeaders() {
    return this.headers;
  }
  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }
  getHeaderNames() {
    return Object.keys(this.headers);
  }
  // Only used directly in next@14+
  flushHeaders() {
    this.headersSent = true;
    const mergeHeadersPriority = globalThis.__openNextAls?.getStore()?.mergeHeadersPriority ?? "middleware";
    if (this.initialHeaders) {
      this.headers = mergeHeadersPriority === "middleware" ? {
        ...this.headers,
        ...this.initialHeaders
      } : {
        ...this.initialHeaders,
        ...this.headers
      };
      const initialCookies = parseSetCookieHeader(this.initialHeaders[SET_COOKIE_HEADER]?.toString());
      this._cookies = mergeHeadersPriority === "middleware" ? [...this._cookies, ...initialCookies] : [...initialCookies, ...this._cookies];
    }
    this.fixHeaders(this.headers);
    this.fixHeadersForError();
    this.headers[SET_COOKIE_HEADER] = this._cookies;
    const parsedHeaders = parseHeaders(this.headers);
    delete parsedHeaders[SET_COOKIE_HEADER];
    if (this.streamCreator) {
      this.responseStream = this.streamCreator?.writeHeaders({
        statusCode: this.statusCode ?? 200,
        cookies: this._cookies,
        headers: parsedHeaders
      });
      this.pipe(this.responseStream);
    }
  }
  appendHeader(name, value) {
    const key = name.toLowerCase();
    if (!this.hasHeader(key)) {
      return this.setHeader(key, value);
    }
    const existingHeader = this.getHeader(key);
    const toAppend = Array.isArray(value) ? value : [value];
    const newValue = Array.isArray(existingHeader) ? [...existingHeader, ...toAppend] : [existingHeader, ...toAppend];
    return this.setHeader(key, newValue);
  }
  writeHead(statusCode, statusMessage, headers) {
    let _headers = headers;
    let _statusMessage;
    if (typeof statusMessage === "string") {
      _statusMessage = statusMessage;
    } else {
      _headers = statusMessage;
    }
    const finalHeaders = this.headers;
    if (_headers) {
      if (Array.isArray(_headers)) {
        for (let i = 0; i < _headers.length; i += 2) {
          finalHeaders[_headers[i]] = _headers[i + 1];
        }
      } else {
        for (const key of Object.keys(_headers)) {
          finalHeaders[key] = _headers[key];
        }
      }
    }
    this.statusCode = statusCode;
    if (headers) {
      this.headers = finalHeaders;
    }
    this.flushHeaders();
    return this;
  }
  /**
   * OpenNext specific method
   */
  fixHeaders(headers) {
    if (this.headersAlreadyFixed) {
      return;
    }
    this.fixHeadersFn(headers);
    this.headersAlreadyFixed = true;
  }
  getFixedHeaders() {
    this.fixHeaders(this.headers);
    this.fixHeadersForError();
    this.headers[SET_COOKIE_HEADER] = this._cookies;
    return this.headers;
  }
  getBody() {
    return Buffer.concat(this._chunks);
  }
  _internalWrite(chunk, encoding) {
    const buffer = encoding === "buffer" ? chunk : Buffer.from(chunk, encoding);
    this.bodyLength += buffer.length;
    if (this.streamCreator?.retainChunks !== false) {
      this._chunks.push(buffer);
    }
    this.push(buffer);
    this.streamCreator?.onWrite?.();
  }
  _transform(chunk, encoding, callback) {
    if (!this.headersSent) {
      this.flushHeaders();
    }
    this._internalWrite(chunk, encoding);
    callback();
  }
  _flush(callback) {
    if (!this.headersSent) {
      this.flushHeaders();
    }
    globalThis.__openNextAls?.getStore()?.pendingPromiseRunner.add(this.onEnd(this.headers));
    this.streamCreator?.onFinish?.(this.bodyLength);
    if (this.bodyLength === 0 && // We use an env variable here because not all aws account have the same behavior
    // On some aws accounts the response will hang if the body is empty
    // We are modifying the response body here, this is not a good practice
    process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
      debug('Force writing "SOMETHING" to the response body');
      this.push("SOMETHING");
    }
    callback();
  }
  /**
   * New method in Node 18.15+
   * There are probably not used right now in Next.js, but better be safe than sorry
   */
  setHeaders(headers) {
    headers.forEach((value, key) => {
      this.setHeader(key, Array.isArray(value) ? value : value.toString());
    });
    return this;
  }
  /**
   * Next specific methods
   * On earlier versions of next.js, those methods are mandatory to make everything work
   */
  get sent() {
    return this.finished || this.headersSent;
  }
  getHeaderValues(name) {
    const values = this.getHeader(name);
    if (values === void 0)
      return void 0;
    return (Array.isArray(values) ? values : [values]).map((value) => value.toString());
  }
  send() {
    for (const chunk of this._chunks) {
      this.write(chunk);
    }
    this.end();
  }
  body(value) {
    this.write(value);
    return this;
  }
  onClose(callback) {
    this.on("close", callback);
  }
  redirect(destination, statusCode) {
    this.setHeader("Location", destination);
    this.statusCode = statusCode;
    if (statusCode === 308) {
      this.setHeader("Refresh", `0;url=${destination}`);
    }
    return this;
  }
  // For some reason, next returns the 500 error page with some cache-control headers
  // We need to fix that
  fixHeadersForError() {
    if (process.env.OPEN_NEXT_DANGEROUSLY_SET_ERROR_HEADERS === "true") {
      return;
    }
    if (this.statusCode === 404 || this.statusCode === 500) {
      this.headers["cache-control"] = "private, no-cache, no-store, max-age=0, must-revalidate";
    }
  }
};

// node_modules/@opennextjs/aws/dist/http/request.js
import http from "node:http";
var IncomingMessage = class extends http.IncomingMessage {
  constructor({ method, url, headers, body, remoteAddress }) {
    super({
      encrypted: true,
      readable: false,
      remoteAddress,
      address: () => ({ port: 443 }),
      end: Function.prototype,
      destroy: Function.prototype
    });
    if (body) {
      headers["content-length"] ??= String(Buffer.byteLength(body));
    }
    Object.assign(this, {
      ip: remoteAddress,
      complete: true,
      httpVersion: "1.1",
      httpVersionMajor: "1",
      httpVersionMinor: "1",
      method,
      headers,
      body,
      url
    });
    this._read = () => {
      this.push(body);
      this.push(null);
    };
  }
};

// node_modules/@opennextjs/aws/dist/utils/promise.js
init_logger();

// node_modules/@opennextjs/aws/dist/utils/requestCache.js
var RequestCache = class {
  _caches = /* @__PURE__ */ new Map();
  /**
   * Returns the Map registered under `key`.
   * If no Map exists yet for that key, a new empty Map is created, stored, and returned.
   * Repeated calls with the same key always return the **same** Map instance.
   */
  getOrCreate(key) {
    let cache = this._caches.get(key);
    if (!cache) {
      cache = /* @__PURE__ */ new Map();
      this._caches.set(key, cache);
    }
    return cache;
  }
};

// node_modules/@opennextjs/aws/dist/utils/promise.js
var DetachedPromise = class {
  resolve;
  reject;
  promise;
  constructor() {
    let resolve;
    let reject;
    this.promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
  }
};
var DetachedPromiseRunner = class {
  promises = [];
  withResolvers() {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    return detachedPromise;
  }
  add(promise) {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    promise.then(detachedPromise.resolve, detachedPromise.reject);
  }
  async await() {
    debug(`Awaiting ${this.promises.length} detached promises`);
    const results = await Promise.allSettled(this.promises.map((p) => p.promise));
    const rejectedPromises = results.filter((r) => r.status === "rejected");
    rejectedPromises.forEach((r) => {
      error(r.reason);
    });
  }
};
async function awaitAllDetachedPromise() {
  const store = globalThis.__openNextAls.getStore();
  const promisesToAwait = store?.pendingPromiseRunner.await() ?? Promise.resolve();
  if (store?.waitUntil) {
    store.waitUntil(promisesToAwait);
    return;
  }
  await promisesToAwait;
}
function provideNextAfterProvider() {
  const NEXT_REQUEST_CONTEXT_SYMBOL = Symbol.for("@next/request-context");
  const VERCEL_REQUEST_CONTEXT_SYMBOL = Symbol.for("@vercel/request-context");
  const store = globalThis.__openNextAls.getStore();
  const waitUntil = store?.waitUntil ?? ((promise) => store?.pendingPromiseRunner.add(promise));
  const nextAfterContext = {
    get: () => ({
      waitUntil
    })
  };
  globalThis[NEXT_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  if (process.env.EMULATE_VERCEL_REQUEST_CONTEXT) {
    globalThis[VERCEL_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  }
}
function runWithOpenNextRequestContext({ isISRRevalidation, waitUntil, requestId = Math.random().toString(36) }, fn) {
  return globalThis.__openNextAls.run({
    requestId,
    pendingPromiseRunner: new DetachedPromiseRunner(),
    isISRRevalidation,
    waitUntil,
    writtenTags: /* @__PURE__ */ new Set(),
    requestCache: new RequestCache()
  }, async () => {
    provideNextAfterProvider();
    let result;
    try {
      result = await fn();
    } finally {
      await awaitAllDetachedPromise();
    }
    return result;
  });
}

// node_modules/@opennextjs/aws/dist/adapters/config/index.js
init_logger();
import path from "node:path";
globalThis.__dirname ??= "";
var NEXT_DIR = path.join(__dirname, ".next");
var OPEN_NEXT_DIR = path.join(__dirname, ".open-next");
debug({ NEXT_DIR, OPEN_NEXT_DIR });
var NextConfig = { "env": {}, "webpack": null, "typescript": { "ignoreBuildErrors": false }, "typedRoutes": false, "distDir": ".next", "cleanDistDir": true, "assetPrefix": "", "cacheMaxMemorySize": 52428800, "configOrigin": "next.config.mjs", "useFileSystemPublicRoutes": true, "generateEtags": true, "pageExtensions": ["tsx", "ts", "jsx", "js"], "poweredByHeader": true, "compress": true, "images": { "deviceSizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840], "imageSizes": [32, 48, 64, 96, 128, 256, 384], "path": "/_next/image", "loader": "default", "loaderFile": "", "domains": [], "disableStaticImages": false, "minimumCacheTTL": 86400, "formats": ["image/avif", "image/webp"], "maximumRedirects": 3, "maximumResponseBody": 5e7, "dangerouslyAllowLocalIP": false, "dangerouslyAllowSVG": false, "contentSecurityPolicy": "script-src 'none'; frame-src 'none'; sandbox;", "contentDispositionType": "attachment", "localPatterns": [{ "pathname": "**", "search": "" }], "remotePatterns": [{ "protocol": "https", "hostname": "image.tmdb.org" }, { "protocol": "https", "hostname": "placehold.co" }, { "protocol": "https", "hostname": "lh3.googleusercontent.com" }], "qualities": [75], "unoptimized": true, "customCacheHandler": false }, "devIndicators": { "position": "bottom-left" }, "onDemandEntries": { "maxInactiveAge": 6e4, "pagesBufferLength": 5 }, "basePath": "", "sassOptions": {}, "trailingSlash": false, "i18n": null, "productionBrowserSourceMaps": false, "excludeDefaultMomentLocales": true, "reactProductionProfiling": false, "reactStrictMode": null, "reactMaxHeadersLength": 6e3, "httpAgentOptions": { "keepAlive": true }, "logging": { "serverFunctions": true, "browserToTerminal": "warn" }, "compiler": {}, "expireTime": 31536e3, "staticPageGenerationTimeout": 60, "output": "standalone", "modularizeImports": { "@mui/icons-material": { "transform": "@mui/icons-material/{{member}}" }, "lodash": { "transform": "lodash/{{member}}" } }, "outputFileTracingRoot": "C:\\Users\\Startklar\\Desktop\\episodio", "cacheComponents": false, "cacheLife": { "default": { "stale": 300, "revalidate": 900, "expire": 4294967294 }, "seconds": { "stale": 30, "revalidate": 1, "expire": 60 }, "minutes": { "stale": 300, "revalidate": 60, "expire": 3600 }, "hours": { "stale": 300, "revalidate": 3600, "expire": 86400 }, "days": { "stale": 300, "revalidate": 86400, "expire": 604800 }, "weeks": { "stale": 300, "revalidate": 604800, "expire": 2592e3 }, "max": { "stale": 300, "revalidate": 2592e3, "expire": 31536e3 } }, "cacheHandlers": {}, "experimental": { "appNewScrollHandler": false, "useSkewCookie": false, "cssChunking": true, "multiZoneDraftMode": false, "appNavFailHandling": false, "prerenderEarlyExit": true, "serverMinification": true, "linkNoTouchStart": false, "caseSensitiveRoutes": false, "cachedNavigations": false, "partialFallbacks": false, "dynamicOnHover": false, "varyParams": false, "prefetchInlining": false, "preloadEntriesOnStart": true, "clientRouterFilter": true, "clientRouterFilterRedirects": false, "fetchCacheKeyPrefix": "", "proxyPrefetch": "flexible", "optimisticClientCache": true, "manualClientBasePath": false, "cpus": 7, "memoryBasedWorkersCount": false, "imgOptConcurrency": null, "imgOptTimeoutInSeconds": 7, "imgOptMaxInputPixels": 268402689, "imgOptSequentialRead": null, "imgOptSkipMetadata": null, "isrFlushToDisk": true, "workerThreads": false, "optimizeCss": false, "nextScriptWorkers": false, "scrollRestoration": false, "externalDir": false, "disableOptimizedLoading": false, "gzipSize": true, "craCompat": false, "esmExternals": true, "fullySpecified": false, "swcTraceProfiling": false, "forceSwcTransforms": false, "largePageDataBytes": 128e3, "typedEnv": false, "parallelServerCompiles": false, "parallelServerBuildTraces": false, "ppr": false, "authInterrupts": false, "webpackMemoryOptimizations": false, "optimizeServerReact": true, "strictRouteTypes": false, "viewTransition": false, "removeUncaughtErrorAndRejectionListeners": false, "validateRSCRequestHeaders": false, "staleTimes": { "dynamic": 0, "static": 300 }, "reactDebugChannel": true, "serverComponentsHmrCache": true, "staticGenerationMaxConcurrency": 8, "staticGenerationMinPagesPerWorker": 25, "transitionIndicator": false, "gestureTransition": false, "inlineCss": false, "useCache": false, "globalNotFound": false, "browserDebugInfoInTerminal": "warn", "lockDistDir": true, "proxyClientMaxBodySize": 10485760, "hideLogsAfterAbort": false, "mcpServer": true, "turbopackFileSystemCacheForDev": true, "turbopackFileSystemCacheForBuild": false, "turbopackInferModuleSideEffects": true, "turbopackPluginRuntimeStrategy": "childProcesses", "optimizePackageImports": ["lucide-react", "date-fns", "lodash-es", "ramda", "antd", "react-bootstrap", "ahooks", "@ant-design/icons", "@headlessui/react", "@headlessui-float/react", "@heroicons/react/20/solid", "@heroicons/react/24/solid", "@heroicons/react/24/outline", "@visx/visx", "@tremor/react", "rxjs", "@mui/material", "@mui/icons-material", "recharts", "react-use", "effect", "@effect/schema", "@effect/platform", "@effect/platform-node", "@effect/platform-browser", "@effect/platform-bun", "@effect/sql", "@effect/sql-mssql", "@effect/sql-mysql2", "@effect/sql-pg", "@effect/sql-sqlite-node", "@effect/sql-sqlite-bun", "@effect/sql-sqlite-wasm", "@effect/sql-sqlite-react-native", "@effect/rpc", "@effect/rpc-http", "@effect/typeclass", "@effect/experimental", "@effect/opentelemetry", "@material-ui/core", "@material-ui/icons", "@tabler/icons-react", "mui-core", "react-icons/ai", "react-icons/bi", "react-icons/bs", "react-icons/cg", "react-icons/ci", "react-icons/di", "react-icons/fa", "react-icons/fa6", "react-icons/fc", "react-icons/fi", "react-icons/gi", "react-icons/go", "react-icons/gr", "react-icons/hi", "react-icons/hi2", "react-icons/im", "react-icons/io", "react-icons/io5", "react-icons/lia", "react-icons/lib", "react-icons/lu", "react-icons/md", "react-icons/pi", "react-icons/ri", "react-icons/rx", "react-icons/si", "react-icons/sl", "react-icons/tb", "react-icons/tfi", "react-icons/ti", "react-icons/vsc", "react-icons/wi"], "trustHostHeader": false, "isExperimentalCompile": false }, "htmlLimitedBots": "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight", "bundlePagesRouterDependencies": false, "configFileName": "next.config.mjs", "turbopack": { "root": "C:\\Users\\Startklar\\Desktop\\episodio" }, "distDirRoot": ".next" };
var BuildId = "4tbLYpZ6-TqIGLqUNxYsu";
var HtmlPages = ["/404", "/500"];
var RoutesManifest = { "basePath": "", "rewrites": { "beforeFiles": [], "afterFiles": [], "fallback": [] }, "redirects": [{ "source": "/:path+/", "destination": "/:path+", "internal": true, "priority": true, "statusCode": 308, "regex": "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$" }], "routes": { "static": [{ "page": "/", "regex": "^/(?:/)?$", "routeKeys": {}, "namedRegex": "^/(?:/)?$" }, { "page": "/_global-error", "regex": "^/_global\\-error(?:/)?$", "routeKeys": {}, "namedRegex": "^/_global\\-error(?:/)?$" }, { "page": "/_not-found", "regex": "^/_not\\-found(?:/)?$", "routeKeys": {}, "namedRegex": "^/_not\\-found(?:/)?$" }, { "page": "/actor-match", "regex": "^/actor\\-match(?:/)?$", "routeKeys": {}, "namedRegex": "^/actor\\-match(?:/)?$" }, { "page": "/admin", "regex": "^/admin(?:/)?$", "routeKeys": {}, "namedRegex": "^/admin(?:/)?$" }, { "page": "/api/actors/popular", "regex": "^/api/actors/popular(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/actors/popular(?:/)?$" }, { "page": "/api/check-username", "regex": "^/api/check\\-username(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/check\\-username(?:/)?$" }, { "page": "/api/follows/list", "regex": "^/api/follows/list(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/follows/list(?:/)?$" }, { "page": "/api/lists/accept-invite", "regex": "^/api/lists/accept\\-invite(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/lists/accept\\-invite(?:/)?$" }, { "page": "/api/lists/invite", "regex": "^/api/lists/invite(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/lists/invite(?:/)?$" }, { "page": "/api/manager/announcement", "regex": "^/api/manager/announcement(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/manager/announcement(?:/)?$" }, { "page": "/api/manager/ban-user", "regex": "^/api/manager/ban\\-user(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/manager/ban\\-user(?:/)?$" }, { "page": "/api/manager/delete-item", "regex": "^/api/manager/delete\\-item(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/manager/delete\\-item(?:/)?$" }, { "page": "/api/manager/user-audit", "regex": "^/api/manager/user\\-audit(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/manager/user\\-audit(?:/)?$" }, { "page": "/api/profiles/search", "regex": "^/api/profiles/search(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/profiles/search(?:/)?$" }, { "page": "/api/search", "regex": "^/api/search(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/search(?:/)?$" }, { "page": "/api/shows/batch-details", "regex": "^/api/shows/batch\\-details(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/shows/batch\\-details(?:/)?$" }, { "page": "/api/shows/discover", "regex": "^/api/shows/discover(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/shows/discover(?:/)?$" }, { "page": "/api/shows/filter", "regex": "^/api/shows/filter(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/shows/filter(?:/)?$" }, { "page": "/api/shows/providers", "regex": "^/api/shows/providers(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/shows/providers(?:/)?$" }, { "page": "/api/shows/random-pool", "regex": "^/api/shows/random\\-pool(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/shows/random\\-pool(?:/)?$" }, { "page": "/api/theme-music", "regex": "^/api/theme\\-music(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/theme\\-music(?:/)?$" }, { "page": "/api/trending", "regex": "^/api/trending(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/trending(?:/)?$" }, { "page": "/auth/callback", "regex": "^/auth/callback(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/callback(?:/)?$" }, { "page": "/chat", "regex": "^/chat(?:/)?$", "routeKeys": {}, "namedRegex": "^/chat(?:/)?$" }, { "page": "/home", "regex": "^/home(?:/)?$", "routeKeys": {}, "namedRegex": "^/home(?:/)?$" }, { "page": "/kvkk", "regex": "^/kvkk(?:/)?$", "routeKeys": {}, "namedRegex": "^/kvkk(?:/)?$" }, { "page": "/manager", "regex": "^/manager(?:/)?$", "routeKeys": {}, "namedRegex": "^/manager(?:/)?$" }, { "page": "/manager/analytics", "regex": "^/manager/analytics(?:/)?$", "routeKeys": {}, "namedRegex": "^/manager/analytics(?:/)?$" }, { "page": "/manifest.webmanifest", "regex": "^/manifest\\.webmanifest(?:/)?$", "routeKeys": {}, "namedRegex": "^/manifest\\.webmanifest(?:/)?$" }, { "page": "/notifications", "regex": "^/notifications(?:/)?$", "routeKeys": {}, "namedRegex": "^/notifications(?:/)?$" }, { "page": "/privacy", "regex": "^/privacy(?:/)?$", "routeKeys": {}, "namedRegex": "^/privacy(?:/)?$" }, { "page": "/profile", "regex": "^/profile(?:/)?$", "routeKeys": {}, "namedRegex": "^/profile(?:/)?$" }, { "page": "/robots.txt", "regex": "^/robots\\.txt(?:/)?$", "routeKeys": {}, "namedRegex": "^/robots\\.txt(?:/)?$" }, { "page": "/search", "regex": "^/search(?:/)?$", "routeKeys": {}, "namedRegex": "^/search(?:/)?$" }, { "page": "/signin", "regex": "^/signin(?:/)?$", "routeKeys": {}, "namedRegex": "^/signin(?:/)?$" }, { "page": "/signup", "regex": "^/signup(?:/)?$", "routeKeys": {}, "namedRegex": "^/signup(?:/)?$" }, { "page": "/sitemap.xml", "regex": "^/sitemap\\.xml(?:/)?$", "routeKeys": {}, "namedRegex": "^/sitemap\\.xml(?:/)?$" }, { "page": "/swiper", "regex": "^/swiper(?:/)?$", "routeKeys": {}, "namedRegex": "^/swiper(?:/)?$" }, { "page": "/watchlist", "regex": "^/watchlist(?:/)?$", "routeKeys": {}, "namedRegex": "^/watchlist(?:/)?$" }, { "page": "/wrapped", "regex": "^/wrapped(?:/)?$", "routeKeys": {}, "namedRegex": "^/wrapped(?:/)?$" }], "dynamic": [{ "page": "/api/show/[id]/season/[seasonNumber]", "regex": "^/api/show/([^/]+?)/season/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid", "nxtPseasonNumber": "nxtPseasonNumber" }, "namedRegex": "^/api/show/(?<nxtPid>[^/]+?)/season/(?<nxtPseasonNumber>[^/]+?)(?:/)?$" }, { "page": "/api/tmdb/show/[id]", "regex": "^/api/tmdb/show/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/api/tmdb/show/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/list/[id]", "regex": "^/list/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/list/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/person/[id]", "regex": "^/person/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/person/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/show/[id]", "regex": "^/show/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/show/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/show/[id]/season/[seasonNumber]/episode/[episodeNumber]", "regex": "^/show/([^/]+?)/season/([^/]+?)/episode/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid", "nxtPseasonNumber": "nxtPseasonNumber", "nxtPepisodeNumber": "nxtPepisodeNumber" }, "namedRegex": "^/show/(?<nxtPid>[^/]+?)/season/(?<nxtPseasonNumber>[^/]+?)/episode/(?<nxtPepisodeNumber>[^/]+?)(?:/)?$" }, { "page": "/u/[username]", "regex": "^/u/([^/]+?)(?:/)?$", "routeKeys": { "nxtPusername": "nxtPusername" }, "namedRegex": "^/u/(?<nxtPusername>[^/]+?)(?:/)?$" }], "data": { "static": [], "dynamic": [] } }, "locales": [] };
var PrerenderManifest = { "version": 4, "routes": { "/_global-error": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/_global-error", "dataRoute": "/_global-error.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/_not-found": { "initialStatus": 404, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/_not-found", "dataRoute": "/_not-found.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/actor-match": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/actor-match", "dataRoute": "/actor-match.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/actors/popular": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/actors/layout,_N_T_/api/actors/popular/layout,_N_T_/api/actors/popular/route,_N_T_/api/actors/popular" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/actors/popular", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/check-username": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/check-username/layout,_N_T_/api/check-username/route,_N_T_/api/check-username" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/check-username", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/follows/list": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/follows/layout,_N_T_/api/follows/list/layout,_N_T_/api/follows/list/route,_N_T_/api/follows/list" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/follows/list", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/profiles/search": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/profiles/layout,_N_T_/api/profiles/search/layout,_N_T_/api/profiles/search/route,_N_T_/api/profiles/search" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/profiles/search", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/search": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/search/layout,_N_T_/api/search/route,_N_T_/api/search" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/search", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/shows/batch-details": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/shows/layout,_N_T_/api/shows/batch-details/layout,_N_T_/api/shows/batch-details/route,_N_T_/api/shows/batch-details" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/shows/batch-details", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/shows/discover": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/shows/layout,_N_T_/api/shows/discover/layout,_N_T_/api/shows/discover/route,_N_T_/api/shows/discover" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/shows/discover", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/shows/filter": { "initialHeaders": { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600", "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/shows/layout,_N_T_/api/shows/filter/layout,_N_T_/api/shows/filter/route,_N_T_/api/shows/filter" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/shows/filter", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/shows/providers": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/shows/layout,_N_T_/api/shows/providers/layout,_N_T_/api/shows/providers/route,_N_T_/api/shows/providers" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": 86400, "initialExpireSeconds": 31536e3, "srcRoute": "/api/shows/providers", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/shows/random-pool": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/shows/layout,_N_T_/api/shows/random-pool/layout,_N_T_/api/shows/random-pool/route,_N_T_/api/shows/random-pool" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": 86400, "initialExpireSeconds": 31536e3, "srcRoute": "/api/shows/random-pool", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/theme-music": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/theme-music/layout,_N_T_/api/theme-music/route,_N_T_/api/theme-music" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/theme-music", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/api/trending": { "initialHeaders": { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400", "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/trending/layout,_N_T_/api/trending/route,_N_T_/api/trending" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": 86400, "initialExpireSeconds": 31536e3, "srcRoute": "/api/trending", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/kvkk": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/kvkk", "dataRoute": "/kvkk.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/manifest.webmanifest": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "application/manifest+json", "x-next-cache-tags": "_N_T_/layout,_N_T_/manifest.webmanifest/layout,_N_T_/manifest.webmanifest/route,_N_T_/manifest.webmanifest" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/manifest.webmanifest", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/privacy": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/privacy", "dataRoute": "/privacy.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/robots.txt": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "text/plain", "x-next-cache-tags": "_N_T_/layout,_N_T_/robots.txt/layout,_N_T_/robots.txt/route,_N_T_/robots.txt" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/robots.txt", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/search": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/search", "dataRoute": "/search.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/signin": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/signin", "dataRoute": "/signin.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/signup": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/signup", "dataRoute": "/signup.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/sitemap.xml": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "application/xml", "x-next-cache-tags": "_N_T_/layout,_N_T_/sitemap.xml/layout,_N_T_/sitemap.xml/route,_N_T_/sitemap.xml" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": 86400, "initialExpireSeconds": 31536e3, "srcRoute": "/sitemap.xml", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/swiper": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/swiper", "dataRoute": "/swiper.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/watchlist": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/watchlist", "dataRoute": "/watchlist.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/wrapped": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/wrapped", "dataRoute": "/wrapped.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] } }, "dynamicRoutes": {}, "notFoundRoutes": [], "preview": { "previewModeId": "871b371562f150fd1359ece1f14c3d7e", "previewModeSigningKey": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf", "previewModeEncryptionKey": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b" } };
var MiddlewareManifest = { "version": 3, "middleware": {}, "sortedMiddleware": [], "functions": { "/admin/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/app/admin/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__0l~mo.9._.js", "server/edge/chunks/ssr/_0knlm9_._.js", "server/edge/chunks/ssr/node_modules_next_0tb849j._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/node_modules_next_dist_0lkxy6y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_10.qa3a._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_07cqn53.js", "server/edge/chunks/ssr/[root-of-the-server]__0sn_y7s._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0w6ntw3.js", "server/app/admin/page/react-loadable-manifest.js"], "name": "app/admin/page", "page": "/admin/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0w6ntw3.js", "matchers": [{ "regexp": "^/admin(?:/)?$", "originalSource": "/admin" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/api/lists/accept-invite/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/lists/accept-invite/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_lists_accept-invite_route_actions_0b43va0.js", "server/edge/chunks/[root-of-the-server]__04m8xuq._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/_0btidgo._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0vben5b.js"], "name": "app/api/lists/accept-invite/route", "page": "/api/lists/accept-invite/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0vben5b.js", "matchers": [{ "regexp": "^/api/lists/accept-invite(?:/)?$", "originalSource": "/api/lists/accept-invite" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/api/lists/invite/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/lists/invite/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_lists_invite_route_actions_03ui_sy.js", "server/edge/chunks/[root-of-the-server]__0kb4q7v._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/_0btidgo._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0qsnl_3.js"], "name": "app/api/lists/invite/route", "page": "/api/lists/invite/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0qsnl_3.js", "matchers": [{ "regexp": "^/api/lists/invite(?:/)?$", "originalSource": "/api/lists/invite" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/api/manager/announcement/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/manager/announcement/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_manager_announcement_route_actions_0va35p9.js", "server/edge/chunks/[root-of-the-server]__0..z6lq._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/_0.pti5r._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_01gd1e4.js"], "name": "app/api/manager/announcement/route", "page": "/api/manager/announcement/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_01gd1e4.js", "matchers": [{ "regexp": "^/api/manager/announcement(?:/)?$", "originalSource": "/api/manager/announcement" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/api/manager/ban-user/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/manager/ban-user/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_manager_ban-user_route_actions_11x3cmo.js", "server/edge/chunks/[root-of-the-server]__0_g2x26._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/_0.pti5r._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0qqg_3w.js"], "name": "app/api/manager/ban-user/route", "page": "/api/manager/ban-user/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0qqg_3w.js", "matchers": [{ "regexp": "^/api/manager/ban-user(?:/)?$", "originalSource": "/api/manager/ban-user" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/api/manager/delete-item/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/manager/delete-item/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_manager_delete-item_route_actions_0luhxwq.js", "server/edge/chunks/[root-of-the-server]__0yd7q52._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/_0.pti5r._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0pxjij~.js"], "name": "app/api/manager/delete-item/route", "page": "/api/manager/delete-item/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0pxjij~.js", "matchers": [{ "regexp": "^/api/manager/delete-item(?:/)?$", "originalSource": "/api/manager/delete-item" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/api/manager/user-audit/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/manager/user-audit/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_manager_user-audit_route_actions_0qkdyjv.js", "server/edge/chunks/[root-of-the-server]__0urx70p._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/_0.pti5r._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0fo.o2a.js"], "name": "app/api/manager/user-audit/route", "page": "/api/manager/user-audit/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0fo.o2a.js", "matchers": [{ "regexp": "^/api/manager/user-audit(?:/)?$", "originalSource": "/api/manager/user-audit" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/api/show/[id]/season/[seasonNumber]/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/show/[id]/season/[seasonNumber]/route_client-reference-manifest.js", "server/edge/chunks/0zjb_server_app_api_show_[id]_season_[seasonNumber]_route_actions_0kosv64.js", "server/edge/chunks/[root-of-the-server]__03ouf9.._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_05r7x62.js"], "name": "app/api/show/[id]/season/[seasonNumber]/route", "page": "/api/show/[id]/season/[seasonNumber]/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_05r7x62.js", "matchers": [{ "regexp": "^/api/show/(?P<nxtPid>[^/]+?)/season/(?P<nxtPseasonNumber>[^/]+?)(?:/)?$", "originalSource": "/api/show/[id]/season/[seasonNumber]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/api/tmdb/show/[id]/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/tmdb/show/[id]/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_tmdb_show_[id]_route_actions_072d75_.js", "server/edge/chunks/[root-of-the-server]__11qi.~i._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_06qjmqg.js"], "name": "app/api/tmdb/show/[id]/route", "page": "/api/tmdb/show/[id]/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_06qjmqg.js", "matchers": [{ "regexp": "^/api/tmdb/show/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/api/tmdb/show/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/auth/callback/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/auth/callback/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_auth_callback_route_actions_01c37h5.js", "server/edge/chunks/[root-of-the-server]__0zi6ntd._.js", "server/edge/chunks/node_modules_next_dist_0xe_ec8._.js", "server/edge/chunks/_0.pti5r._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_07s0dd3.js"], "name": "app/auth/callback/route", "page": "/auth/callback/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_07s0dd3.js", "matchers": [{ "regexp": "^/auth/callback(?:/)?$", "originalSource": "/auth/callback" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/chat/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/node_modules_next_dist_01if~a-._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/edge/chunks/ssr/app_chat_ChatClient_tsx_0x.5nf9._.js", "server/app/chat/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_chat_page_actions_0.msz6f.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_071ql5n.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/[root-of-the-server]__0334l-0._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0o.98mg.js", "server/app/chat/page/react-loadable-manifest.js"], "name": "app/chat/page", "page": "/chat/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0o.98mg.js", "matchers": [{ "regexp": "^/chat(?:/)?$", "originalSource": "/chat" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/home/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/_02hhu5b._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/edge/chunks/ssr/app_home_0~4itcx._.js", "server/app/home/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_home_page_actions_0e9vo1g.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/[root-of-the-server]__0i91_bi._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0wns2bk.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/_0~awx~w._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0h7rjt9.js", "server/app/home/page/react-loadable-manifest.js"], "name": "app/home/page", "page": "/home/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0h7rjt9.js", "matchers": [{ "regexp": "^/home(?:/)?$", "originalSource": "/home" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/list/[id]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/_0.dvi~q._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/app/list/[id]/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_list_[id]_page_actions_0haxoya.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_09j3dbj.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/[root-of-the-server]__0s73uln._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_07u75hf.js", "server/app/list/[id]/page/react-loadable-manifest.js"], "name": "app/list/[id]/page", "page": "/list/[id]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_07u75hf.js", "matchers": [{ "regexp": "^/list/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/list/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/manager/analytics/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/app_manager_06ux671._.js", "server/app/manager/analytics/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_manager_analytics_page_actions_0fvcrnp.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0d9opso.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/[root-of-the-server]__05z4ve3._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0oo3n.n.js", "server/app/manager/analytics/page/react-loadable-manifest.js"], "name": "app/manager/analytics/page", "page": "/manager/analytics/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0oo3n.n.js", "matchers": [{ "regexp": "^/manager/analytics(?:/)?$", "originalSource": "/manager/analytics" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/manager/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/app_manager_ManagerPinAuth_tsx_0rdvak3._.js", "server/edge/chunks/ssr/app_manager_0cfz2ht._.js", "server/app/manager/page_client-reference-manifest.js", "server/edge/chunks/ssr/node_modules_next_dist_0y-07gv._.js", "server/edge/chunks/ssr/[root-of-the-server]__123n1gj._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_0sg_8wm._.js", "server/edge/chunks/ssr/app_manager_0jv0qm-._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_0lkxy6y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_0tb849j._.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0d5gect.js", "server/edge/chunks/ssr/[root-of-the-server]__0wybrpo._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0j8nbsp.js", "server/app/manager/page/react-loadable-manifest.js"], "name": "app/manager/page", "page": "/manager/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0j8nbsp.js", "matchers": [{ "regexp": "^/manager(?:/)?$", "originalSource": "/manager" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/notifications/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/_0to2655._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/app/notifications/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_notifications_page_actions_0qx8dn0.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0mteenf.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/[root-of-the-server]__0tvwrt~._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0focii2.js", "server/app/notifications/page/react-loadable-manifest.js"], "name": "app/notifications/page", "page": "/notifications/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0focii2.js", "matchers": [{ "regexp": "^/notifications(?:/)?$", "originalSource": "/notifications" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_api_navigation_00kxro9.js", "server/edge/chunks/ssr/app_SplashClient_tsx_0rml_va._.js", "server/app/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_page_actions_0ihycwx.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0iuue-k.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/[root-of-the-server]__0wunoy1._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0jgtzkc.js", "server/app/page/react-loadable-manifest.js"], "name": "app/page", "page": "/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0jgtzkc.js", "matchers": [{ "regexp": "^/(?:/)?$", "originalSource": "/" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/person/[id]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/_06-90mx._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/app/person/[id]/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_person_[id]_page_actions_0glph.4.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0hm837q.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/[root-of-the-server]__0t5kge3._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0k2pxu..js", "server/app/person/[id]/page/react-loadable-manifest.js"], "name": "app/person/[id]/page", "page": "/person/[id]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0k2pxu..js", "matchers": [{ "regexp": "^/person/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/person/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/profile/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/_02-l9i5._.js", "server/edge/chunks/ssr/_0hfq0gw._.js", "server/edge/chunks/ssr/app_profile_ProfileContent_tsx_0ytnkzv._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/app/profile/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_profile_page_actions_0lfdv1k.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0g_kx-..js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/[root-of-the-server]__0g4x1ig._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0s_4i1m.js", "server/app/profile/page/react-loadable-manifest.js"], "name": "app/profile/page", "page": "/profile/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0s_4i1m.js", "matchers": [{ "regexp": "^/profile(?:/)?$", "originalSource": "/profile" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/show/[id]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/_0zqtppt._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/edge/chunks/ssr/app_show_[id]_12lfq1~._.js", "server/app/show/[id]/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_show_[id]_page_actions_0noe_-r.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/[root-of-the-server]__103-u_~._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0kj0.jc.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0_94r4z.js", "server/app/show/[id]/page/react-loadable-manifest.js"], "name": "app/show/[id]/page", "page": "/show/[id]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0_94r4z.js", "matchers": [{ "regexp": "^/show/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/show/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/show/[id]/season/[seasonNumber]/episode/[episodeNumber]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/_004aiyh._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/edge/chunks/ssr/04w5_season_[seasonNumber]_episode_[episodeNumber]_EpisodeDiscussion_tsx_13vr6zs._.js", "server/app/show/[id]/season/[seasonNumber]/episode/[episodeNumber]/page_client-reference-manifest.js", "server/edge/chunks/ssr/0ash_show_[id]_season_[seasonNumber]_episode_[episodeNumber]_page_actions_06xt3xy.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/[root-of-the-server]__0yzeahr._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0du80z8.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_10krhk4.js", "server/app/show/[id]/season/[seasonNumber]/episode/[episodeNumber]/page/react-loadable-manifest.js"], "name": "app/show/[id]/season/[seasonNumber]/episode/[episodeNumber]/page", "page": "/show/[id]/season/[seasonNumber]/episode/[episodeNumber]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_10krhk4.js", "matchers": [{ "regexp": "^/show/(?P<nxtPid>[^/]+?)/season/(?P<nxtPseasonNumber>[^/]+?)/episode/(?P<nxtPepisodeNumber>[^/]+?)(?:/)?$", "originalSource": "/show/[id]/season/[seasonNumber]/episode/[episodeNumber]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } }, "/u/[username]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/node_modules_0t4uqwm._.js", "server/edge/chunks/ssr/node_modules_0d8g-oq._.js", "server/edge/chunks/ssr/[root-of-the-server]__0fzf_~u._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_12114qv._.js", "server/edge/chunks/ssr/_0.a_m90._.js", "server/edge/chunks/ssr/node_modules_next_dist_0bwtoun._.js", "server/edge/chunks/ssr/node_modules_next_dist_10msz3l._.js", "server/edge/chunks/ssr/node_modules_next_dist_0ai3pym._.js", "server/edge/chunks/ssr/_0tp2918._.js", "server/edge/chunks/ssr/_07v3y0v._.js", "server/edge/chunks/ssr/_02-l9i5._.js", "server/app/u/[username]/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_u_[username]_page_actions_0one-d5.js", "server/edge/chunks/ssr/node_modules_0dq428y._.js", "server/edge/chunks/ssr/node_modules_next_dist_11o9.b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0tleqjn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0wr6h7~.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_0rhm6ao.js", "server/edge/chunks/ssr/node_modules_next_dist_02.j-69._.js", "server/edge/chunks/ssr/app_u_[username]_0lo~otw._.js", "server/edge/chunks/ssr/[root-of-the-server]__0-19e~e._.js", "server/edge/chunks/ssr/node_modules_next_dist_040xe02._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_07ej-v4._.js", "server/edge/chunks/ssr/_05g6tdw._.js", "server/edge/chunks/ssr/node_modules_0gbahfn._.js", "server/edge/chunks/ssr/[root-of-the-server]__0_22xli._.js", "server/edge/chunks/ssr/node_modules_next_dist_0_7_jh9._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_08jf~g7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0a5tena._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_10x2ygg.js", "server/app/u/[username]/page/react-loadable-manifest.js"], "name": "app/u/[username]/page", "page": "/u/[username]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_10x2ygg.js", "matchers": [{ "regexp": "^/u/(?P<nxtPusername>[^/]+?)(?:/)?$", "originalSource": "/u/[username]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "4tbLYpZ6-TqIGLqUNxYsu", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "LMRZwQqELEvZ5sCHBOjEdf1rxa+T4sDbSZNByoR4iwY=", "__NEXT_PREVIEW_MODE_ID": "871b371562f150fd1359ece1f14c3d7e", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "4550c24d6080ca32ff5bbc527e8f55f2364ecd6f8e492ac24a2515c35420a74b", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "b2ecb3b845a95e3c7f6f3814332fe09f7d9f0e24b137f1b7cc03a5971632c7bf" } } } };
var AppPathRoutesManifest = { "/_global-error/page": "/_global-error", "/_not-found/page": "/_not-found", "/actor-match/page": "/actor-match", "/admin/page": "/admin", "/api/actors/popular/route": "/api/actors/popular", "/api/check-username/route": "/api/check-username", "/api/follows/list/route": "/api/follows/list", "/api/lists/accept-invite/route": "/api/lists/accept-invite", "/api/lists/invite/route": "/api/lists/invite", "/api/manager/announcement/route": "/api/manager/announcement", "/api/manager/ban-user/route": "/api/manager/ban-user", "/api/manager/delete-item/route": "/api/manager/delete-item", "/api/manager/user-audit/route": "/api/manager/user-audit", "/api/profiles/search/route": "/api/profiles/search", "/api/search/route": "/api/search", "/api/show/[id]/season/[seasonNumber]/route": "/api/show/[id]/season/[seasonNumber]", "/api/shows/batch-details/route": "/api/shows/batch-details", "/api/shows/discover/route": "/api/shows/discover", "/api/shows/filter/route": "/api/shows/filter", "/api/shows/providers/route": "/api/shows/providers", "/api/shows/random-pool/route": "/api/shows/random-pool", "/api/theme-music/route": "/api/theme-music", "/api/tmdb/show/[id]/route": "/api/tmdb/show/[id]", "/api/trending/route": "/api/trending", "/auth/callback/route": "/auth/callback", "/chat/page": "/chat", "/home/page": "/home", "/kvkk/page": "/kvkk", "/list/[id]/page": "/list/[id]", "/manager/analytics/page": "/manager/analytics", "/manager/page": "/manager", "/manifest.webmanifest/route": "/manifest.webmanifest", "/notifications/page": "/notifications", "/page": "/", "/person/[id]/page": "/person/[id]", "/privacy/page": "/privacy", "/profile/page": "/profile", "/robots.txt/route": "/robots.txt", "/search/page": "/search", "/show/[id]/page": "/show/[id]", "/show/[id]/season/[seasonNumber]/episode/[episodeNumber]/page": "/show/[id]/season/[seasonNumber]/episode/[episodeNumber]", "/signin/page": "/signin", "/signup/page": "/signup", "/sitemap.xml/route": "/sitemap.xml", "/swiper/page": "/swiper", "/u/[username]/page": "/u/[username]", "/watchlist/page": "/watchlist", "/wrapped/page": "/wrapped" };
var FunctionsConfigManifest = { "version": 1, "functions": { "/": {}, "/admin": {}, "/api/lists/accept-invite": {}, "/api/lists/invite": {}, "/api/manager/announcement": {}, "/api/manager/ban-user": {}, "/api/manager/delete-item": {}, "/api/manager/user-audit": {}, "/api/show/[id]/season/[seasonNumber]": {}, "/api/tmdb/show/[id]": {}, "/auth/callback": {}, "/chat": {}, "/home": {}, "/list/[id]": {}, "/manager": {}, "/manager/analytics": {}, "/notifications": {}, "/person/[id]": {}, "/profile": {}, "/show/[id]": {}, "/show/[id]/season/[seasonNumber]/episode/[episodeNumber]": {}, "/u/[username]": {} } };
var PagesManifest = { "/404": "pages/404.html", "/500": "pages/500.html" };
process.env.NEXT_BUILD_ID = BuildId;
process.env.OPEN_NEXT_BUILD_ID = NextConfig.deploymentId ?? BuildId;
process.env.NEXT_PREVIEW_MODE_ID = PrerenderManifest?.preview?.previewModeId;

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/patchAsyncStorage.js
var mod = (init_node_module(), __toCommonJS(node_module_exports));
var resolveFilename = mod._resolveFilename;

// node_modules/@opennextjs/aws/dist/core/routing/util.js
import crypto from "node:crypto";
init_util();
init_logger();
import { ReadableStream as ReadableStream3 } from "node:stream/web";

// node_modules/@opennextjs/aws/dist/utils/binary.js
var commonBinaryMimeTypes = /* @__PURE__ */ new Set([
  "application/octet-stream",
  // Docs
  "application/epub+zip",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.amazon.ebook",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Fonts
  "font/otf",
  "font/woff",
  "font/woff2",
  // Images
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/vnd.microsoft.icon",
  "image/webp",
  // Audio
  "audio/3gpp",
  "audio/aac",
  "audio/basic",
  "audio/flac",
  "audio/mpeg",
  "audio/ogg",
  "audio/wavaudio/webm",
  "audio/x-aiff",
  "audio/x-midi",
  "audio/x-wav",
  // Video
  "video/3gpp",
  "video/mp2t",
  "video/mpeg",
  "video/ogg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  // Archives
  "application/java-archive",
  "application/vnd.apple.installer+xml",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-zip",
  "application/zip",
  // Serialized data
  "application/x-protobuf"
]);
function isBinaryContentType(contentType) {
  if (!contentType)
    return false;
  const value = contentType.split(";")[0];
  return commonBinaryMimeTypes.has(value);
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/i18n/accept-header.js
function parse(raw, preferences, options) {
  const lowers = /* @__PURE__ */ new Map();
  const header = raw.replace(/[ \t]/g, "");
  if (preferences) {
    let pos = 0;
    for (const preference of preferences) {
      const lower = preference.toLowerCase();
      lowers.set(lower, { orig: preference, pos: pos++ });
      if (options.prefixMatch) {
        const parts2 = lower.split("-");
        while (parts2.pop(), parts2.length > 0) {
          const joined = parts2.join("-");
          if (!lowers.has(joined)) {
            lowers.set(joined, { orig: preference, pos: pos++ });
          }
        }
      }
    }
  }
  const parts = header.split(",");
  const selections = [];
  const map = /* @__PURE__ */ new Set();
  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    const params = part.split(";");
    if (params.length > 2) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const token = params[0].toLowerCase();
    if (!token) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const selection = { token, pos: i, q: 1 };
    if (preferences && lowers.has(token)) {
      selection.pref = lowers.get(token).pos;
    }
    map.add(selection.token);
    if (params.length === 2) {
      const q = params[1];
      const [key, value] = q.split("=");
      if (!value || key !== "q" && key !== "Q") {
        throw new Error(`Invalid ${options.type} header`);
      }
      const score = Number.parseFloat(value);
      if (score === 0) {
        continue;
      }
      if (Number.isFinite(score) && score <= 1 && score >= 1e-3) {
        selection.q = score;
      }
    }
    selections.push(selection);
  }
  selections.sort((a, b) => {
    if (b.q !== a.q) {
      return b.q - a.q;
    }
    if (b.pref !== a.pref) {
      if (a.pref === void 0) {
        return 1;
      }
      if (b.pref === void 0) {
        return -1;
      }
      return a.pref - b.pref;
    }
    return a.pos - b.pos;
  });
  const values = selections.map((selection) => selection.token);
  if (!preferences || !preferences.length) {
    return values;
  }
  const preferred = [];
  for (const selection of values) {
    if (selection === "*") {
      for (const [preference, value] of lowers) {
        if (!map.has(preference)) {
          preferred.push(value.orig);
        }
      }
    } else {
      const lower = selection.toLowerCase();
      if (lowers.has(lower)) {
        preferred.push(lowers.get(lower).orig);
      }
    }
  }
  return preferred;
}
function acceptLanguage(header = "", preferences) {
  return parse(header, preferences, {
    type: "accept-language",
    prefixMatch: true
  })[0] || void 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
function isLocalizedPath(path2) {
  return NextConfig.i18n?.locales.includes(path2.split("/")[1].toLowerCase()) ?? false;
}
function getLocaleFromCookie(cookies) {
  const i18n = NextConfig.i18n;
  const nextLocale = cookies.NEXT_LOCALE?.toLowerCase();
  return nextLocale ? i18n?.locales.find((locale) => nextLocale === locale.toLowerCase()) : void 0;
}
function detectDomainLocale({ hostname, detectedLocale }) {
  const i18n = NextConfig.i18n;
  const domains = i18n?.domains;
  if (!domains) {
    return;
  }
  const lowercasedLocale = detectedLocale?.toLowerCase();
  for (const domain of domains) {
    const domainHostname = domain.domain.split(":", 1)[0].toLowerCase();
    if (hostname === domainHostname || lowercasedLocale === domain.defaultLocale.toLowerCase() || domain.locales?.some((locale) => lowercasedLocale === locale.toLowerCase())) {
      return domain;
    }
  }
}
function detectLocale(internalEvent, i18n) {
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  if (i18n.localeDetection === false) {
    return domainLocale?.defaultLocale ?? i18n.defaultLocale;
  }
  const cookiesLocale = getLocaleFromCookie(internalEvent.cookies);
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  debug({
    cookiesLocale,
    preferredLocale,
    defaultLocale: i18n.defaultLocale,
    domainLocale
  });
  return domainLocale?.defaultLocale ?? cookiesLocale ?? preferredLocale ?? i18n.defaultLocale;
}
function localizePath(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n) {
    return internalEvent.rawPath;
  }
  if (isLocalizedPath(internalEvent.rawPath)) {
    return internalEvent.rawPath;
  }
  const detectedLocale = detectLocale(internalEvent, i18n);
  return `/${detectedLocale}${internalEvent.rawPath}`;
}

// node_modules/@opennextjs/aws/dist/core/routing/queue.js
function generateShardId(rawPath, maxConcurrency, prefix) {
  let a = cyrb128(rawPath);
  let t = a += 1831565813;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  const randomFloat = ((t ^ t >>> 14) >>> 0) / 4294967296;
  const randomInt = Math.floor(randomFloat * maxConcurrency);
  return `${prefix}-${randomInt}`;
}
function generateMessageGroupId(rawPath) {
  const maxConcurrency = Number.parseInt(process.env.MAX_REVALIDATE_CONCURRENCY ?? "10");
  return generateShardId(rawPath, maxConcurrency, "revalidate");
}
function cyrb128(str) {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ h1 >>> 18, 597399067);
  h2 = Math.imul(h4 ^ h2 >>> 22, 2869860233);
  h3 = Math.imul(h1 ^ h3 >>> 17, 951274213);
  h4 = Math.imul(h2 ^ h4 >>> 19, 2716044179);
  h1 ^= h2 ^ h3 ^ h4, h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return h1 >>> 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/util.js
function constructNextUrl(baseUrl, path2) {
  const nextBasePath = NextConfig.basePath ?? "";
  const url = new URL(`${nextBasePath}${path2}`, baseUrl);
  return url.href;
}
function convertRes(res) {
  const statusCode = res.statusCode || 200;
  const headers = parseHeaders(res.getFixedHeaders());
  const isBase64Encoded = isBinaryContentType(headers["content-type"]) || !!headers["content-encoding"];
  const body = new ReadableStream3({
    pull(controller) {
      if (!res._chunks || res._chunks.length === 0) {
        controller.close();
        return;
      }
      controller.enqueue(res._chunks.shift());
    }
  });
  return {
    type: "core",
    statusCode,
    headers,
    body,
    isBase64Encoded
  };
}
function convertToQueryString(query) {
  const queryStrings = [];
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => queryStrings.push(`${key}=${entry}`));
    } else {
      queryStrings.push(`${key}=${value}`);
    }
  });
  return queryStrings.length > 0 ? `?${queryStrings.join("&")}` : "";
}
function convertToQuery(querystring) {
  if (!querystring)
    return {};
  const query = new URLSearchParams(querystring);
  const queryObject = {};
  for (const key of query.keys()) {
    const queries = query.getAll(key);
    queryObject[key] = queries.length > 1 ? queries : queries[0];
  }
  return queryObject;
}
function getMiddlewareMatch(middlewareManifest2, functionsManifest) {
  if (functionsManifest?.functions?.["/_middleware"]) {
    return functionsManifest.functions["/_middleware"].matchers?.map(({ regexp }) => new RegExp(regexp)) ?? [/.*/];
  }
  const rootMiddleware = middlewareManifest2.middleware["/"];
  if (!rootMiddleware?.matchers)
    return [];
  return rootMiddleware.matchers.map(({ regexp }) => new RegExp(regexp));
}
var CommonHeaders;
(function(CommonHeaders2) {
  CommonHeaders2["CACHE_CONTROL"] = "cache-control";
  CommonHeaders2["NEXT_CACHE"] = "x-nextjs-cache";
})(CommonHeaders || (CommonHeaders = {}));
function fixCacheHeaderForHtmlPages(internalEvent, headers) {
  if (internalEvent.rawPath === "/404" || internalEvent.rawPath === "/500") {
    if (process.env.OPEN_NEXT_DANGEROUSLY_SET_ERROR_HEADERS === "true") {
      return;
    }
    headers[CommonHeaders.CACHE_CONTROL] = "private, no-cache, no-store, max-age=0, must-revalidate";
    return;
  }
  const localizedPath = localizePath(internalEvent);
  if (HtmlPages.includes(localizedPath) && !internalEvent.headers["x-middleware-prefetch"]) {
    headers[CommonHeaders.CACHE_CONTROL] = "public, max-age=0, s-maxage=31536000, must-revalidate";
  }
}
function fixSWRCacheHeader(headers) {
  let cacheControl = headers[CommonHeaders.CACHE_CONTROL];
  if (!cacheControl)
    return;
  if (Array.isArray(cacheControl)) {
    cacheControl = cacheControl.join(",");
  }
  if (typeof cacheControl !== "string")
    return;
  headers[CommonHeaders.CACHE_CONTROL] = cacheControl.replace(/\bstale-while-revalidate(?!=)/, "stale-while-revalidate=2592000");
}
function addOpenNextHeader(headers) {
  if (NextConfig.poweredByHeader) {
    headers["X-OpenNext"] = "1";
  }
  if (globalThis.openNextDebug) {
    headers["X-OpenNext-Version"] = globalThis.openNextVersion;
  }
  if (process.env.OPEN_NEXT_REQUEST_ID_HEADER || globalThis.openNextDebug) {
    headers["X-OpenNext-RequestId"] = globalThis.__openNextAls.getStore()?.requestId;
  }
}
async function revalidateIfRequired(host, rawPath, headers, req) {
  if (headers[CommonHeaders.NEXT_CACHE] === "STALE") {
    const internalMeta = req?.[Symbol.for("NextInternalRequestMeta")];
    const revalidateUrl = internalMeta?._nextDidRewrite ? rawPath.startsWith("/_next/data/") ? `/_next/data/${BuildId}${internalMeta?._nextRewroteUrl}.json` : internalMeta?._nextRewroteUrl : rawPath;
    try {
      const hash = (str) => crypto.createHash("md5").update(str).digest("hex");
      const lastModified = globalThis.__openNextAls.getStore()?.lastModified ?? 0;
      const eTag = `${headers.etag ?? headers.ETag ?? ""}`;
      await globalThis.queue.send({
        MessageBody: { host, url: revalidateUrl, eTag, lastModified },
        MessageDeduplicationId: hash(`${rawPath}-${lastModified}-${eTag}`),
        MessageGroupId: generateMessageGroupId(rawPath)
      });
    } catch (e) {
      error(`Failed to revalidate stale page ${rawPath}`, e);
    }
  }
}
function fixISRHeaders(headers) {
  const sMaxAgeRegex = /s-maxage=(\d+)/;
  const match = headers[CommonHeaders.CACHE_CONTROL]?.match(sMaxAgeRegex);
  const sMaxAge = match ? Number.parseInt(match[1]) : void 0;
  if (!sMaxAge) {
    return;
  }
  if (headers[CommonHeaders.NEXT_CACHE] === "REVALIDATED") {
    headers[CommonHeaders.CACHE_CONTROL] = "private, no-cache, no-store, max-age=0, must-revalidate";
    return;
  }
  const _lastModified = globalThis.__openNextAls.getStore()?.lastModified ?? 0;
  if (headers[CommonHeaders.NEXT_CACHE] === "HIT" && _lastModified > 0) {
    debug("cache-control", headers[CommonHeaders.CACHE_CONTROL], _lastModified, Date.now());
    if (sMaxAge && sMaxAge !== 31536e3) {
      const age = Math.round((Date.now() - _lastModified) / 1e3);
      const remainingTtl = Math.max(sMaxAge - age, 1);
      headers[CommonHeaders.CACHE_CONTROL] = `s-maxage=${remainingTtl}, stale-while-revalidate=2592000`;
    }
  }
  if (headers[CommonHeaders.NEXT_CACHE] !== "STALE")
    return;
  headers[CommonHeaders.CACHE_CONTROL] = "s-maxage=2, stale-while-revalidate=2592000";
}
function createServerResponse(routingResult, headers, responseStream) {
  const internalEvent = routingResult.internalEvent;
  return new OpenNextNodeResponse((_headers) => {
    fixCacheHeaderForHtmlPages(internalEvent, _headers);
    fixSWRCacheHeader(_headers);
    addOpenNextHeader(_headers);
    fixISRHeaders(_headers);
  }, async (_headers) => {
    await revalidateIfRequired(internalEvent.headers.host, internalEvent.rawPath, _headers);
    await invalidateCDNOnRequest(routingResult, _headers);
  }, responseStream, headers, routingResult.rewriteStatusCode);
}
async function invalidateCDNOnRequest(params, headers) {
  const { internalEvent, resolvedRoutes, initialURL } = params;
  const initialPath = new URL(initialURL).pathname;
  const isIsrRevalidation = internalEvent.headers["x-isr"] === "1";
  if (!isIsrRevalidation && headers[CommonHeaders.NEXT_CACHE] === "REVALIDATED") {
    await globalThis.cdnInvalidationHandler.invalidatePaths([
      {
        initialPath,
        rawPath: internalEvent.rawPath,
        resolvedRoutes
      }
    ]);
  }
}

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_stream();

// node_modules/@opennextjs/aws/dist/utils/cache.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_logger();
var CACHE_ONE_YEAR = 60 * 60 * 24 * 365;
var CACHE_ONE_MONTH = 60 * 60 * 24 * 30;

// node_modules/@opennextjs/aws/dist/core/routing/matcher.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/routeMatcher.js
var optionalLocalePrefixRegex = `^/(?:${RoutesManifest.locales.map((locale) => `${locale}/?`).join("|")})?`;
var optionalBasepathPrefixRegex = RoutesManifest.basePath ? `^${RoutesManifest.basePath}/?` : "^/";
var optionalPrefix = optionalLocalePrefixRegex.replace("^/", optionalBasepathPrefixRegex);
function routeMatcher(routeDefinitions) {
  const regexp = routeDefinitions.map((route) => ({
    page: route.page,
    regexp: new RegExp(route.regex.replace("^/", optionalPrefix))
  }));
  const appPathsSet = /* @__PURE__ */ new Set();
  const routePathsSet = /* @__PURE__ */ new Set();
  for (const [k, v] of Object.entries(AppPathRoutesManifest)) {
    if (k.endsWith("page")) {
      appPathsSet.add(v);
    } else if (k.endsWith("route")) {
      routePathsSet.add(v);
    }
  }
  return function matchRoute(path2) {
    const foundRoutes = regexp.filter((route) => route.regexp.test(path2));
    return foundRoutes.map((foundRoute) => {
      let routeType = "page";
      if (appPathsSet.has(foundRoute.page)) {
        routeType = "app";
      } else if (routePathsSet.has(foundRoute.page)) {
        routeType = "route";
      }
      return {
        route: foundRoute.page,
        type: routeType
      };
    });
  };
}
var staticRouteMatcher = routeMatcher([
  ...RoutesManifest.routes.static,
  ...getStaticAPIRoutes()
]);
var dynamicRouteMatcher = routeMatcher(RoutesManifest.routes.dynamic);
function getStaticAPIRoutes() {
  const createRouteDefinition = (route) => ({
    page: route,
    regex: `^${route}(?:/)?$`
  });
  const dynamicRoutePages = new Set(RoutesManifest.routes.dynamic.map(({ page }) => page));
  const pagesStaticAPIRoutes = Object.keys(PagesManifest).filter((route) => route.startsWith("/api/") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  const appPathsStaticAPIRoutes = Object.values(AppPathRoutesManifest).filter((route) => (route.startsWith("/api/") || route === "/api") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  return [...pagesStaticAPIRoutes, ...appPathsStaticAPIRoutes];
}

// node_modules/@opennextjs/aws/dist/core/routing/middleware.js
init_stream();
init_utils();
var middlewareManifest = MiddlewareManifest;
var functionsConfigManifest = FunctionsConfigManifest;
var middleMatch = getMiddlewareMatch(middlewareManifest, functionsConfigManifest);

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
var MIDDLEWARE_HEADER_PREFIX = "x-middleware-response-";
var MIDDLEWARE_HEADER_PREFIX_LEN = MIDDLEWARE_HEADER_PREFIX.length;
var INTERNAL_HEADER_PREFIX = "x-opennext-";
var INTERNAL_HEADER_INITIAL_URL = `${INTERNAL_HEADER_PREFIX}initial-url`;
var INTERNAL_HEADER_LOCALE = `${INTERNAL_HEADER_PREFIX}locale`;
var INTERNAL_HEADER_RESOLVED_ROUTES = `${INTERNAL_HEADER_PREFIX}resolved-routes`;
var INTERNAL_HEADER_REWRITE_STATUS_CODE = `${INTERNAL_HEADER_PREFIX}rewrite-status-code`;
var INTERNAL_EVENT_REQUEST_ID = `${INTERNAL_HEADER_PREFIX}request-id`;

// node_modules/@opennextjs/aws/dist/core/util.js
init_logger();
import NextServer from "next/dist/server/next-server.js";

// node_modules/@opennextjs/aws/dist/core/require-hooks.js
init_logger();
var mod2 = (init_node_module(), __toCommonJS(node_module_exports));
var resolveFilename2 = mod2._resolveFilename;

// node_modules/@opennextjs/aws/dist/core/util.js
var cacheHandlerPath = __require.resolve("./cache.cjs");
var composableCacheHandlerPath = __require.resolve("./composable-cache.cjs");
var nextServer = new NextServer.default({
  conf: {
    ...NextConfig,
    // Next.js compression should be disabled because of a bug in the bundled
    // `compression` package — https://github.com/vercel/next.js/issues/11669
    compress: false,
    // By default, Next.js uses local disk to store ISR cache. We will use
    // our own cache handler to store the cache on S3.
    //#override stableIncrementalCache
    cacheHandler: cacheHandlerPath,
    cacheMaxMemorySize: 0,
    // We need to disable memory cache
    //#endOverride
    experimental: {
      ...NextConfig.experimental,
      // This uses the request.headers.host as the URL
      // https://github.com/vercel/next.js/blob/canary/packages/next/src/server/next-server.ts#L1749-L1754
      //#override trustHostHeader
      trustHostHeader: true,
      //#endOverride
      //#override composableCache
      cacheHandlers: {
        default: composableCacheHandlerPath
      }
      //#endOverride
    }
  },
  customServer: false,
  dev: false,
  dir: __dirname
});
var routesLoaded = false;
globalThis.__next_route_preloader = async (stage) => {
  if (routesLoaded) {
    return;
  }
  const thisFunction = globalThis.fnName ? globalThis.openNextConfig.functions[globalThis.fnName] : globalThis.openNextConfig.default;
  const routePreloadingBehavior = thisFunction?.routePreloadingBehavior ?? "none";
  if (routePreloadingBehavior === "none") {
    routesLoaded = true;
    return;
  }
  if (!("unstable_preloadEntries" in nextServer)) {
    debug("The current version of Next.js does not support route preloading. Skipping route preloading.");
    routesLoaded = true;
    return;
  }
  if (stage === "waitUntil" && routePreloadingBehavior === "withWaitUntil") {
    const waitUntil = globalThis.__openNextAls.getStore()?.waitUntil;
    if (!waitUntil) {
      error("You've tried to use the 'withWaitUntil' route preloading behavior, but the 'waitUntil' function is not available.");
      routesLoaded = true;
      return;
    }
    debug("Preloading entries with waitUntil");
    waitUntil?.(nextServer.unstable_preloadEntries());
    routesLoaded = true;
  } else if (stage === "start" && routePreloadingBehavior === "onStart" || stage === "warmerEvent" && routePreloadingBehavior === "onWarmerEvent" || stage === "onDemand") {
    const startTimestamp = Date.now();
    debug("Preloading entries");
    await nextServer.unstable_preloadEntries();
    debug("Preloading entries took", Date.now() - startTimestamp, "ms");
    routesLoaded = true;
  }
};
var requestHandler = (metadata) => "getRequestHandlerWithMetadata" in nextServer ? nextServer.getRequestHandlerWithMetadata(metadata) : nextServer.getRequestHandler();

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
globalThis.__openNextAls = new AsyncLocalStorage();
async function openNextHandler(internalEvent, options) {
  const initialHeaders = internalEvent.headers;
  const requestId = globalThis.openNextConfig.middleware?.external ? internalEvent.headers[INTERNAL_EVENT_REQUEST_ID] : Math.random().toString(36);
  return runWithOpenNextRequestContext({
    isISRRevalidation: initialHeaders["x-isr"] === "1",
    waitUntil: options?.waitUntil,
    requestId
  }, async () => {
    await globalThis.__next_route_preloader("waitUntil");
    if (initialHeaders["x-forwarded-host"]) {
      initialHeaders.host = initialHeaders["x-forwarded-host"];
    }
    debug("internalEvent", internalEvent);
    const internalHeaders = {
      initialPath: initialHeaders[INTERNAL_HEADER_INITIAL_URL] ?? internalEvent.rawPath,
      resolvedRoutes: initialHeaders[INTERNAL_HEADER_RESOLVED_ROUTES] ? JSON.parse(initialHeaders[INTERNAL_HEADER_RESOLVED_ROUTES]) : [],
      rewriteStatusCode: Number.parseInt(initialHeaders[INTERNAL_HEADER_REWRITE_STATUS_CODE])
    };
    let routingResult = {
      internalEvent,
      isExternalRewrite: false,
      origin: false,
      isISR: false,
      initialURL: internalEvent.url,
      ...internalHeaders
    };
    const headers = "type" in routingResult ? routingResult.headers : routingResult.internalEvent.headers;
    const overwrittenResponseHeaders = {};
    for (const [rawKey, value] of Object.entries(headers)) {
      if (!rawKey.startsWith(MIDDLEWARE_HEADER_PREFIX)) {
        continue;
      }
      const key = rawKey.slice(MIDDLEWARE_HEADER_PREFIX_LEN);
      if (key !== "x-middleware-set-cookie") {
        overwrittenResponseHeaders[key] = value;
      }
      headers[key] = value;
      delete headers[rawKey];
    }
    if ("isExternalRewrite" in routingResult && routingResult.isExternalRewrite === true) {
      try {
        routingResult = await globalThis.proxyExternalRequest.proxy(routingResult.internalEvent);
      } catch (e) {
        error("External request failed.", e);
        routingResult = {
          internalEvent: {
            type: "core",
            rawPath: "/500",
            method: "GET",
            headers: {},
            url: constructNextUrl(internalEvent.url, "/500"),
            query: {},
            cookies: {},
            remoteAddress: ""
          },
          // On error we need to rewrite to the 500 page which is an internal rewrite
          isExternalRewrite: false,
          isISR: false,
          origin: false,
          initialURL: internalEvent.url,
          resolvedRoutes: [{ route: "/500", type: "page" }]
        };
      }
    }
    if ("type" in routingResult) {
      if (options?.streamCreator) {
        const response = createServerResponse({
          internalEvent,
          isExternalRewrite: false,
          isISR: false,
          resolvedRoutes: [],
          origin: false,
          initialURL: internalEvent.url
        }, routingResult.headers, options.streamCreator);
        response.statusCode = routingResult.statusCode;
        response.flushHeaders();
        const [bodyToConsume, bodyToReturn] = routingResult.body.tee();
        for await (const chunk of bodyToConsume) {
          response.write(chunk);
        }
        response.end();
        routingResult.body = bodyToReturn;
      }
      return routingResult;
    }
    const preprocessedEvent = routingResult.internalEvent;
    debug("preprocessedEvent", preprocessedEvent);
    const { search, pathname, hash } = new URL(preprocessedEvent.url);
    const reqProps = {
      method: preprocessedEvent.method,
      url: `${pathname}${search}${hash}`,
      //WORKAROUND: We pass this header to the serverless function to mimic a prefetch request which will not trigger revalidation since we handle revalidation differently
      // There is 3 way we can handle revalidation:
      // 1. We could just let the revalidation go as normal, but due to race conditions the revalidation will be unreliable
      // 2. We could alter the lastModified time of our cache to make next believe that the cache is fresh, but this could cause issues with stale data since the cdn will cache the stale data as if it was fresh
      // 3. OUR CHOICE: We could pass a purpose prefetch header to the serverless function to make next believe that the request is a prefetch request and not trigger revalidation (This could potentially break in the future if next changes the behavior of prefetch requests)
      headers: {
        ...headers
      },
      body: preprocessedEvent.body,
      remoteAddress: preprocessedEvent.remoteAddress
    };
    const mergeHeadersPriority = globalThis.openNextConfig.dangerous?.headersAndCookiesPriority ? globalThis.openNextConfig.dangerous.headersAndCookiesPriority(preprocessedEvent) : "middleware";
    const store = globalThis.__openNextAls.getStore();
    if (store) {
      store.mergeHeadersPriority = mergeHeadersPriority;
    }
    const req = new IncomingMessage(reqProps);
    const res = createServerResponse(routingResult, overwrittenResponseHeaders, options?.streamCreator);
    await processRequest(req, res, routingResult);
    const { statusCode, headers: responseHeaders, isBase64Encoded, body } = convertRes(res);
    const internalResult = {
      type: internalEvent.type,
      statusCode,
      headers: responseHeaders,
      body,
      isBase64Encoded
    };
    return internalResult;
  });
}
async function processRequest(req, res, routingResult) {
  delete req.body;
  const initialURL = new URL(
    // We always assume that only the routing layer can set this header.
    routingResult.internalEvent.headers[INTERNAL_HEADER_INITIAL_URL] ?? routingResult.initialURL
  );
  let invokeStatus;
  if (routingResult.internalEvent.rawPath === "/500") {
    invokeStatus = 500;
  } else if (routingResult.internalEvent.rawPath === "/404") {
    invokeStatus = 404;
  }
  const requestMetadata = {
    isNextDataReq: routingResult.internalEvent.query.__nextDataReq === "1",
    initURL: routingResult.initialURL,
    initQuery: convertToQuery(initialURL.search),
    initProtocol: initialURL.protocol,
    defaultLocale: NextConfig.i18n?.defaultLocale,
    locale: routingResult.locale,
    middlewareInvoke: false,
    // By setting invokePath and invokeQuery we can bypass some of the routing logic in Next.js
    invokePath: routingResult.internalEvent.rawPath,
    invokeQuery: routingResult.internalEvent.query,
    // invokeStatus is only used for error pages
    invokeStatus
  };
  try {
    req.url = initialURL.pathname + convertToQueryString(routingResult.internalEvent.query);
    await requestHandler(requestMetadata)(req, res);
  } catch (e) {
    if (e.constructor.name === "NoFallbackError") {
      await handleNoFallbackError(req, res, routingResult, requestMetadata);
    } else {
      error("NextJS request failed.", e);
      await tryRenderError("500", res, routingResult.internalEvent);
    }
  }
}
async function handleNoFallbackError(req, res, routingResult, metadata, index = 1) {
  if (index >= 5) {
    await tryRenderError("500", res, routingResult.internalEvent);
    return;
  }
  if (index >= routingResult.resolvedRoutes.length) {
    await tryRenderError("404", res, routingResult.internalEvent);
    return;
  }
  try {
    await requestHandler({
      ...routingResult,
      invokeOutput: routingResult.resolvedRoutes[index].route,
      ...metadata
    })(req, res);
  } catch (e) {
    if (e.constructor.name === "NoFallbackError") {
      await handleNoFallbackError(req, res, routingResult, metadata, index + 1);
    } else {
      error("NextJS request failed.", e);
      await tryRenderError("500", res, routingResult.internalEvent);
    }
  }
}
async function tryRenderError(type, res, internalEvent) {
  try {
    const _req = new IncomingMessage({
      method: "GET",
      url: `/${type}`,
      headers: internalEvent.headers,
      body: internalEvent.body,
      remoteAddress: internalEvent.remoteAddress
    });
    const requestMetadata = {
      // By setting invokePath and invokeQuery we can bypass some of the routing logic in Next.js
      invokePath: type === "404" ? "/404" : "/500",
      invokeStatus: type === "404" ? 404 : 500,
      middlewareInvoke: false
    };
    await requestHandler(requestMetadata)(_req, res);
  } catch (e) {
    error("NextJS request failed.", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      message: "Server failed to respond.",
      details: e
    }, null, 2));
  }
}

// node_modules/@opennextjs/aws/dist/core/resolve.js
async function resolveConverter(converter2) {
  if (typeof converter2 === "function") {
    return converter2();
  }
  const m_1 = await Promise.resolve().then(() => (init_edge(), edge_exports));
  return m_1.default;
}
async function resolveWrapper(wrapper) {
  if (typeof wrapper === "function") {
    return wrapper();
  }
  const m_1 = await Promise.resolve().then(() => (init_cloudflare_node(), cloudflare_node_exports));
  return m_1.default;
}
async function resolveTagCache(tagCache) {
  if (typeof tagCache === "function") {
    return tagCache();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy(), dummy_exports));
  return m_1.default;
}
async function resolveQueue(queue) {
  if (typeof queue === "function") {
    return queue();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy2(), dummy_exports2));
  return m_1.default;
}
async function resolveIncrementalCache(incrementalCache) {
  if (typeof incrementalCache === "function") {
    return incrementalCache();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy3(), dummy_exports3));
  return m_1.default;
}
async function resolveAssetResolver(assetResolver) {
  if (typeof assetResolver === "function") {
    return assetResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy4(), dummy_exports4));
  return m_1.default;
}
async function resolveProxyRequest(proxyRequest) {
  if (typeof proxyRequest === "function") {
    return proxyRequest();
  }
  const m_1 = await Promise.resolve().then(() => (init_fetch(), fetch_exports));
  return m_1.default;
}
async function resolveCdnInvalidation(cdnInvalidation) {
  if (typeof cdnInvalidation === "function") {
    return cdnInvalidation();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy5(), dummy_exports5));
  return m_1.default;
}

// node_modules/@opennextjs/aws/dist/core/createMainHandler.js
async function createMainHandler() {
  const config = await import("./open-next.config.mjs").then((m) => m.default);
  const thisFunction = globalThis.fnName ? config.functions[globalThis.fnName] : config.default;
  globalThis.serverId = generateUniqueId();
  globalThis.openNextConfig = config;
  await globalThis.__next_route_preloader("start");
  globalThis.queue = await resolveQueue(thisFunction.override?.queue);
  globalThis.incrementalCache = await resolveIncrementalCache(thisFunction.override?.incrementalCache);
  globalThis.tagCache = await resolveTagCache(thisFunction.override?.tagCache);
  if (config.middleware?.external !== true) {
    globalThis.assetResolver = await resolveAssetResolver(globalThis.openNextConfig.middleware?.assetResolver);
  }
  globalThis.proxyExternalRequest = await resolveProxyRequest(thisFunction.override?.proxyExternalRequest);
  globalThis.cdnInvalidationHandler = await resolveCdnInvalidation(thisFunction.override?.cdnInvalidation);
  const converter2 = await resolveConverter(thisFunction.override?.converter);
  const { wrapper, name } = await resolveWrapper(thisFunction.override?.wrapper);
  debug("Using wrapper", name);
  return wrapper(openNextHandler, converter2);
}

// node_modules/@opennextjs/aws/dist/adapters/server-adapter.js
setNodeEnv();
setNextjsServerWorkingDirectory();
globalThis.internalFetch = fetch;
var handler2 = await createMainHandler();
function setNextjsServerWorkingDirectory() {
  process.chdir(__dirname);
}
export {
  handler2 as handler
};
