import { pool } from "../../config/db";
import { AppError } from "../../shared/errors/AppError";
import { getVisibleUserIds, validateAssignee } from "../users/users.service";
import { createActivities } from "../activities/activites.service";
import { createCustomer } from "../customers/customers.service";
import { leadType } from "./leads.types";
// helper
import { buildLeadFilters, getFilteredLeadCount, getLeadCounts } from "./leads.helper";
import { buildPagination } from "../../shared/helpers/pagination.helper";
import { shiftSqlParams } from "../../shared/helpers/sql.helper";
import { assertLeadEditable } from "./leads.helper";
import { ActivityInput } from "../activities/activities.types";
import { deleteEntityRelations } from "../../shared/services/entity-relations.service";
import { createNotifications } from "../notifications/notification.helper";

export const getLeads = async (
  organizationId: number,
  currentUserId: number,
  filters?: {
    status?: string;
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
    } =
      buildLeadFilters(filters);


    const {
      page,
      limit,
      offset,
    } =
      buildPagination(filters);


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
            l.assigned_to IS NULL
            OR l.assigned_to = ANY($1::int[])
          )
        `
        : `
          l.assigned_to = ANY($1::int[])
        `;

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

    const counts =
      await getLeadCounts(
        visibilityCondition,
        organizationId,
        visibleUsers,
        filters
      );

    const total = await getFilteredLeadCount(
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
          l.*,
          u.fullname AS assigned_to_name

        FROM leads l

        LEFT JOIN users u
          ON u.id = l.assigned_to

        ${whereClause}

        ORDER BY
          l.created_at DESC

        LIMIT $${queryParams.length - 1
        }

        OFFSET $${queryParams.length
        }
        `,
        queryParams
      );

    return {

      leads:
        result.rows,

      counts,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total /
            limit
          ),
      },

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

    const activity: ActivityInput = {
      organizationId,
      entityType: "LEAD",
      entityId: result.rows[0].id,
      activityType: "CREATED",
      description: "Lead created",
      createdBy: userId,
    }
    await createActivities([activity]);

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
    u.fullname AS assigned_to_name
FROM leads l
LEFT JOIN users u
    ON u.id = l.assigned_to
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
  organizationId: number,
  currentUserRole: string,
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

  // 1. Fetch lead
  const leadResult = await pool.query(
    `
    SELECT
      converted_at
    FROM leads
    WHERE
      id = $1
      AND organization_id = $2
    `,
    [leadId, organizationId]
  );

  if (!leadResult.rows.length) {
    throw new AppError(
      "Lead not found",
      404
    );
  }

  const lead = leadResult.rows[0];

  // 2. Business rule
  assertLeadEditable(
    lead,
    currentUserRole
  )

  // 3. Update
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

  // 4. Activity

  await createActivities(
    [
      {
        organizationId,
        entityType: "LEAD",
        entityId: leadId,
        activityType: "UPDATED",
        description: "Lead updated",
        createdBy: userId,
      },
    ]
  );

  return result.rows[0];
};

export const assignLeads = async (
  currentUserId: number,
  currentUserName: string,
  leadIds: number[],
  assignedTo: number
) => {
  if (!leadIds.length) {
    throw new AppError(
      "No leads selected",
      400
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentUserResult = await client.query(
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
      currentUserResult.rows[0].organization_id;

    await validateAssignee(
      currentUserId,
      assignedTo
    );

    const assigneeResult =
      await client.query(
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

    const leadsResult =
      await client.query(
        `
        SELECT
          l.id,
          l.assigned_to,
          u.fullname AS assigned_to_name
        FROM leads l
        LEFT JOIN users u
          ON u.id = l.assigned_to
        WHERE
          l.id = ANY($1::int[])
          AND l.organization_id = $2
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

    await client.query(
      `
      UPDATE leads
      SET
        assigned_to = $1,
        updated_at = NOW()
      WHERE
        id = ANY($2::int[])
      `,
      [
        assignedTo,
        leadIds,
      ]
    );

    const activities =
      leadsResult.rows.map((lead) => ({
        organizationId,
        entityType: "LEAD",
        entityId: lead.id,
        activityType: "ASSIGNED",
        description:
          lead.assigned_to_name
            ? `Reassigned from ${lead.assigned_to_name} to ${newAssigneeName}`
            : `Assigned to ${newAssigneeName}`,
        createdBy: currentUserId,
      }));

    await createActivities(
      activities,
      client
    );

    if (
      assignedTo &&
      assignedTo !== currentUserId
    ) {
      if (leadIds.length === 1) {
        const lead = leadsResult.rows[0];

        await createNotifications({
          organizationId,
          userIds: [assignedTo],
          type: "LEAD",
          action: "ASSIGNED",
          title: "Lead Assigned",
          message: `${currentUserName} assigned you a lead.`,
          entityType: "LEAD",
          entityId: lead.id,
        });
      } else {
        await createNotifications({
          organizationId,
          userIds: [assignedTo],
          type: "LEAD",
          action: "ASSIGNED",
          title: "Multiple Leads Assigned",
          message: `${currentUserName} assigned ${leadIds.length} leads to you.`,
          entityType: null,
          entityId: null,
        });
      }
    }

    await client.query("COMMIT");

    return {
      assignedTo,
      totalAssigned: leadIds.length,
    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
};

export const updateLeadStatus = async (
  leadId: number,
  userId: number,
  organizationId: number,
  status: string
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current lead
    const leadResult = await client.query(
      `
      SELECT *
      FROM leads
      WHERE
        id = $1
        AND organization_id = $2
      `,
      [leadId, organizationId]
    );

    if (!leadResult.rows.length) {
      throw new AppError("Lead not found", 404);
    }

    const lead = leadResult.rows[0];

    // Business rule:
    // Lead must be assigned before conversion
    if (
      status === "CONVERTED" &&
      !lead.assigned_to
    ) {
      throw new AppError(
        "Assign the lead before converting it.",
        400
      );
    }

    // Don't do anything if status hasn't changed
    if (lead.status === status) {
      await client.query("COMMIT");
      return lead;
    }

    // Update status
    const result = await client.query(
      `
      UPDATE leads
      SET
        status = $1,
        updated_at = NOW()
        ${
          status === "CONVERTED"
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
        organizationId,
      ]
    );

    const updatedLead = result.rows[0];

    const assignedUserId =
      updatedLead.assigned_to;

    /*
     * Create customer if converted
     */
    if (status === "CONVERTED") {
      await createCustomer(
        organizationId,
        userId,
        {
          fname: updatedLead.fname,
          lname: updatedLead.lname,
          email: updatedLead.email,
          phone1: updatedLead.phone1,
          phone2: updatedLead.phone2,
          company: updatedLead.company,
          assigned_to:
            updatedLead.assigned_to,
          lead_id: updatedLead.id,
        },
        client
      );
    }

    /*
     * Lead status notification
     *
     * Only notify the assigned user
     * when they are not the person who
     * performed the action.
     */
    if (
      assignedUserId &&
      assignedUserId !== userId
    ) {
      let notificationAction:
        | "STATUS_CHANGED"
        | "CONVERTED"
        | "LOST";

      let title: string;
      let message: string;

      if (status === "CONVERTED") {
        notificationAction =
          "CONVERTED";

        title = "Lead Converted";

        message =
          `Lead '${updatedLead.fname} ${updatedLead.lname}' was converted to a customer.`;
      } else if (status === "LOST") {
        notificationAction = "LOST";

        title = "Lead Lost";

        message =
          `Lead '${updatedLead.fname} ${updatedLead.lname}' was marked as lost.`;
      } else {
        notificationAction =
          "STATUS_CHANGED";

        title = "Lead Status Changed";

        message =
          `Lead '${updatedLead.fname} ${updatedLead.lname}' status changed from ${lead.status} to ${updatedLead.status}.`;
      }

      await createNotifications({
        organizationId,
        userIds: [assignedUserId],
        type: "LEAD",
        action: notificationAction,
        title,
        message,
        entityType: "LEAD",
        entityId: updatedLead.id,
      });
    }

    /*
     * Activity log
     */
    const activity: ActivityInput = {
      organizationId,
      entityType: "LEAD",
      entityId: updatedLead.id,
      activityType: "STATUS_CHANGED",
      description:
        `Status changed from ${lead.status} to ${updatedLead.status}`,
      createdBy: userId,
    };

    await createActivities(
      [activity],
      client
    );

    await client.query("COMMIT");

    return updatedLead;
  } catch (error: any) {
    await client.query("ROLLBACK");

    if (
      error.code === "23505" &&
      error.constraint ===
        "fk_customers_lead_id"
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

export const deleteLead = async (
  leadId: number,
  organizationId: number
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await deleteEntityRelations(
      organizationId,
      "LEAD",
      leadId,
      client
    );

    const result = await client.query(
      `
      DELETE FROM leads
      WHERE
        id = $1
        AND organization_id = $2
      RETURNING id
      `,
      [leadId, organizationId]
    );

    if (!result.rows.length) {
      throw new AppError(
        "Lead not found",
        404
      );
    }

    await client.query("COMMIT");

    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


export const getLeadOptions = async (
  organizationId: number,
  currentUserId: number,
  filters?: {
    search?: string;
    page?: number;
    limit?: number;
  },
  canViewUnassigned = false
) => {
  try {
    const {
      page,
      limit,
      offset,
    } = buildPagination(filters);

    const visibleUsers =
      await getVisibleUserIds(
        currentUserId
      );

    const params: any[] = [
      visibleUsers,
      organizationId,
    ];

    const visibilityCondition =
      canViewUnassigned
        ? `
          (
            l.assigned_to IS NULL
            OR l.assigned_to = ANY($1::int[])
          )
        `
        : `
          l.assigned_to = ANY($1::int[])
        `;

    let whereClause = `
      WHERE
        l.organization_id = $2
        AND ${visibilityCondition}
    `;

    if (filters?.search?.trim()) {
      params.push(
        `%${filters.search.trim()}%`
      );

      whereClause += `
        AND (
          CONCAT(
            l.fname,
            ' ',
            COALESCE(l.lname, '')
          ) ILIKE $${params.length}

          OR l.company ILIKE $${params.length}

          OR l.email ILIKE $${params.length}

          OR l.phone1 ILIKE $${params.length}
        )
      `;
    }

    // Total
    const countResult =
      await pool.query(
        `
        SELECT
          COUNT(*)::int AS total

        FROM leads l

        ${whereClause}
        `,
        params
      );

    const total =
      countResult.rows[0].total;

    // Pagination
    params.push(limit);
    params.push(offset);

    const result =
      await pool.query(
        `
        SELECT
          l.id,
          l.fname,
          l.lname,
          l.company,
          l.email,
          l.phone1,
          l.assigned_to,
          u.fullname AS assigned_to_name

        FROM leads l
        LEFT JOIN users u
        ON u.id = l.assigned_to

        ${whereClause}

        ORDER BY
          l.created_at DESC

        LIMIT $${params.length - 1}
        OFFSET $${params.length}
        `,
        params
      );

    return {
      leads: result.rows,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    };
  } catch (error) {
    console.log(
      "Error fetching lead options",
      error
    );

    throw new AppError(
      "Error fetching lead options",
      500
    );
  }
};