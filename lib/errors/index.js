var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var errors_exports = {};
__export(errors_exports, {
  AccessDeniedError: () => import_access_denied_error.default,
  AggregateError: () => import_aggregate_error.default,
  AssociationError: () => import_association_error.default,
  AsyncQueueError: () => import_async_queue.AsyncQueueError,
  BaseError: () => import_base_error.default,
  BulkRecordError: () => import_bulk_record_error.default,
  ConnectionAcquireTimeoutError: () => import_connection_acquire_timeout_error.default,
  ConnectionError: () => import_connection_error.default,
  ConnectionRefusedError: () => import_connection_refused_error.default,
  ConnectionTimedOutError: () => import_connection_timed_out_error.default,
  DatabaseError: () => import_database_error.default,
  EagerLoadingError: () => import_eager_loading_error.default,
  EmptyResultError: () => import_empty_result_error.default,
  ExclusionConstraintError: () => import_exclusion_constraint_error.default,
  ForeignKeyConstraintError: () => import_foreign_key_constraint_error.default,
  HostNotFoundError: () => import_host_not_found_error.default,
  HostNotReachableError: () => import_host_not_reachable_error.default,
  InstanceError: () => import_instance_error.default,
  InvalidConnectionError: () => import_invalid_connection_error.default,
  OptimisticLockError: () => import_optimistic_lock_error.default,
  QueryError: () => import_query_error.default,
  SequelizeScopeError: () => import_sequelize_scope_error.default,
  TimeoutError: () => import_timeout_error.default,
  UniqueConstraintError: () => import_unique_constraint_error.default,
  UnknownConstraintError: () => import_unknown_constraint_error.default,
  ValidationError: () => import_validation_error.default,
  ValidationErrorItem: () => import_validation_error.ValidationErrorItem,
  ValidationErrorItemOrigin: () => import_validation_error.ValidationErrorItemOrigin,
  ValidationErrorItemType: () => import_validation_error.ValidationErrorItemType
});
module.exports = __toCommonJS(errors_exports);
var import_base_error = __toESM(require("./base-error"));
var import_database_error = __toESM(require("./database-error"));
var import_aggregate_error = __toESM(require("./aggregate-error"));
var import_association_error = __toESM(require("./association-error"));
var import_bulk_record_error = __toESM(require("./bulk-record-error"));
var import_connection_error = __toESM(require("./connection-error"));
var import_eager_loading_error = __toESM(require("./eager-loading-error"));
var import_empty_result_error = __toESM(require("./empty-result-error"));
var import_instance_error = __toESM(require("./instance-error"));
var import_optimistic_lock_error = __toESM(require("./optimistic-lock-error"));
var import_query_error = __toESM(require("./query-error"));
var import_sequelize_scope_error = __toESM(require("./sequelize-scope-error"));
var import_validation_error = __toESM(require("./validation-error"));
var import_access_denied_error = __toESM(require("./connection/access-denied-error"));
var import_connection_acquire_timeout_error = __toESM(require("./connection/connection-acquire-timeout-error"));
var import_connection_refused_error = __toESM(require("./connection/connection-refused-error"));
var import_connection_timed_out_error = __toESM(require("./connection/connection-timed-out-error"));
var import_host_not_found_error = __toESM(require("./connection/host-not-found-error"));
var import_host_not_reachable_error = __toESM(require("./connection/host-not-reachable-error"));
var import_invalid_connection_error = __toESM(require("./connection/invalid-connection-error"));
var import_exclusion_constraint_error = __toESM(require("./database/exclusion-constraint-error"));
var import_foreign_key_constraint_error = __toESM(require("./database/foreign-key-constraint-error"));
var import_timeout_error = __toESM(require("./database/timeout-error"));
var import_unknown_constraint_error = __toESM(require("./database/unknown-constraint-error"));
var import_unique_constraint_error = __toESM(require("./validation/unique-constraint-error"));
var import_async_queue = require("../dialects/mssql/async-queue");
//# sourceMappingURL=index.js.map
