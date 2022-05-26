"use strict";
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
var sequelize_exports = {};
__export(sequelize_exports, {
  Sequelize: () => Sequelize,
  and: () => and,
  cast: () => cast,
  col: () => col,
  fn: () => fn,
  json: () => json,
  literal: () => literal,
  or: () => or,
  where: () => where
});
module.exports = __toCommonJS(sequelize_exports);
var import_isPlainObject = __toESM(require("lodash/isPlainObject"));
var import_deprecations = require("./utils/deprecations");
var import_model_utils = require("./utils/model-utils");
var import_sql = require("./utils/sql");
var import_url = require("./utils/url");
const retry = require("retry-as-promised");
const _ = require("lodash");
const Utils = require("./utils");
const { Model } = require("./model");
const DataTypes = require("./data-types");
const { Deferrable } = require("./deferrable");
const { ModelManager } = require("./model-manager");
const { Transaction, TRANSACTION_TYPES } = require("./transaction");
const { QueryTypes } = require("./query-types");
const { TableHints } = require("./table-hints");
const { IndexHints } = require("./index-hints");
const sequelizeErrors = require("./errors");
const Hooks = require("./hooks");
const { Association } = require("./associations/index");
const Validator = require("./utils/validator-extras").validator;
const { Op } = require("./operators");
const deprecations = require("./utils/deprecations");
const { QueryInterface } = require("./dialects/abstract/query-interface");
const { BelongsTo } = require("./associations/belongs-to");
const { HasOne } = require("./associations/has-one");
const { BelongsToMany } = require("./associations/belongs-to-many");
const { HasMany } = require("./associations/has-many");
require("./utils/dayjs");
class Sequelize {
  constructor(database, username, password, options) {
    let config;
    if (arguments.length === 1 && typeof database === "object") {
      options = database;
      config = _.pick(options, "host", "port", "database", "username", "password");
    } else if (arguments.length === 1 && typeof database === "string" || arguments.length === 2 && typeof username === "object") {
      config = {};
      options = username || {};
      _.defaultsDeep(options, (0, import_url.parseConnectionString)(arguments[0]));
    } else {
      options = options || {};
      config = { database, username, password };
    }
    Sequelize.runHooks("beforeInit", config, options);
    this.options = __spreadValues({
      dialect: null,
      dialectModule: null,
      dialectModulePath: null,
      dialectOptions: /* @__PURE__ */ Object.create(null),
      host: "localhost",
      protocol: "tcp",
      define: {},
      query: {},
      sync: {},
      timezone: "+00:00",
      standardConformingStrings: true,
      logging: console.debug,
      omitNull: false,
      native: false,
      replication: false,
      ssl: void 0,
      pool: {},
      quoteIdentifiers: true,
      hooks: {},
      retry: {
        max: 5,
        match: [
          "SQLITE_BUSY: database is locked"
        ]
      },
      transactionType: TRANSACTION_TYPES.DEFERRED,
      isolationLevel: null,
      databaseVersion: 0,
      typeValidation: false,
      benchmark: false,
      minifyAliases: false,
      logQueryParameters: false
    }, options);
    if (!this.options.dialect) {
      throw new Error("Dialect needs to be explicitly supplied as of v4.0.0");
    }
    if (this.options.dialect === "postgresql") {
      this.options.dialect = "postgres";
    }
    if (this.options.dialect === "sqlite" && this.options.timezone !== "+00:00") {
      throw new Error("Setting a custom timezone is not supported by SQLite, dates are always returned as UTC. Please remove the custom timezone parameter.");
    }
    if (this.options.dialect === "ibmi" && this.options.timezone !== "+00:00") {
      throw new Error("Setting a custom timezone is not supported by Db2 for i, dates are always returned as UTC. Please remove the custom timezone parameter.");
    }
    if (this.options.logging === true) {
      deprecations.noTrueLogging();
      this.options.logging = console.debug;
    }
    this._setupHooks(options.hooks);
    this.config = {
      database: config.database || this.options.database,
      username: config.username || this.options.username,
      password: config.password || this.options.password || null,
      host: config.host || this.options.host,
      port: config.port || this.options.port,
      pool: this.options.pool,
      protocol: this.options.protocol,
      native: this.options.native,
      ssl: this.options.ssl,
      replication: this.options.replication,
      dialectModule: this.options.dialectModule,
      dialectModulePath: this.options.dialectModulePath,
      keepDefaultTimezone: this.options.keepDefaultTimezone,
      dialectOptions: this.options.dialectOptions
    };
    if (this.options.replication) {
      if (this.options.replication.write && typeof this.options.replication.write === "string") {
        this.options.replication.write = (0, import_url.parseConnectionString)(this.options.replication.write);
      }
      if (this.options.replication.read) {
        for (let i = 0; i < this.options.replication.read.length; i++) {
          const server = this.options.replication.read[i];
          if (typeof server === "string") {
            this.options.replication.read[i] = (0, import_url.parseConnectionString)(server);
          }
        }
      }
    }
    let Dialect;
    switch (this.getDialect()) {
      case "mariadb":
        Dialect = require("./dialects/mariadb").MariaDbDialect;
        break;
      case "mssql":
        Dialect = require("./dialects/mssql").MssqlDialect;
        break;
      case "mysql":
        Dialect = require("./dialects/mysql").MysqlDialect;
        break;
      case "postgres":
        Dialect = require("./dialects/postgres").PostgresDialect;
        break;
      case "sqlite":
        Dialect = require("./dialects/sqlite").SqliteDialect;
        break;
      case "ibmi":
        Dialect = require("./dialects/ibmi").IBMiDialect;
        break;
      case "db2":
        Dialect = require("./dialects/db2").Db2Dialect;
        break;
      case "snowflake":
        Dialect = require("./dialects/snowflake").SnowflakeDialect;
        break;
      default:
        throw new Error(`The dialect ${this.getDialect()} is not supported. Supported dialects: mariadb, mssql, mysql, postgres, sqlite, ibmi, db2 and snowflake.`);
    }
    this.dialect = new Dialect(this);
    this.dialect.queryGenerator.typeValidation = options.typeValidation;
    if (_.isPlainObject(this.options.operatorsAliases)) {
      deprecations.noStringOperators();
      this.dialect.queryGenerator.setOperatorsAliases(this.options.operatorsAliases);
    } else if (typeof this.options.operatorsAliases === "boolean") {
      deprecations.noBoolOperatorAliases();
    }
    this.queryInterface = this.dialect.queryInterface;
    this.models = {};
    this.modelManager = new ModelManager(this);
    this.connectionManager = this.dialect.connectionManager;
    Sequelize.runHooks("afterInit", this);
  }
  refreshTypes() {
    this.connectionManager.refreshTypeParser(DataTypes);
  }
  getDialect() {
    return this.options.dialect;
  }
  getDatabaseName() {
    return this.config.database;
  }
  getQueryInterface() {
    return this.queryInterface;
  }
  define(modelName, attributes, options = {}) {
    options.modelName = modelName;
    options.sequelize = this;
    const model = class extends Model {
    };
    model.init(attributes, options);
    return model;
  }
  model(modelName) {
    if (!this.isDefined(modelName)) {
      throw new Error(`${modelName} has not been defined`);
    }
    return this.modelManager.getModel(modelName);
  }
  isDefined(modelName) {
    return this.modelManager.models.some((model) => model.name === modelName);
  }
  async query(sql, options) {
    options = __spreadValues(__spreadValues({}, this.options.query), options);
    if (typeof sql === "object") {
      throw new TypeError('"sql" cannot be an object. Pass a string instead, and pass bind and replacement parameters through the "options" parameter');
    }
    sql = sql.trim();
    if (options.replacements) {
      sql = (0, import_sql.injectReplacements)(sql, this.dialect, options.replacements);
    }
    delete options.replacements;
    return this.queryRaw(sql, options);
  }
  async queryRaw(sql, options) {
    if (typeof sql !== "string") {
      throw new TypeError("Sequelize#rawQuery requires a string as the first parameter.");
    }
    if (options != null && "replacements" in options) {
      throw new TypeError(`Sequelize#rawQuery does not accept the "replacements" options.
Only bind parameters can be provided, in the dialect-specific syntax.
Use Sequelize#query if you wish to use replacements.`);
    }
    options = __spreadValues(__spreadValues({}, this.options.query), options);
    let bindParameters;
    if (options.bind != null) {
      const isBindArray = Array.isArray(options.bind);
      if (!(0, import_isPlainObject.default)(options.bind) && !isBindArray) {
        throw new TypeError("options.bind must be either a plain object (for named parameters) or an array (for numeric parameters)");
      }
      const mappedResult = (0, import_sql.mapBindParameters)(sql, this.dialect);
      for (const parameterName of mappedResult.parameterSet) {
        if (isBindArray) {
          if (!/[1-9][0-9]*/.test(parameterName) || options.bind.length < Number(parameterName)) {
            throw new Error(`Query includes bind parameter "$${parameterName}", but no value has been provided for that bind parameter.`);
          }
        } else if (!(parameterName in options.bind)) {
          throw new Error(`Query includes bind parameter "$${parameterName}", but no value has been provided for that bind parameter.`);
        }
      }
      sql = mappedResult.sql;
      if (mappedResult.bindOrder == null) {
        bindParameters = options.bind;
      } else {
        bindParameters = mappedResult.bindOrder.map((key) => {
          if (isBindArray) {
            return options.bind[key - 1];
          }
          return options.bind[key];
        });
      }
    }
    if (options.instance && !options.model) {
      options.model = options.instance.constructor;
    }
    if (!options.instance && !options.model) {
      options.raw = true;
    }
    if (options.mapToModel) {
      options.fieldMap = _.get(options, "model.fieldAttributeMap", {});
    }
    options = _.defaults(options, {
      logging: Object.prototype.hasOwnProperty.call(this.options, "logging") ? this.options.logging : console.debug,
      searchPath: Object.prototype.hasOwnProperty.call(this.options, "searchPath") ? this.options.searchPath : "DEFAULT"
    });
    if (!options.type) {
      if (options.model || options.nest || options.plain) {
        options.type = QueryTypes.SELECT;
      } else {
        options.type = QueryTypes.RAW;
      }
    }
    if (!this.dialect.supports.searchPath || !this.options.dialectOptions || !this.options.dialectOptions.prependSearchPath || options.supportsSearchPath === false) {
      delete options.searchPath;
    } else if (!options.searchPath) {
      options.searchPath = "DEFAULT";
    }
    const checkTransaction = () => {
      if (options.transaction && options.transaction.finished && !options.completesTransaction) {
        const error = new Error(`${options.transaction.finished} has been called on this transaction(${options.transaction.id}), you can no longer use it. (The rejected query is attached as the 'sql' property of this error)`);
        error.sql = sql;
        throw error;
      }
    };
    const retryOptions = __spreadValues(__spreadValues({}, this.options.retry), options.retry);
    return retry(async () => {
      if (options.transaction === void 0 && Sequelize._cls) {
        options.transaction = Sequelize._cls.get("transaction");
      }
      checkTransaction();
      const connection = await (options.transaction ? options.transaction.connection : this.connectionManager.getConnection({
        useMaster: options.useMaster,
        type: options.type === "SELECT" ? "read" : "write"
      }));
      if (this.options.dialect === "db2" && options.alter && options.alter.drop === false) {
        connection.dropTable = false;
      }
      const query = new this.dialect.Query(connection, this, options);
      try {
        await this.runHooks("beforeQuery", options, query);
        checkTransaction();
        return await query.run(sql, bindParameters);
      } finally {
        await this.runHooks("afterQuery", options, query);
        if (!options.transaction) {
          await this.connectionManager.releaseConnection(connection);
        }
      }
    }, retryOptions);
  }
  async set(variables, options) {
    options = __spreadValues(__spreadValues({}, this.options.set), typeof options === "object" && options);
    if (!["mysql", "mariadb"].includes(this.options.dialect)) {
      throw new Error("sequelize.set is only supported for mysql or mariadb");
    }
    if (!options.transaction || !(options.transaction instanceof Transaction)) {
      throw new TypeError("options.transaction is required");
    }
    options.raw = true;
    options.plain = true;
    options.type = "SET";
    const query = `SET ${_.map(variables, (v, k) => `@${k} := ${typeof v === "string" ? `"${v}"` : v}`).join(", ")}`;
    return await this.query(query, options);
  }
  escape(value) {
    return this.dialect.queryGenerator.escape(value);
  }
  async createSchema(schema, options) {
    return await this.getQueryInterface().createSchema(schema, options);
  }
  async showAllSchemas(options) {
    return await this.getQueryInterface().showAllSchemas(options);
  }
  async dropSchema(schema, options) {
    return await this.getQueryInterface().dropSchema(schema, options);
  }
  async dropAllSchemas(options) {
    return await this.getQueryInterface().dropAllSchemas(options);
  }
  async sync(options) {
    options = __spreadProps(__spreadValues(__spreadValues(__spreadValues({}, this.options), this.options.sync), options), {
      hooks: options ? options.hooks !== false : true
    });
    if (options.match && !options.match.test(this.config.database)) {
      throw new Error(`Database "${this.config.database}" does not match sync match parameter "${options.match}"`);
    }
    if (options.hooks) {
      await this.runHooks("beforeBulkSync", options);
    }
    if (options.force) {
      await this.drop(options);
    }
    const models = [];
    this.modelManager.forEachModel((model) => {
      if (model) {
        models.push(model);
      } else {
      }
    });
    if (models.length === 0) {
      await this.authenticate(options);
    } else {
      for (const model of models) {
        await model.sync(options);
      }
    }
    if (options.hooks) {
      await this.runHooks("afterBulkSync", options);
    }
    return this;
  }
  async truncate(options) {
    const models = [];
    this.modelManager.forEachModel((model) => {
      if (model) {
        models.push(model);
      }
    }, { reverse: false });
    if (options && options.cascade) {
      for (const model of models) {
        await model.truncate(options);
      }
    } else {
      await Promise.all(models.map((model) => model.truncate(options)));
    }
  }
  async drop(options) {
    const models = [];
    this.modelManager.forEachModel((model) => {
      if (model) {
        models.push(model);
      }
    }, { reverse: false });
    for (const model of models) {
      await model.drop(options);
    }
  }
  async authenticate(options) {
    options = __spreadValues({
      raw: true,
      plain: true,
      type: QueryTypes.SELECT
    }, options);
    await this.query(`SELECT 1+1 AS result${this.options.dialect === "ibmi" ? " FROM SYSIBM.SYSDUMMY1" : ""}`, options);
  }
  async databaseVersion(options) {
    return await this.getQueryInterface().databaseVersion(options);
  }
  random() {
    if (["postgres", "sqlite", "snowflake"].includes(this.getDialect())) {
      return this.fn("RANDOM");
    }
    return this.fn("RAND");
  }
  static fn = fn;
  static col = col;
  static cast = cast;
  static literal = literal;
  static and = and;
  static or = or;
  static json = json;
  static where = where;
  static isModelStatic = import_model_utils.isModelStatic;
  static isSameInitialModel = import_model_utils.isSameInitialModel;
  async transaction(options, autoCallback) {
    if (typeof options === "function") {
      autoCallback = options;
      options = void 0;
    }
    const transaction = new Transaction(this, options);
    if (!autoCallback) {
      await transaction.prepareEnvironment(false);
      return transaction;
    }
    return Sequelize._clsRun(async () => {
      try {
        await transaction.prepareEnvironment();
        const result = await autoCallback(transaction);
        await transaction.commit();
        return await result;
      } catch (error) {
        try {
          if (!transaction.finished) {
            await transaction.rollback();
          } else {
            await transaction.cleanup();
          }
        } catch {
        }
        throw error;
      }
    });
  }
  static useCLS(ns) {
    if (!ns || typeof ns !== "object" || typeof ns.bind !== "function" || typeof ns.run !== "function") {
      throw new Error("Must provide CLS namespace");
    }
    Sequelize._cls = ns;
    return this;
  }
  static _clsRun(fn2) {
    const ns = Sequelize._cls;
    if (!ns) {
      return fn2();
    }
    let res;
    ns.run((context) => {
      res = fn2(context);
    });
    return res;
  }
  log(...args) {
    let options;
    const last = _.last(args);
    if (last && _.isPlainObject(last) && Object.prototype.hasOwnProperty.call(last, "logging")) {
      options = last;
      if (options.logging === console.log || options.logging === console.debug) {
        args.splice(-1, 1);
      }
    } else {
      options = this.options;
    }
    if (options.logging) {
      if (options.logging === true) {
        deprecations.noTrueLogging();
        options.logging = console.debug;
      }
      if ((this.options.benchmark || options.benchmark) && options.logging === console.debug) {
        args = [`${args[0]} Elapsed time: ${args[1]}ms`];
      }
      options.logging(...args);
    }
  }
  close() {
    return this.connectionManager.close();
  }
  normalizeDataType(Type) {
    let type = typeof Type === "function" ? new Type() : Type;
    const dialectTypes = this.dialect.DataTypes || {};
    if (dialectTypes[type.key]) {
      type = dialectTypes[type.key].extend(type);
    }
    if (type instanceof DataTypes.ARRAY) {
      if (!type.type) {
        throw new Error("ARRAY is missing type definition for its values.");
      }
      if (dialectTypes[type.type.key]) {
        type.type = dialectTypes[type.type.key].extend(type.type);
      }
    }
    return type;
  }
  normalizeAttribute(attribute) {
    if (!_.isPlainObject(attribute)) {
      attribute = { type: attribute };
    }
    if (!attribute.type) {
      return attribute;
    }
    attribute.type = this.normalizeDataType(attribute.type);
    if (Object.prototype.hasOwnProperty.call(attribute, "defaultValue") && typeof attribute.defaultValue === "function" && [DataTypes.NOW, DataTypes.UUIDV1, DataTypes.UUIDV4].includes(attribute.defaultValue)) {
      attribute.defaultValue = new attribute.defaultValue();
    }
    if (attribute.type instanceof DataTypes.ENUM) {
      if (attribute.values) {
        attribute.type.values = attribute.type.options.values = attribute.values;
      } else {
        attribute.values = attribute.type.values;
      }
      if (attribute.values.length === 0) {
        throw new Error("Values for ENUM have not been defined.");
      }
    }
    return attribute;
  }
}
Sequelize.prototype.fn = Sequelize.fn;
Sequelize.prototype.col = Sequelize.col;
Sequelize.prototype.cast = Sequelize.cast;
Sequelize.prototype.literal = Sequelize.literal;
Sequelize.prototype.and = Sequelize.and;
Sequelize.prototype.or = Sequelize.or;
Sequelize.prototype.json = Sequelize.json;
Sequelize.prototype.where = Sequelize.where;
Sequelize.prototype.validate = Sequelize.prototype.authenticate;
Object.defineProperty(Sequelize, "version", {
  enumerable: true,
  get() {
    return require("../package.json").version;
  }
});
Sequelize.options = { hooks: {} };
Sequelize.Utils = Utils;
Sequelize.Op = Op;
Sequelize.TableHints = TableHints;
Sequelize.IndexHints = IndexHints;
Sequelize.Transaction = Transaction;
Sequelize.prototype.Sequelize = Sequelize;
Sequelize.prototype.QueryTypes = Sequelize.QueryTypes = QueryTypes;
Sequelize.prototype.Validator = Sequelize.Validator = Validator;
Sequelize.Model = Model;
Sequelize.QueryInterface = QueryInterface;
Sequelize.BelongsTo = BelongsTo;
Sequelize.HasOne = HasOne;
Sequelize.HasMany = HasMany;
Sequelize.BelongsToMany = BelongsToMany;
Sequelize.DataTypes = DataTypes;
for (const dataTypeName in DataTypes) {
  Object.defineProperty(Sequelize, dataTypeName, {
    get() {
      (0, import_deprecations.noSequelizeDataType)();
      return DataTypes[dataTypeName];
    }
  });
}
Sequelize.Deferrable = Deferrable;
Sequelize.prototype.Association = Sequelize.Association = Association;
Sequelize.useInflection = Utils.useInflection;
Hooks.applyTo(Sequelize);
Hooks.applyTo(Sequelize.prototype);
Sequelize.Error = sequelizeErrors.BaseError;
for (const error of Object.keys(sequelizeErrors)) {
  Sequelize[error] = sequelizeErrors[error];
}
function fn(fn2, ...args) {
  return new Utils.Fn(fn2, args);
}
function col(col2) {
  return new Utils.Col(col2);
}
function cast(val, type) {
  return new Utils.Cast(val, type);
}
function literal(val) {
  return new Utils.Literal(val);
}
function and(...args) {
  return { [Op.and]: args };
}
function or(...args) {
  return { [Op.or]: args };
}
function json(conditionsOrPath, value) {
  return new Utils.Json(conditionsOrPath, value);
}
function where(attr, comparator, logic) {
  return new Utils.Where(attr, comparator, logic);
}
//# sourceMappingURL=sequelize.js.map
