import { Request, Response, NextFunction } from "express";
import * as notesService from "./notes.service";


export const createNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {


  try {
    const note =
      await notesService.createNote(
        Number(req.user.organization_id),
        (req.params.entityType).toString().toUpperCase(),
        Number(req.params.entityId),
        req.body.note,
        req.user.id
      );

    res.status(201).json({
      status: "success",
      data: note
    });

  } catch (error) {

    next(error);

  }

};

export const getNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const notes =
      await notesService.getNotes(
        (req.params.entityType).toString().toUpperCase(),
        Number(req.params.entityId)
      );

    res.status(200).json({
      status: "success",
      data: notes
    });

  } catch (error) {

    next(error);

  }

};

export const updateNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const note =
      await notesService.updateNote(
        (req.params.entityType).toString().toUpperCase(),
        Number(req.params.entityId),
        Number(req.params.noteId),
        req.body.note
      );

    res.status(200).json({
      status: "success",
      data: note
    });

  } catch (error) {

    next(error);

  }

};

export const deleteNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    await notesService.deleteNote(
      (req.params.entityType).toString().toUpperCase(),
      Number(req.params.entityId),
      Number(req.params.noteId)
    );

    res.status(200).json({
      status: "success"
    });

  } catch (error) {

    next(error);

  }

};