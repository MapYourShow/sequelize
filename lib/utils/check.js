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
var check_exports = {};
__export(check_exports, {
  canTreatArrayAsAnd: () => canTreatArrayAsAnd,
  defaultValueSchemable: () => defaultValueSchemable,
  isColString: () => isColString,
  isPrimitive: () => isPrimitive,
  isWhereEmpty: () => isWhereEmpty
});
module.exports = __toCommonJS(check_exports);
var import_isEmpty = __toESM(require("lodash/isEmpty"));
var import_isPlainObject = __toESM(require("lodash/isPlainObject"));
var import_format = require("./format");
var import_sequelize_method = require("./sequelize-method");
const DataTypes = require("../data-types");
function isPrimitive(val) {
  const type = typeof val;
  return ["string", "number", "boolean"].includes(type);
}
function isColString(value) {
  return typeof value === "string" && value.startsWith("$") && value.endsWith("$");
}
function canTreatArrayAsAnd(arr) {
  return arr.some((arg) => (0, import_isPlainObject.default)(arg) || arg instanceof import_sequelize_method.Where);
}
function defaultValueSchemable(value) {
  if (value === void 0) {
    return false;
  }
  if (value instanceof DataTypes.NOW) {
    return false;
  }
  if (value instanceof DataTypes.UUIDV1 || value instanceof DataTypes.UUIDV4) {
    return false;
  }
  return typeof value !== "function";
}
function isWhereEmpty(obj) {
  return Boolean(obj) && (0, import_isEmpty.default)(obj) && (0, import_format.getOperators)(obj).length === 0;
}
//# sourceMappingURL=check.js.map
