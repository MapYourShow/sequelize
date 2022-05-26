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
var belongs_to_many_exports = {};
__export(belongs_to_many_exports, {
  BelongsToMany: () => BelongsToMany,
  isThroughOptions: () => isThroughOptions
});
module.exports = __toCommonJS(belongs_to_many_exports);
var import_each = __toESM(require("lodash/each"));
var import_isEqual = __toESM(require("lodash/isEqual"));
var import_isPlainObject = __toESM(require("lodash/isPlainObject"));
var import_omit = __toESM(require("lodash/omit"));
var import_upperFirst = __toESM(require("lodash/upperFirst"));
var import_errors = require("../errors");
var import_operators = require("../operators");
var import_sequelize = require("../sequelize");
var import_utils = require("../utils");
var import_model_utils = require("../utils/model-utils.js");
var import_base = require("./base");
var import_has_many = require("./has-many");
var import_has_one = require("./has-one");
var import_helpers = require("./helpers");
function addInclude(findOptions, include) {
  if (Array.isArray(findOptions.include)) {
    findOptions.include.push(include);
  } else if (!findOptions.include) {
    findOptions.include = [include];
  } else {
    findOptions.include = [findOptions.include, include];
  }
}
class BelongsToMany extends import_base.MultiAssociation {
  accessors;
  get foreignKey() {
    return this.fromSourceToThrough.foreignKey;
  }
  get otherKey() {
    return this.pairedWith.foreignKey;
  }
  get identifier() {
    return this.foreignKey;
  }
  get identifierField() {
    return this.fromThroughToSource.identifierField;
  }
  get foreignIdentifierField() {
    return this.pairedWith.identifierField;
  }
  get sourceKey() {
    return this.fromThroughToSource.targetKey;
  }
  get sourceKeyField() {
    return this.fromThroughToSource.targetKeyField;
  }
  get targetKey() {
    return this.pairedWith.sourceKey;
  }
  get targetKeyField() {
    return this.pairedWith.sourceKeyField;
  }
  pairedWith;
  fromSourceToThrough;
  fromSourceToThroughOne;
  get fromThroughToSource() {
    return this.fromSourceToThrough.inverse;
  }
  get fromTargetToThrough() {
    return this.pairedWith.fromSourceToThrough;
  }
  get fromTargetToThroughOne() {
    return this.pairedWith.fromSourceToThroughOne;
  }
  get fromThroughToTarget() {
    return this.pairedWith.fromThroughToSource;
  }
  get through() {
    return this.options.through;
  }
  get throughModel() {
    return this.through.model;
  }
  constructor(secret, source, target, options, pair, parent) {
    var _a, _b, _c;
    super(secret, source, target, options, parent);
    try {
      this.pairedWith = pair ?? BelongsToMany.associate(secret, target, source, __spreadProps(__spreadValues({}, options), {
        as: (_a = options.inverse) == null ? void 0 : _a.as,
        scope: (_b = options.inverse) == null ? void 0 : _b.scope,
        foreignKeyConstraints: (_c = options.inverse) == null ? void 0 : _c.foreignKeyConstraints,
        inverse: {
          as: options.as,
          scope: options.scope,
          foreignKeyConstraints: options.foreignKeyConstraints
        },
        sourceKey: options.targetKey,
        targetKey: options.sourceKey,
        foreignKey: options.otherKey,
        otherKey: options.foreignKey,
        through: __spreadProps(__spreadValues({}, options.through), {
          scope: void 0
        })
      }), this, this);
    } catch (error) {
      throw new import_errors.AssociationError(`BelongsToMany associations automatically create the corresponding association on the target model,
    but this association failed to create its paired association (BelongsToMany from ${target.name} to ${source.name}).

    This may happen if you try to define the same BelongsToMany association on both sides of the association.
    If that is the case, instead of doing this:
    A.belongsToMany(B, { as: 'b', through: 'AB' });
    B.belongsToMany(A, { as: 'a', through: 'AB' });

    Do this:
    A.belongsToMany(B, { as: 'b', through: 'AB', inverse: { as: 'a' } });
          `, { cause: error });
    }
    this.pairedWith.pairedWith = this;
    const sourceKey = (options == null ? void 0 : options.sourceKey) || source.primaryKeyAttribute;
    this.fromSourceToThrough = import_has_many.HasMany.associate(import_helpers.AssociationConstructorSecret, this.source, this.throughModel, {
      as: `${this.name.plural}${(0, import_upperFirst.default)(this.pairedWith.name.plural)}`,
      scope: this.through.scope,
      foreignKey: __spreadProps(__spreadValues({}, this.options.foreignKey), {
        allowNull: this.options.foreignKey.allowNull ?? false,
        name: this.options.foreignKey.name || (this.isSelfAssociation ? (0, import_utils.camelize)(`${this.pairedWith.name.singular}_${sourceKey}`) : (0, import_utils.camelize)(`${this.source.options.name.singular}_${sourceKey}`))
      }),
      sourceKey: this.options.sourceKey,
      foreignKeyConstraints: this.options.foreignKeyConstraints,
      hooks: this.options.hooks,
      inverse: {
        as: this.pairedWith.name.singular
      }
    }, this);
    this.fromSourceToThroughOne = import_has_one.HasOne.associate(import_helpers.AssociationConstructorSecret, this.source, this.throughModel, {
      as: `${this.name.singular}${(0, import_upperFirst.default)(this.pairedWith.name.singular)}`,
      scope: this.through.scope,
      foreignKey: __spreadProps(__spreadValues({}, this.options.foreignKey), {
        allowNull: this.options.foreignKey.allowNull ?? false,
        name: this.options.foreignKey.name || (this.isSelfAssociation ? (0, import_utils.camelize)(`${this.pairedWith.name.singular}_${sourceKey}`) : (0, import_utils.camelize)(`${this.source.options.name.singular}_${sourceKey}`))
      }),
      sourceKey: this.options.sourceKey,
      foreignKeyConstraints: this.options.foreignKeyConstraints,
      hooks: this.options.hooks,
      inverse: {
        as: this.pairedWith.name.singular
      }
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
    if (pair == null) {
      this.#makeFkPairUnique();
    }
  }
  #makeFkPairUnique() {
    let hasPrimaryKey = false;
    (0, import_each.default)(this.through.model.rawAttributes, (attribute, attributeName) => {
      if (!attribute.primaryKey) {
        return;
      }
      if ([this.foreignKey, this.otherKey].includes(attributeName)) {
        return;
      }
      if (attribute._autoGenerated) {
        delete this.through.model.rawAttributes[attributeName];
        return;
      }
      hasPrimaryKey = true;
    });
    if (!hasPrimaryKey) {
      if (typeof this.through.unique === "string") {
        throw new TypeError(`BelongsToMany: Option "through.unique" can only be used if the through model's foreign keys are not also the primary keys.
Add your own primary key to the through model, on different attributes than the foreign keys, to be able to use this option.`);
      }
      this.throughModel.rawAttributes[this.foreignKey].primaryKey = true;
      this.throughModel.rawAttributes[this.otherKey].primaryKey = true;
    } else if (this.through.unique !== false) {
      let uniqueKey;
      if (typeof this.through.unique === "string" && this.through.unique !== "") {
        uniqueKey = this.through.unique;
      } else {
        const keys = [this.foreignKey, this.otherKey].sort();
        uniqueKey = [this.through.model.tableName, ...keys, "unique"].join("_");
      }
      this.throughModel.rawAttributes[this.foreignKey].unique = uniqueKey;
      this.throughModel.rawAttributes[this.otherKey].unique = uniqueKey;
    }
    this.throughModel.refreshAttributes();
  }
  static associate(secret, source, target, options, pair, parent) {
    return (0, import_helpers.defineAssociation)(BelongsToMany, source, target, options, parent, normalizeOptions, (newOptions) => {
      var _a;
      if ((0, import_model_utils.isSameInitialModel)(source, target) && (!options.as || !((_a = options.inverse) == null ? void 0 : _a.as) || options.as === options.inverse.as)) {
        throw new import_errors.AssociationError('Both options "as" and "inverse.as" must be defined for belongsToMany self-associations, and their value must be different.');
      }
      return new BelongsToMany(secret, source, target, newOptions, pair, parent);
    });
  }
  #mixin(modelPrototype) {
    (0, import_helpers.mixinMethods)(this, modelPrototype, ["get", "count", "hasSingle", "hasAll", "set", "add", "addMultiple", "remove", "removeMultiple", "create"], {
      hasSingle: "has",
      hasAll: "has",
      addMultiple: "add",
      removeMultiple: "remove"
    });
  }
  async get(instance, options) {
    var _a, _b;
    const through = this.through;
    const findOptions = __spreadProps(__spreadValues({}, options), {
      where: {
        [import_operators.Op.and]: [
          options == null ? void 0 : options.where,
          this.scope
        ]
      }
    });
    let throughWhere = {
      [this.foreignKey]: instance.get(this.sourceKey)
    };
    if (through.scope) {
      Object.assign(throughWhere, through.scope);
    }
    if ((_a = options == null ? void 0 : options.through) == null ? void 0 : _a.where) {
      throughWhere = {
        [import_operators.Op.and]: [throughWhere, options.through.where]
      };
    }
    addInclude(findOptions, {
      association: this.fromTargetToThroughOne,
      attributes: options == null ? void 0 : options.joinTableAttributes,
      required: true,
      paranoid: ((_b = options == null ? void 0 : options.through) == null ? void 0 : _b.paranoid) ?? true,
      where: throughWhere
    });
    let model = this.target;
    if ((options == null ? void 0 : options.scope) != null) {
      if (!options.scope) {
        model = model.unscoped();
      } else if (options.scope !== true) {
        model = model.scope(options.scope);
      }
    }
    if (options == null ? void 0 : options.schema) {
      model = model.schema(options.schema, options.schemaDelimiter);
    }
    return model.findAll(findOptions);
  }
  async count(instance, options) {
    const getOptions = __spreadProps(__spreadValues({}, options), {
      attributes: [
        [(0, import_sequelize.fn)("COUNT", (0, import_sequelize.col)([this.target.name, this.targetKeyField].join("."))), "count"]
      ],
      joinTableAttributes: [],
      raw: true,
      plain: true
    });
    const result = await this.get(instance, getOptions);
    return Number.parseInt(result.count, 10);
  }
  async has(sourceInstance, targetInstancesOrPks, options) {
    if (!Array.isArray(targetInstancesOrPks)) {
      targetInstancesOrPks = [targetInstancesOrPks];
    }
    const targetPrimaryKeys = targetInstancesOrPks.map((instance) => {
      if (instance instanceof this.target) {
        return instance.get(this.targetKey);
      }
      return instance;
    });
    const associatedObjects = await this.get(sourceInstance, __spreadProps(__spreadValues({}, options), {
      raw: true,
      scope: false,
      attributes: [this.targetKey],
      joinTableAttributes: [],
      where: {
        [import_operators.Op.and]: [
          { [this.targetKey]: { [import_operators.Op.in]: targetPrimaryKeys } },
          options == null ? void 0 : options.where
        ]
      }
    }));
    return targetPrimaryKeys.every((pk) => {
      return associatedObjects.some((instance) => {
        return (0, import_isEqual.default)(instance[this.targetKey], pk);
      });
    });
  }
  async set(sourceInstance, newInstancesOrPrimaryKeys, options = {}) {
    const sourceKey = this.sourceKey;
    const targetKey = this.targetKey;
    const foreignKey = this.foreignKey;
    const otherKey = this.otherKey;
    const newInstances = newInstancesOrPrimaryKeys === null ? [] : this.toInstanceArray(newInstancesOrPrimaryKeys);
    const where = __spreadValues({
      [foreignKey]: sourceInstance.get(sourceKey)
    }, this.through.scope);
    const currentThroughRows = await this.through.model.findAll(__spreadProps(__spreadValues({}, options), {
      where,
      raw: true,
      rejectOnEmpty: false
    }));
    const obsoleteTargets = [];
    for (const currentRow of currentThroughRows) {
      const newTarget = newInstances.find((obj) => {
        return currentRow[otherKey] === obj.get(targetKey);
      });
      if (!newTarget) {
        obsoleteTargets.push(currentRow[this.otherKey]);
      }
    }
    const promises = [];
    if (obsoleteTargets.length > 0) {
      promises.push(this.remove(sourceInstance, obsoleteTargets, options));
    }
    if (newInstances.length > 0) {
      promises.push(this.#updateAssociations(sourceInstance, currentThroughRows, newInstances, options));
    }
    await Promise.all(promises);
  }
  async add(sourceInstance, newInstancesOrPrimaryKeys, options) {
    if (!newInstancesOrPrimaryKeys) {
      return;
    }
    const newInstances = this.toInstanceArray(newInstancesOrPrimaryKeys);
    const currentRows = await this.through.model.findAll(__spreadProps(__spreadValues({}, options), {
      raw: true,
      where: __spreadValues({
        [this.foreignKey]: sourceInstance.get(this.sourceKey),
        [this.otherKey]: newInstances.map((newInstance) => newInstance.get(this.targetKey))
      }, this.through.scope),
      rejectOnEmpty: false
    }));
    await this.#updateAssociations(sourceInstance, currentRows, newInstances, options);
  }
  async #updateAssociations(sourceInstance, currentThroughRows, newTargets, options) {
    const sourceKey = this.sourceKey;
    const targetKey = this.targetKey;
    const foreignKey = this.foreignKey;
    const otherKey = this.otherKey;
    const defaultAttributes = (options == null ? void 0 : options.through) || {};
    const promises = [];
    const unassociatedTargets = [];
    const changedTargets = [];
    for (const newInstance of newTargets) {
      const existingThroughRow = currentThroughRows.find((throughRow) => {
        return throughRow[otherKey] === newInstance.get(targetKey);
      });
      if (!existingThroughRow) {
        unassociatedTargets.push(newInstance);
        continue;
      }
      const throughAttributes = newInstance[this.through.model.name];
      const attributes = __spreadValues(__spreadValues({}, defaultAttributes), throughAttributes);
      if (Object.keys(attributes).some((attribute) => {
        return attributes[attribute] !== existingThroughRow[attribute];
      })) {
        changedTargets.push(newInstance);
      }
    }
    if (unassociatedTargets.length > 0) {
      const bulk = unassociatedTargets.map((unassociatedTarget) => {
        const throughAttributes = unassociatedTarget[this.through.model.name];
        const attributes = __spreadValues(__spreadValues({}, defaultAttributes), throughAttributes);
        attributes[foreignKey] = sourceInstance.get(sourceKey);
        attributes[otherKey] = unassociatedTarget.get(targetKey);
        Object.assign(attributes, this.through.scope);
        return attributes;
      });
      promises.push(this.through.model.bulkCreate(bulk, __spreadValues({ validate: true }, options)));
    }
    for (const changedTarget of changedTargets) {
      let throughAttributes = changedTarget[this.through.model.name];
      const attributes = __spreadValues(__spreadValues({}, defaultAttributes), throughAttributes);
      if (throughAttributes instanceof this.through.model) {
        throughAttributes = {};
      }
      promises.push(this.through.model.update(attributes, __spreadProps(__spreadValues({}, options), {
        where: {
          [foreignKey]: sourceInstance.get(sourceKey),
          [otherKey]: changedTarget.get(targetKey)
        }
      })));
    }
    await Promise.all(promises);
  }
  async remove(sourceInstance, targetInstanceOrPks, options) {
    const targetInstance = this.toInstanceArray(targetInstanceOrPks);
    const where = __spreadValues({
      [this.foreignKey]: sourceInstance.get(this.sourceKey),
      [this.otherKey]: targetInstance.map((newInstance) => newInstance.get(this.targetKey))
    }, this.through.scope);
    await this.through.model.destroy(__spreadProps(__spreadValues({}, options), { where }));
  }
  async create(sourceInstance, values = {}, options = {}) {
    if (Array.isArray(options)) {
      options = {
        fields: options
      };
    }
    if (this.scope) {
      Object.assign(values, this.scope);
      if (options.fields) {
        options.fields = [...options.fields, ...Object.keys(this.scope)];
      }
    }
    const newAssociatedObject = await this.target.create(values, options);
    await this.add(sourceInstance, newAssociatedObject, (0, import_omit.default)(options, ["fields"]));
    return newAssociatedObject;
  }
}
Object.defineProperty(BelongsToMany, "name", {
  value: "BelongsToMany"
});
function isThroughOptions(val) {
  return (0, import_isPlainObject.default)(val) && "model" in val;
}
function normalizeThroughOptions(source, target, through, sequelize) {
  var _a;
  const timestamps = through.timestamps ?? ((_a = sequelize.options.define) == null ? void 0 : _a.timestamps);
  let model;
  if (!through || typeof through.model !== "string" && !(0, import_model_utils.isModelStatic)(through.model)) {
    throw new import_errors.AssociationError(`${source.name}.belongsToMany(${target.name}) requires a through model, set the "through", or "through.model" options to either a string or a model`);
  }
  if ((0, import_model_utils.isModelStatic)(through.model)) {
    model = through.model;
  } else if (sequelize.isDefined(through.model)) {
    model = sequelize.model(through.model);
  } else {
    model = sequelize.define(through.model, {}, {
      tableName: through.model,
      indexes: [],
      paranoid: through.paranoid || false,
      validate: {},
      timestamps: through.timestamps,
      schema: source._schema,
      schemaDelimiter: source._schemaDelimiter
    });
  }
  return __spreadProps(__spreadValues({}, through), {
    timestamps,
    model
  });
}
function normalizeOptions(type, options, source, target) {
  if ("timestamps" in options) {
    throw new TypeError('The "timestamps" option in belongsToMany has been renamed to through.timestamps');
  }
  if ("uniqueKey" in options) {
    throw new TypeError('The "uniqueKey" option in belongsToMany has been renamed to through.unique');
  }
  const sequelize = target.sequelize;
  return (0, import_helpers.normalizeBaseAssociationOptions)(type, __spreadProps(__spreadValues({}, options), {
    otherKey: (0, import_helpers.normalizeForeignKeyOptions)(options.otherKey),
    through: (0, import_helpers.removeUndefined)(isThroughOptions(options.through) ? normalizeThroughOptions(source, target, options.through, sequelize) : normalizeThroughOptions(source, target, { model: options.through }, sequelize))
  }), source, target);
}
//# sourceMappingURL=belongs-to-many.js.map
