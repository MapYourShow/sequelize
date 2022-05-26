"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var sql_string_exports = {};
__export(sql_string_exports, {
  arrayToList: () => arrayToList,
  escape: () => escape
});
module.exports = __toCommonJS(sql_string_exports);
const dataTypes = require("./data-types");
const { logger } = require("./utils/logger");
function arrayToList(array, timeZone, dialect, format) {
  return array.reduce((sql, val, i) => {
    if (i !== 0) {
      sql += ", ";
    }
    if (Array.isArray(val)) {
      sql += `(${arrayToList(val, timeZone, dialect, format)})`;
    } else {
      sql += escape(val, timeZone, dialect, format);
    }
    return sql;
  }, "");
}
function escape(val, timeZone, dialect, format) {
  let prependN = false;
  if (val === void 0 || val === null) {
    if (dialect === "ibmi" && format) {
      return "cast(NULL as int)";
    }
    return "NULL";
  }
  switch (typeof val) {
    case "boolean":
      if (["sqlite", "mssql", "ibmi"].includes(dialect)) {
        return Number(Boolean(val));
      }
      return Boolean(val).toString();
    case "number":
    case "bigint":
      return val.toString();
    case "string":
      prependN = dialect === "mssql";
      break;
  }
  if (val instanceof Date) {
    val = dataTypes[dialect].DATE.prototype.stringify(val, { timezone: timeZone });
  }
  if (Buffer.isBuffer(val)) {
    if (dialect === "ibmi") {
      return dataTypes[dialect].STRING.prototype.stringify(val);
    }
    if (dataTypes[dialect].BLOB) {
      return dataTypes[dialect].BLOB.prototype.stringify(val);
    }
    return dataTypes.BLOB.prototype.stringify(val);
  }
  if (Array.isArray(val)) {
    const partialEscape = (escVal) => escape(escVal, timeZone, dialect, format);
    if (dialect === "postgres" && !format) {
      return dataTypes.ARRAY.prototype.stringify(val, { escape: partialEscape });
    }
    return arrayToList(val, timeZone, dialect, format);
  }
  if (!val.replace) {
    throw new Error(`Invalid value ${logger.inspect(val)}`);
  }
  if (["postgres", "sqlite", "mssql", "snowflake", "db2", "ibmi"].includes(dialect)) {
    val = val.replace(/'/g, "''");
    if (dialect === "postgres") {
      val = val.replace(/\0/g, "\\0");
    }
  } else {
    val = val.replace(/[\b\0\t\n\r\u001A"'\\]/g, (s) => {
      switch (s) {
        case "\0":
          return "\\0";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case "\b":
          return "\\b";
        case "	":
          return "\\t";
        case "":
          return "\\Z";
        default:
          return `\\${s}`;
      }
    });
  }
  return `${(prependN ? "N'" : "'") + val}'`;
}
//# sourceMappingURL=sql-string.js.map
