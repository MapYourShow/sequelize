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
var has_many_exports = {};
__export(has_many_exports, {
  HasMany: () => HasMany
});
module.exports = __toCommonJS(has_many_exports);
var import_isPlainObject = __toESM(require("lodash/isPlainObject"));
var import_upperFirst = __toESM(require("lodash/upperFirst"));
var import_errors = require("../errors/index.js");
var import_operators = require("../operators");
var import_sequelize = require("../sequelize");
var import_model_utils = require("../utils/model-utils.js");
var import_base = require("./base");
var import_belongs_to = require("./belongs-to.js");
var import_helpers = require("./helpers");
class HasMany extends import_base.MultiAssociation {
  accessors;
  get foreignKey() {
    return this.inverse.foreignKey;
  }
  get identifierField() {
    return this.inverse.identifierField;
  }
  get sourceKey() {
    return this.inverse.targetKey;
  }
  get sourceKeyAttribute() {
    return this.sourceKey;
  }
  get sourceKeyField() {
    return this.inverse.targetKeyField;
  }
  inverse;
  constructor(secret, source, target, options, parent) {
    var _a, _b;
    if (options.sourceKey && !source.getAttributes()[options.sourceKey]) {
      throw new Error(`Unknown attribute "${options.sourceKey}" passed as sourceKey, define this attribute on model "${source.name}" first`);
    }
    if ("keyType" in options) {
      throw new TypeError(`Option "keyType" has been removed from the BelongsTo's options. Set "foreignKey.type" instead.`);
    }
    if ("through" in options) {
      throw new Error('The "through" option is not available in hasMany. N:M associations are defined using belongsToMany instead.');
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
    const plural = (0, import_upperFirst.default)(this.options.name.plural);
    const singular = (0, import_upperFirst.default)(this.options.name.singular);
    this.accessors = {
      get: `get${plural}`,
      set: `set${plural}`,
      addMultiple: `add${plural}`,
      add: `add${singular}`,
      create: `create${singular}`,
      remove: `remove${singular}`,
      removeMultiple: `remove${plural}`,
      hasSingle: `has${singular}`,
      hasAll: `has${plural}`,
      count: `count${plural}`
    };
    this.#mixin(source.prototype);
  }
  static associate(secret, source, target, options = {}, parent) {
    return (0, import_helpers.defineAssociation)(HasMany, source, target, options, parent, import_helpers.normalizeBaseAssociationOptions, (normalizedOptions) => {
      var _a;
      if ((0, import_model_utils.isSameInitialModel)(source, target) && (!options.as || !((_a = options.inverse) == null ? void 0 : _a.as) || options.as === options.inverse.as)) {
        throw new import_errors.AssociationError('Both options "as" and "inverse.as" must be defined for hasMany self-associations, and their value must be different.');
      }
      return new HasMany(secret, source, target, normalizedOptions, parent);
    });
  }
  #mixin(mixinTargetPrototype) {
    (0, import_helpers.mixinMethods)(this, mixinTargetPrototype, ["get", "count", "hasSingle", "hasAll", "set", "add", "addMultiple", "remove", "removeMultiple", "create"], {
      hasSingle: "has",
      hasAll: "has",
      addMultiple: "add",
      removeMultiple: "remove"
    });
  }
  async get(instances, options = {}) {
    let isManyMode = true;
    if (!Array.isArray(instances)) {
      isManyMode = false;
      instances = [instances];
    }
    const findOptions = __spreadValues({}, options);
    const where = /* @__PURE__ */ Object.create(null);
    if (this.scope) {
      Object.assign(where, this.scope);
    }
    let values;
    if (instances.length > 1) {
      values = instances.map((instance) => instance.get(this.sourceKey, { raw: true }));
      if (findOptions.limit && instances.length > 1) {
        findOptions.groupedLimit = {
          limit: findOptions.limit,
          on: this,
          values
        };
        delete findOptions.limit;
      } else {
        where[this.foreignKey] = {
          [import_operators.Op.in]: values
        };
        delete findOptions.groupedLimit;
      }
    } else {
      where[this.foreignKey] = instances[0].get(this.sourceKey, { raw: true });
    }
    findOptions.where = findOptions.where ? { [import_operators.Op.and]: [where, findOptions.where] } : where;
    let Model = this.target;
    if (options.scope != null) {
      if (!options.scope) {
        Model = Model.unscoped();
      } else if (options.scope !== true) {
        Model = Model.scope(options.scope);
      }
    }
    if (options.schema != null) {
      Model = Model.schema(options.schema, options.schemaDelimiter);
    }
    const results = await Model.findAll(findOptions);
    if (!isManyMode) {
      return results;
    }
    const result = /* @__PURE__ */ new Map();
    for (const instance of instances) {
      result.set(instance.get(this.sourceKey, { raw: true }), []);
    }
    for (const instance of results) {
      const value = instance.get(this.foreignKey, { raw: true });
      result.get(value).push(instance);
    }
    return result;
  }
  async count(instance, options) {
    const findOptions = __spreadProps(__spreadValues({}, options), {
      raw: true,
      plain: true,
      attributes: [
        [
          (0, import_sequelize.fn)("COUNT", (0, import_sequelize.col)(`${this.target.name}.${this.target.primaryKeyField}`)),
          "count"
        ]
      ]
    });
    const result = await this.get(instance, findOptions);
    return Number.parseInt(result.count, 10);
  }
  async has(sourceInstance, targetInstances, options) {
    if (!Array.isArray(targetInstances)) {
      targetInstances = [targetInstances];
    }
    const where = {
      [import_operators.Op.or]: targetInstances.map((instance) => {
        if (instance instanceof this.target) {
          return instance.where();
        }
        return {
          [this.target.primaryKeyAttribute]: instance
        };
      })
    };
    const findOptions = __spreadProps(__spreadValues({}, options), {
      scope: false,
      attributes: [this.target.primaryKeyAttribute],
      raw: true,
      where: {
        [import_operators.Op.and]: [
          where,
          options == null ? void 0 : options.where
        ]
      }
    });
    const associatedObjects = await this.get(sourceInstance, findOptions);
    return associatedObjects.length === targetInstances.length;
  }
  async set(sourceInstance, rawTargetInstances, options) {
    const targetInstances = rawTargetInstances === null ? [] : this.toInstanceArray(rawTargetInstances);
    const oldAssociations = await this.get(sourceInstance, __spreadProps(__spreadValues({}, options), { scope: false, raw: true }));
    const promises = [];
    const obsoleteAssociations = oldAssociations.filter((old) => {
      return !targetInstances.some((obj) => {
        return obj.get(this.target.primaryKeyAttribute) === old[this.target.primaryKeyAttribute];
      });
    });
    const unassociatedObjects = targetInstances.filter((obj) => {
      return !oldAssociations.some((old) => {
        return obj.get(this.target.primaryKeyAttribute) === old[this.target.primaryKeyAttribute];
      });
    });
    if (obsoleteAssociations.length > 0) {
      promises.push(this.remove(sourceInstance, obsoleteAssociations, options));
    }
    if (unassociatedObjects.length > 0) {
      const update = __spreadValues({
        [this.foreignKey]: sourceInstance.get(this.sourceKey)
      }, this.scope);
      const updateWhere = {
        [this.target.primaryKeyAttribute]: unassociatedObjects.map((unassociatedObject) => {
          return unassociatedObject.get(this.target.primaryKeyAttribute);
        })
      };
      promises.push(this.target.unscoped().update(update, __spreadProps(__spreadValues({}, options), {
        where: updateWhere
      })));
    }
    await Promise.all(promises);
  }
  async add(sourceInstance, rawTargetInstances, options = {}) {
    const targetInstances = this.toInstanceArray(rawTargetInstances);
    if (targetInstances.length === 0) {
      return;
    }
    const update = __spreadValues({
      [this.foreignKey]: sourceInstance.get(this.sourceKey)
    }, this.scope);
    const where = {
      [this.target.primaryKeyAttribute]: targetInstances.map((unassociatedObject) => {
        return unassociatedObject.get(this.target.primaryKeyAttribute);
      })
    };
    await this.target.unscoped().update(update, __spreadProps(__spreadValues({}, options), { where }));
  }
  async remove(sourceInstance, targetInstances, options = {}) {
    if (targetInstances == null) {
      return;
    }
    if (!Array.isArray(targetInstances)) {
      targetInstances = [targetInstances];
    }
    if (targetInstances.length === 0) {
      return;
    }
    const update = {
      [this.foreignKey]: null
    };
    const where = {
      [this.foreignKey]: sourceInstance.get(this.sourceKey),
      [this.target.primaryKeyAttribute]: targetInstances.map((targetInstance) => {
        if (targetInstance instanceof this.target) {
          return targetInstance.get(this.target.primaryKeyAttribute);
        }
        if ((0, import_isPlainObject.default)(targetInstance) && this.target.primaryKeyAttribute in targetInstance) {
          return targetInstance[this.target.primaryKeyAttribute];
        }
        return targetInstance;
      })
    };
    await this.target.unscoped().update(update, __spreadProps(__spreadValues({}, options), { where }));
  }
  async create(sourceInstance, values = {}, options = {}) {
    if (Array.isArray(options)) {
      options = {
        fields: options
      };
    }
    if (this.scope) {
      for (const attribute of Object.keys(this.scope)) {
        values[attribute] = this.scope[attribute];
        if (options.fields) {
          options.fields.push(attribute);
        }
      }
    }
    if (options.fields) {
      options.fields.push(this.foreignKey);
    }
    return this.target.create(__spreadProps(__spreadValues({}, values), {
      [this.foreignKey]: sourceInstance.get(this.sourceKey)
    }), options);
  }
}
Object.defineProperty(HasMany, "name", {
  value: "HasMany"
});
//# sourceMappingURL=has-many.js.map
