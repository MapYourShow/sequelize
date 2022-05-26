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
var aggregate_error_exports = {};
__export(aggregate_error_exports, {
  default: () => aggregate_error_default
});
module.exports = __toCommonJS(aggregate_error_exports);
var import_base_error = __toESM(require("./base-error"));
class AggregateError extends import_base_error.default {
  errors;
  constructor(errors) {
    super();
    this.errors = errors;
    this.name = "AggregateError";
  }
  toString() {
    const message = `AggregateError of:
${this.errors.map((error) => error === this ? "[Circular AggregateError]" : error instanceof AggregateError ? String(error).replace(/\n$/, "").replace(/^/gm, "  ") : String(error).replace(/^/gm, "    ").slice(2)).join("\n")}
`;
    return message;
  }
}
var aggregate_error_default = AggregateError;
//# sourceMappingURL=aggregate-error.js.map
