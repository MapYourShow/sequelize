var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
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
var validation_error_exports = {};
__export(validation_error_exports, {
  ValidationErrorItem: () => ValidationErrorItem,
  ValidationErrorItemOrigin: () => ValidationErrorItemOrigin,
  ValidationErrorItemType: () => ValidationErrorItemType,
  default: () => validation_error_default
});
module.exports = __toCommonJS(validation_error_exports);
var import_base_error = __toESM(require("./base-error"));
var ValidationErrorItemType = /* @__PURE__ */ ((ValidationErrorItemType2) => {
  ValidationErrorItemType2["notnull violation"] = "CORE";
  ValidationErrorItemType2["string violation"] = "CORE";
  ValidationErrorItemType2["unique violation"] = "DB";
  ValidationErrorItemType2["validation error"] = "FUNCTION";
  return ValidationErrorItemType2;
})(ValidationErrorItemType || {});
var ValidationErrorItemOrigin = /* @__PURE__ */ ((ValidationErrorItemOrigin2) => {
  ValidationErrorItemOrigin2["CORE"] = "CORE";
  ValidationErrorItemOrigin2["DB"] = "DB";
  ValidationErrorItemOrigin2["FUNCTION"] = "FUNCTION";
  return ValidationErrorItemOrigin2;
})(ValidationErrorItemOrigin || {});
class ValidationErrorItem {
  static TypeStringMap = ValidationErrorItemType;
  static Origins = ValidationErrorItemOrigin;
  message;
  type;
  path;
  value;
  origin;
  instance;
  validatorKey;
  validatorName;
  validatorArgs;
  constructor(message, type, path, value, instance, validatorKey, fnName, fnArgs) {
    this.message = message || "";
    this.type = null;
    this.path = path || null;
    this.value = value !== void 0 ? value : null;
    this.origin = null;
    this.instance = instance || null;
    this.validatorKey = validatorKey || null;
    this.validatorName = fnName || null;
    this.validatorArgs = fnArgs || [];
    if (type) {
      if (this.isValidationErrorItemOrigin(type)) {
        this.origin = type;
      } else {
        const lowercaseType = this.normalizeString(type);
        const realType = ValidationErrorItemType[lowercaseType];
        if (realType && ValidationErrorItemOrigin[realType]) {
          this.origin = realType;
          this.type = type;
        }
      }
    }
  }
  isValidationErrorItemOrigin(origin) {
    return ValidationErrorItemOrigin[origin] !== void 0;
  }
  normalizeString(str) {
    return str.toLowerCase().trim();
  }
  getValidatorKey(useTypeAsNS, NSSeparator) {
    const useTANS = useTypeAsNS === void 0 || Boolean(useTypeAsNS);
    const NSSep = NSSeparator === void 0 ? "." : NSSeparator;
    const type = this.origin;
    const key = this.validatorKey || this.validatorName;
    const useNS = useTANS && type && ValidationErrorItemOrigin[type];
    if (useNS && (typeof NSSep !== "string" || NSSep.length === 0)) {
      throw new Error("Invalid namespace separator given, must be a non-empty string");
    }
    if (!(typeof key === "string" && key.length > 0)) {
      return "";
    }
    return (useNS ? [this.origin, key].join(NSSep) : key).toLowerCase().trim();
  }
}
class ValidationError extends import_base_error.default {
  errors;
  constructor(message, errors, options = {}) {
    const _a = options, { stack } = _a, passUp = __objRest(_a, ["stack"]);
    super(message, passUp);
    this.name = "SequelizeValidationError";
    this.errors = errors || [];
    if (message) {
      this.message = message;
    } else if (this.errors.length > 0 && this.errors[0].message) {
      this.message = this.errors.map((err) => `${err.type || err.origin}: ${err.message}`).join(",\n");
    }
    if (stack) {
      this.stack = stack;
    }
  }
  get(path) {
    const out = [];
    for (const error of this.errors) {
      if (error.path === path) {
        out.push(error);
      }
    }
    return out;
  }
}
var validation_error_default = ValidationError;
//# sourceMappingURL=validation-error.js.map
