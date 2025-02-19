"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var model_exports = {};
__export(model_exports, {
  Model: () => Model
});
module.exports = __toCommonJS(model_exports);
var import_model_utils = require("./utils/model-utils");
const assert = require("assert");
const NodeUtil = require("util");
const _ = require("lodash");
const Dottie = require("dottie");
const Utils = require("./utils");
const { logger } = require("./utils/logger");
const { BelongsTo, BelongsToMany, Association, HasMany, HasOne } = require("./associations");
const { AssociationConstructorSecret } = require("./associations/helpers");
const { InstanceValidator } = require("./instance-validator");
const { QueryTypes } = require("./query-types");
const sequelizeErrors = require("./errors");
const DataTypes = require("./data-types");
const Hooks = require("./hooks");
const { Op } = require("./operators");
const { _validateIncludedElements, combineIncludes, throwInvalidInclude } = require("./model-internals");
const { noDoubleNestedGroup, scopeRenamedToWithScope, schemaRenamedToWithSchema, noModelDropSchema } = require("./utils/deprecations");
const validQueryKeywords = /* @__PURE__ */ new Set([
  "where",
  "attributes",
  "paranoid",
  "include",
  "order",
  "limit",
  "offset",
  "transaction",
  "lock",
  "raw",
  "logging",
  "benchmark",
  "having",
  "searchPath",
  "rejectOnEmpty",
  "plain",
  "scope",
  "group",
  "through",
  "defaults",
  "distinct",
  "primary",
  "exception",
  "type",
  "hooks",
  "force",
  "name"
]);
const nonCascadingOptions = ["include", "attributes", "originalAttributes", "order", "where", "limit", "offset", "plain", "group", "having"];
class Model {
  static get queryInterface() {
    return this.sequelize.getQueryInterface();
  }
  static get queryGenerator() {
    return this.queryInterface.queryGenerator;
  }
  get sequelize() {
    return this.constructor.sequelize;
  }
  constructor(values = {}, options = {}) {
    if (!this.constructor._overwrittenAttributesChecked) {
      this.constructor._overwrittenAttributesChecked = true;
      setTimeout(() => {
        const overwrittenAttributes = [];
        for (const key of Object.keys(this.constructor._attributeManipulation)) {
          if (Object.prototype.hasOwnProperty.call(this, key)) {
            overwrittenAttributes.push(key);
          }
        }
        if (overwrittenAttributes.length > 0) {
          logger.warn(`Model ${JSON.stringify(this.constructor.name)} is declaring public class fields for attribute(s): ${overwrittenAttributes.map((attr) => JSON.stringify(attr)).join(", ")}.
These class fields are shadowing Sequelize's attribute getters & setters.
See https://sequelize.org/docs/v7/core-concepts/model-basics/#caveat-with-public-class-fields`);
        }
      }, 0);
    }
    options = __spreadProps(__spreadValues({
      isNewRecord: true,
      _schema: this.constructor._schema,
      _schemaDelimiter: this.constructor._schemaDelimiter
    }, options), {
      model: this.constructor
    });
    if (options.attributes) {
      options.attributes = options.attributes.map((attribute) => Array.isArray(attribute) ? attribute[1] : attribute);
    }
    if (!options.includeValidated) {
      this.constructor._conformIncludes(options, this.constructor);
      if (options.include) {
        this.constructor._expandIncludeAll(options);
        _validateIncludedElements(options);
      }
    }
    this.dataValues = {};
    this._previousDataValues = {};
    this.uniqno = 1;
    this._changed = /* @__PURE__ */ new Set();
    this._options = options;
    this.isNewRecord = options.isNewRecord;
    this._initValues(values, options);
  }
  _initValues(values, options) {
    let defaults;
    let key;
    values = __spreadValues({}, values);
    if (options.isNewRecord) {
      defaults = {};
      if (this.constructor._hasDefaultValues) {
        defaults = _.mapValues(this.constructor._defaultValues, (valueFn) => {
          const value = valueFn();
          return value && value instanceof Utils.SequelizeMethod ? value : _.cloneDeep(value);
        });
      }
      if (this.constructor.primaryKeyAttributes.length > 0) {
        for (const primaryKeyAttribute of this.constructor.primaryKeyAttributes) {
          if (!Object.prototype.hasOwnProperty.call(defaults, primaryKeyAttribute)) {
            defaults[primaryKeyAttribute] = null;
          }
        }
      }
      if (this.constructor._timestampAttributes.createdAt && defaults[this.constructor._timestampAttributes.createdAt]) {
        this.dataValues[this.constructor._timestampAttributes.createdAt] = Utils.toDefaultValue(defaults[this.constructor._timestampAttributes.createdAt], this.sequelize.options.dialect);
        delete defaults[this.constructor._timestampAttributes.createdAt];
      }
      if (this.constructor._timestampAttributes.updatedAt && defaults[this.constructor._timestampAttributes.updatedAt]) {
        this.dataValues[this.constructor._timestampAttributes.updatedAt] = Utils.toDefaultValue(defaults[this.constructor._timestampAttributes.updatedAt], this.sequelize.options.dialect);
        delete defaults[this.constructor._timestampAttributes.updatedAt];
      }
      if (this.constructor._timestampAttributes.deletedAt && defaults[this.constructor._timestampAttributes.deletedAt]) {
        this.dataValues[this.constructor._timestampAttributes.deletedAt] = Utils.toDefaultValue(defaults[this.constructor._timestampAttributes.deletedAt], this.sequelize.options.dialect);
        delete defaults[this.constructor._timestampAttributes.deletedAt];
      }
      for (key in defaults) {
        if (values[key] === void 0) {
          this.set(key, Utils.toDefaultValue(defaults[key], this.sequelize.options.dialect), { raw: true });
          delete values[key];
        }
      }
    }
    this.set(values, options);
  }
  static _paranoidClause(model, options = {}) {
    if (options.include) {
      for (const include of options.include) {
        this._paranoidClause(include.model, include);
      }
    }
    if (_.get(options, "groupedLimit.on.through.model.options.paranoid")) {
      const throughModel = _.get(options, "groupedLimit.on.through.model");
      if (throughModel) {
        options.groupedLimit.through = this._paranoidClause(throughModel, options.groupedLimit.through);
      }
    }
    if (!model.options.timestamps || !model.options.paranoid || options.paranoid === false) {
      return options;
    }
    const deletedAtCol = model._timestampAttributes.deletedAt;
    const deletedAtAttribute = model.rawAttributes[deletedAtCol];
    const deletedAtObject = {};
    let deletedAtDefaultValue = Object.prototype.hasOwnProperty.call(deletedAtAttribute, "defaultValue") ? deletedAtAttribute.defaultValue : null;
    deletedAtDefaultValue = deletedAtDefaultValue || {
      [Op.eq]: null
    };
    deletedAtObject[deletedAtAttribute.field || deletedAtCol] = deletedAtDefaultValue;
    if (Utils.isWhereEmpty(options.where)) {
      options.where = deletedAtObject;
    } else {
      options.where = { [Op.and]: [deletedAtObject, options.where] };
    }
    return options;
  }
  static _addDefaultAttributes() {
    const tail = {};
    let head = {};
    if (!this.options.noPrimaryKey && !_.some(this.rawAttributes, "primaryKey")) {
      if ("id" in this.rawAttributes && this.rawAttributes.id.primaryKey === void 0) {
        throw new Error(`An attribute called 'id' was defined in model '${this.tableName}' but primaryKey is not set. This is likely to be an error, which can be fixed by setting its 'primaryKey' option to true. If this is intended, explicitly set its 'primaryKey' option to false`);
      }
      head = {
        id: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          _autoGenerated: true
        }
      };
    }
    if (this._timestampAttributes.createdAt) {
      tail[this._timestampAttributes.createdAt] = {
        type: DataTypes.DATE,
        allowNull: false,
        _autoGenerated: true
      };
    }
    if (this._timestampAttributes.updatedAt) {
      tail[this._timestampAttributes.updatedAt] = {
        type: DataTypes.DATE,
        allowNull: false,
        _autoGenerated: true
      };
    }
    if (this._timestampAttributes.deletedAt) {
      tail[this._timestampAttributes.deletedAt] = {
        type: DataTypes.DATE,
        _autoGenerated: true
      };
    }
    if (this._versionAttribute) {
      tail[this._versionAttribute] = {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        _autoGenerated: true
      };
    }
    const newRawAttributes = __spreadValues(__spreadValues({}, head), this.rawAttributes);
    _.each(tail, (value, attr) => {
      if (newRawAttributes[attr] === void 0) {
        newRawAttributes[attr] = value;
      }
    });
    this.rawAttributes = newRawAttributes;
  }
  static getAttributes() {
    return this.rawAttributes;
  }
  static _findAutoIncrementAttribute() {
    this.autoIncrementAttribute = null;
    for (const name in this.rawAttributes) {
      if (Object.prototype.hasOwnProperty.call(this.rawAttributes, name)) {
        const definition = this.rawAttributes[name];
        if (definition && definition.autoIncrement) {
          if (this.autoIncrementAttribute) {
            throw new Error("Invalid Instance definition. Only one autoincrement field allowed.");
          }
          this.autoIncrementAttribute = name;
        }
      }
    }
  }
  static _getAssociationDebugList() {
    return `The following associations are defined on "${this.name}": ${Object.keys(this.associations).map((associationName) => `"${associationName}"`).join(", ")}`;
  }
  static getAssociation(associationName) {
    if (!Object.prototype.hasOwnProperty.call(this.associations, associationName)) {
      throw new Error(`Association with alias "${associationName}" does not exist on ${this.name}.
${this._getAssociationDebugList()}`);
    }
    return this.associations[associationName];
  }
  static _getAssociationsByModel(model) {
    const matchingAssociations = [];
    for (const associationName of Object.keys(this.associations)) {
      const association = this.associations[associationName];
      if (!(0, import_model_utils.isSameInitialModel)(association.target, model)) {
        continue;
      }
      matchingAssociations.push(association);
    }
    return matchingAssociations;
  }
  static _normalizeIncludes(options, associationOwner) {
    this._conformIncludes(options, associationOwner);
    this._expandIncludeAll(options, associationOwner);
  }
  static _conformIncludes(options, associationOwner) {
    if (!options.include) {
      return;
    }
    if (!Array.isArray(options.include)) {
      options.include = [options.include];
    } else if (options.include.length === 0) {
      delete options.include;
      return;
    }
    options.include = options.include.map((include) => this._conformInclude(include, associationOwner));
  }
  static _conformInclude(include, associationOwner) {
    if (!include) {
      throwInvalidInclude(include);
    }
    if (!associationOwner || !(0, import_model_utils.isModelStatic)(associationOwner)) {
      throw new TypeError(`Sequelize sanity check: associationOwner must be a model subclass. Got ${NodeUtil.inspect(associationOwner)} (${typeof associationOwner})`);
    }
    if (include._pseudo) {
      return include;
    }
    if (include.all) {
      this._conformIncludes(include, associationOwner);
      return include;
    }
    if (!_.isPlainObject(include)) {
      if ((0, import_model_utils.isModelStatic)(include)) {
        include = {
          model: include
        };
      } else {
        include = {
          association: include
        };
      }
    } else {
      include = __spreadValues({}, include);
    }
    if (include.as && !include.association) {
      include.association = include.as;
    }
    if (!include.association) {
      include.association = associationOwner.getAssociationWithModel(include.model, include.as);
    } else if (typeof include.association === "string") {
      include.association = associationOwner.getAssociation(include.association);
    } else {
      if (!(include.association instanceof Association)) {
        throwInvalidInclude(include);
      }
      if (!(0, import_model_utils.isSameInitialModel)(include.association.source, associationOwner)) {
        throw new Error(`Invalid Include received: the specified association "${include.association.as}" is not defined on model "${associationOwner.name}". It is owned by model "${include.association.source.name}".
${associationOwner._getAssociationDebugList()}`);
      }
    }
    if (!include.model) {
      include.model = include.association.target;
    }
    if (!(0, import_model_utils.isSameInitialModel)(include.model, include.association.target)) {
      throw new TypeError(`Invalid Include received: the specified "model" option ("${include.model.name}") does not match the target ("${include.association.target.name}") of the "${include.association.as}" association.`);
    }
    if (!include.as) {
      include.as = include.association.as;
    }
    this._conformIncludes(include, include.model);
    return include;
  }
  static _expandIncludeAllElement(includes, include) {
    let _a = include, { all, nested } = _a, includeOptions = __objRest(_a, ["all", "nested"]);
    if (Object.keys(includeOptions).length > 0) {
      throw new Error('"include: { all: true }" does not allow extra options (except for "nested") because they are unsafe. Select includes one by one if you want to specify more options.');
    }
    if (all !== true) {
      if (!Array.isArray(all)) {
        all = [all];
      }
      const validTypes = {
        BelongsTo: true,
        HasOne: true,
        HasMany: true,
        One: ["BelongsTo", "HasOne"],
        Has: ["HasOne", "HasMany"],
        Many: ["HasMany"]
      };
      for (let i = 0; i < all.length; i++) {
        const type = all[i];
        if (type === "All") {
          all = true;
          break;
        }
        const types = validTypes[type];
        if (!types) {
          throw new sequelizeErrors.EagerLoadingError(`include all '${type}' is not valid - must be BelongsTo, HasOne, HasMany, One, Has, Many or All`);
        }
        if (types !== true) {
          all.splice(i, 1);
          i--;
          for (const type_ of types) {
            if (!all.includes(type_)) {
              all.unshift(type_);
              i++;
            }
          }
        }
      }
    }
    const visitedModels = [];
    const addAllIncludes = (parent, includes2) => {
      _.forEach(parent.associations, (association) => {
        if (all !== true && !all.includes(association.associationType)) {
          return;
        }
        if (association.parentAssociation instanceof BelongsToMany && association === association.parentAssociation.fromSourceToThroughOne) {
          return;
        }
        if (includes2.some((existingInclude) => existingInclude.association === association)) {
          return;
        }
        const newInclude = { association };
        const model = association.target;
        if (nested && visitedModels.includes(model)) {
          return;
        }
        const normalizedNewInclude = this._conformInclude(newInclude, parent);
        includes2.push(normalizedNewInclude);
        if (nested) {
          visitedModels.push(parent);
          const subIncludes = [];
          addAllIncludes(model, subIncludes);
          visitedModels.pop();
          if (subIncludes.length > 0) {
            normalizedNewInclude.include = subIncludes;
          }
        }
      });
    };
    addAllIncludes(this, includes);
  }
  static _validateIncludedElement(include, tableNames, options) {
    tableNames[include.model.getTableName()] = true;
    if (include.attributes && !options.raw) {
      include.model._expandAttributes(include);
      include.originalAttributes = include.model._injectDependentVirtualAttributes(include.attributes);
      include = Utils.mapFinderOptions(include, include.model);
      if (include.attributes.length > 0) {
        _.each(include.model.primaryKeys, (attr, key) => {
          if (!include.attributes.some((includeAttr) => {
            if (attr.field !== key) {
              return Array.isArray(includeAttr) && includeAttr[0] === attr.field && includeAttr[1] === key;
            }
            return includeAttr === key;
          })) {
            include.attributes.unshift(key);
          }
        });
      }
    } else {
      include = Utils.mapFinderOptions(include, include.model);
    }
    if (include._pseudo) {
      if (!include.attributes) {
        include.attributes = Object.keys(include.model.tableAttributes);
      }
      return Utils.mapFinderOptions(include, include.model);
    }
    const association = include.association || this.getAssociationWithModel(include.model, include.as);
    include.association = association;
    include.as || (include.as = association.as);
    if (association instanceof BelongsToMany) {
      if (!include.include) {
        include.include = [];
      }
      const through = include.association.through;
      include.through = _.defaults(include.through || {}, {
        model: through.model,
        as: through.model.name,
        association: {
          isSingleAssociation: true
        },
        _pseudo: true,
        parent: include
      });
      if (through.scope) {
        include.through.where = include.through.where ? { [Op.and]: [include.through.where, through.scope] } : through.scope;
      }
      include.include.push(include.through);
      tableNames[through.tableName] = true;
    }
    let model;
    if (include.model.scoped === true) {
      model = include.model;
    } else {
      model = include.association.target.name === include.model.name ? include.association.target : include.association.source;
    }
    model._injectScope(include);
    if (!include.attributes) {
      include.attributes = Object.keys(include.model.tableAttributes);
    }
    include = Utils.mapFinderOptions(include, include.model);
    if (include.required === void 0) {
      include.required = Boolean(include.where);
    }
    if (include.association.scope) {
      include.where = include.where ? { [Op.and]: [include.where, include.association.scope] } : include.association.scope;
    }
    if (include.limit && include.separate === void 0) {
      include.separate = true;
    }
    if (include.separate === true) {
      if (!(include.association instanceof HasMany)) {
        throw new TypeError("Only HasMany associations support include.separate");
      }
      include.duplicating = false;
      if (options.attributes && options.attributes.length > 0 && !_.flattenDepth(options.attributes, 2).includes(association.sourceKey)) {
        options.attributes.push(association.sourceKey);
      }
      if (include.attributes && include.attributes.length > 0 && !_.flattenDepth(include.attributes, 2).includes(association.foreignKey)) {
        include.attributes.push(association.foreignKey);
      }
    }
    if (Object.prototype.hasOwnProperty.call(include, "include")) {
      _validateIncludedElements(include, tableNames);
    }
    return include;
  }
  static _expandIncludeAll(options, associationOwner) {
    const includes = options.include;
    if (!includes) {
      return;
    }
    for (let index = 0; index < includes.length; index++) {
      const include = includes[index];
      if (include.all) {
        includes.splice(index, 1);
        index--;
        associationOwner._expandIncludeAllElement(includes, include);
      }
    }
    for (const include of includes) {
      this._expandIncludeAll(include, include.model);
    }
  }
  static _conformIndex(index) {
    if (!index.fields) {
      throw new Error('Missing "fields" property for index definition');
    }
    index = _.defaults(index, {
      type: "",
      parser: null
    });
    if (index.type && index.type.toLowerCase() === "unique") {
      index.unique = true;
      delete index.type;
    }
    return index;
  }
  static _baseMerge(...args) {
    _.assignWith(...args);
    return args[0];
  }
  static _mergeFunction(objValue, srcValue, key) {
    if (key === "include") {
      return combineIncludes(objValue, srcValue);
    }
    if (Array.isArray(objValue) && Array.isArray(srcValue)) {
      return _.union(objValue, srcValue);
    }
    if (["where", "having"].includes(key)) {
      return combineWheresWithAnd(objValue, srcValue);
    } else if (key === "attributes" && _.isPlainObject(objValue) && _.isPlainObject(srcValue)) {
      return _.assignWith(objValue, srcValue, (objValue2, srcValue2) => {
        if (Array.isArray(objValue2) && Array.isArray(srcValue2)) {
          return _.union(objValue2, srcValue2);
        }
      });
    }
    if (srcValue) {
      return Utils.cloneDeep(srcValue, true);
    }
    return srcValue === void 0 ? objValue : srcValue;
  }
  static _assignOptions(...args) {
    return this._baseMerge(...args, this._mergeFunction);
  }
  static _defaultsOptions(target, opts) {
    return this._baseMerge(target, opts, (srcValue, objValue, key) => {
      return this._mergeFunction(objValue, srcValue, key);
    });
  }
  static init(attributes, options = {}) {
    if (!options.sequelize) {
      throw new Error("No Sequelize instance passed");
    }
    this.sequelize = options.sequelize;
    const globalOptions = this.sequelize.options;
    options = Utils.merge(_.cloneDeep(globalOptions.define), options);
    if (!options.modelName) {
      options.modelName = this.name;
    }
    options = Utils.merge({
      name: {
        plural: Utils.pluralize(options.modelName),
        singular: Utils.singularize(options.modelName)
      },
      indexes: [],
      omitNull: globalOptions.omitNull,
      schema: globalOptions.schema
    }, options);
    this.sequelize.runHooks("beforeDefine", attributes, options);
    if (options.modelName !== this.name) {
      Object.defineProperty(this, "name", { value: options.modelName });
    }
    delete options.modelName;
    this.options = __spreadValues({
      noPrimaryKey: false,
      timestamps: true,
      validate: {},
      freezeTableName: false,
      underscored: false,
      paranoid: false,
      rejectOnEmpty: false,
      whereCollection: null,
      schema: "",
      schemaDelimiter: "",
      defaultScope: {},
      scopes: {},
      indexes: []
    }, options);
    if (this.sequelize.isDefined(this.name)) {
      this.sequelize.modelManager.removeModel(this.sequelize.modelManager.getModel(this.name));
    }
    this.associations = /* @__PURE__ */ Object.create(null);
    this._setupHooks(options.hooks);
    this.underscored = this.options.underscored;
    if (!this.options.tableName) {
      this.tableName = this.options.freezeTableName ? this.name : Utils.underscoredIf(Utils.pluralize(this.name), this.underscored);
    } else {
      this.tableName = this.options.tableName;
    }
    this._schema = this.options.schema || "";
    this._schemaDelimiter = this.options.schemaDelimiter || "";
    _.each(options.validate, (validator, validatorType) => {
      if (Object.prototype.hasOwnProperty.call(attributes, validatorType)) {
        throw new Error(`A model validator function must not have the same name as a field. Model: ${this.name}, field/validation name: ${validatorType}`);
      }
      if (typeof validator !== "function") {
        throw new TypeError(`Members of the validate option must be functions. Model: ${this.name}, error with validate member ${validatorType}`);
      }
    });
    this.rawAttributes = _.mapValues(attributes, (attribute, name) => {
      attribute = this.sequelize.normalizeAttribute(attribute);
      if (name.startsWith("$") || name.endsWith("$")) {
        throw new Error(`Name of attribute "${name}" in model "${this.name}" cannot start or end with "$" as "$attribute$" is reserved syntax used to reference nested columns in queries.`);
      }
      if (name.includes(".")) {
        throw new Error(`Name of attribute "${name}" in model "${this.name}" cannot include the character "." as it would be ambiguous with the syntax used to reference nested columns, and nested json keys, in queries.`);
      }
      if (name.includes("::")) {
        throw new Error(`Name of attribute "${name}" in model "${this.name}" cannot include the character sequence "::" as it is reserved syntax used to cast attributes in queries.`);
      }
      if (name.includes("->")) {
        throw new Error(`Name of attribute "${name}" in model "${this.name}" cannot include the character sequence "->" as it is reserved syntax used in SQL generated by Sequelize to target nested associations.`);
      }
      if (attribute.type === void 0) {
        throw new Error(`Unrecognized datatype for attribute "${this.name}.${name}"`);
      }
      if (attribute.allowNull !== false && _.get(attribute, "validate.notNull")) {
        throw new Error(`Invalid definition for "${this.name}.${name}", "notNull" validator is only allowed with "allowNull:false"`);
      }
      if (_.get(attribute, "references.model.prototype") instanceof Model) {
        attribute.references.model = attribute.references.model.getTableName();
      }
      return attribute;
    });
    const tableName = this.getTableName();
    this._indexes = this.options.indexes.map((index) => Utils.nameIndex(this._conformIndex(index), tableName));
    this.primaryKeys = {};
    this._readOnlyAttributes = /* @__PURE__ */ new Set();
    this._timestampAttributes = {};
    if (this.options.timestamps) {
      for (const key of ["createdAt", "updatedAt", "deletedAt"]) {
        if (!["undefined", "string", "boolean"].includes(typeof this.options[key])) {
          throw new Error(`Value for "${key}" option must be a string or a boolean, got ${typeof this.options[key]}`);
        }
        if (this.options[key] === "") {
          throw new Error(`Value for "${key}" option cannot be an empty string`);
        }
      }
      if (this.options.createdAt !== false) {
        this._timestampAttributes.createdAt = typeof this.options.createdAt === "string" ? this.options.createdAt : "createdAt";
        this._readOnlyAttributes.add(this._timestampAttributes.createdAt);
      }
      if (this.options.updatedAt !== false) {
        this._timestampAttributes.updatedAt = typeof this.options.updatedAt === "string" ? this.options.updatedAt : "updatedAt";
        this._readOnlyAttributes.add(this._timestampAttributes.updatedAt);
      }
      if (this.options.paranoid && this.options.deletedAt !== false) {
        this._timestampAttributes.deletedAt = typeof this.options.deletedAt === "string" ? this.options.deletedAt : "deletedAt";
        this._readOnlyAttributes.add(this._timestampAttributes.deletedAt);
      }
    }
    if (this.options.version) {
      this._versionAttribute = typeof this.options.version === "string" ? this.options.version : "version";
      this._readOnlyAttributes.add(this._versionAttribute);
    }
    this._hasReadOnlyAttributes = this._readOnlyAttributes.size > 0;
    this._addDefaultAttributes();
    this.refreshAttributes();
    this._findAutoIncrementAttribute();
    this._scope = this.options.defaultScope;
    this._scopeNames = ["defaultScope"];
    this.sequelize.modelManager.addModel(this);
    this.sequelize.runHooks("afterDefine", this);
    return this;
  }
  static refreshAttributes() {
    const attributeManipulation = {};
    this.prototype._customGetters = {};
    this.prototype._customSetters = {};
    for (const type of ["get", "set"]) {
      const opt = `${type}terMethods`;
      const funcs = __spreadValues({}, this.options[opt]);
      const _custom = type === "get" ? this.prototype._customGetters : this.prototype._customSetters;
      _.each(funcs, (method, attribute) => {
        _custom[attribute] = method;
        if (type === "get") {
          funcs[attribute] = function() {
            return this.get(attribute);
          };
        }
        if (type === "set") {
          funcs[attribute] = function(value) {
            return this.set(attribute, value);
          };
        }
      });
      _.each(this.rawAttributes, (options, attribute) => {
        if (Object.prototype.hasOwnProperty.call(options, type)) {
          _custom[attribute] = options[type];
        }
        if (type === "get") {
          funcs[attribute] = function() {
            return this.get(attribute);
          };
        }
        if (type === "set") {
          funcs[attribute] = function(value) {
            return this.set(attribute, value);
          };
        }
      });
      _.each(funcs, (fct, name) => {
        if (!attributeManipulation[name]) {
          attributeManipulation[name] = {
            configurable: true
          };
        }
        attributeManipulation[name][type] = fct;
      });
    }
    this._dataTypeChanges = {};
    this._dataTypeSanitizers = {};
    this._hasBooleanAttributes = false;
    this._hasDateAttributes = false;
    this._jsonAttributes = /* @__PURE__ */ new Set();
    this._virtualAttributes = /* @__PURE__ */ new Set();
    this._defaultValues = {};
    this.prototype.validators = {};
    this.fieldRawAttributesMap = /* @__PURE__ */ Object.create(null);
    this.primaryKeys = /* @__PURE__ */ Object.create(null);
    this.uniqueKeys = /* @__PURE__ */ Object.create(null);
    _.each(this.rawAttributes, (definition, name) => {
      definition.type = this.sequelize.normalizeDataType(definition.type);
      definition.Model = this;
      definition.fieldName = name;
      definition._modelAttribute = true;
      if (definition.field === void 0) {
        definition.field = Utils.underscoredIf(name, this.underscored);
      }
      if (definition.primaryKey === true) {
        this.primaryKeys[name] = definition;
      }
      this.fieldRawAttributesMap[definition.field] = definition;
      if (definition.type._sanitize) {
        this._dataTypeSanitizers[name] = definition.type._sanitize;
      }
      if (definition.type._isChanged) {
        this._dataTypeChanges[name] = definition.type._isChanged;
      }
      if (definition.type instanceof DataTypes.BOOLEAN) {
        this._hasBooleanAttributes = true;
      } else if (definition.type instanceof DataTypes.DATE || definition.type instanceof DataTypes.DATEONLY) {
        this._hasDateAttributes = true;
      } else if (definition.type instanceof DataTypes.JSON) {
        this._jsonAttributes.add(name);
      } else if (definition.type instanceof DataTypes.VIRTUAL) {
        this._virtualAttributes.add(name);
      }
      if (Object.prototype.hasOwnProperty.call(definition, "defaultValue")) {
        this._defaultValues[name] = () => Utils.toDefaultValue(definition.defaultValue, this.sequelize.options.dialect);
      }
      if (Object.prototype.hasOwnProperty.call(definition, "unique") && definition.unique) {
        let idxName;
        if (typeof definition.unique === "object" && Object.prototype.hasOwnProperty.call(definition.unique, "name")) {
          idxName = definition.unique.name;
        } else if (typeof definition.unique === "string") {
          idxName = definition.unique;
        } else {
          idxName = `${this.tableName}_${name}_unique`;
        }
        const idx = this.uniqueKeys[idxName] || { fields: [] };
        idx.fields.push(definition.field);
        idx.msg = idx.msg || definition.unique.msg || null;
        idx.name = idxName || false;
        idx.column = name;
        idx.customIndex = definition.unique !== true;
        this.uniqueKeys[idxName] = idx;
      }
      if (Object.prototype.hasOwnProperty.call(definition, "validate")) {
        this.prototype.validators[name] = definition.validate;
      }
      if (definition.index === true && definition.type instanceof DataTypes.JSONB) {
        this._indexes.push(Utils.nameIndex(this._conformIndex({
          fields: [definition.field || name],
          using: "gin"
        }), this.getTableName()));
        delete definition.index;
      }
    });
    this.fieldAttributeMap = _.reduce(this.fieldRawAttributesMap, (map, value, key) => {
      if (key !== value.fieldName) {
        map[key] = value.fieldName;
      }
      return map;
    }, {});
    this._hasJsonAttributes = this._jsonAttributes.size > 0;
    this._hasVirtualAttributes = this._virtualAttributes.size > 0;
    this._hasDefaultValues = !_.isEmpty(this._defaultValues);
    this.tableAttributes = _.omitBy(this.rawAttributes, (_a, key) => this._virtualAttributes.has(key));
    this.prototype._hasCustomGetters = Object.keys(this.prototype._customGetters).length;
    this.prototype._hasCustomSetters = Object.keys(this.prototype._customSetters).length;
    for (const key of Object.keys(attributeManipulation)) {
      if (Object.prototype.hasOwnProperty.call(Model.prototype, key)) {
        this.sequelize.log(`Not overriding built-in method from model attribute: ${key}`);
        continue;
      }
      Object.defineProperty(this.prototype, key, attributeManipulation[key]);
    }
    this.prototype.rawAttributes = this.rawAttributes;
    this.prototype._isAttribute = (key) => Object.prototype.hasOwnProperty.call(this.prototype.rawAttributes, key);
    this.primaryKeyAttributes = Object.keys(this.primaryKeys);
    this.primaryKeyAttribute = this.primaryKeyAttributes[0];
    if (this.primaryKeyAttribute) {
      this.primaryKeyField = this.rawAttributes[this.primaryKeyAttribute].field || this.primaryKeyAttribute;
    }
    this._hasPrimaryKeys = this.primaryKeyAttributes.length > 0;
    this._isPrimaryKey = (key) => this.primaryKeyAttributes.includes(key);
    this._attributeManipulation = attributeManipulation;
  }
  static removeAttribute(attribute) {
    delete this.rawAttributes[attribute];
    this.refreshAttributes();
  }
  static mergeAttributesDefault(newAttributes) {
    Utils.mergeDefaults(this.rawAttributes, newAttributes);
    this.refreshAttributes();
    return this.rawAttributes;
  }
  static async sync(options) {
    options = __spreadValues(__spreadValues({}, this.options), options);
    options.hooks = options.hooks === void 0 ? true : Boolean(options.hooks);
    const attributes = this.tableAttributes;
    const rawAttributes = this.fieldRawAttributesMap;
    if (options.hooks) {
      await this.runHooks("beforeSync", options);
    }
    if (options.force) {
      await this.drop(options);
    }
    const tableName = this.getTableName(options);
    await this.queryInterface.createTable(tableName, attributes, options, this);
    if (options.alter) {
      const tableInfos = await Promise.all([
        this.queryInterface.describeTable(tableName, options),
        this.queryInterface.getForeignKeyReferencesForTable(tableName, options)
      ]);
      const columns = tableInfos[0];
      const foreignKeyReferences = tableInfos[1];
      const removedConstraints = {};
      for (const columnName in attributes) {
        if (!Object.prototype.hasOwnProperty.call(attributes, columnName)) {
          continue;
        }
        if (!columns[columnName] && !columns[attributes[columnName].field]) {
          await this.queryInterface.addColumn(tableName, attributes[columnName].field || columnName, attributes[columnName], options);
        }
      }
      if (options.alter === true || typeof options.alter === "object" && options.alter.drop !== false) {
        for (const columnName in columns) {
          if (!Object.prototype.hasOwnProperty.call(columns, columnName)) {
            continue;
          }
          const currentAttribute = rawAttributes[columnName];
          if (!currentAttribute) {
            await this.queryInterface.removeColumn(tableName, columnName, options);
            continue;
          }
          if (currentAttribute.primaryKey) {
            continue;
          }
          const references = currentAttribute.references;
          if (currentAttribute.references) {
            const database = this.sequelize.config.database;
            const schema = this.sequelize.config.schema;
            for (const foreignKeyReference of foreignKeyReferences) {
              const constraintName = foreignKeyReference.constraintName;
              if (Boolean(constraintName) && foreignKeyReference.tableCatalog === database && (schema ? foreignKeyReference.tableSchema === schema : true) && foreignKeyReference.referencedTableName === references.model && foreignKeyReference.referencedColumnName === references.key && (schema ? foreignKeyReference.referencedTableSchema === schema : true) && !removedConstraints[constraintName] || this.sequelize.options.dialect === "ibmi") {
                await this.queryInterface.removeConstraint(tableName, constraintName, options);
                removedConstraints[constraintName] = true;
              }
            }
          }
          await this.queryInterface.changeColumn(tableName, columnName, currentAttribute, options);
        }
      }
    }
    let indexes = await this.queryInterface.showIndex(tableName, options);
    indexes = this._indexes.filter((item1) => !indexes.some((item2) => item1.name === item2.name)).sort((index1, index2) => {
      if (this.sequelize.options.dialect === "postgres") {
        if (index1.concurrently === true) {
          return 1;
        }
        if (index2.concurrently === true) {
          return -1;
        }
      }
      return 0;
    });
    for (const index of indexes) {
      await this.queryInterface.addIndex(tableName, __spreadValues(__spreadValues({}, options), index));
    }
    if (options.hooks) {
      await this.runHooks("afterSync", options);
    }
    return this;
  }
  static async drop(options) {
    return await this.queryInterface.dropTable(this.getTableName(options), options);
  }
  static async dropSchema(schema) {
    noModelDropSchema();
    return await this.queryInterface.dropSchema(schema);
  }
  static withSchema(schema) {
    if (arguments.length > 1) {
      throw new TypeError("Unlike Model.schema, Model.withSchema only accepts 1 argument which may be either a string or an option bag.");
    }
    const schemaOptions = typeof schema === "string" ? { schema } : schema;
    return this.getInitialModel()._withScopeAndSchema(schemaOptions, this._scope, this._scopeNames);
  }
  static schema(schema, options) {
    schemaRenamedToWithSchema();
    return this.withSchema({
      schema,
      schemaDelimiter: typeof options === "string" ? options : options == null ? void 0 : options.schemaDelimiter
    });
  }
  static getInitialModel() {
    return this._initialModel ?? this;
  }
  static getTableName() {
    return this.queryGenerator.addSchema(this);
  }
  static addScope(name, scope, options) {
    if (this !== this.getInitialModel()) {
      throw new Error(`Model.addScope can only be called on the initial model. Use "${this.name}.getInitialModel()" to access the initial model.`);
    }
    options = __spreadValues({ override: false }, options);
    if ((name === "defaultScope" && Object.keys(this.options.defaultScope).length > 0 || name in this.options.scopes) && options.override === false) {
      throw new Error(`The scope ${name} already exists. Pass { override: true } as options to silence this error`);
    }
    if (name === "defaultScope") {
      this.options.defaultScope = this._scope = scope;
    } else {
      this.options.scopes[name] = scope;
    }
  }
  static scope(...options) {
    scopeRenamedToWithScope();
    return this.withScope(...options);
  }
  static withScope(...scopes) {
    scopes = scopes.flat().filter(Boolean);
    const initialModel = this.getInitialModel();
    const mergedScope = {};
    const scopeNames = [];
    for (const option of scopes) {
      let scope = null;
      let scopeName = null;
      if (_.isPlainObject(option)) {
        if (option.method) {
          if (Array.isArray(option.method) && Boolean(initialModel.options.scopes[option.method[0]])) {
            scopeName = option.method[0];
            scope = initialModel.options.scopes[scopeName].apply(initialModel, option.method.slice(1));
          } else if (initialModel.options.scopes[option.method]) {
            scopeName = option.method;
            scope = initialModel.options.scopes[scopeName].apply(initialModel);
          }
        } else {
          scope = option;
        }
      } else if (option === "defaultScope" && _.isPlainObject(initialModel.options.defaultScope)) {
        scope = initialModel.options.defaultScope;
      } else {
        scopeName = option;
        scope = initialModel.options.scopes[scopeName];
        if (typeof scope === "function") {
          scope = scope();
        }
      }
      if (!scope) {
        throw new sequelizeErrors.SequelizeScopeError(`"${this.name}.withScope()" has been called with an invalid scope: "${scopeName}" does not exist.`);
      }
      this._conformIncludes(scope, this);
      this._assignOptions(mergedScope, Utils.cloneDeep(scope));
      scopeNames.push(scopeName ? scopeName : "defaultScope");
    }
    return initialModel._withScopeAndSchema({
      schema: this._schema || "",
      schemaDelimiter: this._schemaDelimiter || ""
    }, mergedScope, scopeNames);
  }
  static unscoped() {
    scopeRenamedToWithScope();
    return this.withoutScope();
  }
  static withoutScope() {
    return this.withScope(null);
  }
  static withInitialScope() {
    const initialModel = this.getInitialModel();
    if (this._schema !== initialModel._schema || this._schemaDelimiter !== initialModel._schemaDelimiter) {
      return initialModel.withSchema({
        schema: this._schema,
        schemaDelimiter: this._schemaDelimiter
      });
    }
    return initialModel;
  }
  static _withScopeAndSchema(schemaOptions, mergedScope, scopeNames) {
    if (!this._modelVariantRefs) {
      this._modelVariantRefs = /* @__PURE__ */ new Set([new WeakRef(this)]);
    }
    for (const modelVariantRef of this._modelVariantRefs) {
      const modelVariant = modelVariantRef.deref();
      if (!modelVariant) {
        this._modelVariantRefs.delete(modelVariantRef);
        continue;
      }
      if (modelVariant._schema !== (schemaOptions.schema || "")) {
        continue;
      }
      if (modelVariant._schemaDelimiter !== (schemaOptions.schemaDelimiter || "")) {
        continue;
      }
      if (!_.isEqual(modelVariant._scopeNames, scopeNames)) {
        continue;
      }
      if (!_.isEqual(modelVariant._scope, mergedScope)) {
        continue;
      }
      return modelVariant;
    }
    const clone = this._createModelVariant();
    this._modelVariantRefs.add(new WeakRef(clone));
    clone._schema = schemaOptions.schema || "";
    clone._schemaDelimiter = schemaOptions.schemaDelimiter || "";
    clone._scope = mergedScope;
    clone._scopeNames = scopeNames;
    if (scopeNames.length !== 1 || scopeNames[0] !== "defaultScope") {
      clone.scoped = true;
    }
    return clone;
  }
  static _createModelVariant() {
    const model = class extends this {
    };
    model._initialModel = this;
    Object.defineProperty(model, "name", { value: this.name });
    return model;
  }
  static async findAll(options) {
    if (options !== void 0 && !_.isPlainObject(options)) {
      throw new sequelizeErrors.QueryError("The argument passed to findAll must be an options object, use findByPk if you wish to pass a single primary key value");
    }
    if (options !== void 0 && options.attributes && !Array.isArray(options.attributes) && !_.isPlainObject(options.attributes)) {
      throw new sequelizeErrors.QueryError("The attributes option must be an array of column names or an object");
    }
    this._warnOnInvalidOptions(options, Object.keys(this.rawAttributes));
    const tableNames = {};
    tableNames[this.getTableName(options)] = true;
    options = Utils.cloneDeep(options);
    _.defaults(options, { hooks: true, model: this });
    options.rejectOnEmpty = Object.prototype.hasOwnProperty.call(options, "rejectOnEmpty") ? options.rejectOnEmpty : this.options.rejectOnEmpty;
    this._conformIncludes(options, this);
    this._injectScope(options);
    if (options.hooks) {
      await this.runHooks("beforeFind", options);
      this._conformIncludes(options, this);
    }
    this._expandAttributes(options);
    this._expandIncludeAll(options, options.model);
    if (options.hooks) {
      await this.runHooks("beforeFindAfterExpandIncludeAll", options);
    }
    options.originalAttributes = this._injectDependentVirtualAttributes(options.attributes);
    if (options.include) {
      options.hasJoin = true;
      _validateIncludedElements(options, tableNames);
      if (options.attributes && !options.raw && this.primaryKeyAttribute && !options.attributes.includes(this.primaryKeyAttribute) && (!options.group || !options.hasSingleAssociation || options.hasMultiAssociation)) {
        options.attributes = [this.primaryKeyAttribute].concat(options.attributes);
      }
    }
    if (!options.attributes) {
      options.attributes = Object.keys(this.rawAttributes);
      options.originalAttributes = this._injectDependentVirtualAttributes(options.attributes);
    }
    this.options.whereCollection = options.where || null;
    Utils.mapFinderOptions(options, this);
    options = this._paranoidClause(this, options);
    if (options.hooks) {
      await this.runHooks("beforeFindAfterOptions", options);
    }
    const selectOptions = __spreadProps(__spreadValues({}, options), { tableNames: Object.keys(tableNames) });
    const results = await this.queryInterface.select(this, this.getTableName(selectOptions), selectOptions);
    if (options.hooks) {
      await this.runHooks("afterFind", results, options);
    }
    if (_.isEmpty(results) && options.rejectOnEmpty) {
      if (typeof options.rejectOnEmpty === "function") {
        throw new options.rejectOnEmpty();
      }
      if (typeof options.rejectOnEmpty === "object") {
        throw options.rejectOnEmpty;
      }
      throw new sequelizeErrors.EmptyResultError();
    }
    return await Model._findSeparate(results, options);
  }
  static _warnOnInvalidOptions(options, validColumnNames) {
    if (!_.isPlainObject(options)) {
      return;
    }
    const unrecognizedOptions = Object.keys(options).filter((k) => !validQueryKeywords.has(k));
    const unexpectedModelAttributes = _.intersection(unrecognizedOptions, validColumnNames);
    if (!options.where && unexpectedModelAttributes.length > 0) {
      logger.warn(`Model attributes (${unexpectedModelAttributes.join(", ")}) passed into finder method options of model ${this.name}, but the options.where object is empty. Did you forget to use options.where?`);
    }
  }
  static _injectDependentVirtualAttributes(attributes) {
    if (!this._hasVirtualAttributes) {
      return attributes;
    }
    if (!attributes || !Array.isArray(attributes)) {
      return attributes;
    }
    for (const attribute of attributes) {
      if (this._virtualAttributes.has(attribute) && this.rawAttributes[attribute].type.fields) {
        attributes = attributes.concat(this.rawAttributes[attribute].type.fields);
      }
    }
    attributes = _.uniq(attributes);
    return attributes;
  }
  static async _findSeparate(results, options) {
    if (!options.include || options.raw || !results) {
      return results;
    }
    const original = results;
    if (options.plain) {
      results = [results];
    }
    if (!Array.isArray(results) || results.length === 0) {
      return original;
    }
    await Promise.all(options.include.map(async (include) => {
      if (!include.separate) {
        return await Model._findSeparate(results.reduce((memo, result) => {
          let associations = result.get(include.association.as);
          if (!associations) {
            return memo;
          }
          if (!Array.isArray(associations)) {
            associations = [associations];
          }
          for (let i = 0, len = associations.length; i !== len; ++i) {
            memo.push(associations[i]);
          }
          return memo;
        }, []), __spreadProps(__spreadValues({}, _.omit(options, "include", "attributes", "order", "where", "limit", "offset", "plain", "scope")), {
          include: include.include || []
        }));
      }
      const map = await include.association.get(results, __spreadValues(__spreadValues({}, _.omit(options, nonCascadingOptions)), _.omit(include, ["parent", "association", "as", "originalAttributes"])));
      for (const result of results) {
        result.set(include.association.as, map.get(result.get(include.association.sourceKey)), { raw: true });
      }
    }));
    return original;
  }
  static async findByPk(param, options) {
    if ([null, void 0].includes(param)) {
      return null;
    }
    options = Utils.cloneDeep(options) || {};
    if (typeof param === "number" || typeof param === "bigint" || typeof param === "string" || Buffer.isBuffer(param)) {
      options.where = {
        [this.primaryKeyAttribute]: param
      };
    } else {
      throw new TypeError(`Argument passed to findByPk is invalid: ${param}`);
    }
    return await Model.findOne.call(this, options);
  }
  static async findOne(options) {
    if (options !== void 0 && !_.isPlainObject(options)) {
      throw new Error("The argument passed to findOne must be an options object, use findByPk if you wish to pass a single primary key value");
    }
    options = Utils.cloneDeep(options);
    if (options.limit === void 0) {
      const uniqueSingleColumns = _.chain(this.uniqueKeys).values().filter((c) => c.fields.length === 1).map("column").value();
      if (!options.where || !_.some(options.where, (value, key) => (key === this.primaryKeyAttribute || uniqueSingleColumns.includes(key)) && (Utils.isPrimitive(value) || Buffer.isBuffer(value)))) {
        options.limit = 1;
      }
    }
    return await Model.findAll.call(this, _.defaults(options, {
      model: this,
      plain: true
    }));
  }
  static async aggregate(attribute, aggregateFunction, options) {
    options = Utils.cloneDeep(options);
    options.model = this;
    const prevAttributes = options.attributes;
    this._injectScope(options);
    options.attributes = prevAttributes;
    this._conformIncludes(options, this);
    if (options.include) {
      this._expandIncludeAll(options);
      _validateIncludedElements(options);
    }
    const attrOptions = this.rawAttributes[attribute];
    const field = attrOptions && attrOptions.field || attribute;
    let aggregateColumn = this.sequelize.col(field);
    if (options.distinct) {
      aggregateColumn = this.sequelize.fn("DISTINCT", aggregateColumn);
    }
    let { group } = options;
    if (Array.isArray(group) && Array.isArray(group[0])) {
      noDoubleNestedGroup();
      group = group.flat();
    }
    options.attributes = _.unionBy(options.attributes, group, [[this.sequelize.fn(aggregateFunction, aggregateColumn), aggregateFunction]], (a) => Array.isArray(a) ? a[1] : a);
    if (!options.dataType) {
      if (attrOptions) {
        options.dataType = attrOptions.type;
      } else {
        options.dataType = new DataTypes.FLOAT();
      }
    } else {
      options.dataType = this.sequelize.normalizeDataType(options.dataType);
    }
    Utils.mapOptionFieldNames(options, this);
    options = this._paranoidClause(this, options);
    const value = await this.queryInterface.rawSelect(this.getTableName(options), options, aggregateFunction, this);
    return value;
  }
  static async count(options) {
    options = Utils.cloneDeep(options);
    options = _.defaults(options, { hooks: true });
    options.raw = true;
    if (options.hooks) {
      await this.runHooks("beforeCount", options);
    }
    let col = options.col || "*";
    if (options.include) {
      col = `${this.name}.${options.col || this.primaryKeyField}`;
    }
    if (options.distinct && col === "*") {
      col = this.primaryKeyField;
    }
    options.plain = !options.group;
    options.dataType = new DataTypes.INTEGER();
    options.includeIgnoreAttributes = false;
    options.limit = null;
    options.offset = null;
    options.order = null;
    const result = await this.aggregate(col, "count", options);
    if (Array.isArray(result)) {
      return result.map((item) => __spreadProps(__spreadValues({}, item), {
        count: Number(item.count)
      }));
    }
    return result;
  }
  static async findAndCountAll(options) {
    if (options !== void 0 && !_.isPlainObject(options)) {
      throw new Error("The argument passed to findAndCountAll must be an options object, use findByPk if you wish to pass a single primary key value");
    }
    const countOptions = Utils.cloneDeep(options);
    if (countOptions.attributes) {
      countOptions.attributes = void 0;
    }
    const [count, rows] = await Promise.all([
      this.count(countOptions),
      this.findAll(options)
    ]);
    return {
      count,
      rows: count === 0 ? [] : rows
    };
  }
  static async max(field, options) {
    return await this.aggregate(field, "max", options);
  }
  static async min(field, options) {
    return await this.aggregate(field, "min", options);
  }
  static async sum(field, options) {
    return await this.aggregate(field, "sum", options);
  }
  static build(values, options) {
    if (Array.isArray(values)) {
      return this.bulkBuild(values, options);
    }
    return new this(values, options);
  }
  static bulkBuild(valueSets, options) {
    options = __spreadValues({ isNewRecord: true }, options);
    if (!options.includeValidated) {
      this._conformIncludes(options, this);
      if (options.include) {
        this._expandIncludeAll(options);
        _validateIncludedElements(options);
      }
    }
    if (options.attributes) {
      options.attributes = options.attributes.map((attribute) => Array.isArray(attribute) ? attribute[1] : attribute);
    }
    return valueSets.map((values) => this.build(values, options));
  }
  static async create(values, options) {
    options = Utils.cloneDeep(options || {});
    return await this.build(values, {
      isNewRecord: true,
      attributes: options.fields,
      include: options.include,
      raw: options.raw,
      silent: options.silent
    }).save(options);
  }
  static async findOrBuild(options) {
    if (!options || !options.where || arguments.length > 1) {
      throw new Error("Missing where attribute in the options parameter passed to findOrBuild. Please note that the API has changed, and is now options only (an object with where, defaults keys, transaction etc.)");
    }
    let values;
    let instance = await this.findOne(options);
    if (instance === null) {
      values = __spreadValues({}, options.defaults);
      if (_.isPlainObject(options.where)) {
        values = Utils.defaults(values, options.where);
      }
      instance = this.build(values, options);
      return [instance, true];
    }
    return [instance, false];
  }
  static async findOrCreate(options) {
    if (!options || !options.where || arguments.length > 1) {
      throw new Error("Missing where attribute in the options parameter passed to findOrCreate. Please note that the API has changed, and is now options only (an object with where, defaults keys, transaction etc.)");
    }
    options = __spreadValues({}, options);
    if (options.defaults) {
      const defaults = Object.keys(options.defaults);
      const unknownDefaults = defaults.filter((name) => !this.rawAttributes[name]);
      if (unknownDefaults.length > 0) {
        logger.warn(`Unknown attributes (${unknownDefaults}) passed to defaults option of findOrCreate`);
      }
    }
    if (options.transaction === void 0 && this.sequelize.constructor._cls) {
      const t = this.sequelize.constructor._cls.get("transaction");
      if (t) {
        options.transaction = t;
      }
    }
    const internalTransaction = !options.transaction;
    let values;
    let transaction;
    try {
      const t = await this.sequelize.transaction(options);
      transaction = t;
      options.transaction = t;
      const found = await this.findOne(Utils.defaults({ transaction }, options));
      if (found !== null) {
        return [found, false];
      }
      values = __spreadValues({}, options.defaults);
      if (_.isPlainObject(options.where)) {
        values = Utils.defaults(values, options.where);
      }
      options.exception = true;
      options.returning = true;
      try {
        const created = await this.create(values, options);
        if (created.get(this.primaryKeyAttribute, { raw: true }) === null) {
          throw new sequelizeErrors.UniqueConstraintError();
        }
        return [created, true];
      } catch (error) {
        if (!(error instanceof sequelizeErrors.UniqueConstraintError)) {
          throw error;
        }
        const flattenedWhere = Utils.flattenObjectDeep(options.where);
        const flattenedWhereKeys = Object.keys(flattenedWhere).map((name) => _.last(name.split(".")));
        const whereFields = flattenedWhereKeys.map((name) => _.get(this.rawAttributes, `${name}.field`, name));
        const defaultFields = options.defaults && Object.keys(options.defaults).filter((name) => this.rawAttributes[name]).map((name) => this.rawAttributes[name].field || name);
        const errFieldKeys = Object.keys(error.fields);
        const errFieldsWhereIntersects = Utils.intersects(errFieldKeys, whereFields);
        if (defaultFields && !errFieldsWhereIntersects && Utils.intersects(errFieldKeys, defaultFields)) {
          throw error;
        }
        if (errFieldsWhereIntersects) {
          _.each(error.fields, (value, key) => {
            const name = this.fieldRawAttributesMap[key].fieldName;
            if (value.toString() !== options.where[name].toString()) {
              throw new Error(`${this.name}#findOrCreate: value used for ${name} was not equal for both the find and the create calls, '${options.where[name]}' vs '${value}'`);
            }
          });
        }
        const otherCreated = await this.findOne(Utils.defaults({
          transaction: internalTransaction ? null : transaction
        }, options));
        if (otherCreated === null) {
          throw error;
        }
        return [otherCreated, false];
      }
    } finally {
      if (internalTransaction && transaction) {
        await transaction.commit();
      }
    }
  }
  static async findCreateFind(options) {
    if (!options || !options.where) {
      throw new Error("Missing where attribute in the options parameter passed to findCreateFind.");
    }
    let values = __spreadValues({}, options.defaults);
    if (_.isPlainObject(options.where)) {
      values = Utils.defaults(values, options.where);
    }
    const found = await this.findOne(options);
    if (found) {
      return [found, false];
    }
    try {
      const createOptions = __spreadValues({}, options);
      if (this.sequelize.options.dialect === "postgres" && options.transaction) {
        createOptions.ignoreDuplicates = true;
      }
      const created = await this.create(values, createOptions);
      return [created, true];
    } catch (error) {
      if (!(error instanceof sequelizeErrors.UniqueConstraintError || error instanceof sequelizeErrors.EmptyResultError)) {
        throw error;
      }
      const foundAgain = await this.findOne(options);
      return [foundAgain, false];
    }
  }
  static async upsert(values, options) {
    options = __spreadValues({
      hooks: true,
      returning: true,
      validate: true
    }, Utils.cloneDeep(options));
    const createdAtAttr = this._timestampAttributes.createdAt;
    const updatedAtAttr = this._timestampAttributes.updatedAt;
    const hasPrimary = this.primaryKeyField in values || this.primaryKeyAttribute in values;
    const instance = this.build(values);
    options.model = this;
    options.instance = instance;
    const changed = [...instance._changed];
    if (!options.fields) {
      options.fields = changed;
    }
    if (options.validate) {
      await instance.validate(options);
    }
    const updatedDataValues = _.pick(instance.dataValues, changed);
    const insertValues = Utils.mapValueFieldNames(instance.dataValues, Object.keys(instance.rawAttributes), this);
    const updateValues = Utils.mapValueFieldNames(updatedDataValues, options.fields, this);
    const now = Utils.now(this.sequelize.options.dialect);
    if (createdAtAttr && !insertValues[createdAtAttr]) {
      const field = this.rawAttributes[createdAtAttr].field || createdAtAttr;
      insertValues[field] = this._getDefaultTimestamp(createdAtAttr) || now;
    }
    if (updatedAtAttr && !insertValues[updatedAtAttr]) {
      const field = this.rawAttributes[updatedAtAttr].field || updatedAtAttr;
      insertValues[field] = updateValues[field] = this._getDefaultTimestamp(updatedAtAttr) || now;
    }
    if (this.sequelize.options.dialect === "db2") {
      this.uniqno = this.sequelize.dialect.queryGenerator.addUniqueFields(insertValues, this.rawAttributes, this.uniqno);
    }
    if (!hasPrimary && this.primaryKeyAttribute && !this.rawAttributes[this.primaryKeyAttribute].defaultValue) {
      delete insertValues[this.primaryKeyField];
      delete updateValues[this.primaryKeyField];
    }
    if (options.hooks) {
      await this.runHooks("beforeUpsert", values, options);
    }
    const result = await this.queryInterface.upsert(this.getTableName(options), insertValues, updateValues, instance.where(), options);
    const [record] = result;
    record.isNewRecord = false;
    if (options.hooks) {
      await this.runHooks("afterUpsert", result, options);
      return result;
    }
    return result;
  }
  static async bulkCreate(records, options = {}) {
    if (records.length === 0) {
      return [];
    }
    const dialect = this.sequelize.options.dialect;
    const now = Utils.now(this.sequelize.options.dialect);
    options = Utils.cloneDeep(options);
    options.model = this;
    if (!options.includeValidated) {
      this._conformIncludes(options, this);
      if (options.include) {
        this._expandIncludeAll(options);
        _validateIncludedElements(options);
      }
    }
    const instances = records.map((values) => this.build(values, { isNewRecord: true, include: options.include }));
    const recursiveBulkCreate = async (instances2, options2) => {
      options2 = __spreadValues({
        validate: false,
        hooks: true,
        individualHooks: false,
        ignoreDuplicates: false
      }, options2);
      if (options2.returning === void 0) {
        if (options2.association) {
          options2.returning = false;
        } else {
          options2.returning = true;
        }
      }
      if (options2.ignoreDuplicates && ["mssql", "db2", "ibmi"].includes(dialect)) {
        throw new Error(`${dialect} does not support the ignoreDuplicates option.`);
      }
      if (options2.updateOnDuplicate && !["mysql", "mariadb", "sqlite", "postgres", "ibmi"].includes(dialect)) {
        throw new Error(`${dialect} does not support the updateOnDuplicate option.`);
      }
      const model = options2.model;
      options2.fields = options2.fields || Object.keys(model.rawAttributes);
      const createdAtAttr = model._timestampAttributes.createdAt;
      const updatedAtAttr = model._timestampAttributes.updatedAt;
      if (options2.updateOnDuplicate !== void 0) {
        if (Array.isArray(options2.updateOnDuplicate) && options2.updateOnDuplicate.length > 0) {
          options2.updateOnDuplicate = _.intersection(_.without(Object.keys(model.tableAttributes), createdAtAttr), options2.updateOnDuplicate);
        } else {
          throw new Error("updateOnDuplicate option only supports non-empty array.");
        }
      }
      if (options2.hooks) {
        await model.runHooks("beforeBulkCreate", instances2, options2);
      }
      if (options2.validate) {
        const errors = [];
        const validateOptions = __spreadValues({}, options2);
        validateOptions.hooks = options2.individualHooks;
        await Promise.all(instances2.map(async (instance) => {
          try {
            await instance.validate(validateOptions);
          } catch (error) {
            errors.push(new sequelizeErrors.BulkRecordError(error, instance));
          }
        }));
        delete options2.skip;
        if (errors.length > 0) {
          throw new sequelizeErrors.AggregateError(errors);
        }
      }
      if (options2.individualHooks) {
        await Promise.all(instances2.map(async (instance) => {
          const individualOptions = __spreadProps(__spreadValues({}, options2), {
            validate: false,
            hooks: true
          });
          delete individualOptions.fields;
          delete individualOptions.individualHooks;
          delete individualOptions.ignoreDuplicates;
          await instance.save(individualOptions);
        }));
      } else {
        if (options2.include && options2.include.length > 0) {
          await Promise.all(options2.include.filter((include) => include.association instanceof BelongsTo).map(async (include) => {
            const associationInstances = [];
            const associationInstanceIndexToInstanceMap = [];
            for (const instance of instances2) {
              const associationInstance = instance.get(include.as);
              if (associationInstance) {
                associationInstances.push(associationInstance);
                associationInstanceIndexToInstanceMap.push(instance);
              }
            }
            if (associationInstances.length === 0) {
              return;
            }
            const includeOptions = _(Utils.cloneDeep(include)).omit(["association"]).defaults({
              transaction: options2.transaction,
              logging: options2.logging
            }).value();
            const createdAssociationInstances = await recursiveBulkCreate(associationInstances, includeOptions);
            for (const idx in createdAssociationInstances) {
              const associationInstance = createdAssociationInstances[idx];
              const instance = associationInstanceIndexToInstanceMap[idx];
              await include.association.set(instance, associationInstance, { save: false, logging: options2.logging });
            }
          }));
        }
        records = instances2.map((instance) => {
          const values = instance.dataValues;
          if (createdAtAttr && !values[createdAtAttr]) {
            values[createdAtAttr] = now;
            if (!options2.fields.includes(createdAtAttr)) {
              options2.fields.push(createdAtAttr);
            }
          }
          if (updatedAtAttr && !values[updatedAtAttr]) {
            values[updatedAtAttr] = now;
            if (!options2.fields.includes(updatedAtAttr)) {
              options2.fields.push(updatedAtAttr);
            }
          }
          const out = Utils.mapValueFieldNames(values, options2.fields, model);
          for (const key of model._virtualAttributes) {
            delete out[key];
          }
          return out;
        });
        const fieldMappedAttributes = {};
        for (const attr in model.tableAttributes) {
          fieldMappedAttributes[model.rawAttributes[attr].field || attr] = model.rawAttributes[attr];
        }
        if (options2.updateOnDuplicate) {
          options2.updateOnDuplicate = options2.updateOnDuplicate.map((attr) => model.rawAttributes[attr].field || attr);
          const upsertKeys = [];
          for (const i of model._indexes) {
            if (i.unique && !i.where) {
              upsertKeys.push(...i.fields);
            }
          }
          const firstUniqueKey = Object.values(model.uniqueKeys).find((c) => c.fields.length > 0);
          if (firstUniqueKey && firstUniqueKey.fields) {
            upsertKeys.push(...firstUniqueKey.fields);
          }
          options2.upsertKeys = upsertKeys.length > 0 ? upsertKeys : Object.values(model.primaryKeys).map((x) => x.field);
        }
        if (options2.returning && Array.isArray(options2.returning)) {
          options2.returning = options2.returning.map((attr) => _.get(model.rawAttributes[attr], "field", attr));
        }
        const results = await model.queryInterface.bulkInsert(model.getTableName(options2), records, options2, fieldMappedAttributes);
        if (Array.isArray(results)) {
          for (const [i, result] of results.entries()) {
            const instance = instances2[i];
            for (const key in result) {
              if (!instance || key === model.primaryKeyAttribute && instance.get(model.primaryKeyAttribute) && ["mysql", "mariadb", "sqlite"].includes(dialect)) {
                continue;
              }
              if (Object.prototype.hasOwnProperty.call(result, key)) {
                const record = result[key];
                const attr = _.find(model.rawAttributes, (attribute) => attribute.fieldName === key || attribute.field === key);
                instance.dataValues[attr && attr.fieldName || key] = record;
              }
            }
          }
        }
      }
      if (options2.include && options2.include.length > 0) {
        await Promise.all(options2.include.filter((include) => !(include.association instanceof BelongsTo || include.parent && include.parent.association instanceof BelongsToMany)).map(async (include) => {
          const associationInstances = [];
          const associationInstanceIndexToInstanceMap = [];
          for (const instance of instances2) {
            let associated = instance.get(include.as);
            if (!Array.isArray(associated)) {
              associated = [associated];
            }
            for (const associationInstance of associated) {
              if (associationInstance) {
                if (!(include.association instanceof BelongsToMany)) {
                  associationInstance.set(include.association.foreignKey, instance.get(include.association.sourceKey || instance.constructor.primaryKeyAttribute, { raw: true }), { raw: true });
                  Object.assign(associationInstance, include.association.scope);
                }
                associationInstances.push(associationInstance);
                associationInstanceIndexToInstanceMap.push(instance);
              }
            }
          }
          if (associationInstances.length === 0) {
            return;
          }
          const includeOptions = _(Utils.cloneDeep(include)).omit(["association"]).defaults({
            transaction: options2.transaction,
            logging: options2.logging
          }).value();
          const createdAssociationInstances = await recursiveBulkCreate(associationInstances, includeOptions);
          if (include.association instanceof BelongsToMany) {
            const valueSets = [];
            for (const idx in createdAssociationInstances) {
              const associationInstance = createdAssociationInstances[idx];
              const instance = associationInstanceIndexToInstanceMap[idx];
              const values = __spreadValues({
                [include.association.foreignKey]: instance.get(instance.constructor.primaryKeyAttribute, { raw: true }),
                [include.association.otherKey]: associationInstance.get(associationInstance.constructor.primaryKeyAttribute, { raw: true })
              }, include.association.through.scope);
              if (associationInstance[include.association.through.model.name]) {
                for (const attr of Object.keys(include.association.through.model.rawAttributes)) {
                  if (include.association.through.model.rawAttributes[attr]._autoGenerated || attr === include.association.foreignKey || attr === include.association.otherKey || typeof associationInstance[include.association.through.model.name][attr] === "undefined") {
                    continue;
                  }
                  values[attr] = associationInstance[include.association.through.model.name][attr];
                }
              }
              valueSets.push(values);
            }
            const throughOptions = _(Utils.cloneDeep(include)).omit(["association", "attributes"]).defaults({
              transaction: options2.transaction,
              logging: options2.logging
            }).value();
            throughOptions.model = include.association.throughModel;
            const throughInstances = include.association.throughModel.bulkBuild(valueSets, throughOptions);
            await recursiveBulkCreate(throughInstances, throughOptions);
          }
        }));
      }
      for (const instance of instances2) {
        for (const attr in model.rawAttributes) {
          if (model.rawAttributes[attr].field && instance.dataValues[model.rawAttributes[attr].field] !== void 0 && model.rawAttributes[attr].field !== attr) {
            instance.dataValues[attr] = instance.dataValues[model.rawAttributes[attr].field];
            delete instance.dataValues[model.rawAttributes[attr].field];
          }
          instance._previousDataValues[attr] = instance.dataValues[attr];
          instance.changed(attr, false);
        }
        instance.isNewRecord = false;
      }
      if (options2.hooks) {
        await model.runHooks("afterBulkCreate", instances2, options2);
      }
      return instances2;
    };
    return await recursiveBulkCreate(instances, options);
  }
  static async truncate(options) {
    options = Utils.cloneDeep(options) || {};
    options.truncate = true;
    return await this.destroy(options);
  }
  static async destroy(options) {
    options = Utils.cloneDeep(options);
    this._injectScope(options);
    if (!options || !(options.where || options.truncate)) {
      throw new Error("Missing where or truncate attribute in the options parameter of model.destroy.");
    }
    if (!options.truncate && !_.isPlainObject(options.where) && !Array.isArray(options.where) && !(options.where instanceof Utils.SequelizeMethod)) {
      throw new Error("Expected plain object, array or sequelize method in the options.where parameter of model.destroy.");
    }
    options = _.defaults(options, {
      hooks: true,
      individualHooks: false,
      force: false,
      cascade: false,
      restartIdentity: false
    });
    options.type = QueryTypes.BULKDELETE;
    Utils.mapOptionFieldNames(options, this);
    options.model = this;
    if (options.hooks) {
      await this.runHooks("beforeBulkDestroy", options);
    }
    let instances;
    if (options.individualHooks) {
      instances = await this.findAll({ where: options.where, transaction: options.transaction, logging: options.logging, benchmark: options.benchmark });
      await Promise.all(instances.map((instance) => this.runHooks("beforeDestroy", instance, options)));
    }
    let result;
    if (this._timestampAttributes.deletedAt && !options.force) {
      options.type = QueryTypes.BULKUPDATE;
      const attrValueHash = {};
      const deletedAtAttribute = this.rawAttributes[this._timestampAttributes.deletedAt];
      const field = this.rawAttributes[this._timestampAttributes.deletedAt].field;
      const where = {
        [field]: Object.prototype.hasOwnProperty.call(deletedAtAttribute, "defaultValue") ? deletedAtAttribute.defaultValue : null
      };
      attrValueHash[field] = Utils.now(this.sequelize.options.dialect);
      result = await this.queryInterface.bulkUpdate(this.getTableName(options), attrValueHash, Object.assign(where, options.where), options, this.rawAttributes);
    } else {
      result = await this.queryInterface.bulkDelete(this.getTableName(options), options.where, options, this);
    }
    if (options.individualHooks) {
      await Promise.all(instances.map((instance) => this.runHooks("afterDestroy", instance, options)));
    }
    if (options.hooks) {
      await this.runHooks("afterBulkDestroy", options);
    }
    return result;
  }
  static async restore(options) {
    if (!this._timestampAttributes.deletedAt) {
      throw new Error("Model is not paranoid");
    }
    options = __spreadValues({
      hooks: true,
      individualHooks: false
    }, options);
    options.type = QueryTypes.RAW;
    options.model = this;
    Utils.mapOptionFieldNames(options, this);
    if (options.hooks) {
      await this.runHooks("beforeBulkRestore", options);
    }
    let instances;
    if (options.individualHooks) {
      instances = await this.findAll({ where: options.where, transaction: options.transaction, logging: options.logging, benchmark: options.benchmark, paranoid: false });
      await Promise.all(instances.map((instance) => this.runHooks("beforeRestore", instance, options)));
    }
    const attrValueHash = {};
    const deletedAtCol = this._timestampAttributes.deletedAt;
    const deletedAtAttribute = this.rawAttributes[deletedAtCol];
    const deletedAtDefaultValue = Object.prototype.hasOwnProperty.call(deletedAtAttribute, "defaultValue") ? deletedAtAttribute.defaultValue : null;
    attrValueHash[deletedAtAttribute.field || deletedAtCol] = deletedAtDefaultValue;
    options.omitNull = false;
    const result = await this.queryInterface.bulkUpdate(this.getTableName(options), attrValueHash, options.where, options, this.rawAttributes);
    if (options.individualHooks) {
      await Promise.all(instances.map((instance) => this.runHooks("afterRestore", instance, options)));
    }
    if (options.hooks) {
      await this.runHooks("afterBulkRestore", options);
    }
    return result;
  }
  static async update(values, options) {
    options = Utils.cloneDeep(options);
    this._injectScope(options);
    this._optionsMustContainWhere(options);
    options = this._paranoidClause(this, _.defaults(options, {
      validate: true,
      hooks: true,
      individualHooks: false,
      returning: false,
      force: false,
      sideEffects: true
    }));
    options.type = QueryTypes.BULKUPDATE;
    values = _.omitBy(values, (value) => value === void 0);
    if (options.fields && Array.isArray(options.fields)) {
      for (const key of Object.keys(values)) {
        if (!options.fields.includes(key)) {
          delete values[key];
        }
      }
    } else {
      const updatedAtAttr = this._timestampAttributes.updatedAt;
      options.fields = _.intersection(Object.keys(values), Object.keys(this.tableAttributes));
      if (updatedAtAttr && !options.fields.includes(updatedAtAttr)) {
        options.fields.push(updatedAtAttr);
      }
    }
    if (this._timestampAttributes.updatedAt && !options.silent) {
      values[this._timestampAttributes.updatedAt] = this._getDefaultTimestamp(this._timestampAttributes.updatedAt) || Utils.now(this.sequelize.options.dialect);
    }
    options.model = this;
    let valuesUse;
    if (options.validate) {
      const build = this.build(values);
      build.set(this._timestampAttributes.updatedAt, values[this._timestampAttributes.updatedAt], { raw: true });
      if (options.sideEffects) {
        Object.assign(values, _.pick(build.get(), build.changed()));
        options.fields = _.union(options.fields, Object.keys(values));
      }
      options.skip = _.difference(Object.keys(this.rawAttributes), Object.keys(values));
      const attributes = await build.validate(options);
      options.skip = void 0;
      if (attributes && attributes.dataValues) {
        values = _.pick(attributes.dataValues, Object.keys(values));
      }
    }
    if (options.hooks) {
      options.attributes = values;
      await this.runHooks("beforeBulkUpdate", options);
      values = options.attributes;
      delete options.attributes;
    }
    valuesUse = values;
    let instances;
    let updateDoneRowByRow = false;
    if (options.individualHooks) {
      instances = await this.findAll({
        where: options.where,
        transaction: options.transaction,
        logging: options.logging,
        benchmark: options.benchmark,
        paranoid: options.paranoid
      });
      if (instances.length > 0) {
        let changedValues;
        let different = false;
        instances = await Promise.all(instances.map(async (instance) => {
          Object.assign(instance.dataValues, values);
          _.forIn(valuesUse, (newValue, attr) => {
            if (newValue !== instance._previousDataValues[attr]) {
              instance.setDataValue(attr, newValue);
            }
          });
          await this.runHooks("beforeUpdate", instance, options);
          if (!different) {
            const thisChangedValues = {};
            _.forIn(instance.dataValues, (newValue, attr) => {
              if (newValue !== instance._previousDataValues[attr]) {
                thisChangedValues[attr] = newValue;
              }
            });
            if (!changedValues) {
              changedValues = thisChangedValues;
            } else {
              different = !_.isEqual(changedValues, thisChangedValues);
            }
          }
          return instance;
        }));
        if (!different) {
          const keys = Object.keys(changedValues);
          if (keys.length > 0) {
            valuesUse = changedValues;
            options.fields = _.union(options.fields, keys);
          }
        } else {
          instances = await Promise.all(instances.map(async (instance) => {
            const individualOptions = __spreadProps(__spreadValues({}, options), {
              hooks: false,
              validate: false
            });
            delete individualOptions.individualHooks;
            return instance.save(individualOptions);
          }));
          updateDoneRowByRow = true;
        }
      }
    }
    let result;
    if (updateDoneRowByRow) {
      result = [instances.length, instances];
    } else if (_.isEmpty(valuesUse) || Object.keys(valuesUse).length === 1 && valuesUse[this._timestampAttributes.updatedAt]) {
      result = [0];
    } else {
      valuesUse = Utils.mapValueFieldNames(valuesUse, options.fields, this);
      options = Utils.mapOptionFieldNames(options, this);
      options.hasTrigger = this.options ? this.options.hasTrigger : false;
      const affectedRows = await this.queryInterface.bulkUpdate(this.getTableName(options), valuesUse, options.where, options, this.tableAttributes);
      if (options.returning) {
        result = [affectedRows.length, affectedRows];
        instances = affectedRows;
      } else {
        result = [affectedRows];
      }
    }
    if (options.individualHooks) {
      await Promise.all(instances.map((instance) => this.runHooks("afterUpdate", instance, options)));
      result[1] = instances;
    }
    if (options.hooks) {
      options.attributes = values;
      await this.runHooks("afterBulkUpdate", options);
      delete options.attributes;
    }
    return result;
  }
  static async describe(schema, options) {
    return await this.queryInterface.describeTable(this.tableName, __spreadValues({ schema: schema || this._schema || "" }, options));
  }
  static _getDefaultTimestamp(attr) {
    if (Boolean(this.rawAttributes[attr]) && Boolean(this.rawAttributes[attr].defaultValue)) {
      return Utils.toDefaultValue(this.rawAttributes[attr].defaultValue, this.sequelize.options.dialect);
    }
  }
  static _expandAttributes(options) {
    if (!_.isPlainObject(options.attributes)) {
      return;
    }
    let attributes = Object.keys(this.rawAttributes);
    if (options.attributes.exclude) {
      attributes = attributes.filter((elem) => !options.attributes.exclude.includes(elem));
    }
    if (options.attributes.include) {
      attributes = attributes.concat(options.attributes.include);
    }
    options.attributes = attributes;
  }
  static _injectScope(options) {
    const scope = Utils.cloneDeep(this._scope);
    this._normalizeIncludes(scope, this);
    this._defaultsOptions(options, scope);
  }
  static [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.name;
  }
  static hasAlias(alias) {
    return Object.prototype.hasOwnProperty.call(this.associations, alias);
  }
  static getAssociations(target) {
    return Object.values(this.associations).filter((association) => association.target.name === target.name);
  }
  static getAssociationWithModel(targetModel, targetAlias) {
    if (targetAlias) {
      return this.getAssociation(targetAlias);
    }
    if (!targetModel) {
      throwInvalidInclude({ model: targetModel, as: targetAlias });
    }
    const matchingAssociations = this._getAssociationsByModel(targetModel);
    if (matchingAssociations.length === 0) {
      throw new sequelizeErrors.EagerLoadingError(`Invalid Include received: no associations exist between "${this.name}" and "${targetModel.name}"`);
    }
    if (matchingAssociations.length > 1) {
      throw new sequelizeErrors.EagerLoadingError(`
Ambiguous Include received:
You're trying to include the model "${targetModel.name}", but is associated to "${this.name}" multiple times.

Instead of specifying a Model, either:
1. pass one of the Association object (available in "${this.name}.associations") in the "association" option, e.g.:
   include: {
     association: ${this.name}.associations.${matchingAssociations[0].as},
   },

2. pass the name of one of the associations in the "association" option, e.g.:
   include: {
     association: '${matchingAssociations[0].as}',
   },

"${this.name}" is associated to "${targetModel.name}" through the following associations: ${matchingAssociations.map((association) => `"${association.as}"`).join(", ")}
`.trim());
    }
    return matchingAssociations[0];
  }
  static async increment(fields, options) {
    options = options || {};
    if (typeof fields === "string") {
      fields = [fields];
    }
    if (Array.isArray(fields)) {
      fields = fields.map((f) => {
        if (this.rawAttributes[f] && this.rawAttributes[f].field && this.rawAttributes[f].field !== f) {
          return this.rawAttributes[f].field;
        }
        return f;
      });
    } else if (fields && typeof fields === "object") {
      fields = Object.keys(fields).reduce((rawFields, f) => {
        if (this.rawAttributes[f] && this.rawAttributes[f].field && this.rawAttributes[f].field !== f) {
          rawFields[this.rawAttributes[f].field] = fields[f];
        } else {
          rawFields[f] = fields[f];
        }
        return rawFields;
      }, {});
    }
    this._injectScope(options);
    this._optionsMustContainWhere(options);
    options = Utils.defaults({}, options, {
      by: 1,
      where: {},
      increment: true
    });
    const isSubtraction = !options.increment;
    Utils.mapOptionFieldNames(options, this);
    const where = __spreadValues({}, options.where);
    let incrementAmountsByField = {};
    if (Array.isArray(fields)) {
      incrementAmountsByField = {};
      for (const field of fields) {
        incrementAmountsByField[field] = options.by;
      }
    } else {
      incrementAmountsByField = fields;
    }
    if (this._versionAttribute) {
      incrementAmountsByField[this._versionAttribute] = isSubtraction ? -1 : 1;
    }
    const extraAttributesToBeUpdated = {};
    const updatedAtAttr = this._timestampAttributes.updatedAt;
    if (!options.silent && updatedAtAttr && !incrementAmountsByField[updatedAtAttr]) {
      const attrName = this.rawAttributes[updatedAtAttr].field || updatedAtAttr;
      extraAttributesToBeUpdated[attrName] = this._getDefaultTimestamp(updatedAtAttr) || Utils.now(this.sequelize.options.dialect);
    }
    const tableName = this.getTableName(options);
    let affectedRows;
    if (isSubtraction) {
      affectedRows = await this.queryInterface.decrement(this, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options);
    } else {
      affectedRows = await this.queryInterface.increment(this, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options);
    }
    if (options.returning) {
      return [affectedRows, affectedRows.length];
    }
    return [affectedRows];
  }
  static async decrement(fields, options) {
    return this.increment(fields, __spreadProps(__spreadValues({
      by: 1
    }, options), {
      increment: false
    }));
  }
  static _optionsMustContainWhere(options) {
    assert(options && options.where, "Missing where attribute in the options parameter");
    assert(_.isPlainObject(options.where) || Array.isArray(options.where) || options.where instanceof Utils.SequelizeMethod, "Expected plain object, array or sequelize method in the options.where parameter");
  }
  where(checkVersion) {
    const where = this.constructor.primaryKeyAttributes.reduce((result, attribute) => {
      result[attribute] = this.get(attribute, { raw: true });
      return result;
    }, {});
    if (_.size(where) === 0) {
      return this.constructor.options.whereCollection;
    }
    const versionAttr = this.constructor._versionAttribute;
    if (checkVersion && versionAttr) {
      where[versionAttr] = this.get(versionAttr, { raw: true });
    }
    return Utils.mapWhereFieldNames(where, this.constructor);
  }
  toString() {
    return `[object SequelizeInstance:${this.constructor.name}]`;
  }
  getDataValue(key) {
    return this.dataValues[key];
  }
  setDataValue(key, value) {
    const originalValue = this._previousDataValues[key];
    if (!_.isEqual(value, originalValue)) {
      this.changed(key, true);
    }
    this.dataValues[key] = value;
  }
  get(key, options) {
    if (options === void 0 && typeof key === "object") {
      options = key;
      key = void 0;
    }
    options = options || {};
    if (key) {
      if (Object.prototype.hasOwnProperty.call(this._customGetters, key) && !options.raw) {
        return this._customGetters[key].call(this, key, options);
      }
      if (options.plain && this._options.include && this._options.includeNames.includes(key)) {
        if (Array.isArray(this.dataValues[key])) {
          return this.dataValues[key].map((instance) => instance.get(options));
        }
        if (this.dataValues[key] instanceof Model) {
          return this.dataValues[key].get(options);
        }
        return this.dataValues[key];
      }
      return this.dataValues[key];
    }
    if (this._hasCustomGetters || options.plain && this._options.include || options.clone) {
      const values = {};
      let _key;
      if (this._hasCustomGetters) {
        for (_key in this._customGetters) {
          if (this._options.attributes && !this._options.attributes.includes(_key)) {
            continue;
          }
          if (Object.prototype.hasOwnProperty.call(this._customGetters, _key)) {
            values[_key] = this.get(_key, options);
          }
        }
      }
      for (_key in this.dataValues) {
        if (!Object.prototype.hasOwnProperty.call(values, _key) && Object.prototype.hasOwnProperty.call(this.dataValues, _key)) {
          values[_key] = this.get(_key, options);
        }
      }
      return values;
    }
    return this.dataValues;
  }
  set(key, value, options) {
    let values;
    let originalValue;
    if (typeof key === "object" && key !== null) {
      values = key;
      options = value || {};
      if (options.reset) {
        this.dataValues = {};
        for (const key2 in values) {
          this.changed(key2, false);
        }
      }
      if (options.raw && !(this._options && this._options.include) && !(options && options.attributes) && !this.constructor._hasDateAttributes && !this.constructor._hasBooleanAttributes) {
        if (Object.keys(this.dataValues).length > 0) {
          Object.assign(this.dataValues, values);
        } else {
          this.dataValues = values;
        }
        this._previousDataValues = __spreadValues({}, this.dataValues);
      } else {
        if (options.attributes) {
          const setKeys = (data) => {
            for (const k of data) {
              if (values[k] === void 0) {
                continue;
              }
              this.set(k, values[k], options);
            }
          };
          setKeys(options.attributes);
          if (this.constructor._hasVirtualAttributes) {
            setKeys(this.constructor._virtualAttributes);
          }
          if (this._options.includeNames) {
            setKeys(this._options.includeNames);
          }
        } else {
          for (const key2 in values) {
            this.set(key2, values[key2], options);
          }
        }
        if (options.raw) {
          this._previousDataValues = __spreadValues({}, this.dataValues);
        }
      }
      return this;
    }
    if (!options) {
      options = {};
    }
    if (!options.raw) {
      originalValue = this.dataValues[key];
    }
    if (!options.raw && this._customSetters[key]) {
      this._customSetters[key].call(this, value, key);
      const newValue = this.dataValues[key];
      if (!_.isEqual(newValue, originalValue)) {
        this._previousDataValues[key] = originalValue;
        this.changed(key, true);
      }
    } else {
      if (this._options && this._options.include && this._options.includeNames.includes(key)) {
        this._setInclude(key, value, options);
        return this;
      }
      if (!options.raw) {
        if (!this._isAttribute(key)) {
          if (key.includes(".") && this.constructor._jsonAttributes.has(key.split(".")[0])) {
            const previousNestedValue = Dottie.get(this.dataValues, key);
            if (!_.isEqual(previousNestedValue, value)) {
              Dottie.set(this.dataValues, key, value);
              this.changed(key.split(".")[0], true);
            }
          }
          return this;
        }
        if (this.constructor._hasPrimaryKeys && originalValue && this.constructor._isPrimaryKey(key)) {
          return this;
        }
        if (!this.isNewRecord && this.constructor._hasReadOnlyAttributes && this.constructor._readOnlyAttributes.has(key)) {
          return this;
        }
      }
      if (!(value instanceof Utils.SequelizeMethod) && Object.prototype.hasOwnProperty.call(this.constructor._dataTypeSanitizers, key)) {
        value = this.constructor._dataTypeSanitizers[key].call(this, value, options);
      }
      if (!options.raw && (value instanceof Utils.SequelizeMethod || !(value instanceof Utils.SequelizeMethod) && this.constructor._dataTypeChanges[key] && this.constructor._dataTypeChanges[key].call(this, value, originalValue, options) || !this.constructor._dataTypeChanges[key] && !_.isEqual(value, originalValue))) {
        this._previousDataValues[key] = originalValue;
        this.changed(key, true);
      }
      this.dataValues[key] = value;
    }
    return this;
  }
  setAttributes(updates) {
    return this.set(updates);
  }
  changed(key, value) {
    if (key === void 0) {
      if (this._changed.size > 0) {
        return [...this._changed];
      }
      return false;
    }
    if (value === true) {
      this._changed.add(key);
      return this;
    }
    if (value === false) {
      this._changed.delete(key);
      return this;
    }
    return this._changed.has(key);
  }
  previous(key) {
    if (key) {
      return this._previousDataValues[key];
    }
    return _.pickBy(this._previousDataValues, (value, key2) => this.changed(key2));
  }
  _setInclude(key, value, options) {
    if (!Array.isArray(value)) {
      value = [value];
    }
    if (value[0] instanceof Model) {
      value = value.map((instance) => instance.dataValues);
    }
    const include = this._options.includeMap[key];
    const association = include.association;
    const accessor = key;
    const primaryKeyAttribute = include.model.primaryKeyAttribute;
    const childOptions = {
      isNewRecord: this.isNewRecord,
      include: include.include,
      includeNames: include.includeNames,
      includeMap: include.includeMap,
      includeValidated: true,
      raw: options.raw,
      attributes: include.originalAttributes
    };
    let isEmpty;
    if (include.originalAttributes === void 0 || include.originalAttributes.length > 0) {
      if (association.isSingleAssociation) {
        if (Array.isArray(value)) {
          value = value[0];
        }
        isEmpty = value && value[primaryKeyAttribute] === null || value === null;
        this[accessor] = this.dataValues[accessor] = isEmpty ? null : include.model.build(value, childOptions);
      } else {
        isEmpty = value[0] && value[0][primaryKeyAttribute] === null;
        this[accessor] = this.dataValues[accessor] = isEmpty ? [] : include.model.bulkBuild(value, childOptions);
      }
    }
  }
  async save(options) {
    if (arguments.length > 1) {
      throw new Error("The second argument was removed in favor of the options object.");
    }
    options = Utils.cloneDeep(options);
    options = _.defaults(options, {
      hooks: true,
      validate: true
    });
    if (!options.fields) {
      if (this.isNewRecord) {
        options.fields = Object.keys(this.constructor.rawAttributes);
      } else {
        options.fields = _.intersection(this.changed(), Object.keys(this.constructor.rawAttributes));
      }
      options.defaultFields = options.fields;
    }
    if (options.returning === void 0) {
      if (options.association) {
        options.returning = false;
      } else if (this.isNewRecord) {
        options.returning = true;
      }
    }
    const primaryKeyName = this.constructor.primaryKeyAttribute;
    const primaryKeyAttribute = primaryKeyName && this.constructor.rawAttributes[primaryKeyName];
    const createdAtAttr = this.constructor._timestampAttributes.createdAt;
    const versionAttr = this.constructor._versionAttribute;
    const hook = this.isNewRecord ? "Create" : "Update";
    const wasNewRecord = this.isNewRecord;
    const now = Utils.now(this.sequelize.options.dialect);
    let updatedAtAttr = this.constructor._timestampAttributes.updatedAt;
    if (updatedAtAttr && options.fields.length > 0 && !options.fields.includes(updatedAtAttr)) {
      options.fields.push(updatedAtAttr);
    }
    if (versionAttr && options.fields.length > 0 && !options.fields.includes(versionAttr)) {
      options.fields.push(versionAttr);
    }
    if (options.silent === true && !(this.isNewRecord && this.get(updatedAtAttr, { raw: true }))) {
      _.remove(options.fields, (val) => val === updatedAtAttr);
      updatedAtAttr = false;
    }
    if (this.isNewRecord === true) {
      if (createdAtAttr && !options.fields.includes(createdAtAttr)) {
        options.fields.push(createdAtAttr);
      }
      if (primaryKeyAttribute && primaryKeyAttribute.defaultValue && !options.fields.includes(primaryKeyName)) {
        options.fields.unshift(primaryKeyName);
      }
    }
    if (this.isNewRecord === false && primaryKeyName && this.get(primaryKeyName, { raw: true }) === void 0) {
      throw new Error("You attempted to save an instance with no primary key, this is not allowed since it would result in a global update");
    }
    if (updatedAtAttr && !options.silent && options.fields.includes(updatedAtAttr)) {
      this.dataValues[updatedAtAttr] = this.constructor._getDefaultTimestamp(updatedAtAttr) || now;
    }
    if (this.isNewRecord && createdAtAttr && !this.dataValues[createdAtAttr]) {
      this.dataValues[createdAtAttr] = this.constructor._getDefaultTimestamp(createdAtAttr) || now;
    }
    if (this.sequelize.options.dialect === "db2" && this.isNewRecord) {
      this.uniqno = this.sequelize.dialect.queryGenerator.addUniqueFields(this.dataValues, this.constructor.rawAttributes, this.uniqno);
    }
    if (options.validate) {
      await this.validate(options);
    }
    if (options.hooks) {
      const beforeHookValues = _.pick(this.dataValues, options.fields);
      let ignoreChanged = _.difference(this.changed(), options.fields);
      let hookChanged;
      let afterHookValues;
      if (updatedAtAttr && options.fields.includes(updatedAtAttr)) {
        ignoreChanged = _.without(ignoreChanged, updatedAtAttr);
      }
      await this.constructor.runHooks(`before${hook}`, this, options);
      if (options.defaultFields && !this.isNewRecord) {
        afterHookValues = _.pick(this.dataValues, _.difference(this.changed(), ignoreChanged));
        hookChanged = [];
        for (const key of Object.keys(afterHookValues)) {
          if (afterHookValues[key] !== beforeHookValues[key]) {
            hookChanged.push(key);
          }
        }
        options.fields = _.uniq(options.fields.concat(hookChanged));
      }
      if (hookChanged && options.validate) {
        options.skip = _.difference(Object.keys(this.constructor.rawAttributes), hookChanged);
        await this.validate(options);
        delete options.skip;
      }
    }
    if (options.fields.length > 0 && this.isNewRecord && this._options.include && this._options.include.length > 0) {
      await Promise.all(this._options.include.filter((include) => include.association instanceof BelongsTo).map(async (include) => {
        const instance = this.get(include.as);
        if (!instance) {
          return;
        }
        const includeOptions = _(Utils.cloneDeep(include)).omit(["association"]).defaults({
          transaction: options.transaction,
          logging: options.logging,
          parentRecord: this
        }).value();
        await instance.save(includeOptions);
        await this[include.association.accessors.set](instance, { save: false, logging: options.logging });
      }));
    }
    const realFields = options.fields.filter((field) => !this.constructor._virtualAttributes.has(field));
    if (realFields.length === 0) {
      return this;
    }
    if (!this.changed() && !this.isNewRecord) {
      return this;
    }
    const versionFieldName = _.get(this.constructor.rawAttributes[versionAttr], "field") || versionAttr;
    const values = Utils.mapValueFieldNames(this.dataValues, options.fields, this.constructor);
    let query = null;
    let args = [];
    let where;
    if (this.isNewRecord) {
      query = "insert";
      args = [this, this.constructor.getTableName(options), values, options];
    } else {
      where = this.where(true);
      if (versionAttr) {
        values[versionFieldName] = Number.parseInt(values[versionFieldName], 10) + 1;
      }
      query = "update";
      args = [this, this.constructor.getTableName(options), values, where, options];
    }
    const [result, rowsUpdated] = await this.constructor.queryInterface[query](...args);
    if (versionAttr) {
      if (rowsUpdated < 1) {
        throw new sequelizeErrors.OptimisticLockError({
          modelName: this.constructor.name,
          values,
          where
        });
      } else {
        result.dataValues[versionAttr] = values[versionFieldName];
      }
    }
    for (const attr of Object.keys(this.constructor.rawAttributes)) {
      if (this.constructor.rawAttributes[attr].field && values[this.constructor.rawAttributes[attr].field] !== void 0 && this.constructor.rawAttributes[attr].field !== attr) {
        values[attr] = values[this.constructor.rawAttributes[attr].field];
        delete values[this.constructor.rawAttributes[attr].field];
      }
    }
    Object.assign(values, result.dataValues);
    Object.assign(result.dataValues, values);
    if (wasNewRecord && this._options.include && this._options.include.length > 0) {
      await Promise.all(this._options.include.filter((include) => !(include.association instanceof BelongsTo || include.parent && include.parent.association instanceof BelongsToMany)).map(async (include) => {
        let instances = this.get(include.as);
        if (!instances) {
          return;
        }
        if (!Array.isArray(instances)) {
          instances = [instances];
        }
        const includeOptions = _(Utils.cloneDeep(include)).omit(["association"]).defaults({
          transaction: options.transaction,
          logging: options.logging,
          parentRecord: this
        }).value();
        await Promise.all(instances.map(async (instance) => {
          if (include.association instanceof BelongsToMany) {
            await instance.save(includeOptions);
            const values0 = __spreadValues({
              [include.association.foreignKey]: this.get(this.constructor.primaryKeyAttribute, { raw: true }),
              [include.association.otherKey]: instance.get(instance.constructor.primaryKeyAttribute, { raw: true })
            }, include.association.through.scope);
            if (instance[include.association.through.model.name]) {
              for (const attr of Object.keys(include.association.through.model.rawAttributes)) {
                if (include.association.through.model.rawAttributes[attr]._autoGenerated || attr === include.association.foreignKey || attr === include.association.otherKey || typeof instance[include.association.through.model.name][attr] === "undefined") {
                  continue;
                }
                values0[attr] = instance[include.association.through.model.name][attr];
              }
            }
            await include.association.throughModel.create(values0, includeOptions);
          } else {
            instance.set(include.association.foreignKey, this.get(include.association.sourceKey || this.constructor.primaryKeyAttribute, { raw: true }), { raw: true });
            Object.assign(instance, include.association.scope);
            await instance.save(includeOptions);
          }
        }));
      }));
    }
    if (options.hooks) {
      await this.constructor.runHooks(`after${hook}`, result, options);
    }
    for (const field of options.fields) {
      result._previousDataValues[field] = result.dataValues[field];
      this.changed(field, false);
    }
    this.isNewRecord = false;
    return result;
  }
  async reload(options) {
    options = Utils.defaults({
      where: this.where()
    }, options, {
      include: this._options.include || void 0
    });
    const reloaded = await this.constructor.findOne(options);
    if (!reloaded) {
      throw new sequelizeErrors.InstanceError("Instance could not be reloaded because it does not exist anymore (find call returned null)");
    }
    this._options = reloaded._options;
    this.set(reloaded.dataValues, {
      raw: true,
      reset: !options.attributes
    });
    return this;
  }
  async validate(options) {
    return new InstanceValidator(this, options).validate();
  }
  async update(values, options) {
    values = _.omitBy(values, (value) => value === void 0);
    const changedBefore = this.changed() || [];
    options = options || {};
    if (Array.isArray(options)) {
      options = { fields: options };
    }
    options = Utils.cloneDeep(options);
    const setOptions = Utils.cloneDeep(options);
    setOptions.attributes = options.fields;
    this.set(values, setOptions);
    const sideEffects = _.without(this.changed(), ...changedBefore);
    const fields = _.union(Object.keys(values), sideEffects);
    if (!options.fields) {
      options.fields = _.intersection(fields, this.changed());
      options.defaultFields = options.fields;
    }
    return await this.save(options);
  }
  async destroy(options) {
    options = __spreadValues({
      hooks: true,
      force: false
    }, options);
    if (options.hooks) {
      await this.constructor.runHooks("beforeDestroy", this, options);
    }
    const where = this.where(true);
    let result;
    if (this.constructor._timestampAttributes.deletedAt && options.force === false) {
      const attributeName = this.constructor._timestampAttributes.deletedAt;
      const attribute = this.constructor.rawAttributes[attributeName];
      const defaultValue = Object.prototype.hasOwnProperty.call(attribute, "defaultValue") ? attribute.defaultValue : null;
      const currentValue = this.getDataValue(attributeName);
      const undefinedOrNull = currentValue == null && defaultValue == null;
      if (undefinedOrNull || _.isEqual(currentValue, defaultValue)) {
        this.setDataValue(attributeName, new Date());
      }
      result = await this.save(__spreadProps(__spreadValues({}, options), { hooks: false }));
    } else {
      result = await this.constructor.queryInterface.delete(this, this.constructor.getTableName(options), where, __spreadValues({ type: QueryTypes.DELETE, limit: null }, options));
    }
    if (options.hooks) {
      await this.constructor.runHooks("afterDestroy", this, options);
    }
    return result;
  }
  isSoftDeleted() {
    if (!this.constructor._timestampAttributes.deletedAt) {
      throw new Error("Model is not paranoid");
    }
    const deletedAtAttribute = this.constructor.rawAttributes[this.constructor._timestampAttributes.deletedAt];
    const defaultValue = Object.prototype.hasOwnProperty.call(deletedAtAttribute, "defaultValue") ? deletedAtAttribute.defaultValue : null;
    const deletedAt = this.get(this.constructor._timestampAttributes.deletedAt) || null;
    const isSet = deletedAt !== defaultValue;
    return isSet;
  }
  async restore(options) {
    if (!this.constructor._timestampAttributes.deletedAt) {
      throw new Error("Model is not paranoid");
    }
    options = __spreadValues({
      hooks: true,
      force: false
    }, options);
    if (options.hooks) {
      await this.constructor.runHooks("beforeRestore", this, options);
    }
    const deletedAtCol = this.constructor._timestampAttributes.deletedAt;
    const deletedAtAttribute = this.constructor.rawAttributes[deletedAtCol];
    const deletedAtDefaultValue = Object.prototype.hasOwnProperty.call(deletedAtAttribute, "defaultValue") ? deletedAtAttribute.defaultValue : null;
    this.setDataValue(deletedAtCol, deletedAtDefaultValue);
    const result = await this.save(__spreadProps(__spreadValues({}, options), { hooks: false, omitNull: false }));
    if (options.hooks) {
      await this.constructor.runHooks("afterRestore", this, options);
      return result;
    }
    return result;
  }
  async increment(fields, options) {
    const identifier = this.where();
    options = Utils.cloneDeep(options);
    options.where = __spreadValues(__spreadValues({}, options.where), identifier);
    options.instance = this;
    await this.constructor.increment(fields, options);
    return this;
  }
  async decrement(fields, options) {
    return this.increment(fields, __spreadProps(__spreadValues({
      by: 1
    }, options), {
      increment: false
    }));
  }
  equals(other) {
    if (!other || !other.constructor) {
      return false;
    }
    if (!(other instanceof this.constructor)) {
      return false;
    }
    return this.constructor.primaryKeyAttributes.every((attribute) => this.get(attribute, { raw: true }) === other.get(attribute, { raw: true }));
  }
  equalsOneOf(others) {
    return others.some((other) => this.equals(other));
  }
  setValidators(attribute, validators) {
    this.validators[attribute] = validators;
  }
  toJSON() {
    return _.cloneDeep(this.get({
      plain: true
    }));
  }
  static hasMany(target, options) {
    return HasMany.associate(AssociationConstructorSecret, this, target, options);
  }
  static belongsToMany(target, options) {
    return BelongsToMany.associate(AssociationConstructorSecret, this, target, options);
  }
  static hasOne(target, options) {
    return HasOne.associate(AssociationConstructorSecret, this, target, options);
  }
  static belongsTo(target, options) {
    return BelongsTo.associate(AssociationConstructorSecret, this, target, options);
  }
}
function unpackAnd(where) {
  if (!_.isObject(where)) {
    return where;
  }
  const keys = Utils.getComplexKeys(where);
  if (keys.length === 0) {
    return;
  }
  if (keys.length !== 1 || keys[0] !== Op.and) {
    return where;
  }
  const andParts = where[Op.and];
  return andParts;
}
function combineWheresWithAnd(whereA, whereB) {
  const unpackedA = unpackAnd(whereA);
  if (unpackedA === void 0) {
    return whereB;
  }
  const unpackedB = unpackAnd(whereB);
  if (unpackedB === void 0) {
    return whereA;
  }
  return {
    [Op.and]: [unpackedA, unpackedB].flat()
  };
}
Hooks.applyTo(Model, true);
//# sourceMappingURL=model.js.map
