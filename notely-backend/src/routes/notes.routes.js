const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const notesController = require("../controllers/notes.controller");

router.use(authenticate);

router.post("/", notesController.createNote);
router.get("/", notesController.getNotes);
router.get("/:id", notesController.getNoteById);
router.put("/:id", notesController.updateNote);
router.delete("/:id", notesController.deleteNote);

module.exports = router;