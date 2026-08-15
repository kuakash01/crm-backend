import { pool } from "../../config/db";
import { createActivities } from "../activities/activites.service";
import { AppError } from "../../shared/errors/AppError";
import { ActivityInput } from "../activities/activities.types";
import {
  buildPagination,
  buildPaginationResponse,
  PaginationOptions,
} from "../../shared/helpers/pagination.helper";

export const createNote = async (
  organizationId: number,
  entityType: string,
  entityId: number,
  note: string,
  createdBy: number
) => {

  const result = await pool.query(
    `
    WITH inserted AS (
      INSERT INTO notes(
        organization_id,
        entity_type,
        entity_id,
        note,
        created_by
      )
      VALUES(
        $1,
        $2,
        $3,
        $4,
        $5
      )
      RETURNING *
    )
    SELECT
      i.*,
      u.fullname AS created_by_name
      FROM inserted i
      INNER JOIN users u
      ON u.id = i.created_by;
    `,
    [
      organizationId,
      entityType,
      entityId,
      note,
      createdBy
    ]
  );



  const activity: ActivityInput = {
    organizationId,
    entityType,
    entityId,
    activityType: "NOTE_ADDED",
    description: "Added a note",
    createdBy
  }
  await createActivities([activity]);

  return result.rows[0];

};


export const getNotes = async (
  organizationId: number,
  entityType: string,
  entityId: number,
  options?: PaginationOptions
) => {
  const { page, limit, offset } = buildPagination(options);

  const [notesResult, countResult] = await Promise.all([
    pool.query(
      `
      SELECT
        n.id,
        n.note,
        n.created_at,
        n.updated_at,
        u.fullname AS created_by_name
      FROM notes n
      INNER JOIN users u
        ON u.id = n.created_by
      WHERE
        n.organization_id = $1
        AND n.entity_type = $2
        AND n.entity_id = $3
      ORDER BY
        n.created_at DESC
      LIMIT $4
      OFFSET $5
      `,
      [
        organizationId,
        entityType,
        entityId,
        limit,
        offset,
      ]
    ),

    pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM notes
      WHERE
        organization_id = $1
        AND entity_type = $2
        AND entity_id = $3
      `,
      [
        organizationId,
        entityType,
        entityId,
      ]
    ),
  ]);

  return buildPaginationResponse(
    notesResult.rows,
    page,
    limit,
    countResult.rows[0].total
  );
};

export const updateNote = async (
  entityType: string,
  entityId: number,
  noteId: number,
  note: string
) => {

  const result = await pool.query(
    `
    UPDATE notes
    SET
      note = $1,
      updated_at = NOW()
    WHERE
      id = $2
      AND entity_type = $3
      AND entity_id = $4
    RETURNING *
    `,
    [
      note,
      noteId,
      entityType,
      entityId
    ]
  );

  if (!result.rows.length) {

    throw new AppError(
      "Note not found",
      404
    );

  }

  return result.rows[0];

};


export const deleteNote = async (
  entityType: string,
  entityId: number,
  noteId: number
) => {

  const result = await pool.query(
    `
    DELETE
    FROM notes
    WHERE
      id = $1
      AND entity_type = $2
      AND entity_id = $3
    RETURNING *
    `,
    [
      noteId,
      entityType,
      entityId
    ]
  );

  if (!result.rows.length) {

    throw new AppError(
      "Note not found",
      404
    );

  }

  return result.rows[0];

};  