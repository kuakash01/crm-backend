import { Pool, PoolClient } from "pg";
import { pool } from "../../config/db";
import { createActivity } from "../activities/activites.service";
import { AppError } from "../../shared/errors/AppError";
import { validateAssignee } from "../users/users.service";

export const createCustomer = async (
  organizationId: number,
  currentUserId: number,
  data: any,
  db: Pool | PoolClient = pool
) => {

  const {
    fname,
    lname,
    email,
    phone1,
    phone2,
    company,
    assigned_to,
    lead_id
  } = data;

  // Prevent duplicate customer creation from same lead
  if (lead_id) {

    const existingCustomer = await db.query(
      `
      SELECT id
      FROM customers
      WHERE lead_id = $1
      `,
      [lead_id]
    );

    if (existingCustomer.rows.length) {

      throw new AppError(
        "Customer already exists for this lead",
        400
      );

    }

  }

  const result = await db.query(
    `
    INSERT INTO customers(
      fname,
      lname,
      email,
      phone1,
      phone2,
      company,
      assigned_to,
      lead_id,
      organization_id
    )
    VALUES(
      $1,$2,$3,$4,$5,$6,$7,$8,$9
    )
    RETURNING *
    `,
    [
      fname,
      lname ?? null,
      email,
      phone1,
      phone2 ?? null,
      company ?? null,
      assigned_to ?? null,
      lead_id ?? null,
      organizationId
    ]
  );

  const customer = result.rows[0];

  await createActivity(
    organizationId,
    "CUSTOMER",
    customer.id,
    "CREATED",
    lead_id
      ? "Customer created from lead"
      : "Customer created manually",
    currentUserId,
    db
  );

  return customer;

};

export const getCustomers = async (
  organizationId: number
) => {

  const result = await pool.query(
    `
    SELECT
      c.*,
      u.fullname AS assigned_to_name
    FROM customers c
    LEFT JOIN users u
      ON u.id = c.assigned_to
    WHERE c.organization_id = $1
    ORDER BY c.created_at DESC
    `,
    [organizationId]
  );

  return result.rows;

};

export const getCustomerById = async (
  organizationId: number,
  customerId: number
) => {

  const result = await pool.query(
    `
    SELECT
      c.*,
      u.fullname AS assigned_to_name
    FROM customers c
    LEFT JOIN users u
      ON u.id = c.assigned_to
    WHERE
      c.id = $1
      AND c.organization_id = $2
    `,
    [
      customerId,
      organizationId
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Customer not found",
      404
    );
  }

  return result.rows[0];

};

export const updateCustomer = async (
  organizationId: number,
  customerId: number,
  currentUserId: number,
  data: any
) => {

  const {
    fname,
    lname,
    email,
    phone1,
    phone2,
    company
  } = data;

  const result = await pool.query(
    `
    UPDATE customers
    SET
      fname = $1,
      lname = $2,
      email = $3,
      phone1 = $4,
      phone2 = $5,
      company = $6,
      updated_at = NOW()
    WHERE
      id = $7
      AND organization_id = $8
    RETURNING *
    `,
    [
      fname,
      lname,
      email,
      phone1,
      phone2,
      company,
      customerId,
      organizationId
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Customer not found",
      404
    );
  }

  await createActivity(
    organizationId,
    "CUSTOMER",
    customerId,
    "UPDATED",
    "Customer updated",
    currentUserId
  );

  return result.rows[0];

};

export const updateCustomerStatus = async (
  organizationId: number,
  customerId: number,
  status: string,
  currentUserId: number
) => {

  const result = await pool.query(
    `
    UPDATE customers
    SET
      status = $1,
      updated_at = NOW()
    WHERE
      id = $2
      AND organization_id = $3
    RETURNING *
    `,
    [
      status,
      customerId,
      organizationId
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Customer not found",
      404
    );
  }

  await createActivity(
    organizationId,
    "CUSTOMER",
    customerId,
    "STATUS_CHANGED",
    `Customer status changed to ${status}`,
    currentUserId
  );

  return result.rows[0];

};

export const deleteCustomer = async (
  organizationId: number,
  customerId: number,
  currentUserId: number
) => {

  const result = await pool.query(
    `
    DELETE
    FROM customers
    WHERE
      id = $1
      AND organization_id = $2
    RETURNING *
    `,
    [
      customerId,
      organizationId
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Customer not found",
      404
    );
  }

  await createActivity(
    organizationId,
    "CUSTOMER",
    customerId,
    "DELETED",
    "Customer deleted",
    currentUserId
  );

  return result.rows[0];

};

export const assignCustomer = async (
  currentUserId: number,
  userName: string,
  customerIds: number[],
  assignedTo: number
) => {

  if (!customerIds.length) {
    throw new AppError(
      "No Customer selected",
      400
    );
  }

  const currentUserResult =
    await pool.query(
      `
      SELECT organization_id
      FROM users
      WHERE id = $1
      `,
      [currentUserId]
    );

  if (!currentUserResult.rows.length) {
    throw new AppError(
      "User not found",
      404
    );
  }

  const organizationId =
    currentUserResult.rows[0]
      .organization_id;

  await validateAssignee(
    currentUserId,
    assignedTo
  );

  const customerResult =
    await pool.query(
      `
      SELECT id
      FROM customers
      WHERE
        id = ANY($1::int[])
        AND organization_id = $2
      `,
      [
        customerIds,
        organizationId,
      ]
    );

  if (
    customerResult.rows.length !==
    customerIds.length
  ) {
    throw new AppError(
      "One or more customers do not belong to your organization",
      403
    );
  }

  await pool.query(
    `
    UPDATE customers
    SET
      assigned_to = $1,
      updated_at = NOW()
    WHERE id = ANY($2::int[])
    `,
    [
      assignedTo,
      customerIds,
    ]
  );

  await createActivity(organizationId, "CUSTOMER", customerIds, "ASSIGNED", `Customer Assigned By ${userName}`, currentUserId);

  return {
    assignedTo,
    totalAssigned:
      customerIds.length,
  };
};



export const getCustomerDeals = async (
  customerId: number,
  organizationId: number
) => {


  const customer = await pool.query(
    `
  SELECT id
  FROM customers
  WHERE
    id = $1
    AND organization_id = $2
  `,
    [
      customerId,
      organizationId
    ]
  );

  if (!customer.rows.length) {
    throw new AppError(
      "Customer not found",
      404
    );
  }

  const result = await pool.query(
    `
    SELECT
      d.*,

      s.name AS service_name,

      assigned.fullname AS assigned_to_name

    FROM deals d

    INNER JOIN services s
      ON s.id = d.service_id

    LEFT JOIN users assigned
      ON assigned.id = d.assigned_to

    WHERE
      d.customer_id = $1
      AND d.organization_id = $2

    ORDER BY
      d.created_at DESC
    `,
    [
      customerId,
      organizationId
    ]
  );

  return result.rows;

};