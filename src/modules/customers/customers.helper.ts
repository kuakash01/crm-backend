import { pool } from "../../config/db";
import { shiftSqlParams } from "../../shared/helpers/sql.helper";

interface CustomerFilters {
  status?: string;
  search?: string;
}

export const buildCustomerFilters = (
  filters?: {
    status?: string;
    search?: string;
  },
  includeStatus = true
) => {

  const conditions: string[] = [];
  const params: any[] = [];

  if (
    includeStatus &&
    filters?.status &&
    filters.status !== "ALL"
  ) {

    params.push(filters.status);

    conditions.push(
      `c.status = $${params.length}`
    );

  }

  if (filters?.search) {

    params.push(
      `%${filters.search}%`
    );

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

export const getCustomerCounts = async (
  visibilityCondition: string,
  organizationId: number,
  visibleUsers: number[],
  filters?: {
    status?: string;
    search?: string;
  }
) => {

  const {
    conditions,
    params,
  } = buildCustomerFilters(
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
      c.organization_id = $2
      AND ${visibilityCondition}
      ${
        conditions.length
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
        c.status,
        COUNT(*)::int AS total

      FROM customers c

      ${whereClause}

      GROUP BY c.status
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

    counts[row.status] =
      row.total;

    counts.ALL +=
      row.total;

  });

  return counts;

};




export const getFilteredCustomerCount = async (
  visibilityCondition: string,
  organizationId: number,
  visibleUsers: number[],
  filters?: {
    status?: string;
    search?: string;
  }
) => {
  const { conditions, params } = buildCustomerFilters(filters);

  params.unshift(organizationId);
  params.unshift(visibleUsers);

  const whereClause = `
    WHERE
      c.organization_id = $2
      AND ${visibilityCondition}
      ${
        conditions.length
          ? "AND " + shiftSqlParams(conditions, 2)
          : ""
      }
  `;

  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM customers c
      ${whereClause}
    `,
    params
  );

  return result.rows[0].total;
};