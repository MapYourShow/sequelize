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
var deprecations_exports = {};
__export(deprecations_exports, {
  movedSequelizeParam: () => movedSequelizeParam,
  noBoolOperatorAliases: () => noBoolOperatorAliases,
  noDoubleNestedGroup: () => noDoubleNestedGroup,
  noModelDropSchema: () => noModelDropSchema,
  noRawAttributes: () => noRawAttributes,
  noSequelizeDataType: () => noSequelizeDataType,
  noStringOperators: () => noStringOperators,
  noTrueLogging: () => noTrueLogging,
  schemaRenamedToWithSchema: () => schemaRenamedToWithSchema,
  scopeRenamedToWithScope: () => scopeRenamedToWithScope,
  unsupportedEngine: () => unsupportedEngine,
  useErrorCause: () => useErrorCause
});
module.exports = __toCommonJS(deprecations_exports);
var import_util = require("util");
const noop = () => {
};
const noRawAttributes = (0, import_util.deprecate)(noop, "Use sequelize.fn / sequelize.literal to construct attributes", "SEQUELIZE0001");
const noTrueLogging = (0, import_util.deprecate)(noop, "The logging-option should be either a function or false. Default: console.log", "SEQUELIZE0002");
const noStringOperators = (0, import_util.deprecate)(noop, "String based operators are deprecated. Please use Symbol based operators for better security, read more at https://sequelize.org/docs/v7/core-concepts/model-querying-basics/#deprecated-operator-aliases", "SEQUELIZE0003");
const noBoolOperatorAliases = (0, import_util.deprecate)(noop, "A boolean value was passed to options.operatorsAliases. This is a no-op with v5 and should be removed.", "SEQUELIZE0004");
const noDoubleNestedGroup = (0, import_util.deprecate)(noop, "Passing a double nested nested array to `group` is unsupported and will be removed in v6.", "SEQUELIZE0005");
const unsupportedEngine = (0, import_util.deprecate)(noop, "This database engine version is not supported, please update your database server. More information https://github.com/sequelize/sequelize/blob/main/ENGINE.md", "SEQUELIZE0006");
const useErrorCause = (0, import_util.deprecate)(noop, 'The "parent" and "original" properties in Sequelize errors have been replaced with the native "cause" property. Use that one instead.', "SEQUELIZE0007");
const scopeRenamedToWithScope = (0, import_util.deprecate)(noop, "Model.scope has been renamed to Model.withScope, and Model.unscoped has been renamed to Model.withoutScope", "SEQUELIZE0008");
const schemaRenamedToWithSchema = (0, import_util.deprecate)(noop, "Model.schema has been renamed to Model.withSchema", "SEQUELIZE0009");
const noSequelizeDataType = (0, import_util.deprecate)(noop, `Accessing DataTypes on the Sequelize constructor is deprecated. Use the DataTypes object instead.
e.g, instead of using Sequelize.STRING, use DataTypes.STRING`, "SEQUELIZE0010");
const noModelDropSchema = (0, import_util.deprecate)(noop, "Do not use Model.dropSchema. Use Sequelize#dropSchema or QueryInterface#dropSchema instead", "SEQUELIZE0011");
const movedSequelizeParam = (0, import_util.deprecate)(noop, 'The "sequelize" instance has been moved from the second parameter bag to the first parameter bag in "beforeAssociate" and "afterAssociate" hooks', "SEQUELIZE0012");
//# sourceMappingURL=deprecations.js.map
