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
var base_exports = {};
__export(base_exports, {
  Association: () => Association,
  MultiAssociation: () => MultiAssociation
});
module.exports = __toCommonJS(base_exports);
var Utils = __toESM(require("../utils"));
var import_helpers = require("./helpers");
class Association {
  source;
  target;
  isSelfAssociation;
  isAliased;
  options;
  parentAssociation;
  get rootAssociation() {
    if (this.parentAssociation) {
      return this.parentAssociation.rootAssociation;
    }
    return this;
  }
  get associationType() {
    return this.constructor.name;
  }
  get isMultiAssociation() {
    return this.constructor.isMultiAssociation;
  }
  get isSingleAssociation() {
    return !this.isMultiAssociation;
  }
  static get isMultiAssociation() {
    return false;
  }
  constructor(secret, source, target, options, parent) {
    if (secret !== import_helpers.AssociationConstructorSecret) {
      throw new Error(`Class ${this.constructor.name} cannot be instantiated directly due to it mutating the source model. Use one of the static methods on Model instead.`);
    }
    this.source = source;
    this.target = target;
    this.parentAssociation = parent ?? null;
    this.isSelfAssociation = this.source === this.target;
    this.isAliased = Boolean(options == null ? void 0 : options.as);
    this.options = Utils.cloneDeep(options);
    source.associations[this.as] = this;
  }
  get as() {
    return this.options.as;
  }
  get name() {
    return this.options.name;
  }
  get scope() {
    return this.options.scope;
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.as;
  }
}
class MultiAssociation extends Association {
  static get isMultiAssociation() {
    return true;
  }
  toInstanceArray(input) {
    if (!Array.isArray(input)) {
      input = [input];
    }
    return input.map((element) => {
      if (element instanceof this.target) {
        return element;
      }
      const tmpInstance = /* @__PURE__ */ Object.create(null);
      tmpInstance[this.target.primaryKeyAttribute] = element;
      return this.target.build(tmpInstance, { isNewRecord: false });
    });
  }
}
//# sourceMappingURL=base.js.map
