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
var deferrable_exports = {};
__export(deferrable_exports, {
  Deferrable: () => Deferrable
});
module.exports = __toCommonJS(deferrable_exports);
var import_utils = require("./utils/index.js");
class Deferrable {
  static toString(queryGenerator) {
    return new this().toString(queryGenerator);
  }
  toString(queryGenerator) {
    return this.toSql(queryGenerator);
  }
  toSql(_queryGenerator) {
    throw new Error("toSql implementation missing");
  }
  static INITIALLY_DEFERRED = (0, import_utils.classToInvokable)(class INITIALLY_DEFERRED extends Deferrable {
    toSql() {
      return "DEFERRABLE INITIALLY DEFERRED";
    }
  });
  static INITIALLY_IMMEDIATE = (0, import_utils.classToInvokable)(class INITIALLY_IMMEDIATE extends Deferrable {
    toSql() {
      return "DEFERRABLE INITIALLY IMMEDIATE";
    }
  });
  static NOT = (0, import_utils.classToInvokable)(class NOT extends Deferrable {
    toSql() {
      return "NOT DEFERRABLE";
    }
  });
  static SET_DEFERRED = (0, import_utils.classToInvokable)(class SET_DEFERRED extends Deferrable {
    #constraints;
    constructor(constraints) {
      super();
      this.#constraints = constraints;
    }
    toSql(queryGenerator) {
      return queryGenerator.setDeferredQuery(this.#constraints);
    }
  });
  static SET_IMMEDIATE = (0, import_utils.classToInvokable)(class SET_IMMEDIATE extends Deferrable {
    #constraints;
    constructor(constraints) {
      super();
      this.#constraints = constraints;
    }
    toSql(queryGenerator) {
      return queryGenerator.setImmediateQuery(this.#constraints);
    }
  });
}
//# sourceMappingURL=deferrable.js.map
