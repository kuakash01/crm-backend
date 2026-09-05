"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.updateNote = exports.getNotes = exports.createNote = void 0;
const notesService = __importStar(require("./notes.service"));
const createNote = async (req, res, next) => {
    try {
        const note = await notesService.createNote(Number(req.user.organization_id), (req.params.entityType).toString().toUpperCase(), Number(req.params.entityId), req.body.note, req.user.id);
        res.status(201).json({
            status: "success",
            data: note
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createNote = createNote;
const getNotes = async (req, res, next) => {
    try {
        const notes = await notesService.getNotes(req.user.organization_id, String(req.params.entityType).toUpperCase(), Number(req.params.entityId), {
            page: req.query.page
                ? Number(req.query.page)
                : undefined,
            limit: req.query.limit
                ? Number(req.query.limit)
                : undefined,
        });
        res.status(200).json({
            status: "success",
            data: notes,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotes = getNotes;
const updateNote = async (req, res, next) => {
    try {
        const note = await notesService.updateNote((req.params.entityType).toString().toUpperCase(), Number(req.params.entityId), Number(req.params.noteId), req.body.note);
        res.status(200).json({
            status: "success",
            data: note
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateNote = updateNote;
const deleteNote = async (req, res, next) => {
    try {
        await notesService.deleteNote((req.params.entityType).toString().toUpperCase(), Number(req.params.entityId), Number(req.params.noteId));
        res.status(200).json({
            status: "success"
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNote = deleteNote;
