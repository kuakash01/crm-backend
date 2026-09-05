"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertLeadEditable = exports.getFilteredLeadCount = exports.getLeadCounts = exports.buildLeadFilters = void 0;
const db_1 = require("../../config/db");
const sql_helper_1 = require("../../shared/helpers/sql.helper");
const AppError_1 = require("../../shared/errors/AppError");
const buildLeadFilters = (filters, includeStatus = true) => {
    const conditions = [];
    const params = [];
    if (includeStatus &&
        filters?.status &&
        filters.status !== "ALL") {
        params.push(filters.status);
        conditions.push(`l.status = $${params.length}`);
    }
    if (filters?.search) {
        params.push(`%${filters.search}%`);
        conditions.push(`
      (
        CONCAT(l.fname,' ',l.lname) ILIKE $${params.length}
        OR l.email ILIKE $${params.length}
        OR l.company ILIKE $${params.length}
      )
    `);
    }
    return {
        conditions,
        params,
    };
};
exports.buildLeadFilters = buildLeadFilters;
const getLeadCounts = async (visibilityCondition, organizationId, visibleUsers, filters) => {
    const { conditions, params, } = (0, exports.buildLeadFilters)(filters, false);
    params.unshift(organizationId);
    params.unshift(visibleUsers);
    const whereClause = `
    WHERE
      l.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
        ? "AND " +
            (0, sql_helper_1.shiftSqlParams)(conditions, 2)
        : ""}
  `;
    const result = await db_1.pool.query(`
      SELECT
        l.status,
        COUNT(*)::int AS total
      FROM leads l

      ${whereClause}

      GROUP BY l.status
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
exports.getLeadCounts = getLeadCounts;
const getFilteredLeadCount = async (visibilityCondition, organizationId, visibleUsers, filters) => {
    const { conditions, params } = (0, exports.buildLeadFilters)(filters);
    params.unshift(organizationId);
    params.unshift(visibleUsers);
    const whereClause = `
    WHERE
      l.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
        ? "AND " + (0, sql_helper_1.shiftSqlParams)(conditions, 2)
        : ""}
  `;
    const result = await db_1.pool.query(`
      SELECT COUNT(*)::int AS total
      FROM leads l
      ${whereClause}
    `, params);
    return result.rows[0].total;
};
exports.getFilteredLeadCount = getFilteredLeadCount;
const assertLeadEditable = (lead, currentUserRole) => {
    if (lead.converted_at &&
        currentUserRole !== "admin") {
        throw new AppError_1.AppError("Converted leads cannot be edited.", 403);
    }
};
exports.assertLeadEditable = assertLeadEditable;
