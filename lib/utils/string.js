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
var string_exports = {};
__export(string_exports, {
  camelize: () => camelize,
  camelizeIf: () => camelizeIf,
  nameIndex: () => nameIndex,
  pluralize: () => pluralize,
  removeTrailingSemicolon: () => removeTrailingSemicolon,
  safeStringifyJson: () => safeStringifyJson,
  singularize: () => singularize,
  spliceStr: () => spliceStr,
  underscore: () => underscore,
  underscoredIf: () => underscoredIf,
  useInflection: () => useInflection
});
module.exports = __toCommonJS(string_exports);
var import_inflection = __toESM(require("inflection"));
let inflection = import_inflection.default;
function useInflection(newInflection) {
  inflection = newInflection;
}
function camelizeIf(str, condition) {
  let result = str;
  if (condition) {
    result = camelize(str);
  }
  return result;
}
function camelize(str) {
  return str.trim().replace(/[-_\s]+(.)?/g, (match, c) => c.toUpperCase());
}
function underscoredIf(str, condition) {
  let result = str;
  if (condition) {
    result = underscore(str);
  }
  return result;
}
function underscore(str) {
  return inflection.underscore(str);
}
function spliceStr(str, index, count, add) {
  return str.slice(0, index) + add + str.slice(index + count);
}
function singularize(str) {
  return inflection.singularize(str);
}
function pluralize(str) {
  return inflection.pluralize(str);
}
function nameIndex(index, tableName) {
  if (typeof tableName !== "string" && tableName.tableName) {
    tableName = tableName.tableName;
  }
  if (!Object.prototype.hasOwnProperty.call(index, "name")) {
    const fields = index.fields.map((field) => typeof field === "string" ? field : field.name || field.attribute);
    index.name = underscore(`${tableName}_${fields.join("_")}`);
  }
  return index;
}
function safeStringifyJson(stringifyTarget) {
  return JSON.stringify(stringifyTarget, (key, value) => {
    if (typeof value === "bigint") {
      return String(value);
    }
    return value;
  });
}
function removeTrailingSemicolon(str) {
  if (!str.endsWith(";")) {
    return str;
  }
  return str.slice(0, Math.max(0, str.length - 1));
}
//# sourceMappingURL=string.js.map
