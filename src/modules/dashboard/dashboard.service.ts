import { pool } from "../../config/db";
import { getVisibleUserIds } from "../users/users.service";

export const getDashboardStats = async (
  organizationId: number,
  currentUserId: number,
  canViewUnassigned: boolean
) => {

  const visibleUsers =
    await getVisibleUserIds(
      currentUserId
    );

  const visibilityCondition =
    canViewUnassigned
      ? `
      (
        assigned_to = ANY($2::int[])
        OR assigned_to IS NULL
      )
    `
      : `
      assigned_to = ANY($2::int[])
    `;

  const result = await pool.query(
    `
    SELECT

      (
        SELECT COUNT(*)
        FROM leads
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
      ) AS total_leads,

      (
        SELECT COUNT(*)
        FROM customers
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
      ) AS total_customers,

      (
        SELECT COUNT(*)
        FROM deals
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
      ) AS total_deals,

      (
        SELECT
          COALESCE(
            SUM(price),
            0
          )
        FROM deals
        WHERE
          organization_id = $1
          AND stage = 'WON'
          AND ${visibilityCondition}
      ) AS total_revenue
    `,
    [
      organizationId,
      visibleUsers,
    ]
  );

  const stats = result.rows[0];

  // Pipeline summary
  const pipelineResult = await pool.query(
    `
  SELECT
    stage,
    COUNT(*)::int AS total
  FROM deals
  WHERE
    organization_id = $1
    AND ${visibilityCondition}
  GROUP BY stage
  `,
    [
      organizationId,
      visibleUsers,
    ]
  );

  const pipeline = {
    OPEN: 0,
    QUOTATION_SENT: 0,
    NEGOTIATION: 0,
    WON: 0,
    LOST: 0,
  };

  pipelineResult.rows.forEach((row) => {
    pipeline[
      row.stage as keyof typeof pipeline
    ] = Number(row.total);
  });

  // Fetch today's tasks
  const todayTasksResult = await pool.query(
    `
  SELECT
    t.id,
    t.title,
    t.description,
    t.entity_type,
    t.entity_id,
    t.due_date,
    t.status,

    u.fullname AS assigned_to_name

  FROM tasks t

  LEFT JOIN users u
    ON u.id = t.assigned_to

  WHERE
    t.organization_id = $1
    AND t.assigned_to = ANY($2::int[])
    AND t.status = 'PENDING'
    AND DATE(t.due_date) = CURRENT_DATE

  ORDER BY
    t.due_date ASC,
    t.created_at DESC

  LIMIT 5
  `,
    [
      organizationId,
      visibleUsers,
    ]
  );

  // recently activities
  const recentActivitiesResult = await pool.query(
    `
  SELECT
    a.id,
    a.activity_type,
    a.description,
    a.entity_type,
    a.entity_id,
    a.created_at,

    u.fullname AS created_by_name

  FROM activities a

  LEFT JOIN users u
    ON u.id = a.created_by

  WHERE
    a.organization_id = $1

  ORDER BY
    a.created_at DESC

  LIMIT 5
  `,
    [organizationId]
  );

  // revenue chart data
  const revenueChartResult = await pool.query(
    `
  SELECT
   DATE_TRUNC('month', updated_at) AS month_date,

    TO_CHAR(
      DATE_TRUNC('month', updated_at),
      'Mon'
    ) AS month,

    COALESCE(
      SUM(price),
      0
    )::numeric AS revenue

  FROM deals

  WHERE
    organization_id = $1
    AND stage = 'WON'
    AND ${visibilityCondition}

  GROUP BY
    DATE_TRUNC('month', updated_at)

  ORDER BY
    month_date
  `,
    [
      organizationId,
      visibleUsers,
    ]
  );

  return {
    stats: {
      totalLeads: Number(
        stats.total_leads
      ),
      totalCustomers: Number(
        stats.total_customers
      ),
      totalDeals: Number(
        stats.total_deals
      ),
      totalRevenue: Number(
        stats.total_revenue
      ),
    },
    pipeline,
    todayTasks:
      todayTasksResult.rows,
    recentActivities:
      recentActivitiesResult.rows,
    revenueChart: revenueChartResult.rows,
  };
};