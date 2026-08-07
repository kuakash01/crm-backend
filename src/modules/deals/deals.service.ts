import { pool } from "../../config/db";
import { AppError } from "../../shared/errors/AppError";
import { createActivity, createActivities } from "../activities/activites.service";
import { validateAssignee, getVisibleUserIds } from "../users/users.service";
import { DealStage } from "./deals.types";
import { buildDealFilters, validateCustomerAndService, getDealCounts, getFilteredDealCounts } from "./deals.helper";
import { buildPagination } from "../../shared/helpers/pagination.helper";
import { shiftSqlParams } from "../../shared/helpers/sql.helper";
import { ActivityInput } from "../activities/activities.types";
import { deleteEntityRelations } from "../../shared/services/entity-relations.service";



export const createDeal = async (
  organizationId: number,
  currentUserId: number,
  data: any
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const {
      title,
      customer_id,
      service_id,
      stage,
      price,
      expected_close_date,

    } = data;

    await validateCustomerAndService(
      organizationId,
      customer_id,
      service_id,
      client
    );

    // Get the assigned_to of the customer
    const customerDetails = await client.query(
      `
      SELECT
        id,
        assigned_to
      FROM customers
      WHERE id = $1
      `,
      [customer_id]
    );
    const customer_assigned_to = customerDetails.rows[0].assigned_to;

    // Create deal
    const result = await client.query(
      `
      INSERT INTO deals (
        title,
        customer_id,
        service_id,
        stage,
        price,
        expected_close_date,
        assigned_to,
        organization_id
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      RETURNING *
      `,
      [
        title,
        customer_id,
        service_id,
        stage ?? "OPEN",
        price,
        expected_close_date ?? null,
        customer_assigned_to ?? currentUserId,
        organizationId,
      ]
    );

    await createActivities([
      {
        organizationId,
        entityType: "DEAL",
        entityId: result.rows[0].id,
        activityType: "CREATED",
        description: "Deal created",
        createdBy: currentUserId,
      },
    ], client);

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");
    console.error("Error creating deal:", error);

    throw error;

  } finally {

    client.release();

  }

};

export const getDeals = async (
  organizationId: number,
  currentUserId: number,
  filters?: {
    stage?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  canViewUnassigned = false
) => {

  try {

    const {
      conditions,
      params,
    } = buildDealFilters(filters);

    const {
      page,
      limit,
      offset,
    } = buildPagination(filters);

    const visibleUsers =
      await getVisibleUserIds(
        currentUserId
      );

    params.unshift(organizationId);
    params.unshift(visibleUsers);

    const visibilityCondition =
      canViewUnassigned
        ? `
      (
        d.assigned_to IS NULL
        OR d.assigned_to = ANY($1::int[])
      )
    `
        : `
      d.assigned_to = ANY($1::int[])
    `;

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

    const counts =
      await getDealCounts(
        visibilityCondition,
        organizationId,
        visibleUsers,
        filters
      );

    const total = await getFilteredDealCounts(
      visibilityCondition,
      organizationId,
      visibleUsers,
      filters
    );

    const queryParams = [
      ...params,
      limit,
      offset,
    ];

    const result =
      await pool.query(
        `
    SELECT
      d.*,

      CONCAT(
        c.fname,
        ' ',
        COALESCE(c.lname,'')
      ) AS customer_name,

      s.name AS service_name,

      u.fullname AS assigned_to_name

    FROM deals d

    INNER JOIN customers c
      ON c.id = d.customer_id

    INNER JOIN services s
      ON s.id = d.service_id

    LEFT JOIN users u
      ON u.id = d.assigned_to

    ${whereClause}

    ORDER BY
      d.created_at DESC

    LIMIT $${queryParams.length - 1}

    OFFSET $${queryParams.length}
    `,
        queryParams
      );

    return {

      deals: result.rows,

      counts,

      pagination: {

        page,

        limit,

        total: total,

        totalPages:
          Math.ceil(
            total / limit
          )

      }

    };
  } catch (error) {

    console.log(
      "Error fetching deals",
      error
    );

    throw new AppError(
      "Error fetching deals",
      500
    );

  }

};

export const getPipelineDeals = async (
  organizationId: number,
  currentUserId: number,
   canViewUnassigned: boolean
) => {
  try {

    const visibleUsers =
      await getVisibleUserIds(
        currentUserId
      );

    const visibilityCondition =
      canViewUnassigned
        ? `
      (
        d.assigned_to IS NULL
        OR d.assigned_to = ANY($1::int[])
      )
    `
        : `
      d.assigned_to = ANY($1::int[])
    `;

    const result =
      await pool.query(
        `
        SELECT
          d.*,

          CONCAT(
            c.fname,
            ' ',
            COALESCE(c.lname,'')
          ) AS customer_name,

          s.name AS service_name,

          u.fullname AS assigned_to_name

        FROM deals d

        INNER JOIN customers c
          ON c.id = d.customer_id

        INNER JOIN services s
          ON s.id = d.service_id

        LEFT JOIN users u
          ON u.id = d.assigned_to

        WHERE
          d.organization_id = $2
          AND ${visibilityCondition}

        ORDER BY
          d.updated_at DESC
        `,
        [
          visibleUsers,
          organizationId,
        ]
      );

    return result.rows;

  } catch (error) {

    console.log(
      "Error fetching pipeline deals",
      error
    );

    throw new AppError(
      "Error fetching pipeline deals",
      500
    );

  }
};

export const getDealById = async (
  dealId: number,
  organizationId: number,
  currentUserId: number,
  role: string,
  canViewUnassigned = false
) => {

  let result;

  // Admin can view all deals
  if (role.toLowerCase() === "admin") {

    result = await pool.query(
      `
      SELECT
        d.*,

        CONCAT(
          c.fname,
          ' ',
          COALESCE(c.lname, '')
        ) AS customer_name,

        s.name AS service_name,

        u.fullname AS assigned_to_name

      FROM deals d

      INNER JOIN customers c
        ON c.id = d.customer_id

      INNER JOIN services s
        ON s.id = d.service_id

      LEFT JOIN users u
        ON u.id = d.assigned_to

      WHERE
        d.id = $1
        AND d.organization_id = $2
      `,
      [
        dealId,
        organizationId
      ]
    );

  } else {

    const visibleUserIds =
      await getVisibleUserIds(currentUserId);

    const visibilityCondition =
      canViewUnassigned
        ? `
          (
            d.assigned_to IS NULL
            OR d.assigned_to = ANY($3::int[])
          )
        `
        : `
          d.assigned_to = ANY($3::int[])
        `;

    result = await pool.query(
      `
      SELECT
        d.*,

        CONCAT(
          c.fname,
          ' ',
          COALESCE(c.lname, '')
        ) AS customer_name,

        s.name AS service_name,

        u.fullname AS assigned_to_name

      FROM deals d

      INNER JOIN customers c
        ON c.id = d.customer_id

      INNER JOIN services s
        ON s.id = d.service_id

      LEFT JOIN users u
        ON u.id = d.assigned_to

      WHERE
        d.id = $1
        AND d.organization_id = $2
        AND ${visibilityCondition}
      `,
      [
        dealId,
        organizationId,
        visibleUserIds
      ]
    );

  }

  if (!result.rows.length) {
    throw new AppError(
      "Deal not found",
      404
    );
  }

  return result.rows[0];

};

export const updateDeal = async (
  dealId: number,
  organizationId: number,
  currentUserId: number,
  role: string,
  data: any
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const {
      title,
      customer_id,
      service_id,
      price,
      expected_close_date,
      assigned_to
    } = data;

    // Validate customer & service
    await validateCustomerAndService(
      organizationId,
      customer_id,
      service_id,
      client
    );

    // Validate assignee
    if (assigned_to) {
      await validateAssignee(
        currentUserId,
        assigned_to,
        client
      );
    }

    const updateResult = await client.query(
      `
      UPDATE deals
      SET
        title = $1,
        customer_id = $2,
        service_id = $3,
        price = $4,
        expected_close_date = $5,
        assigned_to = $6,
        updated_at = NOW()
      WHERE
        id = $7
        AND organization_id = $8
      RETURNING id
      `,
      [
        title,
        customer_id,
        service_id,
        price,
        expected_close_date ?? null,
        assigned_to ?? null,
        dealId,
        organizationId
      ]
    );

    if (!updateResult.rows.length) {
      throw new AppError(
        "Deal not found",
        404
      );
    }

    await createActivities(
      [
        {
          organizationId,
          entityType: "DEAL",
          entityId: dealId,
          activityType: "UPDATED",
          description: "Deal updated",
          createdBy: currentUserId,
        },
      ],
      client
    );

    await client.query("COMMIT");

    // Return the same DTO as GET /deals/:id
    return await getDealById(
      dealId,
      organizationId,
      currentUserId,
      role
    );

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

export const updateDealStage = async (
  dealId: number,
  organizationId: number,
  currentUserId: number,
  stage: DealStage
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const dealResult = await client.query(
      `
      SELECT stage
      FROM deals
      WHERE
        id = $1
        AND organization_id = $2
      `,
      [
        dealId,
        organizationId
      ]
    );

    if (!dealResult.rows.length) {
      throw new AppError(
        "Deal not found",
        404
      );
    }

    const oldStage =
      dealResult.rows[0].stage;

    if (oldStage === stage) {
      throw new AppError(
        "Deal is already in this stage",
        400
      );
    }

    const result = await client.query(
      `
      UPDATE deals
      SET
        stage = $1,
        updated_at = NOW()
      WHERE
        id = $2
        AND organization_id = $3
      RETURNING stage
      `,
      [
        stage,
        dealId,
        organizationId
      ]
    );

    await createActivities(
      [
        {
          organizationId,
          entityType: "DEAL",
          entityId: dealId,
          activityType: "STAGE_CHANGED",
          description: `Stage changed from ${oldStage} to ${stage}`,
          createdBy: currentUserId,
        },
      ],
      client
    );

    /**
     * Future
     *
     * if (stage === "WON") {
     *   // Create project
     * }
     */

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

export const deleteDeal = async (
  dealId: number,
  organizationId: number
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const result = await client.query(
      `
      DELETE
      FROM deals
      WHERE
        id = $1
        AND organization_id = $2
      RETURNING *
      `,
      [
        dealId,
        organizationId
      ]
    );

    if (!result.rows.length) {
      throw new AppError(
        "Deal not found",
        404
      );
    }

    await deleteEntityRelations(
      organizationId,
      "DEAL",
      dealId,
      client
    );

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

export const assignDeals = async (
  organizationId: number,
  currentUserId: number,
  dealIds: number[],
  assignedTo: number
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await validateAssignee(
      currentUserId,
      assignedTo,
      client
    );

    const assigneeResult = await client.query(
      `
      SELECT fullname
      FROM users
      WHERE id = $1
      `,
      [assignedTo]
    );

    if (!assigneeResult.rows.length) {
      throw new AppError(
        "Assignee not found",
        404
      );
    }

    const newAssigneeName =
      assigneeResult.rows[0].fullname;

    const dealsResult = await client.query(
      `
      SELECT
        d.id,
        d.assigned_to,
        u.fullname AS assigned_to_name
      FROM deals d
      LEFT JOIN users u
        ON u.id = d.assigned_to
      WHERE
        d.organization_id = $1
        AND d.id = ANY($2::int[])
      `,
      [
        organizationId,
        dealIds,
      ]
    );

    if (
      dealsResult.rows.length !==
      dealIds.length
    ) {
      throw new AppError(
        "One or more deals do not belong to your organization",
        403
      );
    }

    await client.query(
      `
      UPDATE deals
      SET
        assigned_to = $1,
        updated_at = NOW()
      WHERE
        organization_id = $2
        AND id = ANY($3::int[])
      `,
      [
        assignedTo,
        organizationId,
        dealIds,
      ]
    );

    const activities: ActivityInput[] =
      dealsResult.rows.map((deal) => ({
        organizationId,
        entityType: "DEAL",
        entityId: deal.id,
        activityType: "ASSIGNED",
        description:
          deal.assigned_to_name
            ? `Reassigned from ${deal.assigned_to_name} to ${newAssigneeName}`
            : `Assigned to ${newAssigneeName}`,
        createdBy: currentUserId,
      }));

    await createActivities(
      activities,
      client
    );

    await client.query("COMMIT");

    return {
      updatedCount: dealIds.length,
    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
};