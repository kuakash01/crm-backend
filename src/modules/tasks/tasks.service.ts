import { pool } from "../../config/db";
import { createActivities } from "../activities/activites.service";
import { AppError } from "../../shared/errors/AppError";
import { getVisibleUserIds } from "../users/users.service"
import {
  buildPagination,
  buildPaginationResponse
} from "../../shared/helpers/pagination.helper";
import { ActivityInput } from "../activities/activities.types";
import { createNotifications } from "../notifications/notification.helper";

export interface GetAllTasksParams {
  organizationId: number;
  currentUserId: number;

  page: number;
  limit: number;

  search?: string;

  status?: "PENDING" | "COMPLETED";

  entityType?:
  | "LEAD"
  | "CUSTOMER"
  | "DEAL"
  | "GENERAL";
  entityId?: number;

  priority?:
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";
}

export const getAllTasksService = async ({
  organizationId,
  currentUserId,
  page,
  limit,
  search = "",
  status,
  entityType,
  entityId,
  priority,
}: GetAllTasksParams) => {
  const {
    page: currentPage,
    limit: currentLimit,
    offset,
  } = buildPagination({
    page,
    limit,
  });

  const visibleUsers =
    await getVisibleUserIds(currentUserId);

  const values: any[] = [
    organizationId,
    visibleUsers,
  ];

  let index = 3;

  let where = `
    t.organization_id = $1
    AND t.assigned_to = ANY($2::int[])
  `;

  /*
   * Search
   */
  if (search.trim()) {
    where += `
      AND (
        t.title ILIKE $${index}
        OR COALESCE(t.description, '') ILIKE $${index}
        OR u.fullname ILIKE $${index}
        OR COALESCE(l.company, '') ILIKE $${index}
        OR COALESCE(c.company, '') ILIKE $${index}
        OR COALESCE(d.title, '') ILIKE $${index}
      )
    `;

    values.push(`%${search.trim()}%`);
    index++;
  }

  /*
   * Status filter
   */
  if (status) {
    where += `
      AND t.status = $${index}
    `;

    values.push(status);
    index++;
  }

  /*
   * Entity filter
   */
  if (entityType) {
    if (entityType === "GENERAL") {
      where += `
        AND t.entity_type IS NULL
      `;
    } else {
      where += `
        AND t.entity_type = $${index}
      `;

      values.push(entityType);
      index++;
    }
  }

  /*
   * Specific entity filter
   *
   * Used by module task tabs.
   */
  if (entityId !== undefined) {
    where += `
      AND t.entity_id = $${index}
    `;

    values.push(entityId);
    index++;
  }

  /*
   * Priority filter
   */
  if (priority) {
    where += `
      AND t.priority = $${index}
    `;

    values.push(priority);
    index++;
  }

  /*
   * Total filtered records
   */
  const totalResult = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total

    FROM tasks t

    LEFT JOIN users u
      ON u.id = t.assigned_to

    LEFT JOIN leads l
      ON l.id = t.entity_id
      AND t.entity_type = 'LEAD'

    LEFT JOIN customers c
      ON c.id = t.entity_id
      AND t.entity_type = 'CUSTOMER'

    LEFT JOIN deals d
      ON d.id = t.entity_id
      AND t.entity_type = 'DEAL'

    WHERE ${where}
    `,
    values
  );

  /*
   * Overall counts
   *
   * Ignore search/status/priority,
   * but respect module context.
   */
  const countValues: any[] = [
    organizationId,
    visibleUsers,
  ];

  let countIndex = 3;

  let countWhere = `
    t.organization_id = $1
    AND t.assigned_to = ANY($2::int[])
  `;

  if (entityType) {
    if (entityType === "GENERAL") {
      countWhere += `
        AND t.entity_type IS NULL
      `;
    } else {
      countWhere += `
        AND t.entity_type = $${countIndex}
      `;

      countValues.push(entityType);
      countIndex++;
    }
  }

  if (entityId !== undefined) {
    countWhere += `
      AND t.entity_id = $${countIndex}
    `;

    countValues.push(entityId);
    countIndex++;
  }

  const countsResult = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total,

      COUNT(*) FILTER (
        WHERE t.status = 'PENDING'
      )::int AS pending,

      COUNT(*) FILTER (
        WHERE t.status = 'COMPLETED'
      )::int AS completed

    FROM tasks t

    WHERE ${countWhere}
    `,
    countValues
  );

  const counts = countsResult.rows[0];

  /*
   * Task list
   */
  const queryParams = [
    ...values,
    currentLimit,
    offset,
  ];

  const tasksResult = await pool.query(
    `
    SELECT
      t.id,
      t.title,
      t.status,
      t.priority,
      t.due_date,

      u.fullname AS assigned_to_name

    FROM tasks t

    LEFT JOIN users u
      ON u.id = t.assigned_to

    LEFT JOIN leads l
      ON l.id = t.entity_id
      AND t.entity_type = 'LEAD'

    LEFT JOIN customers c
      ON c.id = t.entity_id
      AND t.entity_type = 'CUSTOMER'

    LEFT JOIN deals d
      ON d.id = t.entity_id
      AND t.entity_type = 'DEAL'

    WHERE ${where}

    ORDER BY
      t.created_at DESC

    LIMIT $${queryParams.length - 1}
    OFFSET $${queryParams.length}
    `,
    queryParams
  );

  const total = totalResult.rows[0].total;

  return {
    tasks: tasksResult.rows,

    counts,

    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(
        total / currentLimit
      ),
    },
  };
};

export const createTask = async (
  organizationId: number,
  currentUserId: number,
  data: {
    entity_type?:
    | "LEAD"
    | "CUSTOMER"
    | "DEAL"
    | null;

    entity_id?: number | null;

    title: string;

    description?: string | null;

    due_date?: string | null;

    priority?:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "URGENT";

    assigned_to: number;
  }
) => {
  const {
    entity_type,
    entity_id,
    title,
    description,
    due_date,
    priority = "NORMAL",
    assigned_to,
  } = data;

  if (
    (entity_type && !entity_id) ||
    (!entity_type && entity_id)
  ) {
    throw new AppError(
      "Both entity type and entity ID are required for a related task.",
      400
    );
  }

  const result = await pool.query(
    `
    INSERT INTO tasks (
      organization_id,
      entity_type,
      entity_id,
      title,
      description,
      due_date,
      status,
      priority,
      assigned_to,
      created_by
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'PENDING',
      $7,
      $8,
      $9
    )
    RETURNING *
    `,
    [
      organizationId,
      entity_type ?? null,
      entity_id ?? null,
      title,
      description ?? null,
      due_date ?? null,
      priority,
      assigned_to,
      currentUserId,
    ]
  );

  const task = result.rows[0];

  // Create activity only when the task is
  // related to a CRM record.
  if (entity_type && entity_id) {
    const activity: ActivityInput = {
      organizationId,
      entityType: entity_type,
      entityId: entity_id,
      activityType: "TASK_CREATED",
      description: `Task '${title}' created`,
      createdBy: currentUserId,
    };

    await createActivities([activity]);
  }

  // Notify assignee if task was assigned
  // to someone other than the creator.
  if (assigned_to !== currentUserId) {
    await createNotifications({
      organizationId,
      userIds: [assigned_to],
      type: "TASK",
      action: "ASSIGNED",
      title: "Task Assigned",
      message: `A new task "${title}" was assigned to you.`,
      entityType: entity_type ?? null,
      entityId: entity_id ?? null,
    });
  }

  return task;
};

export const getTaskById = async (
  organizationId: number,
  taskId: number
) => {
  const result = await pool.query(
    `
    SELECT
      t.id,
      t.title,
      t.description,
      t.status,
      t.priority,
      t.due_date,

      t.entity_type,
      t.entity_id,
      t.assigned_to,
      t.created_by,

      t.created_at,
      t.updated_at,

      assigned.fullname AS assigned_to_name,
      creator.fullname AS created_by_name,

      CASE
        WHEN t.entity_type = 'LEAD'
          THEN l.company

        WHEN t.entity_type = 'CUSTOMER'
          THEN c.company

        WHEN t.entity_type = 'DEAL'
          THEN d.title

        ELSE NULL
      END AS entity_name

    FROM tasks t

    LEFT JOIN users assigned
      ON assigned.id = t.assigned_to

    LEFT JOIN users creator
      ON creator.id = t.created_by

    LEFT JOIN leads l
      ON l.id = t.entity_id
      AND t.entity_type = 'LEAD'

    LEFT JOIN customers c
      ON c.id = t.entity_id
      AND t.entity_type = 'CUSTOMER'

    LEFT JOIN deals d
      ON d.id = t.entity_id
      AND t.entity_type = 'DEAL'

    WHERE
      t.id = $1
      AND t.organization_id = $2

    LIMIT 1
    `,
    [taskId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new AppError("Task not found", 404);
  }

  return result.rows[0];
};

export const updateTask = async (
  organizationId: number,
  currentUserId: number,
  taskId: number,
  data: {
    title: string;
    description: string | null;
    due_date: string | null;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    assigned_to: number;
  }
) => {
  const {
    title,
    description,
    due_date,
    priority,
    assigned_to,
  } = data;

  const existingTask = await pool.query(
    `
    SELECT
      assigned_to,
      entity_type,
      entity_id
    FROM tasks
    WHERE
      id = $1
      AND organization_id = $2
    `,
    [
      taskId,
      organizationId,
    ]
  );

  if (!existingTask.rows.length) {
    throw new AppError(
      "Task not found",
      404
    );
  }

  const oldTask = existingTask.rows[0];

  const result = await pool.query(
    `
    UPDATE tasks
    SET
      title = $1,
      description = $2,
      due_date = $3,
      priority = $4,
      assigned_to = $5,
      updated_at = NOW()
    WHERE
      id = $6
      AND organization_id = $7
    RETURNING *
    `,
    [
      title,
      description,
      due_date,
      priority,
      assigned_to,
      taskId,
      organizationId,
    ]
  );

  const task = result.rows[0];

  // Notify only when the assignee actually changed
  // and the new assignee is not the current user.
  if (
    oldTask.assigned_to !== assigned_to &&
    assigned_to !== currentUserId
  ) {
    await createNotifications({
      organizationId,
      userIds: [assigned_to],
      type: "TASK",
      action: "ASSIGNED",
      title: "Task Assigned",
      message: `The task "${title}" was assigned to you.`,
      entityType: oldTask.entity_type ?? null,
      entityId: oldTask.entity_id ?? null,
    });
  }

  return task;
};

export const updateTaskStatus = async (
  organizationId: number,
  taskId: number,
  status: "PENDING" | "COMPLETED",
  currentUserId: number
) => {
  const existingTask = await pool.query(
    `
    SELECT
      status,
      title,
      created_by,
      entity_type,
      entity_id
    FROM tasks
    WHERE
      id = $1
      AND organization_id = $2
    `,
    [
      taskId,
      organizationId,
    ]
  );

  if (!existingTask.rows.length) {
    throw new AppError("Task not found", 404);
  }

  const task = existingTask.rows[0];

  if (task.status === status) {
    throw new AppError(
      `Task is already ${status.toLowerCase()}`,
      400
    );
  }

  const result = await pool.query(
    `
    UPDATE tasks
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
      taskId,
      organizationId,
    ]
  );

  const updatedTask = result.rows[0];

  // Task completed activity
  if (status === "COMPLETED") {
    const activity: ActivityInput = {
      organizationId,
      entityType: updatedTask.entity_type,
      entityId: updatedTask.entity_id,
      activityType: "TASK_COMPLETED",
      description: `Task '${updatedTask.title}' completed`,
      createdBy: currentUserId,
    };

    await createActivities([activity]);

    // Notify task creator
    if (task.created_by !== currentUserId) {
      await createNotifications({
        organizationId,
        userIds: [task.created_by],
        type: "TASK",
        action: "COMPLETED",
        title: "Task Completed",
        message: `The task "${updatedTask.title}" was completed.`,
        entityType: updatedTask.entity_type,
        entityId: updatedTask.entity_id,
      });
    }
  }

  return updatedTask;
};

export const deleteTask = async (
  organizationId: number,
  taskId: number
) => {
  const result = await pool.query(
    `
    DELETE
    FROM tasks
    WHERE
      id = $1
      AND organization_id = $2
    RETURNING *
    `,
    [
      taskId,
      organizationId,
    ]
  );

  if (!result.rows.length) {
    throw new AppError("Task not found", 404);
  }

  return result.rows[0];
};