"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftSqlParams = void 0;
const shiftSqlParams = (conditions, shift) => {
    return conditions
        .map(condition => condition.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + shift}`))
        .join(" AND ");
};
exports.shiftSqlParams = shiftSqlParams;
