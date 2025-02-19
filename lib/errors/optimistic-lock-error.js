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
var optimistic_lock_error_exports = {};
__export(optimistic_lock_error_exports, {
  default: () => optimistic_lock_error_default
});
module.exports = __toCommonJS(optimistic_lock_error_exports);
var import_base_error = __toESM(require("./base-error"));
class OptimisticLockError extends import_base_error.default {
  modelName;
  values;
  where;
  constructor(options, errorOptions) {
    const message = (options == null ? void 0 : options.message) || `Attempting to update a stale model instance: ${options == null ? void 0 : options.modelName}`;
    super(message, errorOptions);
    this.name = "SequelizeOptimisticLockError";
    this.modelName = options == null ? void 0 : options.modelName;
    this.values = options == null ? void 0 : options.values;
    this.where = options == null ? void 0 : options.where;
  }
}
var optimistic_lock_error_default = OptimisticLockError;
//# sourceMappingURL=optimistic-lock-error.js.map
