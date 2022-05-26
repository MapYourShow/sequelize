"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
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
var connection_manager_exports = {};
__export(connection_manager_exports, {
  SnowflakeConnectionManager: () => SnowflakeConnectionManager
});
module.exports = __toCommonJS(connection_manager_exports);
const { ConnectionManager } = require("../abstract/connection-manager");
const SequelizeErrors = require("../../errors");
const { logger } = require("../../utils/logger");
const DataTypes = require("../../data-types").snowflake;
const debug = logger.debugContext("connection:snowflake");
const parserStore = require("../parserStore")("snowflake");
class SnowflakeConnectionManager extends ConnectionManager {
  constructor(dialect, sequelize) {
    sequelize.config.port = sequelize.config.port || 3306;
    super(dialect, sequelize);
    this.lib = this._loadDialectModule("snowflake-sdk");
    this.refreshTypeParser(DataTypes);
  }
  _refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }
  _clearTypeParser() {
    parserStore.clear();
  }
  static _typecast(field, next) {
    if (parserStore.get(field.type)) {
      return parserStore.get(field.type)(field, this.sequelize.options, next);
    }
    return next();
  }
  async connect(config) {
    const connectionConfig = __spreadValues({
      account: config.host,
      username: config.username,
      password: config.password,
      database: config.database,
      warehouse: config.warehouse,
      role: config.role
    }, config.dialectOptions);
    try {
      const connection = await new Promise((resolve, reject) => {
        this.lib.createConnection(connectionConfig).connect((err, conn) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(conn);
          }
        });
      });
      debug("connection acquired");
      if (!this.sequelize.config.keepDefaultTimezone) {
        const tzOffset = this.sequelize.options.timezone === "+00:00" ? "Etc/UTC" : this.sequelize.options.timezone;
        const isNamedTzOffset = /\//.test(tzOffset);
        if (isNamedTzOffset) {
          await new Promise((resolve, reject) => {
            connection.execute({
              sqlText: `ALTER SESSION SET timezone = '${tzOffset}'`,
              complete(err) {
                if (err) {
                  console.error(err);
                  reject(err);
                } else {
                  resolve();
                }
              }
            });
          });
        } else {
          throw new Error("only support time zone name for snowflake!");
        }
      }
      return connection;
    } catch (error) {
      switch (error.code) {
        case "ECONNREFUSED":
          throw new SequelizeErrors.ConnectionRefusedError(error);
        case "ER_ACCESS_DENIED_ERROR":
          throw new SequelizeErrors.AccessDeniedError(error);
        case "ENOTFOUND":
          throw new SequelizeErrors.HostNotFoundError(error);
        case "EHOSTUNREACH":
          throw new SequelizeErrors.HostNotReachableError(error);
        case "EINVAL":
          throw new SequelizeErrors.InvalidConnectionError(error);
        default:
          throw new SequelizeErrors.ConnectionError(error);
      }
    }
  }
  async disconnect(connection) {
    if (!connection.isUp()) {
      debug("connection tried to disconnect but was already at CLOSED state");
      return;
    }
    return new Promise((resolve, reject) => {
      connection.destroy((err) => {
        if (err) {
          console.error(`Unable to disconnect: ${err.message}`);
          reject(err);
        } else {
          console.error(`Disconnected connection with id: ${connection.getId()}`);
          resolve(connection.getId());
        }
      });
    });
  }
  validate(connection) {
    return connection.isUp();
  }
}
//# sourceMappingURL=connection-manager.js.map
