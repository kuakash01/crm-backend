"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilteredCustomerCount = exports.getCustomerCounts = exports.buildCustomerFilters = void 0;
const db_1 = require("../../config/db");
const sql_helper_1 = require("../../shared/helpers/sql.helper");
const buildCustomerFilters = (filters, includeStatus = true) => {
    const conditions = [];
    const params = [];
    if (includeStatus &&
        filters?.status &&
        filters.status !== "ALL") {
        params.push(filters.status);
        conditions.push(`c.status = $${params.length}`);
    }
    if (filters?.search) {
        params.push(`%${filters.search}%`);
        conditions.push(`
      (
        CONCAT(
          c.fname,
          ' ',
          COALESCE(c.lname,'')
        ) ILIKE $${params.length}
        OR c.email ILIKE $${params.length}
        OR c.company ILIKE $${params.length}
      )
    `);
    }
    return {
        conditions,
        params,
    };
};
exports.buildCustomerFilters = buildCustomerFilters;
const getCustomerCounts = async (visibilityCondition, organizationId, visibleUsers, filters) => {
    const { conditions, params, } = (0, exports.buildCustomerFilters)(filters, false);
    params.unshift(organizationId);
    params.unshift(visibleUsers);
    const whereClause = `
    WHERE
      c.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
        ? "AND " +
            (0, sql_helper_1.shiftSqlParams)(conditions, 2)
        : ""}
  `;
    const result = await db_1.pool.query(`
      SELECT
        c.status,
        COUNT(*)::int AS total

      FROM customers c

      ${whereClause}

      GROUP BY c.status
      `, params);
    const counts = {
        ALL: 0,
    };
    result.rows.forEach(row => {
        counts[row.status] =
            row.total;
        counts.ALL +=
            row.total;
    });
    return counts;
};
exports.getCustomerCounts = getCustomerCounts;
const getFilteredCustomerCount = async (visibilityCondition, organizationId, visibleUsers, filters) => {
    const { conditions, params } = (0, exports.buildCustomerFilters)(filters);
    params.unshift(organizationId);
    params.unshift(visibleUsers);
    const whereClause = `
    WHERE
      c.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
        ? "AND " + (0, sql_helper_1.shiftSqlParams)(conditions, 2)
        : ""}
  `;
    const result = await db_1.pool.query(`
      SELECT COUNT(*)::int AS total
      FROM customers c
      ${whereClause}
    `, params);
    return result.rows[0].total;
};
exports.getFilteredCustomerCount = getFilteredCustomerCount;
