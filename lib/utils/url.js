var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var url_exports = {};
__export(url_exports, {
  parseConnectionString: () => parseConnectionString
});
module.exports = __toCommonJS(url_exports);
var import_path = __toESM(require("path"));
var import_url = __toESM(require("url"));
var import_pg_connection_string = __toESM(require("pg-connection-string"));
function parseConnectionString(connectionString) {
  const urlParts = import_url.default.parse(connectionString, true);
  const options = {};
  if (urlParts.protocol) {
    let protocol = urlParts.protocol.replace(/:$/, "");
    if (protocol === "postgresql") {
      protocol = "postgres";
    }
    options.dialect = protocol;
  }
  if (urlParts.hostname != null) {
    options.host = urlParts.hostname;
  }
  if (urlParts.pathname) {
    options.database = urlParts.pathname.replace(/^\//, "");
  }
  if (urlParts.port) {
    options.port = urlParts.port;
  }
  if (urlParts.auth) {
    const authParts = urlParts.auth.split(":");
    options.username = authParts[0];
    if (authParts.length > 1) {
      options.password = authParts.slice(1).join(":");
    }
  }
  if (options.dialect === "sqlite" && urlParts.pathname && !urlParts.pathname.startsWith("/:memory")) {
    const storagePath = import_path.default.join(options.host, urlParts.pathname);
    options.storage = import_path.default.resolve(options.storage || storagePath);
  }
  if (urlParts.query) {
    if (urlParts.query.host) {
      options.host = urlParts.query.host;
    }
    options.dialectOptions = urlParts.query;
    if (urlParts.query.options) {
      try {
        const o = JSON.parse(urlParts.query.options);
        options.dialectOptions.options = o;
      } catch {
      }
    }
  }
  if (options.dialect === "postgres") {
    options.dialectOptions = options.dialectOptions || {};
    Object.assign(options.dialectOptions, import_pg_connection_string.default.parse(connectionString));
  }
  return options;
}
//# sourceMappingURL=url.js.map
