import { pool } from "../../config/db";
import { createActivity } from "../activities/activites.service";
import { AppError } from "../../shared/errors/AppError";

export const createService = async (
  organizationId: number,
  currentUserId: number,
  data: any
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const {
      name,
      description,
      base_price
    } = data;

    const result = await client.query(
      `
      INSERT INTO services(
        name,
        description,
        base_price,
        organization_id
      )
      VALUES(
        $1,$2,$3,$4
      )
      RETURNING *
      `,
      [
        name,
        description ?? null,
        base_price,
        organizationId
      ]
    );

    // await createActivity(
    //   organizationId,
    //   "SERVICES",
    //   result.rows[0].id,
    //   "CREATED",
    //   `Service '${name}' created`,
    //   currentUserId,
    //   client
    // );

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }

};

export const getServices = async (
  organizationId: number,
  includeInactive = false
) => {

  const result = await pool.query(
    `
    SELECT *
    FROM services
    WHERE
      organization_id = $1
      ${includeInactive
      ? ""
      : "AND is_active = TRUE"
    }
    ORDER BY
      name
    `,
    [organizationId]
  );

  return result.rows;

};

export const getServiceById = async (
  serviceId: number,
  organizationId: number
) => {

  const result = await pool.query(
    `
    SELECT *
    FROM services
    WHERE
      id = $1
      AND organization_id = $2
    `,
    [
      serviceId,
      organizationId
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Service not found",
      404
    );
  }

  return result.rows[0];

};

export const updateService = async (
  serviceId: number,
  organizationId: number,
  currentUserId: number,
  data: any
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const {
      name,
      description,
      base_price,
      is_active
    } = data;

    const result = await client.query(
      `
      UPDATE services
      SET
        name = $1,
        description = $2,
        base_price = $3,
        is_active = $4,
        updated_at = NOW()
      WHERE
        id = $5
        AND organization_id = $6
      RETURNING *
      `,
      [
        name,
        description ?? null,
        base_price,
        is_active,
        serviceId,
        organizationId
      ]
    );

    if (!result.rows.length) {
      throw new AppError(
        "Service not found",
        404
      );
    }

    // await createActivity(
    //   organizationId,
    //   "SERVICE",
    //   serviceId,
    //   "UPDATED",
    //   "Service updated",
    //   currentUserId,
    //   client
    // );

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }

};

export const deleteService = async (
  serviceId: number,
  organizationId: number,
  currentUserId: number
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const dealResult = await client.query(
      `
      SELECT 1
      FROM deals
      WHERE
        service_id = $1
      LIMIT 1
      `,
      [serviceId]
    );

    if (dealResult.rows.length) {
      throw new AppError(
        "This service is used by existing deals. Deactivate it instead.",
        400
      );
    }

    const result = await client.query(
      `
      DELETE
      FROM services
      WHERE
        id = $1
        AND organization_id = $2
      RETURNING *
      `,
      [
        serviceId,
        organizationId
      ]
    );

    if (!result.rows.length) {
      throw new AppError(
        "Service not found",
        404
      );
    }

    // await createActivity(
    //   organizationId,
    //   "SERVICE",
    //   serviceId,
    //   "DELETED",
    //   `Service '${result.rows[0].name}' deleted`,
    //   currentUserId,
    //   client
    // );

    await client.query("COMMIT");

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }

};
