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
var query_interface_exports = {};
__export(query_interface_exports, {
  QueryInterface: () => QueryInterface
});
module.exports = __toCommonJS(query_interface_exports);
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const Utils = require("../../utils");
const DataTypes = require("../../data-types");
const { Transaction } = require("../../transaction");
const { QueryTypes } = require("../../query-types");
class QueryInterface {
  constructor(sequelize, queryGenerator) {
    this.sequelize = sequelize;
    this.queryGenerator = queryGenerator;
  }
  async createDatabase(database, options) {
    options = options || {};
    const sql = this.queryGenerator.createDatabaseQuery(database, options);
    return await this.sequelize.queryRaw(sql, options);
  }
  async dropDatabase(database, options) {
    options = options || {};
    const sql = this.queryGenerator.dropDatabaseQuery(database);
    return await this.sequelize.queryRaw(sql, options);
  }
  async createSchema(schema, options) {
    options = options || {};
    const sql = this.queryGenerator.createSchema(schema);
    return await this.sequelize.queryRaw(sql, options);
  }
  async dropSchema(schema, options) {
    options = options || {};
    const query = this.queryGenerator.dropSchema(schema);
    let sql;
    if (typeof query === "object") {
      options.bind = query.bind;
      sql = query.query;
    } else {
      sql = query;
    }
    return await this.sequelize.queryRaw(sql, options);
  }
  async dropAllSchemas(options) {
    options = options || {};
    if (!this.queryGenerator._dialect.supports.schemas) {
      return this.sequelize.drop(options);
    }
    const schemas = await this.showAllSchemas(options);
    return Promise.all(schemas.map((schemaName) => this.dropSchema(schemaName, options)));
  }
  async showAllSchemas(options) {
    options = __spreadProps(__spreadValues({}, options), {
      raw: true,
      type: this.sequelize.QueryTypes.SELECT
    });
    const showSchemasSql = this.queryGenerator.showSchemasQuery(options);
    const schemaNames = await this.sequelize.queryRaw(showSchemasSql, options);
    return schemaNames.flatMap((value) => value.schema_name ? value.schema_name : value);
  }
  async databaseVersion(options) {
    return await this.sequelize.queryRaw(this.queryGenerator.versionQuery(), __spreadProps(__spreadValues({}, options), { type: QueryTypes.VERSION }));
  }
  async createTable(tableName, attributes, options, model) {
    let sql = "";
    options = __spreadValues({}, options);
    if (options && options.uniqueKeys) {
      _.forOwn(options.uniqueKeys, (uniqueKey) => {
        if (uniqueKey.customIndex === void 0) {
          uniqueKey.customIndex = true;
        }
      });
    }
    if (model) {
      options.uniqueKeys = options.uniqueKeys || model.uniqueKeys;
    }
    attributes = _.mapValues(attributes, (attribute) => this.sequelize.normalizeAttribute(attribute));
    await this.ensureEnums(tableName, attributes, options, model);
    if (!tableName.schema && (options.schema || Boolean(model) && model._schema)) {
      tableName = this.queryGenerator.addSchema({
        tableName,
        _schema: Boolean(model) && model._schema || options.schema
      });
    }
    attributes = this.queryGenerator.attributesToSQL(attributes, { table: tableName, context: "createTable" });
    sql = this.queryGenerator.createTableQuery(tableName, attributes, options);
    return await this.sequelize.queryRaw(sql, options);
  }
  async dropTable(tableName, options) {
    options = __spreadValues({}, options);
    options.cascade = options.cascade || options.force || false;
    const sql = this.queryGenerator.dropTableQuery(tableName, options);
    await this.sequelize.queryRaw(sql, options);
  }
  async _dropAllTables(tableNames, skip, options) {
    for (const tableName of tableNames) {
      if (!skip.includes(tableName.tableName || tableName)) {
        await this.dropTable(tableName, __spreadProps(__spreadValues({}, options), { cascade: true }));
      }
    }
  }
  async dropAllTables(options) {
    options = options || {};
    const skip = options.skip || [];
    const tableNames = await this.showAllTables(options);
    const foreignKeys = await this.getForeignKeysForTables(tableNames, options);
    for (const tableName of tableNames) {
      let normalizedTableName = tableName;
      if (_.isObject(tableName)) {
        normalizedTableName = `${tableName.schema}.${tableName.tableName}`;
      }
      for (const foreignKey of foreignKeys[normalizedTableName]) {
        await this.sequelize.queryRaw(this.queryGenerator.dropForeignKeyQuery(tableName, foreignKey));
      }
    }
    await this._dropAllTables(tableNames, skip, options);
  }
  async renameTable(before, after, options) {
    options = options || {};
    const sql = this.queryGenerator.renameTableQuery(before, after);
    return await this.sequelize.queryRaw(sql, options);
  }
  async showAllTables(options) {
    options = __spreadProps(__spreadValues({}, options), {
      raw: true,
      type: QueryTypes.SHOWTABLES
    });
    const showTablesSql = this.queryGenerator.showTablesQuery(this.sequelize.config.database);
    const tableNames = await this.sequelize.queryRaw(showTablesSql, options);
    return tableNames.flat();
  }
  async describeTable(tableName, options) {
    let schema = null;
    let schemaDelimiter = null;
    if (typeof options === "string") {
      schema = options;
    } else if (typeof options === "object" && options !== null) {
      schema = options.schema || null;
      schemaDelimiter = options.schemaDelimiter || null;
    }
    if (typeof tableName === "object" && tableName !== null) {
      schema = tableName.schema;
      tableName = tableName.tableName;
    }
    const sql = this.queryGenerator.describeTableQuery(tableName, schema, schemaDelimiter);
    options = __spreadProps(__spreadValues({}, options), { type: QueryTypes.DESCRIBE });
    try {
      const data = await this.sequelize.queryRaw(sql, options);
      if (_.isEmpty(data)) {
        throw new Error(`No description found for "${tableName}" table. Check the table name and schema; remember, they _are_ case sensitive.`);
      }
      return data;
    } catch (error) {
      if (error.original && error.original.code === "ER_NO_SUCH_TABLE") {
        throw new Error(`No description found for "${tableName}" table. Check the table name and schema; remember, they _are_ case sensitive.`);
      }
      throw error;
    }
  }
  async addColumn(table, key, attribute, options) {
    if (!table || !key || !attribute) {
      throw new Error("addColumn takes at least 3 arguments (table, attribute name, attribute definition)");
    }
    options = options || {};
    attribute = this.sequelize.normalizeAttribute(attribute);
    return await this.sequelize.queryRaw(this.queryGenerator.addColumnQuery(table, key, attribute), options);
  }
  async removeColumn(tableName, attributeName, options) {
    return this.sequelize.queryRaw(this.queryGenerator.removeColumnQuery(tableName, attributeName), options);
  }
  normalizeAttribute(dataTypeOrOptions) {
    let attribute;
    if (Object.values(DataTypes).includes(dataTypeOrOptions)) {
      attribute = { type: dataTypeOrOptions, allowNull: true };
    } else {
      attribute = dataTypeOrOptions;
    }
    return this.sequelize.normalizeAttribute(attribute);
  }
  quoteIdentifier(identifier2, force) {
    return this.queryGenerator.quoteIdentifier(identifier2, force);
  }
  quoteIdentifiers(identifiers) {
    return this.queryGenerator.quoteIdentifiers(identifiers);
  }
  async changeColumn(tableName, attributeName, dataTypeOrOptions, options) {
    options = options || {};
    const query = this.queryGenerator.attributesToSQL({
      [attributeName]: this.normalizeAttribute(dataTypeOrOptions)
    }, {
      context: "changeColumn",
      table: tableName
    });
    const sql = this.queryGenerator.changeColumnQuery(tableName, query);
    return this.sequelize.queryRaw(sql, options);
  }
  async assertTableHasColumn(tableName, columnName, options) {
    const description = await this.describeTable(tableName, options);
    if (description[columnName]) {
      return description;
    }
    throw new Error(`Table ${tableName} doesn't have the column ${columnName}`);
  }
  async renameColumn(tableName, attrNameBefore, attrNameAfter, options) {
    options = options || {};
    const data = (await this.assertTableHasColumn(tableName, attrNameBefore, options))[attrNameBefore];
    const _options = {};
    _options[attrNameAfter] = {
      attribute: attrNameAfter,
      type: data.type,
      allowNull: data.allowNull,
      defaultValue: data.defaultValue
    };
    if (data.defaultValue === null && !data.allowNull) {
      delete _options[attrNameAfter].defaultValue;
    }
    const sql = this.queryGenerator.renameColumnQuery(tableName, attrNameBefore, this.queryGenerator.attributesToSQL(_options));
    return await this.sequelize.queryRaw(sql, options);
  }
  async addIndex(tableName, attributes, options, rawTablename) {
    if (!Array.isArray(attributes)) {
      rawTablename = options;
      options = attributes;
      attributes = options.fields;
    }
    if (!rawTablename) {
      rawTablename = tableName;
    }
    options = Utils.cloneDeep(options);
    options.fields = attributes;
    const sql = this.queryGenerator.addIndexQuery(tableName, options, rawTablename);
    return await this.sequelize.queryRaw(sql, __spreadProps(__spreadValues({}, options), { supportsSearchPath: false }));
  }
  async showIndex(tableName, options) {
    const sql = this.queryGenerator.showIndexesQuery(tableName, options);
    return await this.sequelize.queryRaw(sql, __spreadProps(__spreadValues({}, options), { type: QueryTypes.SHOWINDEXES }));
  }
  async getForeignKeysForTables(tableNames, options) {
    if (tableNames.length === 0) {
      return {};
    }
    options = __spreadProps(__spreadValues({}, options), { type: QueryTypes.FOREIGNKEYS });
    const results = await Promise.all(tableNames.map((tableName) => this.sequelize.queryRaw(this.queryGenerator.getForeignKeysQuery(tableName, this.sequelize.config.database), options)));
    const result = {};
    for (let [i, tableName] of tableNames.entries()) {
      if (_.isObject(tableName)) {
        tableName = `${tableName.schema}.${tableName.tableName}`;
      }
      result[tableName] = Array.isArray(results[i]) ? results[i].map((r) => r.constraint_name) : [results[i] && results[i].constraint_name];
      result[tableName] = result[tableName].filter(_.identity);
    }
    return result;
  }
  async getForeignKeyReferencesForTable(tableName, options) {
    const queryOptions = __spreadProps(__spreadValues({}, options), {
      type: QueryTypes.FOREIGNKEYS
    });
    const query = this.queryGenerator.getForeignKeysQuery(tableName, this.sequelize.config.database);
    return this.sequelize.queryRaw(query, queryOptions);
  }
  async removeIndex(tableName, indexNameOrAttributes, options) {
    options = options || {};
    const sql = this.queryGenerator.removeIndexQuery(tableName, indexNameOrAttributes, options);
    return await this.sequelize.queryRaw(sql, options);
  }
  async addConstraint(tableName, options) {
    if (!options.fields) {
      throw new Error("Fields must be specified through options.fields");
    }
    if (!options.type) {
      throw new Error("Constraint type must be specified through options.type");
    }
    options = Utils.cloneDeep(options);
    const sql = this.queryGenerator.addConstraintQuery(tableName, options);
    return await this.sequelize.queryRaw(sql, options);
  }
  async showConstraint(tableName, constraintName, options) {
    const sql = this.queryGenerator.showConstraintsQuery(tableName, constraintName);
    return await this.sequelize.queryRaw(sql, __spreadProps(__spreadValues({}, options), { type: QueryTypes.SHOWCONSTRAINTS }));
  }
  async removeConstraint(tableName, constraintName, options) {
    return this.sequelize.queryRaw(this.queryGenerator.removeConstraintQuery(tableName, constraintName), options);
  }
  async insert(instance, tableName, values, options) {
    if (options == null ? void 0 : options.bind) {
      (0, import_sql.assertNoReservedBind)(options.bind);
    }
    options = Utils.cloneDeep(options);
    options.hasTrigger = instance && instance.constructor.options.hasTrigger;
    const { query, bind } = this.queryGenerator.insertQuery(tableName, values, instance && instance.constructor.rawAttributes, options);
    options.type = QueryTypes.INSERT;
    options.instance = instance;
    delete options.replacements;
    options.bind = (0, import_sql.combineBinds)(options.bind, bind);
    const results = await this.sequelize.queryRaw(query, options);
    if (instance) {
      results[0].isNewRecord = false;
    }
    return results;
  }
  async upsert(tableName, insertValues, updateValues, where, options) {
    if (options == null ? void 0 : options.bind) {
      (0, import_sql.assertNoReservedBind)(options.bind);
    }
    options = __spreadValues({}, options);
    const model = options.model;
    options.type = QueryTypes.UPSERT;
    options.updateOnDuplicate = Object.keys(updateValues);
    options.upsertKeys = options.conflictFields || [];
    if (options.upsertKeys.length === 0) {
      const primaryKeys = Object.values(model.primaryKeys).map((item) => item.field);
      const uniqueKeys = Object.values(model.uniqueKeys).filter((c) => c.fields.length > 0).map((c) => c.fields);
      const indexKeys = Object.values(model._indexes).filter((c) => c.unique && c.fields.length > 0).map((c) => c.fields);
      for (const field of options.updateOnDuplicate) {
        const uniqueKey = uniqueKeys.find((fields) => fields.includes(field));
        if (uniqueKey) {
          options.upsertKeys = uniqueKey;
          break;
        }
        const indexKey = indexKeys.find((fields) => fields.includes(field));
        if (indexKey) {
          options.upsertKeys = indexKey;
          break;
        }
      }
      if (options.upsertKeys.length === 0 || _.intersection(options.updateOnDuplicate, primaryKeys).length > 0) {
        options.upsertKeys = primaryKeys;
      }
      options.upsertKeys = _.uniq(options.upsertKeys);
    }
    const { bind, query } = this.queryGenerator.insertQuery(tableName, insertValues, model.rawAttributes, options);
    delete options.replacement;
    options.bind = (0, import_sql.combineBinds)(options.bind, bind);
    return await this.sequelize.queryRaw(query, options);
  }
  async bulkInsert(tableName, records, options, attributes) {
    options = __spreadProps(__spreadValues({}, options), { type: QueryTypes.INSERT });
    const sql = this.queryGenerator.bulkInsertQuery(tableName, records, options, attributes);
    delete options.replacements;
    const results = await this.sequelize.queryRaw(sql, options);
    return results[0];
  }
  async update(instance, tableName, values, where, options) {
    if (options == null ? void 0 : options.bind) {
      (0, import_sql.assertNoReservedBind)(options.bind);
    }
    options = __spreadValues({}, options);
    options.hasTrigger = instance && instance.constructor.options.hasTrigger;
    const { query, bind } = this.queryGenerator.updateQuery(tableName, values, where, options, instance.constructor.rawAttributes);
    options.type = QueryTypes.UPDATE;
    options.instance = instance;
    delete options.replacements;
    options.bind = (0, import_sql.combineBinds)(options.bind, bind);
    return await this.sequelize.queryRaw(query, options);
  }
  async bulkUpdate(tableName, values, where, options, columnDefinitions) {
    if (options == null ? void 0 : options.bind) {
      (0, import_sql.assertNoReservedBind)(options.bind);
    }
    options = Utils.cloneDeep(options);
    if (typeof where === "object") {
      where = Utils.cloneDeep(where);
    }
    const { bind, query } = this.queryGenerator.updateQuery(tableName, values, where, options, columnDefinitions);
    const table = _.isObject(tableName) ? tableName : { tableName };
    const model = _.find(this.sequelize.modelManager.models, { tableName: table.tableName });
    options.type = QueryTypes.BULKUPDATE;
    options.model = model;
    options.bind = (0, import_sql.combineBinds)(options.bind, bind);
    return await this.sequelize.queryRaw(query, options);
  }
  async delete(instance, tableName, identifier2, options) {
    const cascades = [];
    const sql = this.queryGenerator.deleteQuery(tableName, identifier2, {}, instance.constructor);
    options = __spreadValues({}, options);
    delete options.replacements;
    if (Boolean(instance.constructor) && Boolean(instance.constructor.associations)) {
      const keys = Object.keys(instance.constructor.associations);
      const length = keys.length;
      let association;
      for (let i = 0; i < length; i++) {
        association = instance.constructor.associations[keys[i]];
        if (association.options && association.options.onDelete && association.options.onDelete.toLowerCase() === "cascade" && association.options.hooks === true) {
          cascades.push(association.accessors.get);
        }
      }
    }
    for (const cascade of cascades) {
      let instances = await instance[cascade](options);
      if (!instances) {
        continue;
      }
      if (!Array.isArray(instances)) {
        instances = [instances];
      }
      for (const _instance of instances) {
        await _instance.destroy(options);
      }
    }
    options.instance = instance;
    return await this.sequelize.queryRaw(sql, options);
  }
  async bulkDelete(tableName, where, options, model) {
    options = Utils.cloneDeep(options);
    options = _.defaults(options, { limit: null });
    if (options.truncate === true) {
      return this.sequelize.queryRaw(this.queryGenerator.truncateTableQuery(tableName, options), options);
    }
    if (typeof identifier === "object") {
      where = Utils.cloneDeep(where);
    }
    const sql = this.queryGenerator.deleteQuery(tableName, where, options, model);
    delete options.replacements;
    return await this.sequelize.queryRaw(sql, options);
  }
  async select(model, tableName, optionsArg) {
    const options = __spreadProps(__spreadValues({}, optionsArg), { type: QueryTypes.SELECT, model });
    const sql = this.queryGenerator.selectQuery(tableName, options, model);
    delete options.replacements;
    return await this.sequelize.queryRaw(sql, options);
  }
  async increment(model, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options) {
    return this.#arithmeticQuery("+", model, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options);
  }
  async decrement(model, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options) {
    return this.#arithmeticQuery("-", model, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options);
  }
  async #arithmeticQuery(operator, model, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options) {
    options = Utils.cloneDeep(options);
    options.model = model;
    const sql = this.queryGenerator.arithmeticQuery(operator, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options);
    options.type = QueryTypes.UPDATE;
    delete options.replacements;
    return await this.sequelize.queryRaw(sql, options);
  }
  async rawSelect(tableName, options, attributeSelector, Model) {
    options = Utils.cloneDeep(options);
    options = _.defaults(options, {
      raw: true,
      plain: true,
      type: QueryTypes.SELECT
    });
    const sql = this.queryGenerator.selectQuery(tableName, options, Model);
    if (attributeSelector === void 0) {
      throw new Error("Please pass an attribute selector!");
    }
    delete options.replacements;
    const data = await this.sequelize.queryRaw(sql, options);
    if (!options.plain) {
      return data;
    }
    const result = data ? data[attributeSelector] : null;
    if (!options || !options.dataType) {
      return result;
    }
    const dataType = options.dataType;
    if ((dataType instanceof DataTypes.DECIMAL || dataType instanceof DataTypes.FLOAT) && result !== null) {
      return Number.parseFloat(result);
    }
    if ((dataType instanceof DataTypes.INTEGER || dataType instanceof DataTypes.BIGINT) && result !== null) {
      return Number.parseInt(result, 10);
    }
    if (dataType instanceof DataTypes.DATE && result !== null && !(result instanceof Date)) {
      return new Date(result);
    }
    return result;
  }
  async createTrigger(tableName, triggerName, timingType, fireOnArray, functionName, functionParams, optionsArray, options) {
    const sql = this.queryGenerator.createTrigger(tableName, triggerName, timingType, fireOnArray, functionName, functionParams, optionsArray);
    options = options || {};
    if (sql) {
      return await this.sequelize.queryRaw(sql, options);
    }
  }
  async dropTrigger(tableName, triggerName, options) {
    const sql = this.queryGenerator.dropTrigger(tableName, triggerName);
    options = options || {};
    if (sql) {
      return await this.sequelize.queryRaw(sql, options);
    }
  }
  async renameTrigger(tableName, oldTriggerName, newTriggerName, options) {
    const sql = this.queryGenerator.renameTrigger(tableName, oldTriggerName, newTriggerName);
    options = options || {};
    if (sql) {
      return await this.sequelize.queryRaw(sql, options);
    }
  }
  async createFunction(functionName, params, returnType, language, body, optionsArray, options) {
    const sql = this.queryGenerator.createFunction(functionName, params, returnType, language, body, optionsArray, options);
    options = options || {};
    if (sql) {
      return await this.sequelize.queryRaw(sql, options);
    }
  }
  async dropFunction(functionName, params, options) {
    const sql = this.queryGenerator.dropFunction(functionName, params);
    options = options || {};
    if (sql) {
      return await this.sequelize.queryRaw(sql, options);
    }
  }
  async renameFunction(oldFunctionName, params, newFunctionName, options) {
    const sql = this.queryGenerator.renameFunction(oldFunctionName, params, newFunctionName);
    options = options || {};
    if (sql) {
      return await this.sequelize.queryRaw(sql, options);
    }
  }
  ensureEnums() {
  }
  async setIsolationLevel(transaction, value, options) {
    if (!transaction || !(transaction instanceof Transaction)) {
      throw new Error("Unable to set isolation level for a transaction without transaction object!");
    }
    if (transaction.parent || !value) {
      return;
    }
    options = __spreadProps(__spreadValues({}, options), { transaction: transaction.parent || transaction });
    const sql = this.queryGenerator.setIsolationLevelQuery(value, {
      parent: transaction.parent
    });
    if (!sql) {
      return;
    }
    return await this.sequelize.queryRaw(sql, options);
  }
  async startTransaction(transaction, options) {
    if (!transaction || !(transaction instanceof Transaction)) {
      throw new Error("Unable to start a transaction without transaction object!");
    }
    options = __spreadProps(__spreadValues({}, options), { transaction: transaction.parent || transaction });
    options.transaction.name = transaction.parent ? transaction.name : void 0;
    const sql = this.queryGenerator.startTransactionQuery(transaction);
    return await this.sequelize.queryRaw(sql, options);
  }
  async deferConstraints(transaction, options) {
    options = __spreadProps(__spreadValues({}, options), { transaction: transaction.parent || transaction });
    const sql = this.queryGenerator.deferConstraintsQuery(options);
    if (sql) {
      return await this.sequelize.queryRaw(sql, options);
    }
  }
  async commitTransaction(transaction, options) {
    if (!transaction || !(transaction instanceof Transaction)) {
      throw new Error("Unable to commit a transaction without transaction object!");
    }
    if (transaction.parent) {
      return;
    }
    options = __spreadProps(__spreadValues({}, options), {
      transaction: transaction.parent || transaction,
      supportsSearchPath: false,
      completesTransaction: true
    });
    const sql = this.queryGenerator.commitTransactionQuery(transaction);
    const promise = this.sequelize.queryRaw(sql, options);
    transaction.finished = "commit";
    return await promise;
  }
  async rollbackTransaction(transaction, options) {
    if (!transaction || !(transaction instanceof Transaction)) {
      throw new Error("Unable to rollback a transaction without transaction object!");
    }
    options = __spreadProps(__spreadValues({}, options), {
      transaction: transaction.parent || transaction,
      supportsSearchPath: false,
      completesTransaction: true
    });
    options.transaction.name = transaction.parent ? transaction.name : void 0;
    const sql = this.queryGenerator.rollbackTransactionQuery(transaction);
    const promise = this.sequelize.queryRaw(sql, options);
    transaction.finished = "rollback";
    return await promise;
  }
}
//# sourceMappingURL=query-interface.js.map
