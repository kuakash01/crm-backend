import { pool } from "../../config/db";
import { AppError } from "../../shared/errors/AppError";
import { createActivity } from "../activities/activites.service";
import { validateAssignee, getVisibleUserIds } from "../users/users.service";
import { DealStage } from "./deals.types";
import { buildDealFilters, validateCustomerAndService, buildDealCounts } from "./deals.helper";


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
      assigned_to,
      notes
    } = data;

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
        organization_id,
        notes
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
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
        assigned_to ?? null,
        organizationId,
        notes ?? null
      ]
    );

    await createActivity(
      organizationId,
      "DEALS",
      result.rows[0].id,
      "CREATED",
      `Deal '${title}' created`,
      currentUserId,
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

export const getDeals = async (
  organizationId: number,
  currentUserId: number,
  role: string,
  filters?: {
    stage?: string;
    customerId?: number;
    serviceId?: number;
    search?: string;
  },
  canViewUnassigned = false
) => {

  try {


    let result;

    // ADMIN
    if (
      role.toLowerCase() === "admin"
    ) {
      const {
        conditions,
        params,
      } = buildDealFilters(
        filters,
        2
      );

      params.unshift(
        organizationId
      );

      result = await pool.query(
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
    d.organization_id = $1

    ${conditions.length
          ? "AND " +
          conditions.join(" AND ")
          : ""
        }

        ORDER BY
          d.created_at DESC
        `,
        params
      );

    }

    // NON ADMIN
    else {
      const {
        conditions,
        params,
      } = buildDealFilters(
        filters,
        3
      );

      const visibleUsers =
        await getVisibleUserIds(
          currentUserId
        );

      params.unshift(
        organizationId
      );

      params.unshift(
        visibleUsers
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

      result = await pool.query(
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

    ${conditions.length
          ? "AND " +
          conditions.join(" AND ")
          : ""
        }

        ORDER BY
          d.created_at DESC
        `,
        params
      );

    }

    const deals = result.rows;

    const counts =
      buildDealCounts(deals);

    return {
      deals,
      counts,
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
      assigned_to,
      notes
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
        notes = $7,
        updated_at = NOW()
      WHERE
        id = $8
        AND organization_id = $9
      RETURNING id
      `,
      [
        title,
        customer_id,
        service_id,
        price,
        expected_close_date ?? null,
        assigned_to ?? null,
        notes ?? null,
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

    await createActivity(
      organizationId,
      "DEALS",
      dealId,
      "UPDATED",
      "Deal updated",
      currentUserId,
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

    if (!result.rows.length) {
      throw new AppError(
        "Deal not found",
        404
      );
    }

    await createActivity(
      organizationId,
      "DEALS",
      dealId,
      "STAGE_CHANGED",
      `Deal stage updated to ${stage}`,
      currentUserId,
      client
    );

    /**
     * Future
     *
     * if(stage === "WON") {
     *    // Create project
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
  organizationId: number,
  currentUserId: number
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

    await createActivity(
      organizationId,
      "DEALS",
      dealId,
      "DELETED",
      `Deal '${result.rows[0].title}' deleted`,
      currentUserId,
      client
    );

    await client.query("COMMIT");

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

    // Validate assignee
    await validateAssignee(
      currentUserId,
      assignedTo,
      client
    );

    const result = await client.query(
      `
      UPDATE deals
      SET
        assigned_to = $1,
        updated_at = NOW()
      WHERE
        organization_id = $2
        AND id = ANY($3::int[])
      RETURNING id
      `,
      [
        assignedTo,
        organizationId,
        dealIds,
      ]
    );

    if (!result.rows.length) {

      throw new AppError(
        "Deal not found",
        404
      );

    }

    for (const deal of result.rows) {

      await createActivity(
        organizationId,
        "DEALS",
        deal.id,
        "ASSIGNED",
        "Deal reassigned",
        currentUserId,
        client
      );

    }

    await client.query("COMMIT");

    return {
      updatedCount:
        result.rowCount,
    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};