import { pool } from "../../config/db";
import { AppError } from "../../shared/errors/AppError";
import { getVisibleUserIds, validateAssignee } from "../users/users.service";
import { createActivity } from "../activities/activites.service";
import { createCustomer } from "../customers/customers.service";
import { leadType } from "./leads.types";


export const getLeads = async (
  organizationId: number,
  currentUserId: number,
  role: string,
  filters?: {
    status?: string;
    search?: string;
  },
  canViewUnassigned = false
) => {

  try {

    const conditions: string[] = [];
    const params: any[] = [];

    // status filter
    if (
      filters?.status &&
      filters.status !== "ALL"
    ) {

      params.push(filters.status);

      conditions.push(
        `l.status = $${params.length}`
      );
    }

    // search filter
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

    let result;

    // ADMIN
    if (
      role.toLowerCase() ===
      "admin"
    ) {

      params.unshift(
        organizationId
      );

      result = await pool.query(
        `
        SELECT
          l.*,
          u.fullname AS assigned_to_name
        FROM leads l
        LEFT JOIN users u
          ON u.id = l.assigned_to
        WHERE
          l.organization_id = $1
          ${conditions.length
          ? "AND " +
          conditions
            .map(c =>
              c.replace(
                /\$(\d+)/g,
                (_, n) =>
                  `$${Number(n) + 1}`
              )
            )
            .join(" AND ")
          : ""
        }
        ORDER BY l.created_at DESC
        `,
        params
      );

    }

    // NON ADMIN
    else {
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
          ?
          `
(
  l.assigned_to IS NULL
  OR l.assigned_to = ANY($1::int[])
)
`
          :
          `
l.assigned_to = ANY($1::int[])
`;

      result = await pool.query(
        `
  SELECT
    l.*,
    u.fullname AS assigned_to_name
  FROM leads l
  LEFT JOIN users u
    ON u.id = l.assigned_to
  WHERE
    l.organization_id = $2
    AND ${visibilityCondition}
    ${conditions.length
          ? "AND " +
          conditions
            .map(c =>
              c.replace(
                /\$(\d+)/g,
                (_, n) =>
                  `$${Number(n) + 2}`
              )
            )
            .join(" AND ")
          : ""
        }
  ORDER BY
    l.created_at DESC
  `,
        params
      );
    }
    const leads = result.rows;

    const counts: Record<
      string,
      number
    > = {
      ALL: leads.length
    };

    leads.forEach(
      (lead: any) => {

        counts[lead.status] =
          (
            counts[
            lead.status
            ] || 0
          ) + 1;

      }
    );

    return {
      leads,
      counts
    };

  } catch (error) {

    console.log(
      "Error fetching leads",
      error
    );

    throw new AppError(
      "Error fetching leads",
      500
    );

  }

};

export const createLead = async (
  organizationId: number,
  userId: number,
  userName: string,
  lead: leadType
) => {
  try {
    const {
      fname,
      lname,
      email,
      phone1,
      phone2,
      company,
      source,
    } = lead;

    // 1. Corrected query to look up by email, and checking the leads table
    const checkEmail = await pool.query(
      `SELECT email FROM leads WHERE email = $1 AND organization_id = $2`,
      [email, organizationId]
    );

    // 2. Corrected truthy check using rows.length
    if (checkEmail.rows.length > 0) {
      throw new AppError("Email Already Exists", 409);
    }

    const query = `
      INSERT INTO leads(fname, lname, email, phone1, phone2, company, source, organization_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, fname, lname, email, company
    `;

    const values = [
      fname,
      lname,
      email,
      phone1,
      phone2?.trim() || null,
      company,
      source ?? "MANUAL",
      organizationId
    ];

    const result = await pool.query(query, values);

    // Optional: If createActivity is async, remember to await it if needed
    await createActivity(organizationId, "LEAD", result.rows[0].id, "CREATED", `New Lead Created by ${userName}`, userId);

    // Returning the single created object instead of the whole rows array is usually cleaner
    return result.rows[0];

  } catch (error) {
    console.error("Error in createLead service:", error);

    // 3. Re-throw operational errors so the controller can catch them properly
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Error Creating leads", 500);
  }
};

export const getLeadById = async (
  leadId: number,
  organizationId: number
) => {
  const result = await pool.query(
    `
   SELECT
    l.*,
    u.fullname AS assigned_to_name,
    c.id AS customer_id,
    (c.id IS NOT NULL) AS customer_created
FROM leads l
LEFT JOIN users u
    ON u.id = l.assigned_to
LEFT JOIN customers c
    ON c.lead_id = l.id
WHERE
    l.id = $1
    AND l.organization_id = $2;
    `,
    [leadId, organizationId]
  );

  if (!result.rows.length) {
    throw new AppError("Lead not found", 404);
  }

  return result.rows[0];
};

export const updateLeadDetails = async (
  leadId: number,
  userId: number,
  userName: string,
  organizationId: number,
  leadData: any
) => {
  const {
    fname,
    lname,
    email,
    phone1,
    phone2,
    company,
  } = leadData;

  const result = await pool.query(
    `
    UPDATE leads
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
      phone2 || null,
      company,
      leadId,
      organizationId,
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Lead not found",
      404
    );
  }
  await createActivity(organizationId, "LEAD", leadId, "UPDATED", `Lead Updated by ${userName}`, userId);

  return result.rows[0];
};

export const deleteLead = async (
  leadId: number,
  organizationId: number
) => {
  const result = await pool.query(
    `
    DELETE FROM leads
    WHERE id = $1
    AND organization_id = $2
    RETURNING id
    `,
    [leadId, organizationId]
  );

  if (!result.rows.length) {
    throw new AppError("Lead not found", 404);
  }

  return true;
};

export const assignLeads = async (
  currentUserId: number,
  userName: string,
  leadIds: number[],
  assignedTo: number
) => {

  if (!leadIds.length) {
    throw new AppError(
      "No leads selected",
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

  const leadsResult =
    await pool.query(
      `
      SELECT id
      FROM leads
      WHERE
        id = ANY($1::int[])
        AND organization_id = $2
      `,
      [
        leadIds,
        organizationId,
      ]
    );

  if (
    leadsResult.rows.length !==
    leadIds.length
  ) {
    throw new AppError(
      "One or more leads do not belong to your organization",
      403
    );
  }

  await pool.query(
    `
    UPDATE leads
    SET
      assigned_to = $1,
      updated_at = NOW()
    WHERE id = ANY($2::int[])
    `,
    [
      assignedTo,
      leadIds,
    ]
  );

  await createActivity(organizationId, "LEAD", leadIds, "ASSIGNED", `Lead Assigned By ${userName}`, currentUserId);

  return {
    assignedTo,
    totalAssigned:
      leadIds.length,
  };
};

export const updateLeadStatus = async (
  leadId: number,
  userId: number,
  userName: string,
  organizationId: number,
  status: string
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE leads
      SET
        status = $1,
        updated_at = NOW()
        ${status === "CONVERTED"
        ? ", converted_at = NOW()"
        : ""
      }
      WHERE
        id = $2
        AND organization_id = $3
      RETURNING *
      `,
      [
        status,
        leadId,
        organizationId
      ]
    );

    if (!result.rows.length) {

      throw new AppError(
        "Lead not found",
        404
      );

    }

    const customer = {
      fname: result.rows[0].fname,
      lname: result.rows[0].lname,
      email: result.rows[0].email,
      phone1: result.rows[0].phone1,
      phone2: result.rows[0].phone2,
      company: result.rows[0].company,
      assigned_to: result.rows[0].assigned_to,
      lead_id: result.rows[0].id
    }

    if (status === "CONVERTED") {
      await createCustomer(
        organizationId,
        userId,
        customer,
        client)
    }

    await createActivity(
      organizationId,
      "LEAD",
      result.rows[0].id,
      "STATUS_CHANGED",
      `Lead status updated to ${status} by ${userName}`,
      userId,
      client // pass transaction client
    );

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error: any) {

    await client.query("ROLLBACK");

    if (
      error.code === "23505" &&
      error.constraint === "fk_customers_lead_id"
    ) {
      throw new AppError(
        "Lead already converted to customer",
        400
      );
    }

    throw error;

  } finally {

    client.release();

  }

};
