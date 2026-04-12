const prisma = require("../config/db");
const DOMPurify = require("isomorphic-dompurify");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id) {
  return typeof id === "string" && UUID_REGEX.test(id);
}

// Create Note
exports.createNote = async (req, res) => {
  try {
    const { title, content, isPublic } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required and must be a non-empty string" });
    }

    if (title.length > 500) {
      return res.status(400).json({ error: "title must be 500 characters or fewer" });
    }

    if (content === undefined || content === null) {
      return res.status(400).json({ error: "content is required" });
    }

    const cleanContent = DOMPurify.sanitize(content);

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: cleanContent,
        isPublic: typeof isPublic === "boolean" ? isPublic : false,
        ownerId: req.user.id,
      },
    });

    res.status(201).json(note);
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ error: "Failed to create note" });
  }
};

// Get All Notes (paginated)
exports.getNotes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { ownerId: req.user.id },
        { shares: { some: { userEmail: req.user.email } } }
      ]
    };

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          shares: {
            where: { userEmail: req.user.email }
          }
        }
      }),
      prisma.note.count({ where }),
    ]);

    res.json({
      data: notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get notes error:", err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};

// Get Single Note
exports.getNoteById = async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: "Invalid note ID format" });
    }

    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: {
        shares: {
          where: { userEmail: req.user.email }
        }
      }
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const hasAccess = note.ownerId === req.user.id || note.shares.length > 0;

    if (!hasAccess) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    console.error("Get note error:", err);
    res.status(500).json({ error: "Failed to fetch note" });
  }
};

// Update Note
exports.updateNote = async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: "Invalid note ID format" });
    }

    const { title, content, isPublic } = req.body;
    const data = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title must be a non-empty string" });
      }
      if (title.length > 500) {
        return res.status(400).json({ error: "title must be 500 characters or fewer" });
      }
      data.title = title.trim();
    }

    if (content !== undefined) {
      if (content === null) {
        return res.status(400).json({ error: "content cannot be null" });
      }
      data.content = DOMPurify.sanitize(content);
    }

    if (isPublic !== undefined) {
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ error: "isPublic must be a boolean" });
      }
      data.isPublic = isPublic;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const existing = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: { shares: { where: { userEmail: req.user.email } } }
    });

    if (!existing) {
      return res.status(404).json({ error: "Note not found" });
    }

    const canEdit = existing.ownerId === req.user.id || 
                    (existing.shares.length > 0 && existing.shares[0].role === "EDIT");

    if (!canEdit) {
      return res.status(403).json({ error: "You do not have permission to edit this note" });
    }

    const note = await prisma.note.update({
      where: { id: req.params.id },
      data,
    });

    res.json(note);
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
};

// Delete Note
exports.deleteNote = async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: "Invalid note ID format" });
    }

    const existing = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || existing.ownerId !== req.user.id) {
      return res.status(404).json({ error: "Note not found or no permission to delete" });
    }

    await prisma.note.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Note deleted" });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
};
