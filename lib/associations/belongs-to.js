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
var belongs_to_exports = {};
__export(belongs_to_exports, {
  BelongsTo: () => BelongsTo
});
module.exports = __toCommonJS(belongs_to_exports);
var import_assert = __toESM(require("assert"));
var import_isObject = __toESM(require("lodash/isObject.js"));
var import_upperFirst = __toESM(require("lodash/upperFirst"));
var import_errors = require("../errors/index.js");
var import_operators = require("../operators");
var Utils = __toESM(require("../utils"));
var import_model_utils = require("../utils/model-utils.js");
var import_base = require("./base");
var import_has_many = require("./has-many.js");
var import_has_one = require("./has-one.js");
var import_helpers = require("./helpers");
class BelongsTo extends import_base.Association {
  accessors;
  get identifier() {
    return this.foreignKey;
  }
  foreignKey;
  identifierField;
  targetKey;
  targetKeyField;
  targetKeyIsPrimary;
  get targetIdentifier() {
    return this.targetKey;
  }
  inverse;
  constructor(secret, source, target, options, parent) {
    var _a, _b, _c, _d, _e;
    const targetKey = (options == null ? void 0 : options.targetKey) || target.primaryKeyAttribute;
    if (!target.getAttributes()[targetKey]) {
      throw new Error(`Unknown attribute "${options.targetKey}" passed as targetKey, define this attribute on model "${target.name}" first`);
    }
    if ("keyType" in options) {
      throw new TypeError(`Option "keyType" has been removed from the BelongsTo's options. Set "foreignKey.type" instead.`);
    }
    super(secret, source, target, options, parent);
    this.targetKey = targetKey;
    if (target.sequelize.options.dialect === "db2" && this.target.getAttributes()[this.targetKey].primaryKey !== true) {
      this.target.getAttributes()[this.targetKey].unique = true;
    }
    let foreignKey;
    let foreignKeyAttributeOptions;
    if ((0, import_isObject.default)((_a = this.options) == null ? void 0 : _a.foreignKey)) {
      (0, import_assert.default)(typeof ((_b = this.options) == null ? void 0 : _b.foreignKey) === "object");
      foreignKeyAttributeOptions = this.options.foreignKey;
      foreignKey = this.options.foreignKey.name || this.options.foreignKey.fieldName;
    } else if ((_c = this.options) == null ? void 0 : _c.foreignKey) {
      foreignKey = this.options.foreignKey;
    }
    if (!foreignKey) {
      foreignKey = this.inferForeignKey();
    }
    this.foreignKey = foreignKey;
    const newForeignKeyAttribute = __spreadProps(__spreadValues({
      type: this.target.rawAttributes[this.targetKey].type
    }, foreignKeyAttributeOptions), {
      allowNull: ((_d = this.source.rawAttributes[this.foreignKey]) == null ? void 0 : _d.allowNull) ?? (foreignKeyAttributeOptions == null ? void 0 : foreignKeyAttributeOptions.allowNull)
    });
    this.targetKeyField = Utils.getColumnName(this.target.getAttributes()[this.targetKey]);
    this.targetKeyIsPrimary = this.targetKey === this.target.primaryKeyAttribute;
    (0, import_helpers.addForeignKeyConstraints)(newForeignKeyAttribute, this.target, this.options, this.targetKeyField);
    this.source.mergeAttributesDefault({
      [this.foreignKey]: newForeignKeyAttribute
    });
    this.identifierField = Utils.getColumnName(this.source.getAttributes()[this.foreignKey]);
    const singular = (0, import_upperFirst.default)(this.options.name.singular);
    this.accessors = {
      get: `get${singular}`,
      set: `set${singular}`,
      create: `create${singular}`
    };
    this.#mixin(source.prototype);
    if (options.inverse) {
      const passDown = __spreadProps(__spreadValues({}, options), {
        as: options.inverse.as,
        scope: (_e = options.inverse) == null ? void 0 : _e.scope,
        sourceKey: options.targetKey,
        inverse: void 0
      });
      delete passDown.targetKey;
      switch (options.inverse.type) {
        case "hasMany":
          import_has_many.HasMany.associate(secret, target, source, passDown, this);
          break;
        case "hasOne":
          import_has_one.HasOne.associate(secret, target, source, passDown, this);
          break;
        default:
          throw new Error(`Invalid option received for "inverse.type": ${options.inverse.type} is not recognised. Expected "hasMany" or "hasOne"`);
      }
    }
  }
  static associate(secret, source, target, options = {}, parent) {
    return (0, import_helpers.defineAssociation)(BelongsTo, source, target, options, parent, import_helpers.normalizeBaseAssociationOptions, (normalizedOptions) => {
      if ((0, import_model_utils.isSameInitialModel)(source, target) && options.inverse && (!options.as || !options.inverse.as || options.as === options.inverse.as)) {
        throw new import_errors.AssociationError(`Both options "as" and "inverse.as" must be defined for belongsTo self-associations, and their value must be different, if you specify the 'inverse' option.`);
      }
      return new BelongsTo(secret, source, target, normalizedOptions, parent);
    });
  }
  #mixin(modelPrototype) {
    (0, import_helpers.mixinMethods)(this, modelPrototype, ["get", "set", "create"]);
  }
  inferForeignKey() {
    const associationName = Utils.singularize(this.options.as);
    if (!associationName) {
      throw new Error("Sanity check: Could not guess the name of the association");
    }
    return Utils.camelize(`${associationName}_${this.targetKey}`);
  }
  async get(instances, options) {
    options = Utils.cloneDeep(options);
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
      where[this.targetKey] = {
        [import_operators.Op.in]: instances.map((_instance) => _instance.get(this.foreignKey))
      };
    } else {
      const foreignKeyValue = instances[0].get(this.foreignKey);
      if (this.targetKeyIsPrimary && !options.where) {
        return Target.findByPk(foreignKeyValue, options);
      }
      where[this.targetKey] = foreignKeyValue;
      options.limit = null;
    }
    options.where = options.where ? { [import_operators.Op.and]: [where, options.where] } : where;
    if (isManyMode) {
      const results = await Target.findAll(options);
      const result = /* @__PURE__ */ new Map();
      for (const instance of results) {
        result.set(instance.get(this.targetKey, { raw: true }), instance);
      }
      return result;
    }
    return Target.findOne(options);
  }
  async set(sourceInstance, associatedInstance, options = {}) {
    let value = associatedInstance;
    if (associatedInstance != null && associatedInstance instanceof this.target) {
      value = associatedInstance[this.targetKey];
    }
    sourceInstance.set(this.foreignKey, value);
    if (options.save === false) {
      return;
    }
    await sourceInstance.save(__spreadValues({
      fields: [this.foreignKey],
      association: true
    }, options));
  }
  async create(sourceInstance, values = {}, options = {}) {
    values = values || {};
    options = options || {};
    const newAssociatedObject = await this.target.create(values, options);
    await this.set(sourceInstance, newAssociatedObject, options);
    return newAssociatedObject;
  }
}
Object.defineProperty(BelongsTo, "name", {
  value: "BelongsTo"
});
//# sourceMappingURL=belongs-to.js.map
