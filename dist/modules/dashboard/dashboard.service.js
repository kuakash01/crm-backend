"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const db_1 = require("../../config/db");
const users_service_1 = require("../users/users.service");
const emptyPipeline = {
    OPEN: 0,
    QUOTATION_SENT: 0,
    NEGOTIATION: 0,
    WON: 0,
    LOST: 0,
};
const roundMetric = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));
const rate = (numerator, denominator) => denominator === 0 ? 0 : (numerator / denominator) * 100;
const changePercent = (current, previous) => {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }
    return Math.round(((current - previous) / previous) * 100);
};
const getDashboardStats = async (organizationId, currentUserId, canViewUnassigned) => {
    const visibleUsers = await (0, users_service_1.getVisibleUserIds)(currentUserId);
    const visibilityCondition = canViewUnassigned
        ? `
      (
        assigned_to = ANY($2::int[])
        OR assigned_to IS NULL
      )
    `
        : `
      assigned_to = ANY($2::int[])
    `;
    const params = [organizationId, visibleUsers];
    const result = await db_1.pool.query(`
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
        SELECT COALESCE(SUM(price), 0)
        FROM deals
        WHERE
          organization_id = $1
          AND stage = 'WON'
          AND ${visibilityCondition}
      ) AS total_revenue
    `, params);
    const stats = result.rows[0];
    const pipelineResult = await db_1.pool.query(`
    SELECT
      stage,
      COUNT(*)::int AS total
    FROM deals
    WHERE
      organization_id = $1
      AND ${visibilityCondition}
    GROUP BY stage
    `, params);
    const pipeline = { ...emptyPipeline };
    pipelineResult.rows.forEach((row) => {
        pipeline[row.stage] = Number(row.total);
    });
    const todayTasksResult = await db_1.pool.query(`
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
    `, params);
    const recentActivitiesResult = await db_1.pool.query(`
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
    `, [organizationId]);
    const revenueChartResult = await db_1.pool.query(`
    WITH months AS (
      SELECT DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval AS month_date
      FROM generate_series(0, 11) AS n
    )
    SELECT
      TO_CHAR(m.month_date, 'Mon') AS month,
      COALESCE(SUM(d.price), 0)::numeric AS revenue
    FROM months m
    LEFT JOIN deals d
      ON DATE_TRUNC('month', d.updated_at) = m.month_date
      AND d.organization_id = $1
      AND d.stage = 'WON'
      AND ${visibilityCondition.replaceAll("assigned_to", "d.assigned_to")}
    GROUP BY m.month_date
    ORDER BY m.month_date
    `, params);
    const conversionResult = await db_1.pool.query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM leads
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
          AND created_at >= NOW() - INTERVAL '30 days'
      ) AS leads_current,

      (
        SELECT COUNT(*)
        FROM leads
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
          AND converted_at IS NOT NULL
          AND converted_at >= NOW() - INTERVAL '30 days'
      ) AS converted_current,

      (
        SELECT COUNT(*)
        FROM leads
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
          AND created_at >= NOW() - INTERVAL '60 days'
          AND created_at < NOW() - INTERVAL '30 days'
      ) AS leads_previous,

      (
        SELECT COUNT(*)
        FROM leads
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
          AND converted_at IS NOT NULL
          AND converted_at >= NOW() - INTERVAL '60 days'
          AND converted_at < NOW() - INTERVAL '30 days'
      ) AS converted_previous,

      (
        SELECT COALESCE(AVG(price), 0)
        FROM deals
        WHERE
          organization_id = $1
          AND stage = 'WON'
          AND ${visibilityCondition}
          AND updated_at >= NOW() - INTERVAL '30 days'
      ) AS avg_deal_current,

      (
        SELECT COALESCE(AVG(price), 0)
        FROM deals
        WHERE
          organization_id = $1
          AND stage = 'WON'
          AND ${visibilityCondition}
          AND updated_at >= NOW() - INTERVAL '60 days'
          AND updated_at < NOW() - INTERVAL '30 days'
      ) AS avg_deal_previous,

      (
        SELECT COUNT(*)
        FROM deals
        WHERE
          organization_id = $1
          AND stage = 'WON'
          AND ${visibilityCondition}
          AND updated_at >= NOW() - INTERVAL '30 days'
      ) AS won_current,

      (
        SELECT COUNT(*)
        FROM deals
        WHERE
          organization_id = $1
          AND stage = 'WON'
          AND ${visibilityCondition}
          AND updated_at >= NOW() - INTERVAL '60 days'
          AND updated_at < NOW() - INTERVAL '30 days'
      ) AS won_previous,

      (
        SELECT COUNT(*)
        FROM customers
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
      ) AS customers_total,

      (
        SELECT COUNT(*)
        FROM customers
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
          AND status = 'ACTIVE'
      ) AS customers_active,

      (
        SELECT COUNT(*)
        FROM customers
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
          AND created_at < NOW() - INTERVAL '30 days'
      ) AS customers_total_previous,

      (
        SELECT COUNT(*)
        FROM customers
        WHERE
          organization_id = $1
          AND ${visibilityCondition}
          AND created_at < NOW() - INTERVAL '30 days'
          AND status = 'ACTIVE'
      ) AS customers_active_previous
    `, params);
    const conversion = conversionResult.rows[0];
    const conversionMetrics = [
        {
            label: "Conversion Rate",
            current: roundMetric(rate(Number(conversion.converted_current), Number(conversion.leads_current))),
            previous: roundMetric(rate(Number(conversion.converted_previous), Number(conversion.leads_previous))),
            unit: "%",
            isPercentage: true,
        },
        {
            label: "Avg Deal Value",
            current: Math.round(Number(conversion.avg_deal_current) || 0),
            previous: Math.round(Number(conversion.avg_deal_previous) || 0),
            unit: "₹",
        },
        {
            label: "Sales Velocity",
            current: Number(conversion.won_current) || 0,
            previous: Number(conversion.won_previous) || 0,
            unit: "deals/mo",
        },
        {
            label: "Customer Retention",
            current: roundMetric(rate(Number(conversion.customers_active), Number(conversion.customers_total))),
            previous: roundMetric(rate(Number(conversion.customers_active_previous), Number(conversion.customers_total_previous))),
            unit: "%",
            isPercentage: true,
        },
    ];
    const topLeadsResult = await db_1.pool.query(`
    SELECT
      l.id,
      TRIM(CONCAT(l.fname, ' ', COALESCE(l.lname, ''))) AS name,
      'Won value' AS metric,
      COALESCE(SUM(d.price) FILTER (WHERE d.stage = 'WON'), 0)::numeric AS value,
      COALESCE(
        SUM(d.price) FILTER (
          WHERE d.stage = 'WON'
            AND d.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
        ),
        0
      )::numeric AS this_month,
      COALESCE(
        SUM(d.price) FILTER (
          WHERE d.stage = 'WON'
            AND d.updated_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
            AND d.updated_at < DATE_TRUNC('month', CURRENT_DATE)
        ),
        0
      )::numeric AS last_month
    FROM leads l
    LEFT JOIN customers c
      ON c.lead_id = l.id
      AND c.organization_id = l.organization_id
    LEFT JOIN deals d
      ON d.customer_id = c.id
      AND d.organization_id = l.organization_id
    WHERE
      l.organization_id = $1
      AND ${visibilityCondition.replaceAll("assigned_to", "l.assigned_to")}
    GROUP BY l.id
    ORDER BY value DESC, l.created_at DESC
    LIMIT 5
    `, params);
    const topCustomersResult = await db_1.pool.query(`
    SELECT
      c.id,
      TRIM(CONCAT(c.fname, ' ', COALESCE(c.lname, ''))) AS name,
      'Lifetime Value' AS metric,
      COALESCE(SUM(d.price) FILTER (WHERE d.stage = 'WON'), 0)::numeric AS value,
      COALESCE(
        SUM(d.price) FILTER (
          WHERE d.stage = 'WON'
            AND d.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
        ),
        0
      )::numeric AS this_month,
      COALESCE(
        SUM(d.price) FILTER (
          WHERE d.stage = 'WON'
            AND d.updated_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
            AND d.updated_at < DATE_TRUNC('month', CURRENT_DATE)
        ),
        0
      )::numeric AS last_month
    FROM customers c
    LEFT JOIN deals d
      ON d.customer_id = c.id
      AND d.organization_id = c.organization_id
    WHERE
      c.organization_id = $1
      AND ${visibilityCondition.replaceAll("assigned_to", "c.assigned_to")}
    GROUP BY c.id
    ORDER BY value DESC, c.created_at DESC
    LIMIT 5
    `, params);
    const mapPerformer = (row) => ({
        id: row.id,
        name: row.name,
        metric: row.metric,
        value: Number(row.value) || 0,
        change: changePercent(Number(row.this_month) || 0, Number(row.last_month) || 0),
    });
    return {
        stats: {
            totalLeads: Number(stats.total_leads),
            totalCustomers: Number(stats.total_customers),
            totalDeals: Number(stats.total_deals),
            totalRevenue: Number(stats.total_revenue),
        },
        pipeline,
        todayTasks: todayTasksResult.rows,
        recentActivities: recentActivitiesResult.rows,
        revenueChart: revenueChartResult.rows.map((row) => ({
            month: row.month,
            revenue: Number(row.revenue) || 0,
        })),
        conversionMetrics,
        topLeads: topLeadsResult.rows.map(mapPerformer),
        topCustomers: topCustomersResult.rows.map(mapPerformer),
    };
};
exports.getDashboardStats = getDashboardStats;
