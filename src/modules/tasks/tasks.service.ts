import { pool } from "../../config/db";
import { createActivity } from "../activities/activites.service";
import { AppError } from "../../shared/errors/AppError";


export const createTask = async (
  organizationId: number,
  entityType: string,
  entityId: number,
  currentUserId: number,
  data: any
) => {

  const {
    title,
    description,
    due_date,
    assigned_to
  } = data;

  const result = await pool.query(
    `
    INSERT INTO tasks(
      organization_id,
      entity_type,
      entity_id,
      title,
      description,
      due_date,
      assigned_to,
      created_by
    )
    VALUES(
      $1,$2,$3,$4,$5,$6,$7,$8
    )
    RETURNING *
    `,
    [
      organizationId,
      entityType,
      entityId,
      title,
      description,
      due_date || null,
      assigned_to,
      currentUserId
    ]
  );

  await createActivity(
    organizationId,
    entityType,
    entityId,
    "TASK_CREATED",
    `Task '${title}' created`,
    currentUserId
  );

  return result.rows[0];

};


export const getTasks = async (
  organizationId: number,
  entityType: string,
  entityId: number
) => {

  const result = await pool.query(
    `
    SELECT
      t.*,
      assigned.fullname AS assigned_to_name,
      creator.fullname AS created_by_name
    FROM tasks t
    INNER JOIN users assigned
      ON assigned.id = t.assigned_to
    INNER JOIN users creator
      ON creator.id = t.created_by
    WHERE
      t.entity_type = $1
      AND t.entity_id = $2
      AND t.organization_id = $3
    ORDER BY
      t.status,
      t.due_date NULLS LAST,
      t.created_at DESC
    `,
    [
      entityType,
      entityId,
      organizationId
    ]
  );

  return result.rows;

};

export const updateTask = async (
  organizationId:number,
  entityType: string,
  entityId: number,
  taskId: number,
  data: any
) => {

  const {
    title,
    description,
    due_date,
    assigned_to
  } = data;

  const result = await pool.query(
    `
    UPDATE tasks
    SET
      title = $1,
      description = $2,
      due_date = $3,
      assigned_to = $4,
      updated_at = NOW()
    WHERE
      id = $5
      AND entity_type = $6
      AND entity_id = $7
      AND organization_id = $8
    RETURNING *
    `,
    [
      title,
      description,
      due_date,
      assigned_to,
      taskId,
      entityType,
      entityId,
      organizationId
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Task not found",
      404
    );
  }

  return result.rows[0];

};

export const updateTaskStatus = async (
  organizationId: number,
  entityType: string,
  entityId: number,
  taskId: number,
  status: "PENDING" | "COMPLETED",
  currentUserId: number
) => {

  const result = await pool.query(
    `
    UPDATE tasks
    SET
      status = $1,
      updated_at = NOW()
    WHERE
      id = $2
      AND entity_type = $3
      AND entity_id = $4
    RETURNING *
    `,
    [
      status,
      taskId,
      entityType,
      entityId
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Task not found",
      404
    );
  }

  if (
    status === "COMPLETED"
  ) {

    await createActivity(
      organizationId,
      entityType,
      entityId,
      "TASK_COMPLETED",
      `Task '${result.rows[0].title}' completed`,
      currentUserId
    );

  }

  return result.rows[0];

};


export const deleteTask = async (
  organizationId:number,
  entityType: string,
  entityId: number,
  taskId: number
) => {

  const result = await pool.query(
    `
    DELETE
    FROM tasks
    WHERE
      id = $1
      AND entity_type = $2
      AND entity_id = $3
      AND organization_id = $4
    RETURNING *
    `,
    [
      taskId,
      entityType,
      entityId,
      organizationId
    ]
  );

  if (!result.rows.length) {

    throw new AppError(
      "Task not found",
      404
    );

  }

  return result.rows[0];

};