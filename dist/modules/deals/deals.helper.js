"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilteredDealCounts = exports.getDealCounts = exports.validateCustomerAndService = exports.buildDealFilters = void 0;
const AppError_1 = require("../../shared/errors/AppError");
const db_1 = require("../../config/db");
const sql_helper_1 = require("../../shared/helpers/sql.helper");
const buildDealFilters = (filters, includeStage = true) => {
    const conditions = [];
    const params = [];
    if (includeStage &&
        filters?.stage &&
        filters.stage !== "ALL") {
        params.push(filters.stage);
        conditions.push(`d.stage = $${params.length}`);
    }
    if (filters?.customerId) {
        params.push(filters.customerId);
        conditions.push(`d.customer_id = $${params.length}`);
    }
    if (filters?.serviceId) {
        params.push(filters.serviceId);
        conditions.push(`d.service_id = $${params.length}`);
    }
    if (filters?.search) {
        params.push(`%${filters.search}%`);
        conditions.push(`
      (
        d.title ILIKE $${params.length}
        OR c.company ILIKE $${params.length}
        OR CONCAT(c.fname,' ',COALESCE(c.lname,'')) ILIKE $${params.length}
        OR s.name ILIKE $${params.length}
      )
    `);
    }
    return {
        conditions,
        params,
    };
};
exports.buildDealFilters = buildDealFilters;
const validateCustomerAndService = async (organizationId, customerId, serviceId, db = db_1.pool) => {
    const validation = await db.query(`
    SELECT

      EXISTS (
        SELECT 1
        FROM customers
        WHERE
          id = $1
          AND organization_id = $2
      ) AS customer_exists,

      EXISTS (
        SELECT 1
        FROM services
        WHERE
          id = $3
          AND organization_id = $2
          AND is_active = TRUE
      ) AS service_exists
    `, [
        customerId,
        organizationId,
        serviceId
    ]);
    const { customer_exists, service_exists } = validation.rows[0];
    if (!customer_exists) {
        throw new AppError_1.AppError("Customer not found", 404);
    }
    if (!service_exists) {
        throw new AppError_1.AppError("Service not found", 404);
    }
};
exports.validateCustomerAndService = validateCustomerAndService;
const getDealCounts = async (visibilityCondition, organizationId, visibleUsers, filters) => {
    const { conditions, params, } = (0, exports.buildDealFilters)(filters, false);
    params.unshift(organizationId);
    params.unshift(visibleUsers);
    const whereClause = `
    WHERE
      d.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
        ? "AND " +
            (0, sql_helper_1.shiftSqlParams)(conditions, 2)
        : ""}
  `;
    const result = await db_1.pool.query(`
      SELECT
        d.stage,
        COUNT(*)::int AS total

      FROM deals d

      INNER JOIN customers c
        ON c.id = d.customer_id

      INNER JOIN services s
        ON s.id = d.service_id

      ${whereClause}

      GROUP BY d.stage
      `, params);
    const counts = {
        ALL: 0,
    };
    result.rows.forEach(row => {
        counts[row.stage] =
            row.total;
        counts.ALL +=
            row.total;
    });
    return counts;
};
exports.getDealCounts = getDealCounts;
const getFilteredDealCounts = async (visibilityCondition, organizationId, visibleUsers, filters) => {
    const { conditions, params, } = (0, exports.buildDealFilters)(filters);
    params.unshift(organizationId);
    params.unshift(visibleUsers);
    const whereClause = `
    WHERE
      d.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
        ? "AND " +
            (0, sql_helper_1.shiftSqlParams)(conditions, 2)
        : ""}
  `;
    const result = await db_1.pool.query(`
      SELECT COUNT(*)::int AS total

      FROM deals d

      INNER JOIN customers c
        ON c.id = d.customer_id

      INNER JOIN services s
        ON s.id = d.service_id

      ${whereClause}
    `, params);
    return result.rows[0].total;
};
exports.getFilteredDealCounts = getFilteredDealCounts;
