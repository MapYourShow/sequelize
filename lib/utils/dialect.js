var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var dialect_exports = {};
__export(dialect_exports, {
  TICK_CHAR: () => TICK_CHAR,
  addTicks: () => addTicks,
  now: () => now,
  removeTicks: () => removeTicks,
  toDefaultValue: () => toDefaultValue
});
module.exports = __toCommonJS(dialect_exports);
var import_isPlainObject = __toESM(require("lodash/isPlainObject"));
var import_uuid = require("uuid");
const DataTypes = require("../data-types");
const dialectsSupportingMilliseconds = /* @__PURE__ */ new Set([
  "mariadb",
  "mysql",
  "postgres",
  "sqlite",
  "mssql",
  "db2",
  "ibmi"
]);
function now(dialect) {
  const d = new Date();
  if (!dialectsSupportingMilliseconds.has(dialect)) {
    d.setMilliseconds(0);
  }
  return d;
}
function toDefaultValue(value, dialect) {
  if (typeof value === "function") {
    const tmp = value();
    if (tmp instanceof DataTypes.ABSTRACT) {
      return tmp.toSql();
    }
    return tmp;
  }
  if (value instanceof DataTypes.UUIDV1) {
    return (0, import_uuid.v1)();
  }
  if (value instanceof DataTypes.UUIDV4) {
    return (0, import_uuid.v4)();
  }
  if (value instanceof DataTypes.NOW) {
    return now(dialect);
  }
  if (Array.isArray(value)) {
    return [...value];
  }
  if ((0, import_isPlainObject.default)(value)) {
    return __spreadValues({}, value);
  }
  return value;
}
const TICK_CHAR = "`";
function addTicks(s, tickChar = TICK_CHAR) {
  return tickChar + removeTicks(s, tickChar) + tickChar;
}
function removeTicks(s, tickChar = TICK_CHAR) {
  return s.replace(new RegExp(tickChar, "g"), "");
}
//# sourceMappingURL=dialect.js.map
