import { pool } from "../../config/db";
import { shiftSqlParams } from "../../shared/helpers/sql.helper";
import { AppError } from "../../shared/errors/AppError";

export const buildLeadFilters = (
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
      `l.status = $${params.length}`
    );

  }

  if (filters?.search) {

    params.push(
      `%${filters.search}%`
    );

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

export const getLeadCounts = async (
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
  } = buildLeadFilters(
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
      l.organization_id = $2
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
        l.status,
        COUNT(*)::int AS total
      FROM leads l

      ${whereClause}

      GROUP BY l.status
      `,
      params
    );

  const counts: Record<
    string,
    number
  > = {
    ALL: 0,
  };

  result.rows.forEach(
    row => {

      counts[row.status] =
        row.total;

      counts.ALL +=
        row.total;

    }
  );

  return counts;

};



export const getFilteredLeadCount = async (
  visibilityCondition: string,
  organizationId: number,
  visibleUsers: number[],
  filters?: {
    status?: string;
    search?: string;
  }
) => {
  const { conditions, params } = buildLeadFilters(filters);

  params.unshift(organizationId);
  params.unshift(visibleUsers);

  const whereClause = `
    WHERE
      l.organization_id = $2
      AND ${visibilityCondition}
      ${conditions.length
      ? "AND " + shiftSqlParams(conditions, 2)
      : ""
    }
  `;

  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM leads l
      ${whereClause}
    `,
    params
  );

  return result.rows[0].total;
};


export const assertLeadEditable = (
  lead: { converted_at: Date },
  currentUserRole: string
) => {
  if (
    lead.converted_at &&
    currentUserRole !== "admin"
  ) {
    throw new AppError(
      "Converted leads cannot be edited.",
      403
    );
  }
};