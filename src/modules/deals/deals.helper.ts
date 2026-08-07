import { Pool, PoolClient } from "pg";
import { AppError } from "../../shared/errors/AppError";
import { pool } from "../../config/db";
import { shiftSqlParams } from "../../shared/helpers/sql.helper";

export const buildDealFilters = (
  filters?: {
    stage?: string;
    customerId?: number;
    serviceId?: number;
    search?: string;
  },
  includeStage = true
) => {

  const conditions: string[] = [];
  const params: any[] = [];

  if (
    includeStage &&
    filters?.stage &&
    filters.stage !== "ALL"
  ) {

    params.push(filters.stage);

    conditions.push(
      `d.stage = $${params.length}`
    );

  }

  if (filters?.customerId) {

    params.push(filters.customerId);

    conditions.push(
      `d.customer_id = $${params.length}`
    );

  }

  if (filters?.serviceId) {

    params.push(filters.serviceId);

    conditions.push(
      `d.service_id = $${params.length}`
    );

  }

  if (filters?.search) {

    params.push(
      `%${filters.search}%`
    );

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

export const validateCustomerAndService = async (
  organizationId: number,
  customerId: number,
  serviceId: number,
  db: Pool | PoolClient = pool
) => {

  const validation = await db.query(
    `
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
    `,
    [
      customerId,
      organizationId,
      serviceId
    ]
  );

  const {
    customer_exists,
    service_exists
  } = validation.rows[0];

  if (!customer_exists) {
    throw new AppError(
      "Customer not found",
      404
    );
  }

  if (!service_exists) {
    throw new AppError(
      "Service not found",
      404
    );
  }

};


export const getDealCounts = async (
  visibilityCondition: string,
  organizationId: number,
  visibleUsers: number[],
  filters?: {
    stage?: string;
    customerId?: number;
    serviceId?: number;
    search?: string;
  }
) => {

  const {
    conditions,
    params,
  } = buildDealFilters(
    filters,
    false
  );

  params.unshift(
    organizationId
  );

  params.unshift(
    visibleUsers
  );

  const whereClause = `
    WHERE
      d.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
      ? "AND " +
      shiftSqlParams(
        conditions,
        2
      )
      : ""
    }
  `;

  const result =
    await pool.query(
      `
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
      `,
      params
    );

  const counts: Record<
    string,
    number
  > = {
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

export const getFilteredDealCounts = async (
  visibilityCondition: string,
  organizationId: number,
  visibleUsers: number[],
  filters?: {
    stage?: string;
    customerId?: number;
    serviceId?: number;
    search?: string;
  }
) => {

  const {
    conditions,
    params,
  } = buildDealFilters(
    filters,
  );

  params.unshift(
    organizationId
  );

  params.unshift(
    visibleUsers
  );

  const whereClause = `
    WHERE
      d.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
      ? "AND " +
      shiftSqlParams(
        conditions,
        2
      )
      : ""
    }
  `;

  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM deals d
      ${whereClause}
    `,
    params
  );

  return result.rows[0].total;
};