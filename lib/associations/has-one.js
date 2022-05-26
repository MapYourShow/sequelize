var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
var has_one_exports = {};
__export(has_one_exports, {
  HasOne: () => HasOne
});
module.exports = __toCommonJS(has_one_exports);
var import_upperFirst = __toESM(require("lodash/upperFirst"));
var import_errors = require("../errors/index.js");
var import_model = require("../model");
var import_operators = require("../operators");
var Utils = __toESM(require("../utils"));
var import_model_utils = require("../utils/model-utils.js");
var import_base = require("./base");
var import_belongs_to = require("./belongs-to.js");
var import_helpers = require("./helpers");
class HasOne extends import_base.Association {
  get foreignKey() {
    return this.inverse.foreignKey;
  }
  get identifierField() {
    return this.inverse.identifierField;
  }
  get sourceKey() {
    return this.inverse.targetKey;
  }
  get sourceKeyField() {
    return this.inverse.targetKeyField;
  }
  get sourceKeyAttribute() {
    return this.sourceKey;
  }
  inverse;
  accessors;
  constructor(secret, source, target, options, parent) {
    var _a, _b;
    if ((options == null ? void 0 : options.sourceKey) && !source.getAttributes()[options.sourceKey]) {
      throw new Error(`Unknown attribute "${options.sourceKey}" passed as sourceKey, define this attribute on model "${source.name}" first`);
    }
    if ("keyType" in options) {
      throw new TypeError(`Option "keyType" has been removed from the BelongsTo's options. Set "foreignKey.type" instead.`);
    }
    super(secret, source, target, options, parent);
    this.inverse = import_belongs_to.BelongsTo.associate(secret, target, source, {
      as: (_a = options.inverse) == null ? void 0 : _a.as,
      scope: (_b = options.inverse) == null ? void 0 : _b.scope,
      foreignKey: options.foreignKey,
      targetKey: options.sourceKey,
      foreignKeyConstraints: options.foreignKeyConstraints,
      hooks: options.hooks
    }, this);
    const singular = (0, import_upperFirst.default)(this.options.name.singular);
    this.accessors = {
      get: `get${singular}`,
      set: `set${singular}`,
      create: `create${singular}`
    };
    this.#mixin(source.prototype);
  }
  #mixin(mixinTargetPrototype) {
    (0, import_helpers.mixinMethods)(this, mixinTargetPrototype, ["get", "set", "create"]);
  }
  static associate(secret, source, target, options = {}, parent) {
    return (0, import_helpers.defineAssociation)(HasOne, source, target, options, parent, import_helpers.normalizeBaseAssociationOptions, (normalizedOptions) => {
      var _a;
      if ((0, import_model_utils.isSameInitialModel)(source, target) && (!options.as || !((_a = options.inverse) == null ? void 0 : _a.as) || options.as === options.inverse.as)) {
        throw new import_errors.AssociationError(`Both options "as" and "inverse.as" must be defined for hasOne self-associations, and their value must be different.
This is because hasOne associations automatically create the corresponding belongsTo association, but they cannot share the same name.

If having two associations does not make sense (for instance a "spouse" association from user to user), consider using belongsTo instead of hasOne.`);
      }
      return new HasOne(secret, source, target, normalizedOptions, parent);
    });
  }
  async get(instances, options) {
    options = options ? Utils.cloneDeep(options) : {};
    let Target = this.target;
    if (options.scope != null) {
      if (!options.scope) {
        Target = Target.unscoped();
      } else if (options.scope !== true) {
        Target = Target.scope(options.scope);
      }
    }
    if (options.schema != null) {
      Target = Target.schema(options.schema, options.schemaDelimiter);
    }
    let isManyMode = true;
    if (!Array.isArray(instances)) {
      isManyMode = false;
      instances = [instances];
    }
    const where = /* @__PURE__ */ Object.create(null);
    if (instances.length > 1) {
      where[this.foreignKey] = {
        [import_operators.Op.in]: instances.map((instance) => instance.get(this.sourceKey))
      };
    } else {
      where[this.foreignKey] = instances[0].get(this.sourceKey);
    }
    if (this.scope) {
      Object.assign(where, this.scope);
    }
    options.where = options.where ? { [import_operators.Op.and]: [where, options.where] } : where;
    if (isManyMode) {
      const results = await Target.findAll(options);
      const result = /* @__PURE__ */ new Map();
      for (const targetInstance of results) {
        result.set(targetInstance.get(this.foreignKey, { raw: true }), targetInstance);
      }
      return result;
    }
    return Target.findOne(options);
  }
  async set(sourceInstance, associatedInstanceOrPk, options) {
    options = __spreadProps(__spreadValues({}, options), { scope: false });
    if (options.save === false) {
      throw new Error(`The "save: false" option cannot be honoured in ${this.source.name}#${this.accessors.set}
because, as this is a hasOne association, the foreign key we need to update is located on the model ${this.target.name}.`);
    }
    const oldInstance = await this.get(sourceInstance, options);
    const alreadyAssociated = !oldInstance || !associatedInstanceOrPk ? false : associatedInstanceOrPk instanceof import_model.Model ? associatedInstanceOrPk.equals(oldInstance) : oldInstance.get(this.target.primaryKeyAttribute) === associatedInstanceOrPk;
    if (alreadyAssociated) {
      if (associatedInstanceOrPk instanceof import_model.Model) {
        return associatedInstanceOrPk;
      }
      return oldInstance;
    }
    if (oldInstance) {
      oldInstance.set(this.foreignKey, null);
      await oldInstance.save(__spreadProps(__spreadValues({}, options), {
        fields: [this.foreignKey],
        association: true
      }));
    }
    if (associatedInstanceOrPk) {
      let associatedInstance;
      if (associatedInstanceOrPk instanceof this.target) {
        associatedInstance = associatedInstanceOrPk;
      } else {
        const tmpInstance = /* @__PURE__ */ Object.create(null);
        tmpInstance[this.target.primaryKeyAttribute] = associatedInstanceOrPk;
        associatedInstance = this.target.build(tmpInstance, {
          isNewRecord: false
        });
      }
      Object.assign(associatedInstance, this.scope);
      associatedInstance.set(this.foreignKey, sourceInstance.get(this.sourceKeyAttribute));
      return associatedInstance.save(options);
    }
    return null;
  }
  async create(sourceInstance, values = {}, options = {}) {
    if (this.scope) {
      for (const attribute of Object.keys(this.scope)) {
        values[attribute] = this.scope[attribute];
        if (options.fields) {
          options.fields.push(attribute);
        }
      }
    }
    values[this.foreignKey] = sourceInstance.get(this.sourceKeyAttribute);
    if (options.fields) {
      options.fields.push(this.foreignKey);
    }
    return this.target.create(values, options);
  }
}
Object.defineProperty(HasOne, "name", {
  value: "HasOne"
});
//# sourceMappingURL=has-one.js.map
