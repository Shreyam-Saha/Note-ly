const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const notesController = require("../controllers/notes.controller");
const sharesController = require("../controllers/shares.controller");
const { shareLimiter } = require("../middleware/rateLimiter");

router.use(authenticate);

// Note routes
router.post("/", notesController.createNote);
router.get("/", notesController.getNotes);
router.get("/:id", notesController.getNoteById);
router.put("/:id", notesController.updateNote);
router.delete("/:id", notesController.deleteNote);

// Shares routes
router.get("/:id/shares", sharesController.getShares);
router.post("/:id/shares", shareLimiter, sharesController.createShare);
router.put("/:id/shares/:shareId", sharesController.updateShare);
router.delete("/:id/shares/:shareId", sharesController.deleteShare);

module.exports = router;
