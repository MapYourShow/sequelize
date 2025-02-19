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
  IBMiQueryInterface: () => IBMiQueryInterface
});
module.exports = __toCommonJS(query_interface_exports);
const { Transaction } = require("../../transaction");
const { QueryInterface } = require("../abstract/query-interface");
class IBMiQueryInterface extends QueryInterface {
  startTransaction(transaction, options) {
    if (!(transaction instanceof Transaction)) {
      throw new TypeError("Unable to start a transaction without transaction object!");
    }
    options = __spreadProps(__spreadValues({}, options), { transaction: transaction.parent || transaction });
    options.transaction.name = transaction.parent ? transaction.name : void 0;
    return transaction.connection.beginTransaction();
  }
  commitTransaction(transaction) {
    if (!(transaction instanceof Transaction)) {
      throw new TypeError("Unable to commit a transaction without transaction object!");
    }
    if (transaction.parent) {
      throw new Error("Unable to commit a transaction that has a parent transaction!");
    }
    const promise = transaction.connection.commit();
    transaction.finished = "commit";
    return promise;
  }
  rollbackTransaction(transaction, options) {
    if (!(transaction instanceof Transaction)) {
      throw new TypeError("Unable to rollback a transaction without transaction object!");
    }
    options = __spreadProps(__spreadValues({}, options), {
      transaction: transaction.parent || transaction,
      supportsSearchPath: false,
      completesTransaction: true
    });
    options.transaction.name = transaction.parent ? transaction.name : void 0;
    const promise = transaction.connection.rollback();
    transaction.finished = "commit";
    return promise;
  }
}
//# sourceMappingURL=query-interface.js.map
