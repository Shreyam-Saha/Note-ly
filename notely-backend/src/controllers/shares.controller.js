const prisma = require("../config/db");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id) {
  return typeof id === "string" && UUID_REGEX.test(id);
}

// Middleware or helper to check if user is the owner of the note
async function verifyNoteOwner(noteId, userId) {
  if (!isValidUUID(noteId)) {
    throw new Error("Invalid note ID");
  }
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });
  if (!note || note.ownerId !== userId) {
    throw new Error("Not authorized or note not found");
  }
  return note;
}

// Get all shares for a note
exports.getShares = async (req, res) => {
  try {
    await verifyNoteOwner(req.params.id, req.user.id);
    const shares = await prisma.noteShare.findMany({
      where: { noteId: req.params.id },
      orderBy: { createdAt: "desc" }
    });
    res.json(shares);
  } catch (err) {
    if (err.message === "Invalid note ID") return res.status(400).json({ error: err.message });
    if (err.message === "Not authorized or note not found") return res.status(404).json({ error: err.message });
    console.error("Get shares error:", err);
    res.status(500).json({ error: "Failed to fetch shares" });
  }
};

// Create a share
exports.createShare = async (req, res) => {
  try {
    await verifyNoteOwner(req.params.id, req.user.id);
    const { email, role } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    if (email === req.user.email) {
      return res.status(400).json({ error: "Cannot share with yourself" });
    }

    const validRoles = ["READ", "EDIT"];
    const assignedRole = validRoles.includes(role) ? role : "READ";

    const share = await prisma.noteShare.upsert({
      where: {
        noteId_userEmail: {
          noteId: req.params.id,
          userEmail: email
        }
      },
      update: {
        role: assignedRole
      },
      create: {
        noteId: req.params.id,
        userEmail: email,
        role: assignedRole
      }
    });

    res.status(201).json(share);
  } catch (err) {
    if (err.message === "Invalid note ID") return res.status(400).json({ error: err.message });
    if (err.message === "Not authorized or note not found") return res.status(404).json({ error: err.message });
    console.error("Create share error:", err);
    res.status(500).json({ error: "Failed to create share" });
  }
};

// Update a share
exports.updateShare = async (req, res) => {
  try {
    await verifyNoteOwner(req.params.id, req.user.id);
    const { role } = req.body;
    const { shareId } = req.params;

    if (!isValidUUID(shareId)) {
      return res.status(400).json({ error: "Invalid share ID format" });
    }

    const validRoles = ["READ", "EDIT"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be READ or EDIT." });
    }

    const existingShare = await prisma.noteShare.findUnique({
      where: { id: shareId }
    });

    if (!existingShare || existingShare.noteId !== req.params.id) {
       return res.status(404).json({ error: "Share not found" });
    }

    const share = await prisma.noteShare.update({
      where: { id: shareId },
      data: { role }
    });

    res.json(share);
  } catch (err) {
    if (err.message === "Invalid note ID") return res.status(400).json({ error: err.message });
    if (err.message === "Not authorized or note not found") return res.status(404).json({ error: err.message });
    console.error("Update share error:", err);
    res.status(500).json({ error: "Failed to update share" });
  }
};

// Delete a share
exports.deleteShare = async (req, res) => {
  try {
    await verifyNoteOwner(req.params.id, req.user.id);
    const { shareId } = req.params;

    if (!isValidUUID(shareId)) {
      return res.status(400).json({ error: "Invalid share ID format" });
    }

    const existingShare = await prisma.noteShare.findUnique({
      where: { id: shareId }
    });

    if (!existingShare || existingShare.noteId !== req.params.id) {
       return res.status(404).json({ error: "Share not found" });
    }

    await prisma.noteShare.delete({
      where: { id: shareId }
    });

    res.json({ message: "Collaborator removed" });
  } catch (err) {
    if (err.message === "Invalid note ID") return res.status(400).json({ error: err.message });
    if (err.message === "Not authorized or note not found") return res.status(404).json({ error: err.message });
    console.error("Delete share error:", err);
    res.status(500).json({ error: "Failed to remove collaborator" });
  }
};
