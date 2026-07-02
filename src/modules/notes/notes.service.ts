import { pool } from "../../config/db";
import { createActivity } from "../activities/activites.service";
import { AppError } from "../../shared/errors/AppError";

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

  await createActivity(
    organizationId,
    entityType,
    entityId,
    "NOTE_ADDED",
    "Added a note",
    createdBy
  );

  return result.rows[0];

};

export const getNotes = async (
  entityType: string,
  entityId: number
) => {

  const result = await pool.query(
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
      n.entity_type = $1
      AND n.entity_id = $2
    ORDER BY
      n.created_at DESC
    `,
    [
      entityType,
      entityId
    ]
  );

  return result.rows;

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