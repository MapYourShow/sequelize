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
var helpers_exports = {};
__export(helpers_exports, {
  AssociationConstructorSecret: () => AssociationConstructorSecret,
  addForeignKeyConstraints: () => addForeignKeyConstraints,
  assertAssociationModelIsDefined: () => assertAssociationModelIsDefined,
  assertAssociationUnique: () => assertAssociationUnique,
  checkNamingCollision: () => checkNamingCollision,
  defineAssociation: () => defineAssociation,
  getModel: () => getModel,
  mixinMethods: () => mixinMethods,
  normalizeBaseAssociationOptions: () => normalizeBaseAssociationOptions,
  normalizeForeignKeyOptions: () => normalizeForeignKeyOptions,
  removeUndefined: () => removeUndefined
});
module.exports = __toCommonJS(helpers_exports);
var import_assert = __toESM(require("assert"));
var import_util = __toESM(require("util"));
var import_isEqual = __toESM(require("lodash/isEqual"));
var import_isPlainObject = __toESM(require("lodash/isPlainObject.js"));
var import_isUndefined = __toESM(require("lodash/isUndefined"));
var import_lowerFirst = __toESM(require("lodash/lowerFirst"));
var import_omit = __toESM(require("lodash/omit"));
var import_omitBy = __toESM(require("lodash/omitBy"));
var import_errors = require("../errors/index.js");
var deprecations = __toESM(require("../utils/deprecations.js"));
var Utils = __toESM(require("../utils/index.js"));
var import_model_utils = require("../utils/model-utils.js");
function checkNamingCollision(source, associationName) {
  if (Object.prototype.hasOwnProperty.call(source.getAttributes(), associationName)) {
    throw new Error(`Naming collision between attribute '${associationName}' and association '${associationName}' on model ${source.name}. To remedy this, change the "as" options in your association definition`);
  }
}
function addForeignKeyConstraints(newAttribute, source, options, key) {
  if (options.foreignKeyConstraints !== false) {
    const primaryKeys = Object.keys(source.primaryKeys).map((primaryKeyAttribute) => source.getAttributes()[primaryKeyAttribute].field || primaryKeyAttribute);
    if (primaryKeys.length === 1 || !primaryKeys.includes(key)) {
      newAttribute.references = {
        model: source.getTableName(),
        key: key || primaryKeys[0]
      };
      newAttribute.onDelete = newAttribute.onDelete ?? (newAttribute.allowNull !== false ? "SET NULL" : "CASCADE");
      newAttribute.onUpdate = newAttribute.onUpdate ?? "CASCADE";
    }
  }
}
function mixinMethods(association, mixinTargetPrototype, methods, aliases) {
  for (const method of methods) {
    const targetMethodName = association.accessors[method];
    if (Object.prototype.hasOwnProperty.call(mixinTargetPrototype, targetMethodName)) {
      continue;
    }
    const realMethod = (aliases == null ? void 0 : aliases[method]) || method;
    Object.defineProperty(mixinTargetPrototype, targetMethodName, {
      enumerable: false,
      value(...params) {
        return association[realMethod](this, ...params);
      }
    });
  }
}
const AssociationConstructorSecret = Symbol("AssociationConstructorPrivateKey");
function getModel(sequelize, model) {
  if (typeof model === "string") {
    if (!sequelize.isDefined(model)) {
      return null;
    }
    return sequelize.model(model);
  }
  return model;
}
function removeUndefined(val) {
  return (0, import_omitBy.default)(val, import_isUndefined.default);
}
function assertAssociationUnique(type, source, target, options, parent) {
  const as = options.as;
  const existingAssociation = source.associations[as];
  if (!existingAssociation) {
    return;
  }
  const incompatibilityStatus = getAssociationsIncompatibilityStatus(existingAssociation, type, target, options);
  if ((parent || existingAssociation.parentAssociation) && incompatibilityStatus == null) {
    return;
  }
  const existingRoot = existingAssociation.rootAssociation;
  if (!parent && existingRoot === existingAssociation) {
    throw new import_errors.AssociationError(`You have defined two associations with the same name "${as}" on the model "${source.name}". Use another alias using the "as" parameter.`);
  }
  throw new import_errors.AssociationError(`
${parent ? `The association "${parent.as}" needs to define` : `You are trying to define`} the ${type.name} association "${options.as}" from ${source.name} to ${target.name},
but that child association has already been defined as ${existingAssociation.associationType}, to ${target.name} by this call:

${existingRoot.source.name}.${(0, import_lowerFirst.default)(existingRoot.associationType)}(${existingRoot.target.name}, ${import_util.default.inspect(existingRoot.options)})

That association would be re-used if compatible, but it is incompatible because ${incompatibilityStatus === IncompatibilityStatus.DIFFERENT_TYPES ? `their types are different (${type.name} vs ${existingAssociation.associationType})` : incompatibilityStatus === IncompatibilityStatus.DIFFERENT_TARGETS ? `they target different models (${target.name} vs ${existingAssociation.target.name})` : `their options are not reconcilable:

Options of the association to create:
${import_util.default.inspect((0, import_omit.default)(options, "inverse"), { sorted: true })}

Options of the existing association:
${import_util.default.inspect((0, import_omit.default)(existingAssociation.options, "inverse"), { sorted: true })}
`}`.trim());
}
var IncompatibilityStatus = /* @__PURE__ */ ((IncompatibilityStatus2) => {
  IncompatibilityStatus2[IncompatibilityStatus2["DIFFERENT_TYPES"] = 0] = "DIFFERENT_TYPES";
  IncompatibilityStatus2[IncompatibilityStatus2["DIFFERENT_TARGETS"] = 1] = "DIFFERENT_TARGETS";
  IncompatibilityStatus2[IncompatibilityStatus2["DIFFERENT_OPTIONS"] = 2] = "DIFFERENT_OPTIONS";
  return IncompatibilityStatus2;
})(IncompatibilityStatus || {});
function getAssociationsIncompatibilityStatus(existingAssociation, newAssociationType, newTarget, newOptions) {
  if (existingAssociation.associationType !== newAssociationType.name) {
    return 0 /* DIFFERENT_TYPES */;
  }
  if (!(0, import_model_utils.isSameInitialModel)(existingAssociation.target, newTarget)) {
    return 1 /* DIFFERENT_TARGETS */;
  }
  const opts1 = (0, import_omit.default)(existingAssociation.options, "inverse");
  const opts2 = (0, import_omit.default)(newOptions, "inverse");
  if (!(0, import_isEqual.default)(opts1, opts2)) {
    return 2 /* DIFFERENT_OPTIONS */;
  }
  return null;
}
function assertAssociationModelIsDefined(model) {
  if (!model.sequelize) {
    throw new Error(`Model ${model.name} must be defined (through Model.init or Sequelize#define) before calling one of its association declaration methods.`);
  }
}
function defineAssociation(type, source, target, options, parent, normalizeOptions, construct) {
  if (!(0, import_model_utils.isModelStatic)(target)) {
    throw new Error(`${source.name}.${(0, import_lowerFirst.default)(type.name)} called with something that's not a subclass of Sequelize.Model`);
  }
  assertAssociationModelIsDefined(source);
  assertAssociationModelIsDefined(target);
  const normalizedOptions = normalizeOptions(type, options, source, target);
  checkNamingCollision(source, normalizedOptions.as);
  assertAssociationUnique(type, source, target, normalizedOptions, parent);
  const sequelize = source.sequelize;
  Object.defineProperty(normalizedOptions, "sequelize", {
    configurable: true,
    get() {
      deprecations.movedSequelizeParam();
      return sequelize;
    }
  });
  if (normalizedOptions.hooks) {
    source.runHooks("beforeAssociate", { source, target, type, sequelize }, normalizedOptions);
  }
  let association;
  try {
    association = source.associations[normalizedOptions.as] ?? construct(normalizedOptions);
  } catch (error) {
    throw new import_errors.AssociationError(parent ? `Association "${parent.as}" needs to create the ${type.name} association "${normalizedOptions.as}" from ${source.name} to ${target.name}, but it failed` : `Defining ${type.name} association "${normalizedOptions.as}" from ${source.name} to ${target.name} failed`, { cause: error });
  }
  if (normalizedOptions.hooks) {
    source.runHooks("afterAssociate", { source, target, type, association, sequelize }, normalizedOptions);
  }
  checkNamingCollision(source, normalizedOptions.as);
  return association;
}
function normalizeBaseAssociationOptions(associationType, options, source, target) {
  if ("onDelete" in options || "onUpdate" in options) {
    throw new Error('Options "onDelete" and "onUpdate" have been moved to "foreignKey.onDelete" and "foreignKey.onUpdate" (also available as "otherKey" in belongsToMany)');
  }
  if ("constraints" in options) {
    throw new Error('Option "constraints" has been renamed to "foreignKeyConstraints"');
  }
  if ("foreignKeyConstraint" in options) {
    throw new Error('Option "foreignKeyConstraint" has been renamed to "foreignKeyConstraints" (with a "s" at the end)');
  }
  const isMultiAssociation = associationType.isMultiAssociation;
  let name;
  let as;
  if (options == null ? void 0 : options.as) {
    if ((0, import_isPlainObject.default)(options.as)) {
      (0, import_assert.default)(typeof options.as === "object");
      name = options.as;
      as = isMultiAssociation ? options.as.plural : options.as.singular;
    } else {
      (0, import_assert.default)(typeof options.as === "string");
      as = options.as;
      name = {
        plural: isMultiAssociation ? options.as : Utils.pluralize(options.as),
        singular: isMultiAssociation ? Utils.singularize(options.as) : options.as
      };
    }
  } else {
    as = isMultiAssociation ? target.options.name.plural : target.options.name.singular;
    name = target.options.name;
  }
  return removeUndefined(__spreadProps(__spreadValues({}, options), {
    foreignKey: normalizeForeignKeyOptions(options.foreignKey),
    hooks: options.hooks ?? false,
    as,
    name
  }));
}
function normalizeForeignKeyOptions(foreignKey) {
  return typeof foreignKey === "string" ? { name: foreignKey } : removeUndefined(__spreadProps(__spreadValues({}, foreignKey), {
    name: (foreignKey == null ? void 0 : foreignKey.name) ?? (foreignKey == null ? void 0 : foreignKey.fieldName),
    fieldName: void 0
  }));
}
//# sourceMappingURL=helpers.js.map
